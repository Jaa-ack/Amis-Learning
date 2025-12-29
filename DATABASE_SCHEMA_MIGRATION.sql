-- ============================================================================
-- DATABASE MIGRATION: Convert to Single-User System
-- ============================================================================
-- 
-- This script removes the multi-user infrastructure and simplifies the schema
-- for a single-user learning system. Run this BEFORE rebuilding Prisma client.
-- 
-- IMPORTANT: Backup your database before running this!
--
-- ============================================================================

BEGIN;

-- Step 1: Drop foreign key constraints to reviews
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;

-- Step 2: Drop foreign key constraints to review_session
ALTER TABLE review_session DROP CONSTRAINT IF EXISTS review_session_user_id_fkey;

-- Step 3: Drop foreign key constraints to user_card_stats
ALTER TABLE user_card_stats DROP CONSTRAINT IF EXISTS user_card_stats_user_id_fkey;

-- Step 4: Drop foreign key constraints to user_preferences
ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;

-- Step 5: Remove createdBy columns from flashcards and sentences
ALTER TABLE flashcards DROP COLUMN IF EXISTS created_by;
ALTER TABLE sentences DROP COLUMN IF EXISTS created_by;

-- Step 6: Remove user_id columns from reviews and review_session
ALTER TABLE reviews DROP COLUMN IF EXISTS user_id;
ALTER TABLE review_session DROP COLUMN IF EXISTS user_id;

-- Step 7: Remove user_id column from user_card_stats and adjust unique constraints
ALTER TABLE user_card_stats DROP CONSTRAINT IF EXISTS user_card_stats_user_id_flashcard_id_key;
ALTER TABLE user_card_stats DROP COLUMN IF EXISTS user_id;
-- Add new unique constraint on flashcard_id only
ALTER TABLE user_card_stats ADD CONSTRAINT user_card_stats_flashcard_id_key UNIQUE (flashcard_id);

-- Step 8: Adjust indexes
DROP INDEX IF EXISTS user_card_stats_user_id_current_priority_idx;
-- Re-create index on just current_priority
CREATE INDEX user_card_stats_current_priority_idx ON user_card_stats(current_priority);

DROP INDEX IF EXISTS reviews_user_id_flashcard_id_idx;
-- Re-create index on just flashcard_id
CREATE INDEX reviews_flashcard_id_idx ON reviews(flashcard_id);

-- Step 9: Drop user preference table (no more needed)
DROP TABLE IF EXISTS user_preferences;

-- Step 10: Drop users table (no more needed)
DROP TABLE IF EXISTS users;

-- Step 11: Verify remaining tables structure
-- The following tables should now exist:
-- - dialects (id, code, name, region, created_at)
-- - flashcards (id, dialect_id, lemma, phonetic, meaning, status, tags, created_at, updated_at)
-- - sentences (id, dialect_id, text, translation, created_at)
-- - sentence_word_links (id, sentence_id, flashcard_id, start_index, end_index)
-- - user_card_stats (id, flashcard_id, ef, interval_days, repetitions, next_review_at, last_review_at, current_priority, status, wrong_count)
-- - review_session (id, type, created_at)
-- - reviews (id, flashcard_id, session_id, mode, score, similarity, quality, created_at)

COMMIT;

-- ============================================================================
-- Notes:
-- 1. After running this script, you must:
--    a) In your local Supabase client or migrations, run: prisma migrate deploy
--    b) Or run: prisma generate && prisma db push
-- 
-- 2. All existing user data will be deleted. If you need to preserve review
--    history, extract it to a backup before running this.
--
-- 3. The system now operates in single-user mode. All flashcards and stats
--    are global.
-- ============================================================================
