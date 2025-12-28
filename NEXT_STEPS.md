# ✅ Supabase 連接成功！接下來的步驟

## 🎉 目前進度

- ✅ DATABASE_URL 已設定正確
- ✅ Prisma schema 已推送到 Supabase
- ✅ 所有資料表已建立（users, dialects, flashcards, sentences 等）
- 🔄 正在匯入單字資料...

---

## 📊 匯入進度

目前正在執行：
```bash
npm run import
```

**預期匯入內容**：
- 秀姑巒阿美語：約 761 筆
- 南勢阿美語：約 374 筆
- 恆春阿美語：若干筆
- 海岸阿美語：約 657 筆
- 馬蘭阿美語：若干筆

**總計約 1,800+ 筆單字**

匯入過程可能需要 5-10 分鐘，請耐心等待。

---

## 🔧 接下來必做的事

### 1. 在 Supabase 建立索引（重要！）

前往 Supabase Dashboard → 你的專案 → **SQL Editor**

**新增查詢** → 貼上以下 SQL 並執行：

```sql
-- 啟用 pg_trgm 擴充（模糊查詢必備）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram indexes for fuzzy match
CREATE INDEX IF NOT EXISTS idx_flashcards_lemma_trgm
  ON flashcards USING gin (lemma gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sentences_text_trgm
  ON sentences USING gin (text gin_trgm_ops);

-- Priority and scheduling helpers
CREATE INDEX IF NOT EXISTS idx_user_card_stats_next_review
  ON user_card_stats (next_review_at);

CREATE INDEX IF NOT EXISTS idx_user_card_stats_user_priority
  ON user_card_stats (user_id, current_priority);
```

**或直接執行我準備好的檔案**：
複製 `web/supabase-indexes.sql` 的內容到 Supabase SQL Editor 執行。

---

### 2. 啟動本地開發環境

```bash
cd /Users/jaaaaack/VSCode/Amis-Learninig/web
npm run dev
```

開啟 http://localhost:3000 測試各功能：

- **/study** — 學習模式（SM-2 智能複習）
- **/test** — 拼寫測驗
- **/dictionary** — 字典查詢（試試搜尋「影子」）
- **/cms** — 內容管理（新增單字與例句）
- **/dashboard** — 統計儀表板

---

### 3. 驗證資料匯入成功

在瀏覽器打開 http://localhost:3000/dashboard

你應該會看到：
- 五個方言及其單字數量
- 長條圖顯示分布

或在 Supabase Dashboard：
- **Table Editor** → 選擇 `dialects` 表 → 應該有 5 筆資料
- **Table Editor** → 選擇 `flashcards` 表 → 應該有 1,800+ 筆資料

---

## 🚀 部署到 Vercel

### 步驟 1：推送到 GitHub

```bash
cd /Users/jaaaaack/VSCode/Amis-Learninig
git init
git add .
git commit -m "Initial commit: Amis Learning Platform with Supabase"
git branch -M main
# 建立 GitHub repo 後執行
git remote add origin https://github.com/你的使用者名稱/Amis-Learninig.git
git push -u origin main
```

### 步驟 2：連接 Vercel

1. 前往 https://vercel.com/
2. **New Project**
3. **Import Git Repository** → 選擇你的 GitHub repo
4. **Configure Project**：
   - Framework Preset: Next.js
   - Root Directory: `web`
5. **Environment Variables**：
   - Key: `DATABASE_URL`
   - Value: `postgresql://postgres:Jason92123!abc@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres?sslmode=require`
6. **Deploy**

### 步驟 3：驗證部署

部署完成後，Vercel 會給你一個網址（如 `https://amis-learning.vercel.app`）

測試以下 API：
- `/api/dashboard/dialects` — 應返回方言列表
- `/dictionary` — 應能搜尋單字

---

## 📝 你的 .env 檔案（已修正）

```env
DATABASE_URL="postgresql://postgres:Jason92123!abc@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres?sslmode=require"
NEXT_PUBLIC_API_BASE=""
```

**問題說明**：
1. ❌ 原本：缺少結尾的 `"` 且密碼有方括號 `[Jason92123!abc]`
2. ✅ 修正：移除方括號，加上 `?sslmode=require` 以支援 Supabase SSL 連線

---

## ⚠️ 常見問題

### Q: 匯入很慢或卡住？
A: 正常現象，1,800+ 筆資料需要時間。可以按 Ctrl+C 中斷，再執行 `npm run import` 繼續（腳本會跳過重複的）。

### Q: 字典搜尋沒結果？
A: 確認已在 Supabase 執行 `CREATE EXTENSION pg_trgm` 和建立索引。

### Q: Vercel 部署後 API 錯誤？
A: 檢查 Environment Variables 的 `DATABASE_URL` 是否包含 `?sslmode=require`。

---

## 🎯 下一步建議

1. **建立測試帳號系統**（目前使用 `demo-user`）
2. **加上使用者登入**（NextAuth.js + Supabase Auth）
3. **優化 iPhone 體驗**（PWA manifest, 觸控手勢）
4. **加入語音功能**（TTS 朗讀阿美語）
5. **例句資料**（透過 CMS 新增例句並測試智能連結）

有任何問題隨時問我！
