# 資料庫性能優化指南

## 問題診斷

系統回應速度慢的原因：
1. ❌ **缺少關鍵資料庫索引** - 複雜查詢掃描全表
2. ❌ **CTE 查詢效能差** - 多層 WITH + EXISTS 子查詢
3. ❌ **連接池限制過低** - `connection_limit=1` 造成排隊
4. ❌ **重複查詢未快取** - 每次請求都查詢資料庫

---

## 🚀 已實施優化

### 1. 資料庫索引優化 ✅

**執行方式：**
1. 登入 Supabase Dashboard: https://supabase.com/dashboard
2. 選擇你的專案 → SQL Editor
3. 複製 `db/performance-indexes.sql` 的內容並執行

**新增索引清單：**
```sql
-- 關鍵索引（針對 CTE 查詢優化）
idx_reviews_flashcard_session    -- reviews (flashcard_id, session_id)
idx_reviews_session_score         -- reviews (session_id, score)
idx_review_session_type           -- review_session (type, created_at)
idx_user_card_stats_composite     -- user_card_stats (複合索引)
idx_flashcards_dialect_created    -- flashcards (dialect_id, created_at DESC)

-- 外鍵索引
idx_sentence_word_links_sentence  -- sentence_word_links (sentence_id)
idx_sentence_word_links_flashcard -- sentence_word_links (flashcard_id)
```

**預期提升：** 
- 查詢速度提升 **3-10 倍**（視資料量而定）
- 特別是 `/api/cards/next` 和 `/api/dashboard/priority`

---

### 2. SQL 查詢重構 ✅

**Before (慢):**
```sql
-- 使用 EXISTS 子查詢，每筆資料都掃描一次 reviews 表
WITH stats AS (
  SELECT ucs.*, 
         EXISTS (SELECT 1 FROM reviews r ...) AS failed_post_test
  FROM user_card_stats ucs ...
)
```

**After (快):**
```sql
-- 使用 CTE 預先計算，再 LEFT JOIN（只掃描一次）
WITH failed_tests AS (
  SELECT DISTINCT r.flashcard_id
  FROM reviews r
  INNER JOIN review_session s ON s.id = r.session_id
  WHERE s.type = 'POST_TEST' AND r.score <= 2
)
SELECT f.*, ...
FROM flashcards f
LEFT JOIN user_card_stats ucs ON ucs.flashcard_id = f.id
LEFT JOIN failed_tests ft ON ft.flashcard_id = f.id
```

**修改檔案：**
- ✅ `web/src/pages/api/cards/next.ts`
- ✅ `web/src/pages/api/dashboard/priority.ts`

**預期提升：** 查詢時間減少 **50-70%**

---

### 3. 連接池配置優化 ✅

**Before:**
```env
connection_limit=1
```

**After:**
```env
connection_limit=10
```

**說明：**
- Vercel serverless 環境建議 5-10 個連接
- 避免單一連接排隊造成延遲
- Supabase 免費版總限制為 60 連接，10 個連接很安全

**修改檔案：** ✅ `web/.env`

**預期提升：** 並發請求回應時間減少 **30-50%**

---

### 4. 記憶體快取機制 ✅

**新增檔案：** `web/src/lib/cache.ts`

**快取策略：**
- **Dialect 資料：** 10 分鐘（很少變動）
- **Card 資料：** 1 分鐘（避免學習進度不同步）

**已啟用快取的 API：**
- ✅ `/api/dashboard/dialects` - dialect 清單 + 卡片統計

**預期提升：** 
- 重複請求回應時間 **<10ms**（從快取讀取）
- 減少資料庫負載 **60-80%**

---

## 📊 效能指標預估

| API 端點 | 優化前 | 優化後 | 提升幅度 |
|---------|--------|--------|---------|
| `/api/cards/next` | 1500-3000ms | 200-500ms | **5-10x** |
| `/api/dashboard/priority` | 2000-4000ms | 300-600ms | **5-8x** |
| `/api/dashboard/dialects` | 500-1000ms | 10-100ms* | **10-50x*** |
| `/api/dictionary/search` | 800-1500ms | 300-600ms** | **2-3x** |

\* 第二次請求（快取命中）  
\** 需執行索引後

---

## 🔧 部署步驟

### Step 1: 執行資料庫索引（必須！）

```bash
# 1. 登入 Supabase Dashboard
# 2. SQL Editor → New Query
# 3. 複製 db/performance-indexes.sql 內容
# 4. Run
```

