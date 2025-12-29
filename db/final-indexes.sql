-- 最終版：資料庫性能與搜尋索引（Supabase / PostgreSQL）
-- 使用方式：將本檔案內容貼到 Supabase SQL Editor 執行一次即可

-- 0) 擴充功能（Trigram 模糊搜尋）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1) 模糊搜尋索引（詞彙與句子）
CREATE INDEX IF NOT EXISTS idx_flashcards_lemma_trgm
  ON flashcards USING gin (lemma gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sentences_text_trgm
  ON sentences USING gin (text gin_trgm_ops);

-- 2) 排程與優先權（使用次數最高的查詢欄位）
CREATE INDEX IF NOT EXISTS idx_user_card_stats_next_review
  ON user_card_stats (next_review_at);

CREATE INDEX IF NOT EXISTS idx_user_card_stats_composite
  ON user_card_stats (flashcard_id, next_review_at, ef, repetitions);

-- 3) Reviews 與 ReviewSession（加速 POST_TEST 與成績篩選）
CREATE INDEX IF NOT EXISTS idx_reviews_flashcard_session
  ON reviews (flashcard_id, session_id);

CREATE INDEX IF NOT EXISTS idx_reviews_session_score
  ON reviews (session_id, score)
  WHERE session_id IS NOT NULL;

-- 注意：ReviewSession 的時間戳記欄位為 "createdAt"（駝峰式），需加引號
CREATE INDEX IF NOT EXISTS idx_review_session_type
  ON review_session (type, "createdAt");

-- 4) 關聯表外鍵索引（避免全表掃描）
CREATE INDEX IF NOT EXISTS idx_sentence_word_links_sentence
  ON sentence_word_links (sentence_id);

CREATE INDEX IF NOT EXISTS idx_sentence_word_links_flashcard
  ON sentence_word_links (flashcard_id);

-- 5) 卡片複合索引（依方言與建立時間取最新）
-- 注意：Flashcards 的時間戳記欄位為 "createdAt"（駝峰式），需加引號
CREATE INDEX IF NOT EXISTS idx_flashcards_dialect_created
  ON flashcards (dialect_id, "createdAt" DESC);

-- 6) 更新統計資訊（讓查詢規劃器最佳化）
ANALYZE flashcards;
ANALYZE user_card_stats;
ANALYZE reviews;
ANALYZE review_session;
ANALYZE sentence_word_links;

-- 7)（選用）查看索引使用狀況
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;
