**在 Supabase SQL Editor 中執行此腳本（逐步或一次全部）：**

```sql
-- 執行完整遷移（刪除所有用戶相關表和列）
-- 請在 Supabase Dashboard → SQL Editor 中貼上此內容後執行
-- 備份數據庫後再執行！

-- 步驟 1-10：參考 DATABASE_SCHEMA_MIGRATION.sql 的完整 SQL
-- 或直接在 Supabase SQL Editor 執行：

BEGIN;

-- 移除外鍵
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE review_session DROP CONSTRAINT IF EXISTS review_session_user_id_fkey;
ALTER TABLE user_card_stats DROP CONSTRAINT IF EXISTS user_card_stats_user_id_fkey;
ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;

-- 移除 createdBy 列
ALTER TABLE flashcards DROP COLUMN IF EXISTS created_by;
ALTER TABLE sentences DROP COLUMN IF EXISTS created_by;

-- 移除 user_id 列
ALTER TABLE reviews DROP COLUMN IF EXISTS user_id;
ALTER TABLE review_session DROP COLUMN IF EXISTS user_id;

-- user_card_stats：移除舊唯一約束，添加新的
ALTER TABLE user_card_stats DROP CONSTRAINT IF EXISTS user_card_stats_user_id_flashcard_id_key;
ALTER TABLE user_card_stats DROP COLUMN IF EXISTS user_id;
ALTER TABLE user_card_stats ADD CONSTRAINT user_card_stats_flashcard_id_key UNIQUE (flashcard_id);

-- 索引調整
DROP INDEX IF EXISTS user_card_stats_user_id_current_priority_idx;
DROP INDEX IF EXISTS reviews_user_id_flashcard_id_idx;
CREATE INDEX IF NOT EXISTS user_card_stats_current_priority_idx ON user_card_stats(current_priority);
CREATE INDEX IF NOT EXISTS reviews_flashcard_id_idx ON reviews(flashcard_id);

-- 刪除舊表
DROP TABLE IF EXISTS user_preferences;
DROP TABLE IF EXISTS users;

COMMIT;
```

---

## 後續步驟

### 在本地開發環境

1. **同步 Prisma schema**：
   ```bash
   cd /path/to/web
   npx prisma generate
   npx prisma db pull  # 同步遠程 DB 結構（可選）
   ```

2. **確認無 TypeScript 錯誤**：
   ```bash
   npm run build
   ```

3. **推送到 GitHub**：
   ```bash
   git add -A
   git commit -m "refactor: Convert to single-user system"
   git push origin main
   ```

### 在 Vercel 部署

Vercel 會自動偵測到新提交，觸發自動部署：
- Build logs 應顯示 `prisma generate` 成功
- 新版本應在 5-10 分鐘內上線

### 驗證遷移成功

1. **檢查 DB 結構**（Supabase SQL Editor）：
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
   ```
   應返回 7 個表：dialects, flashcards, sentences, sentence_word_links, user_card_stats, review_session, reviews

2. **驗證 API 端點**（瀏覽器或 curl）：
   ```bash
   # 測試方言端點（無 userId 參數）
   curl -s https://web-one-eta-27.vercel.app/api/dashboard/dialects | jq

   # 測試卡片端點（無 userId 參數）
   curl -s 'https://web-one-eta-27.vercel.app/api/cards/next?limit=5' | jq

   # 檢查 DB 狀態
   curl -s https://web-one-eta-27.vercel.app/api/debug/db-summary | jq
   ```

3. **Study 頁面測試**：
   - 訪問 https://web-one-eta-27.vercel.app/study
   - 應看到方言列表（若已有 flashcards 數據）
   - 點擊方言應載入卡片進行學習

---

## 常見問題

**Q: 執行 SQL 後 Prisma 報錯？**  
A: 執行 `npx prisma generate` 刷新客戶端，然後 `npm run build` 驗證。

**Q: Vercel 部署後 500 錯誤？**  
A: 檢查 Vercel logs，可能是 Prisma 客戶端未正確重建。嘗試手動重新部署。

**Q: 如何恢復舊數據？**  
A: 使用 Supabase 的備份功能恢復之前的快照（若已配置）。

---

## 架構概述（遷移後）

| 表 | 用途 | 關鍵欄位 |
|---|---|---|
| dialects | 方言管理 | id, code, name |
| flashcards | 單字卡 | id, dialectId, lemma, meaning, phonetic, status |
| sentences | 例句 | id, dialectId, text, translation |
| sentence_word_links | 例句-單字連結 | sentenceId, flashcardId, startIndex, endIndex |
| user_card_stats | **全局**學習統計（無 userId） | id, flashcardId, ef, intervalDays, repetitions, nextReviewAt |
| review_session | 測驗場次 | id, type (NORMAL/POST_TEST) |
| reviews | 作答紀錄 | id, flashcardId, sessionId, mode, score, similarity |

---

現在系統已轉為**單用戶架構**。所有 flashcards 與統計數據均共享，不再分用戶隔離。

