import re
import ollama
from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams,
    Distance,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)

# ==========================
# CONFIG
# ==========================

EMBEDDING_MODEL = "mxbai-embed-large"
LANGUAGE_MODEL = "qwen2.5:3b"

SQL_FILE = "../db/002_seed.sql"
COLLECTION = "agent_schedule_sql"

# Qdrant default port = 6333
client = QdrantClient(
    host="localhost",
    port=6333,
)

CURRENT_USER_ID = (
    "00000000-0000-0000-0000-000000000004"
)

# ==========================
# LOAD SQL DATASET
# ==========================

def split_sql_tuples(values_text):
    tuples = []
    current = []
    depth = 0
    in_string = False
    i = 0

    while i < len(values_text):
        char = values_text[i]
        current.append(char)

        if char == "'" and not (
            i + 1 < len(values_text) and values_text[i + 1] == "'"
        ):
            in_string = not in_string

        elif not in_string:
            if char == "(":
                depth += 1
            elif char == ")":
                depth -= 1

                if depth == 0:
                    tuples.append("".join(current).strip().rstrip(","))
                    current = []

        i += 1

    return tuples


def extract_user_id(table, row_text):
    ids = re.findall(
        r"'([0-9a-fA-F-]{36})'",
        row_text
    )

    try:
        if table == "users":
            return ids[0]

        if table == "sessions":
            return ids[1]

        if table == "interventions":
            return ids[1]

        if table == "vulnerability_scores":
            return ids[1]

    except IndexError:
        pass

    return None

def load_sql_chunks(path):
    with open(path, "r") as f:
        sql = f.read()

    sql = re.sub(
        r"--.*?$",
        "",
        sql,
        flags=re.MULTILINE,
    )

    statements = [
        s.strip()
        for s in sql.split(";")
        if s.strip()
    ]

    chunks = []

    for stmt in statements:
        match = re.search(
            r"INSERT INTO\s+(\w+)\s*\((.*?)\)\s*VALUES\s*(.*)",
            stmt,
            re.I | re.S,
        )

        if not match:
            chunks.append({
                "text": stmt,
                "table": "unknown",
            })
            continue

        table = match.group(1)
        columns = match.group(2)
        values_text = match.group(3)

        rows = split_sql_tuples(values_text)

        for row in rows:
            chunks.append({
                "table": table,
                "user_id": extract_user_id(
                    table,
                    row
                ),
                "text": f"""
            TABLE: {table}

            ROW:
            {row}
            """.strip()
            })

    return chunks


dataset = load_sql_chunks(SQL_FILE)

print(
    f"Loaded {len(dataset)} SQL chunks"
)

# ==========================
# DETERMINE VECTOR SIZE
# ==========================

sample = ollama.embed(
    model=EMBEDDING_MODEL,
    input="hello"
)

VECTOR_SIZE = len(
    sample["embeddings"][0]
)

print(
    "Embedding size:",
    VECTOR_SIZE
)

# ==========================
# RESET COLLECTION
# ==========================

RESET_COLLECTION = False

# ==========================
# CREATE COLLECTION
# ==========================

if RESET_COLLECTION and client.collection_exists(COLLECTION):
    client.delete_collection(COLLECTION)
    print("Deleted collection")

if not client.collection_exists(COLLECTION):
    client.create_collection(
        collection_name=COLLECTION,
        vectors_config=VectorParams(
            size=VECTOR_SIZE,
            distance=Distance.COSINE,
        ),
    )

# ==========================
# INDEX ONLY ONCE
# ==========================

count = client.count(
    collection_name=COLLECTION
).count

if count == 0:

    print(
        "Embedding SQL..."
    )

    points = []

    for i, row in enumerate(dataset):

        embedding = (
            ollama.embed(
                model=EMBEDDING_MODEL,
                input=row["text"],
            )["embeddings"][0]
        )

        points.append(
            PointStruct(
                id=i,
                vector=embedding,
                payload={
                    "table":
                        row["table"],
                    "user_id":
                        row["user_id"],
                    "text":
                        row["text"],
                },
            )
        )

        print(
            f"{i+1}/{len(dataset)}"
        )

    client.upsert(
        collection_name=COLLECTION,
        points=points,
    )

    print(
        "Finished indexing"
    )

else:

    print(
        f"Using existing {count} vectors"
    )

# ==========================
# RETRIEVE
# ==========================

def retrieve(
        query,
        current_user_id,
        top_n=5
    ):

    query_embedding = (
        ollama.embed(
            model=EMBEDDING_MODEL,
            input=query,
        )["embeddings"][0]
    )

    results = client.query_points(
        collection_name=COLLECTION,
        query=query_embedding,
        limit=top_n,
        query_filter=Filter(
            must=[
                FieldCondition(
                    key="user_id",
                    match=MatchValue(
                        value=current_user_id
                    )
                )
            ]
        )
    )

    return [
        {
            "table":
                r.payload["table"],
            "text":
                r.payload["text"],
            "score":
                r.score,
        }
        for r in results.points
    ]


# ==========================
# CHAT
# ==========================

while True:

    q = input(
        "\nAsk: "
    )

    if q in [
        "quit",
        "exit",
    ]:
        break

    retrieved = retrieve(
        query=q,
        current_user_id=CURRENT_USER_ID
    )

    print("\n===== RETRIEVED CHUNKS =====")

    for i, r in enumerate(retrieved, 1):
        print(f"\nChunk {i}")
        print(f"Table: {r['table']}")
        print(f"Score: {r['score']:.4f}")
        print("-" * 50)
        print(r["text"])

    print("\n============================\n")

    context = "\n\n".join([
        f"[TABLE={r['table']}]\n{r['text']}"
        for r in retrieved
    ])

    response = ollama.chat(
        model=LANGUAGE_MODEL,
        messages=[
            {
                "role": "system",
                "content":
f"""
You are a database assistant.

Answer ONLY from the retrieved records.

The retrieved records may contain raw SQL-style rows.
You are allowed to extract obvious values from JSON fields in those rows.

If the user asks about hobbies, look for the JSON object containing hobby names and scores.

If information is not present, say:
'I could not find that information in the database.'

Do not use information outside the retrieved records.
Do not guess.
Do not invent values.

Retrieved records:

{context}
"""
            },
            {
                "role":
                    "user",
                "content":
                    q,
            }
        ],
        options={
            "temperature": 0,
            "num_predict": 120,
        },
        stream=True,
    )

    print()

    for token in response:

        print(
            token["message"]["content"],
            end="",
            flush=True,
        )

    print()