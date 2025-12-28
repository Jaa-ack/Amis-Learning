-- 在 Supabase SQL Editor 執行此檔案以建立必要的擴充和索引

-- 1. 啟用 pg_trgm 擴充（模糊查詢必備）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Trigram indexes for fuzzy match on lemma and sentence text
CREATE INDEX IF NOT EXISTS idx_flashcards_lemma_trgm
  ON flashcards USING gin (lemma gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sentences_text_trgm
  ON sentences USING gin (text gin_trgm_ops);

-- 3. Priority and scheduling helpers
CREATE INDEX IF NOT EXISTS idx_user_card_stats_next_review
  ON user_card_stats (next_review_at);

CREATE INDEX IF NOT EXISTS idx_user_card_stats_user_priority
  ON user_card_stats (user_id, current_priority);

-- 4. 其他效能優化索引
CREATE INDEX IF NOT EXISTS idx_flashcards_dialect_status
  ON flashcards (dialect_id, status);

CREATE INDEX IF NOT EXISTS idx_reviews_user_flashcard
  ON reviews (user_id, flashcard_id);

-- 完成！
SELECT 'Database indexes created successfully!' AS status;
