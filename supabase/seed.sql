-- ============================================================
-- Seed: exercise categories + starter exercise library
-- Run this AFTER 0001_init.sql. Safe to re-run (uses upserts).
-- The "6 Weeks of The Work" program itself (weeks/workouts/sets)
-- is NOT seeded here — see README for how that gets added once
-- we confirm the actual program content with you.
-- ============================================================

insert into exercise_categories (name) values
  ('squat'), ('hinge'), ('push'), ('pull'), ('carry'), ('core'),
  ('rotation'), ('anti_rotation'), ('mobility'), ('conditioning'),
  ('single_leg_stability'), ('power')
on conflict (name) do nothing;

-- Helper pattern: insert exercise referencing category by name
insert into exercise_library (name, category_id, equipment) values
  ('Goblet Squat', (select id from exercise_categories where name = 'squat'), 'dumbbell/kettlebell'),
  ('Barbell Back Squat', (select id from exercise_categories where name = 'squat'), 'barbell'),
  ('Kettlebell Deadlift', (select id from exercise_categories where name = 'hinge'), 'kettlebell'),
  ('Barbell Romanian Deadlift', (select id from exercise_categories where name = 'hinge'), 'barbell'),
  ('Dumbbell Bench Press', (select id from exercise_categories where name = 'push'), 'dumbbell'),
  ('Cable Chest Press', (select id from exercise_categories where name = 'push'), 'cable'),
  ('Dumbbell Row', (select id from exercise_categories where name = 'pull'), 'dumbbell'),
  ('Cable Lat Pulldown', (select id from exercise_categories where name = 'pull'), 'cable'),
  ('Farmer''s Carry', (select id from exercise_categories where name = 'carry'), 'dumbbell/kettlebell'),
  ('Suitcase Carry', (select id from exercise_categories where name = 'carry'), 'kettlebell'),
  ('Pallof Press', (select id from exercise_categories where name = 'anti_rotation'), 'cable'),
  ('Cable Wood Chop', (select id from exercise_categories where name = 'rotation'), 'cable'),
  ('Mace 360', (select id from exercise_categories where name = 'rotation'), 'mace'),
  ('Half-Kneeling Hip Flexor Stretch', (select id from exercise_categories where name = 'mobility'), 'bodyweight'),
  ('Thoracic Spine Rotation', (select id from exercise_categories where name = 'mobility'), 'bodyweight'),
  ('Single-Leg RDL', (select id from exercise_categories where name = 'single_leg_stability'), 'dumbbell'),
  ('Bulgarian Split Squat', (select id from exercise_categories where name = 'single_leg_stability'), 'dumbbell'),
  ('Kettlebell Swing', (select id from exercise_categories where name = 'power'), 'kettlebell'),
  ('Medicine Ball Rotational Throw', (select id from exercise_categories where name = 'power'), 'medicine ball'),
  ('Peloton Ride', (select id from exercise_categories where name = 'conditioning'), 'peloton'),
  ('Treadmill Intervals', (select id from exercise_categories where name = 'conditioning'), 'treadmill'),
  ('Zone 2 Walk', (select id from exercise_categories where name = 'conditioning'), 'bodyweight/treadmill')
on conflict do nothing;
