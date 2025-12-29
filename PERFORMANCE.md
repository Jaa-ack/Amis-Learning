# 資料庫性能優化（最終版）

本文件整合「快速指南」與「詳細說明」，作為專案的單一參考入口。搭配 `db/final-indexes.sql` 使用即可獲得完整的效能最佳化。

---

## 為什麼會慢？
- 缺少關鍵索引，複雜查詢會掃描全表
- CTE + EXISTS 子查詢重複掃描 `reviews` / `review_session`
- 連接池限制過低（`connection_limit=1`）導致請求排隊
- 重複請求未快取（方言清單等）

---

## 一鍵修復：執行最終索引腳本

1. 打開 Supabase Dashboard → SQL Editor → New Query
2. 貼上 `db/final-indexes.sql` 內容
3. 點選 Run 執行（10–30 秒）

驗證：
```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

---

## 程式碼層優化（已完成）

- 查詢重構：`EXISTS` → 預計算 CTE + `LEFT JOIN`
  - `web/src/pages/api/cards/next.ts`
  - `web/src/pages/api/dashboard/priority.ts`

- 連接池調整：`.env` 將 `connection_limit=10`

- 記憶體快取：`web/src/lib/cache.ts`（10 分鐘：方言清單；1 分鐘：卡片）
  - 已使用於 `/api/dashboard/dialects`

---

## 預期效能

| 端點 | 優化前 | 優化後 | 提升 |
|---|---|---|---|
| `/api/cards/next` | 1.5–3s | 0.2–0.5s | 5–10x |
| `/api/dashboard/priority` | 2–4s | 0.3–0.6s | 5–8x |
| `/api/dashboard/dialects` | 0.5–1s | 10–100ms* | 10–50x* |
| `/api/dictionary/search` | 0.8–1.5s | 0.3–0.6s | 2–3x |

\* 第二次請求（快取命中）

---

## 驗收步驟

1. 執行 `db/final-indexes.sql`
2. 推送程式碼後等待 Vercel 自動部署（3–5 分鐘）
3. Chrome DevTools → Network 檢查主要端點回應時間

---

## 疑難排解

**索引執行錯誤**：確認欄位為駝峰式，需加雙引號，例如 `"createdAt"`

**仍然很慢**：
- 索引是否真的建立（執行驗證 SQL）
- `.env` 是否為 `connection_limit=10`
- 二次請求是否快取命中（`/api/dashboard/dialects`）

**Serverless 快取限制**：若需要跨實例快取，建議導入 Vercel KV（Redis）

---

## 相關檔案
- 最終索引：`db/final-indexes.sql`
- 快取層：`web/src/lib/cache.ts`
- API 查詢：`web/src/pages/api/cards/next.ts`、`web/src/pages/api/dashboard/priority.ts`

---

## 版本資訊
最後更新：2025-12-29
維護者：Amis-Learning 團隊
