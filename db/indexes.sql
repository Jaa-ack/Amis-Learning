-- PostgreSQL indexes and extensions for fuzzy matching and performance

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram indexes for fuzzy match on lemma and sentence text
CREATE INDEX IF NOT EXISTS idx_flashcards_lemma_trgm
  ON flashcards USING gin (lemma gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sentences_text_trgm
  ON sentences USING gin (text gin_trgm_ops);

-- Priority and scheduling helpers
CREATE INDEX IF NOT EXISTS idx_user_card_stats_next_review
  ON user_card_stats (next_review_at);

CREATE INDEX IF NOT EXISTS idx_user_card_stats_user_priority
  ON user_card_stats (user_id, current_priority);
