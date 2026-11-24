-- Migration: Remove unused salt column from users table
-- bcrypt stores salt in the hash itself, so separate salt column is not needed

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='users' AND column_name='salt'
  ) THEN
    ALTER TABLE users DROP COLUMN salt;
    RAISE NOTICE 'Column salt removed from users table';
  ELSE
    RAISE NOTICE 'Column salt does not exist, skipping';
  END IF;
END $$;
