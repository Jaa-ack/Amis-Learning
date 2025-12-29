-- 性能優化索引 - 解決查詢速度慢的問題
-- 執行方式：在 Supabase SQL Editor 中直接執行此檔案

-- 1. Reviews 表的關鍵索引（用於 CTE 查詢中的 EXISTS subquery）
CREATE INDEX IF NOT EXISTS idx_reviews_flashcard_session 
  ON reviews (flashcard_id, session_id);

CREATE INDEX IF NOT EXISTS idx_reviews_session_score 
  ON reviews (session_id, score) 
  WHERE session_id IS NOT NULL;

-- 2. ReviewSession 表的類型索引（用於 POST_TEST 篩選）
CREATE INDEX IF NOT EXISTS idx_review_session_type 
  ON review_session (type, created_at);

-- 3. UserCardStat 的複合索引（用於 priority 計算）
CREATE INDEX IF NOT EXISTS idx_user_card_stats_composite 
  ON user_card_stats (flashcard_id, next_review_at, ef, repetitions);

-- 4. SentenceWordLink 的外鍵索引
CREATE INDEX IF NOT EXISTS idx_sentence_word_links_sentence 
  ON sentence_word_links (sentence_id);

CREATE INDEX IF NOT EXISTS idx_sentence_word_links_flashcard 
  ON sentence_word_links (flashcard_id);

-- 5. Flashcards 的複合索引（用於 fallback 查詢）
CREATE INDEX IF NOT EXISTS idx_flashcards_dialect_created 
  ON flashcards (dialect_id, created_at DESC);

-- 6. 優化 trigram 索引（確保存在且有效）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_flashcards_lemma_trgm
  ON flashcards USING gin (lemma gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sentences_text_trgm
  ON sentences USING gin (text gin_trgm_ops);

-- 7. 分析表以更新統計數據
ANALYZE flashcards;
ANALYZE user_card_stats;
ANALYZE reviews;
ANALYZE review_session;
ANALYZE sentence_word_links;

-- 查看索引使用情況（可選）
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;
