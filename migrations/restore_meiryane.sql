-- Restauracao manual da participante Meiryane Irma
-- Execute no Cloudflare D1 Console do banco ennea-path-pro-db.

INSERT OR REPLACE INTO participants (
  id,
  full_name,
  email,
  phone,
  company,
  role,
  birth_date,
  gender,
  plan,
  answers,
  current_index,
  created_date,
  updated_date
) VALUES (
  'participant_meiryane_irma',
  'Meiryane Irma',
  '',
  '',
  '',
  '',
  '',
  '',
  'premium',
  '{}',
  0,
  datetime('now'),
  datetime('now')
);

INSERT OR REPLACE INTO results (
  id,
  participant_id,
  participant_name,
  participant_email,
  participant_company,
  participant_role,
  participant_birth_date,
  plan,
  answers,
  scores,
  dominant_type,
  dominant_type_name,
  wing,
  wing_name,
  confidence_level,
  duration_seconds,
  completed,
  created_date,
  updated_date
) VALUES (
  'result_340f5ea9-d9e7-4385-9cec-ac05371eea6a',
  'participant_meiryane_irma',
  'Meiryane Irma',
  '',
  '',
  '',
  '',
  'premium',
  '{}',
  '{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":100,"9":0}',
  8,
  'O Desafiador',
  '',
  '',
  100,
  0,
  1,
  datetime('now'),
  datetime('now')
);
