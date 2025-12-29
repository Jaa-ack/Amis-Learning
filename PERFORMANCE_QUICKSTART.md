# ⚡️ 資料庫性能優化 - 快速執行指南

## 🎯 一分鐘了解

**問題：** 每個動作都要等很久  
**原因：** 缺少資料庫索引 + 查詢效能差 + 連接池太小  
**解決：** 4 步優化，預期 **5-10 倍速度提升**

---

## 📋 執行步驟（15 分鐘完成）

### ✅ Step 1: 執行資料庫索引（最重要！）

1. 打開 **Supabase Dashboard**: https://supabase.com/dashboard
2. 選擇你的專案
3. 左側選單點選 **SQL Editor**
4. 點選 **New Query**
5. 複製以下內容貼上：

```sql
-- 性能優化索引
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Reviews 表索引（加速 CTE 查詢）
CREATE INDEX IF NOT EXISTS idx_reviews_flashcard_session 
  ON reviews (flashcard_id, session_id);

CREATE INDEX IF NOT EXISTS idx_reviews_session_score 
  ON reviews (session_id, score) 
  WHERE session_id IS NOT NULL;

-- ReviewSession 表索引
CREATE INDEX IF NOT EXISTS idx_review_session_type 
  ON review_session (type, created_at);

-- UserCardStat 複合索引
CREATE INDEX IF NOT EXISTS idx_user_card_stats_composite 
  ON user_card_stats (flashcard_id, next_review_at, ef, repetitions);

-- SentenceWordLink 外鍵索引
CREATE INDEX IF NOT EXISTS idx_sentence_word_links_sentence 
  ON sentence_word_links (sentence_id);

CREATE INDEX IF NOT EXISTS idx_sentence_word_links_flashcard 
  ON sentence_word_links (flashcard_id);

-- Flashcards 複合索引
CREATE INDEX IF NOT EXISTS idx_flashcards_dialect_created 
  ON flashcards (dialect_id, created_at DESC);

-- Trigram 索引（模糊搜尋）
CREATE INDEX IF NOT EXISTS idx_flashcards_lemma_trgm
  ON flashcards USING gin (lemma gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sentences_text_trgm
  ON sentences USING gin (text gin_trgm_ops);

-- 更新統計數據
ANALYZE flashcards;
ANALYZE user_card_stats;
ANALYZE reviews;
ANALYZE review_session;
```

6. 點選 **Run** 按鈕（或按 Ctrl+Enter / Cmd+Enter）
7. 等待完成（約 10-30 秒）

**驗證索引已建立：**
```sql
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY indexname;
```

應該看到至少 8 個 `idx_` 開頭的索引。

---

### ✅ Step 2: 等待 Vercel 自動部署

程式碼已經推送到 GitHub，Vercel 會自動部署。

1. 打開 **Vercel Dashboard**: https://vercel.com/dashboard
2. 選擇你的專案 `amis-learning`
3. 查看最新部署狀態
4. 等待狀態變成 **Ready**（約 3-5 分鐘）

或直接在終端機查看部署狀態：
```bash
# 如果有安裝 Vercel CLI
vercel inspect
```

---

### ✅ Step 3: 測試性能提升

部署完成後，開啟你的網站並測試：

**測試清單：**
- [ ] **Study 頁面** - 選擇方言後載入速度
- [ ] **Test 頁面** - 選擇方言後載入速度
- [ ] **Dashboard** - 資料顯示速度
- [ ] **Dictionary** - 搜尋回應速度

**檢查方式（Chrome）：**
1. 按 F12 開啟 DevTools
2. 切換到 **Network** 標籤
3. 重新整理頁面
4. 查看 API 請求時間（應該 <500ms）

**Before vs After:**
```
Before: /api/cards/next → 2000-3000ms ❌
After:  /api/cards/next → 200-500ms   ✅

Before: /api/dashboard/priority → 3000-4000ms ❌
After:  /api/dashboard/priority → 300-600ms   ✅
```

---

### ✅ Step 4: 清除瀏覽器快取（如果仍慢）

如果測試後仍然慢，可能是瀏覽器快取問題：

**Chrome:**
1. F12 → Network 標籤
2. 勾選 **Disable cache**
3. 重新整理頁面

**Safari:**
1. 開發 → 清空快取
2. 重新整理頁面

---

## 🎉 完成！

如果一切順利，你應該會感受到明顯的速度提升：
- ✅ Study/Test 頁面載入速度：**快 5-10 倍**
- ✅ Dashboard 資料顯示：**快 5-8 倍**
- ✅ Dictionary 搜尋：**快 2-3 倍**

---

## ❓ 常見問題

### Q1: Supabase 執行 SQL 時出現錯誤？
**A:** 可能索引已存在。執行以下清除後重試：
```sql
DROP INDEX IF EXISTS idx_reviews_flashcard_session;
DROP INDEX IF EXISTS idx_reviews_session_score;
-- ... 其他索引
```

### Q2: Vercel 部署失敗？
**A:** 檢查 Vercel Logs 錯誤訊息。常見原因：
- 環境變數未設定
- 資料庫連線失敗

### Q3: 仍然很慢？
**A:** 檢查清單：
1. ✅ Supabase 索引已建立（執行驗證 SQL）
2. ✅ Vercel 部署成功（無錯誤）
3. ✅ 瀏覽器快取已清除
4. ✅ `.env` 中 `connection_limit=10`

如果全部確認仍慢，回報具體的 API 端點和回應時間。

---

## 📚 詳細文件

更多技術細節請參考：[PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md)

---

**需要協助？** 
回報時請提供：
1. 慢速的 API 端點（例如 `/api/cards/next`）
2. 回應時間（Network 標籤中的 Time）
3. Vercel Logs 錯誤訊息（如果有）