**驗證索引是否成功：**
```sql
-- 在 Supabase SQL Editor 執行
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

應該看到所有 `idx_reviews_*`, `idx_user_card_stats_*` 等索引。

---

### Step 2: 部署程式碼

```bash
# 在本地執行
cd /Users/jaaaaack/VSCode/Amis-Learning

# 提交所有變更
git add .
git commit -m "perf: optimize database queries and add caching"
git push origin main
```

Vercel 會自動部署（3-5 分鐘）。

---

### Step 3: 驗證性能提升

部署完成後，開啟 Chrome DevTools → Network：

**測試項目：**
1. ✅ Study 頁面載入速度
2. ✅ Test 頁面載入速度
3. ✅ Dashboard 資料顯示速度
4. ✅ Dictionary 搜尋回應速度

**預期結果：**
- 首次載入：300-600ms（有索引加速）
- 第二次載入：10-100ms（快取命中）

---

## 🎯 進階優化建議（選用）

如果執行上述優化後仍有性能問題，可考慮：

### 1. 升級 Supabase 方案
- 免費版：共享 CPU，連接限制 60
- Pro 版：專用資源，連接限制 200+
- 成本：$25/月

### 2. 實施資料庫視圖（Materialized View）
```sql
-- 預先計算優先權佇列（適合大量資料）
CREATE MATERIALIZED VIEW priority_queue AS
SELECT f.*, ucs.ef, ucs.next_review_at, ...
FROM flashcards f
LEFT JOIN user_card_stats ucs ON ...;

-- 定期刷新（每 5 分鐘）
REFRESH MATERIALIZED VIEW priority_queue;
```

### 3. 添加 Redis 快取層
- 使用 Vercel KV 或 Upstash Redis
- 快取複雜查詢結果
- 成本：$0-10/月

### 4. 查詢結果分頁
```typescript
// 不要一次載入所有資料
const limit = 20; // 每頁 20 筆
const offset = page * limit;
```

---

## 📈 監控建議

### Supabase Logs
1. Dashboard → Logs → Database
2. 查看慢查詢（>1s）
3. 分析哪些查詢需要進一步優化

### Vercel Analytics
1. Dashboard → Analytics → Web Vitals
2. 監控 FCP (First Contentful Paint)
3. 目標：<1s

---

## ✅ 檢查清單

部署前：
- [ ] 執行 `db/performance-indexes.sql` 在 Supabase
- [ ] 驗證索引已建立（上方 SQL 查詢）
- [ ] 本地測試 `npm run build` 成功
- [ ] 確認 `.env` 中 `connection_limit=10`

部署後：
- [ ] Vercel 部署成功（無錯誤）
- [ ] Study 頁面載入時間 <500ms
- [ ] Test 頁面載入時間 <500ms
- [ ] Dashboard 載入時間 <600ms
- [ ] 第二次請求快取命中（<100ms）

---

## 🆘 疑難排解

### Q: 部署後仍然很慢
A: 
1. 確認索引已執行（Supabase SQL Editor 查詢）
2. 檢查 Vercel Logs 是否有錯誤
3. 確認 `.env` 已更新 `connection_limit=10`
4. 清除瀏覽器快取重新測試

### Q: 快取沒有生效
A:
1. 檢查 Vercel Logs 是否有 cache hit 訊息
2. 確認第二次請求時間明顯變短
3. 記憶體快取在 Vercel serverless 環境可能無效（冷啟動）
   - 考慮改用 Vercel KV (Redis)

### Q: Supabase 連接數超限
A:
```env
# 降低連接限制
connection_limit=5
```

### Q: 索引執行失敗
A:
```sql
-- 檢查是否已存在
SELECT indexname FROM pg_indexes WHERE indexname = 'idx_reviews_flashcard_session';

-- 如果存在，先刪除再重建
DROP INDEX IF EXISTS idx_reviews_flashcard_session;
CREATE INDEX idx_reviews_flashcard_session ON reviews (flashcard_id, session_id);
```

---

## 📝 總結

此次優化涵蓋：
✅ **資料庫層**：7 個新索引 + trigram 索引優化  
✅ **查詢層**：重構 2 個核心 API 查詢  
✅ **連接層**：提高連接池限制 10x  
✅ **應用層**：記憶體快取機制  

**預期整體提升：5-10 倍查詢速度**

如有任何問題，請回報具體的慢速 API 端點和查詢時間！
