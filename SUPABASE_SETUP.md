# Supabase 完整設定指南

## 1. 取得 Supabase 連接資訊（詳細步驟）

### 方法一：從 Project Settings 取得（推薦）

1. 前往 [Supabase Dashboard](https://app.supabase.com/)
2. 點選你的 **Amis-Learninig** 專案
3. 左側選單最下方，點擊 **⚙️ Project Settings**（齒輪圖示）
4. 在 Settings 子選單中，點擊 **Database**
5. 往下捲動找到 **Connection string** 區塊
6. 在 Connection string 下方，選擇 **URI** 標籤（或稱 **Pooler** / **Direct connection**）
7. 你會看到類似這樣的連接字串：
   ```
   postgresql://postgres.xxxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
   ```
   或
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxxx.supabase.co:5432/postgres
   ```

**重要：** 連接字串中的 `[YOUR-PASSWORD]` 需要替換成你的**資料庫密碼**。

### 如何取得資料庫密碼？

- **如果你記得建立專案時設定的密碼**：直接替換 `[YOUR-PASSWORD]`
- **如果忘記密碼**：
  1. 同樣在 **Project Settings** → **Database** 頁面
  2. 找到 **Database password** 區塊
  3. 點擊 **Reset database password** 重設密碼
  4. 複製新密碼，並替換到連接字串中

### 方法二：使用 Connection Pooling（推薦用於 Vercel Serverless）

Supabase 提供兩種連接模式：
- **Direct connection**（Port 5432）：適合長時間連線
- **Connection pooling**（Port 6543）：適合 Serverless 環境（Vercel）

**取得 Pooling 連接字串**：
1. 在 **Project Settings** → **Database**
2. 找到 **Connection Pooling** 區塊
3. **Connection string** 選擇 **URI**
4. **Mode** 選擇 **Transaction**
5. 複製顯示的連接字串

### 完整的連接字串範例

假設：
- Project Reference: `abcdefghijklmnop`
- 密碼: `MySecurePassword123`

則 DATABASE_URL 應為：
```
postgresql://postgres.abcdefghijklmnop:MySecurePassword123@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

或（Direct connection）：
```
postgresql://postgres:MySecurePassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
```

## 2. 設定本地環境變數

```bash
cd /Users/jaaaaack/VSCode/Amis-Learninig/web
cp .env.example .env
```

編輯 `.env` 檔案，貼上 Supabase 連接字串：
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
NEXT_PUBLIC_API_BASE=""
```

## 3. 在 Supabase 啟用必要擴充

前往 Supabase Dashboard：**SQL Editor** → 執行以下 SQL：

```sql
-- 啟用 pg_trgm 擴充（用於模糊查詢與智能連結）
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

## 4. 推送資料庫結構（Prisma Schema）

確認你在 `web/` 資料夾，執行：

```bash
npx prisma generate
npx prisma db push
```

這會建立所有資料表（users, dialects, flashcards, sentences, reviews 等）。

## 5. 建立效能索引

在 Supabase SQL Editor 執行（或將 `db/indexes.sql` 內容貼上）：

```sql
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
```

## 6. 匯入單字資料

確認 `.env` 的 `DATABASE_URL` 已設定正確，執行：

```bash
npx tsx scripts/import-words.ts
```

腳本會自動：
- 建立 5 個方言（秀姑巒、南勢、恆春、海岸、馬蘭）
- 從 `學習詞表/` 讀取 CSV 並匯入到 `flashcards` 表
- 每筆單字都會關聯到對應的方言 ID

**預期輸出**：
```
Importing 學習詞表_秀姑巒阿美語.csv
Importing 學習詞表_南勢阿美語.csv
...
```

## 7. 本地測試 Next.js 應用

```bash
npm run dev
```

開啟 http://localhost:3000，進入各頁面測試：
- `/study` — 學習模式
- `/test` — 拼寫測驗
- `/dictionary` — 字典查詢
- `/cms` — 內容管理（新增單字與例句）
- `/dashboard` — 統計儀表板

## 8. 部署到 Vercel

### 8.1 推送程式碼到 GitHub

```bash
cd /Users/jaaaaack/VSCode/Amis-Learninig
git init
git add .
git commit -m "Initial commit: Amis Learning Platform"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 8.2 連接 Vercel

1. 前往 [Vercel Dashboard](https://vercel.com/)
2. **New Project** → 選擇你的 GitHub repo
3. **Root Directory** 設定為 `web`
4. **Environment Variables** 加入：
   - Key: `DATABASE_URL`
   - Value: 你的 Supabase 連接字串
5. 點擊 **Deploy**

### 8.3 部署後推送資料庫（選用）

若尚未執行 `prisma db push`，可在 Vercel CLI 執行：

```bash
vercel env pull .env.production
npx prisma db push
```

或直接在本地完成所有資料庫建立與匯入後再部署。

## 9. 驗證部署

部署完成後，前往 Vercel 提供的網址（如 `https://amis-learning.vercel.app`），測試各功能：
- API 健康檢查：`/api/health`
- 字典查詢：`/api/dictionary/search?q=影子`
- 方言分布：`/api/dashboard/dialects`

## 常見問題

**Q: 連接 Supabase 時出現 SSL 錯誤？**  
A: 在 `DATABASE_URL` 最後加上 `?sslmode=require`：
```
postgresql://...?sslmode=require
```

**Q: CSV 匯入失敗？**  
A: 確認 CSV 檔案編碼為 UTF-8，且路徑正確。可先測試單一檔案。

**Q: 模糊查詢無結果？**  
A: 確認已執行 `CREATE EXTENSION pg_trgm` 並建立 Trigram 索引。

**Q: Vercel 部署後 API 錯誤？**  
A: 檢查 Vercel Environment Variables 是否已設定 `DATABASE_URL`。
