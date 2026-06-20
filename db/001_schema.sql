CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- hobby_profile keys must be lowercase to match redirect_suggestion->>'hobby' at query time.
-- push_subscription: Web Push object from browser.
-- google_refresh_token: stored after OAuth; used to fetch Calendar.
CREATE TABLE users (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email                TEXT        NOT NULL UNIQUE,
    password_hash        TEXT        NOT NULL,
    identity_statement   TEXT,
    agent_tone           TEXT        NOT NULL DEFAULT 'tough_love'
                                     CHECK (agent_tone IN ('tough_love', 'gentle', 'coach')),
    hobby_profile        JSONB,
    push_subscription    JSONB,
    google_refresh_token TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- one row per flagged URL open; use created_at::time when you need time of day
CREATE TABLE sessions (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    app_triggered       TEXT        NOT NULL,
    vulnerability_score INT         CHECK (vulnerability_score BETWEEN 0 AND 100),
    battery             INT         CHECK (battery BETWEEN 0 AND 100),
    location            TEXT,
    outcome             TEXT        CHECK (outcome IN ('redirected', 'leisure_window', 'overridden')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- one row per agent conversation; messages and suggestion stored as JSONB
CREATE TABLE interventions (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    messages            JSONB       NOT NULL DEFAULT '[]',
    redirect_suggestion JSONB,
    accepted            BOOLEAN,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- hourly risk scores for the dashboard timeline; signals is freeform per session
CREATE TABLE vulnerability_scores (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score       INT         NOT NULL CHECK (score BETWEEN 0 AND 100),
    signals     JSONB       NOT NULL DEFAULT '{}',
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_created      ON sessions(user_id, created_at DESC);
CREATE INDEX idx_interventions_user_created ON interventions(user_id, created_at DESC);
CREATE INDEX idx_interventions_session      ON interventions(session_id);
CREATE INDEX idx_interventions_accepted     ON interventions(user_id, accepted) WHERE accepted = true;
CREATE INDEX idx_vuln_user_recorded         ON vulnerability_scores(user_id, recorded_at DESC);
