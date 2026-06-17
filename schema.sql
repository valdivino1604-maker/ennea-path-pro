CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  role TEXT,
  birth_date TEXT,
  gender TEXT,
  plan TEXT DEFAULT 'basico',
  answers TEXT DEFAULT '{}',
  current_index INTEGER DEFAULT 0,
  created_date TEXT NOT NULL,
  updated_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY,
  participant_id TEXT NOT NULL,
  participant_name TEXT,
  participant_email TEXT,
  participant_company TEXT,
  participant_role TEXT,
  participant_birth_date TEXT,
  plan TEXT DEFAULT 'basico',
  answers TEXT NOT NULL,
  scores TEXT NOT NULL,
  dominant_type INTEGER,
  dominant_type_name TEXT,
  wing TEXT,
  wing_name TEXT,
  confidence_level REAL,
  duration_seconds INTEGER,
  completed INTEGER DEFAULT 1,
  created_date TEXT NOT NULL,
  updated_date TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_results_participant_id ON results(participant_id);
CREATE INDEX IF NOT EXISTS idx_results_created_date ON results(created_date);
