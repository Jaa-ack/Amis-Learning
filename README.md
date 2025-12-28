# Amis Language Learning Platform (阿美族語言學習平台)

基於 SM-2 間隔重複演算法的智能阿美語學習系統，針對 iPhone 移動端體驗優化。

## 🚀 部署到 Vercel

### 前置條件
- ✅ GitHub Repository: https://github.com/Jaa-ack/Amis-Learninig
- ✅ Supabase 資料庫已建立
- ✅ Vercel 帳號已連接 GitHub

### 步驟 1：準備資料庫

在 Supabase SQL Editor 執行：

```sql
-- 啟用擴充
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_flashcards_lemma_trgm ON flashcards USING gin (lemma gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_user_card_stats_next_review ON user_card_stats (next_review_at);
CREATE INDEX IF NOT EXISTS idx_user_card_stats_user_priority ON user_card_stats (user_id, current_priority);
```

### 步驟 2：推送程式碼到 GitHub

```bash
cd /Users/jaaaaack/VSCode/Amis-Learninig
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

### 步驟 3：在 Vercel 設定專案

1. 前往 Vercel Dashboard → 你的專案
2. **Settings** → **General** → **Root Directory** 設為 `web`
3. **Settings** → **Environment Variables** → 新增：
   - Key: `DATABASE_URL`
   - Value: `postgresql://postgres:你的密碼@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres?sslmode=require`
4. **Deployments** → 點擊最新的部署 → **Redeploy**

### 步驟 4：匯入資料（本地執行）

```bash
cd web
npm install
npx prisma generate
npm run import
```

---

## 💻 本地開發

```bash
cd web
cp .env.example .env
# 編輯 .env，填入 DATABASE_URL
npm install
npx prisma generate
npx prisma db push
npm run import
npm run dev
```

開啟 http://localhost:3000

---

## 📱 主要功能

- **/study** — SM-2 智能學習（優先級 P1-P4）
- **/test** — 拼寫測驗（相似度評分）
- **/dictionary** — 模糊查詢（pg_trgm）
- **/cms** — 內容管理（新增詞彙、例句、智能連結）
- **/dashboard** — 學習統計與方言分布

---

## 🗂️ 專案結構

- `web/` — Next.js 應用（前端 + API Routes）
- `學習詞表/` — 五種阿美語方言詞彙 CSV
- `docs/` — 技術文件（架構、演算法、UI 設計）

---

## 🛠️ 技術堆疊

- **Frontend**: Next.js 14, React 18
- **Backend**: Next.js API Routes (Serverless)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Deployment**: Vercel

---

## 📚 技術文件

- [技術架構](docs/tech-architecture.md) — 系統設計與選型
- [演算法說明](docs/algorithms.md) — SM-2 與智能連結
- [UI/UX 設計](docs/ui-ux.md) — iPhone 介面指引
