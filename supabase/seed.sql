insert into public.approved_institutions (domain, institution_name) values
  ('up.edu.ph',           'University of the Philippines'),
  ('dlsu.edu.ph',         'De La Salle University'),
  ('ateneo.edu',          'Ateneo de Manila University'),
  ('ust.edu.ph',          'University of Santo Tomas'),
  ('admu.edu.ph',         'Ateneo de Manila University'),
  ('mapua.edu.ph',        'Mapúa University'),
  ('feu.edu.ph',          'Far Eastern University'),
  ('pnu.edu.ph',          'Philippine Normal University'),
  ('tip.edu.ph',          'Technological Institute of the Philippines'),
  ('ceu.edu.ph',          'Centro Escolar University'),
  ('nationalmuseum.gov.ph', 'National Museum of the Philippines'),
  ('nhcp.gov.ph',         'National Historical Commission of the Philippines'),
  ('nlp.gov.ph',          'National Library of the Philippines')
on conflict (domain) do nothing;
