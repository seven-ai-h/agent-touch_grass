ALTER TABLE users ADD COLUMN IF NOT EXISTS schedule JSONB NOT NULL DEFAULT '{}';

-- Seed Jamie's weekly schedule: focus Mon-Fri 9-12 + 2-5, leisure Mon-Thu 7-8pm
UPDATE users SET schedule = '{
  "0": {"9":"focus","10":"focus","11":"focus","14":"focus","15":"focus","16":"focus","19":"leisure"},
  "1": {"9":"focus","10":"focus","11":"focus","14":"focus","15":"focus","16":"focus","19":"leisure"},
  "2": {"9":"focus","10":"focus","11":"focus","14":"focus","15":"focus","16":"focus","19":"leisure"},
  "3": {"9":"focus","10":"focus","11":"focus","14":"focus","15":"focus","16":"focus","19":"leisure"},
  "4": {"9":"focus","10":"focus","11":"focus","14":"focus","15":"focus","16":"focus"},
  "5": {"11":"leisure","12":"leisure","13":"leisure"},
  "6": {}
}'
WHERE email = 'jamie@berkeley.edu';

UPDATE users SET schedule = '{
  "0": {"8":"focus","9":"focus","10":"focus","11":"focus","20":"leisure"},
  "1": {"8":"focus","9":"focus","10":"focus","11":"focus","20":"leisure"},
  "2": {"8":"focus","9":"focus","10":"focus","11":"focus"},
  "3": {"8":"focus","9":"focus","10":"focus","11":"focus","20":"leisure"},
  "4": {"8":"focus","9":"focus","10":"focus","11":"focus"},
  "5": {"10":"leisure","11":"leisure","12":"leisure"},
  "6": {"10":"leisure","11":"leisure"}
}'
WHERE email = 'hiro@berkeley.edu';
