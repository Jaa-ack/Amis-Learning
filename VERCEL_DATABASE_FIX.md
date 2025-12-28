# 🔧 Vercel 資料庫連接修復指南

## ✅ 問題已確認

**本地測試結果**：Direct Connection (Port 5432) ✅ 連接成功

```bash
# 測試成功的連接字串
postgresql://postgres:Jason92123!abc@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres
```

## 🎯 立即修復步驟

### 步驟 1：獲取正確的 Connection Pooling URL

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard/project/komwtkwhfvhuswfwvnwu/settings/database)
2. 在 **Database Settings** 頁面，找到 **Connection Pooling** 區塊
3. **Transaction Mode** 的連接字串應該類似：
   ```
   postgresql://postgres.komwtkwhfvhuswfwvnwu:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
   ```
   
⚠️ **注意**：主機名稱從 `db.xxx.supabase.co` 變成 `aws-0-xxx.pooler.supabase.com`

### 步驟 2：設定 Vercel 環境變數

前往：https://vercel.com/jaa-acks-projects/web/settings/environment-variables

#### 選項 A：使用 Connection Pooling（推薦給 Serverless）

**DATABASE_URL**（更新現有的）：
```
postgresql://postgres.komwtkwhfvhuswfwvnwu:Jason92123!abc@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**DIRECT_URL**（新增）：
```
postgresql://postgres:Jason92123!abc@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres
```

✅ 兩者都勾選：**Production**, **Preview**, **Development**

#### 選項 B：簡單方案（如果選項 A 失敗）

**DATABASE_URL**（僅使用 Direct Connection）：
```
postgresql://postgres:Jason92123!abc@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres?connection_limit=1
```

**DIRECT_URL**（新增，與 DATABASE_URL 相同）：
```
postgresql://postgres:Jason92123!abc@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres
```

### 步驟 3：提交 Schema 變更

```bash
cd /Users/jaaaaack/VSCode/Amis-Learning
git add web/prisma/schema.prisma
git commit -m "fix: Add directUrl support for Supabase connection pooling"
git push origin main
```

### 步驟 4：重新部署（清除快取）

在 Vercel Dashboard：
1. 前往：https://vercel.com/jaa-acks-projects/web
2. **Deployments** → 最新部署 → **⋯** (三個點) → **Redeploy**
3. ⚠️ **取消勾選** "Use existing Build Cache"
4. 點擊 **Redeploy**

### 步驟 5：驗證修復

部署完成後，測試 API：

```bash
curl 'https://web-one-eta-27.vercel.app/api/dashboard/dialects?userId=demo-user'
```

**預期結果**：應返回 JSON 陣列，而非 500 錯誤

## 📋 如何從 Supabase 獲取正確的 Pooling URL

### 方法 1：從 Dashboard 複製（推薦）

1. 訪問：https://supabase.com/dashboard/project/komwtkwhfvhuswfwvnwu/settings/database
2. 滾動到 **Connection Pooling** 區塊
3. **Pool Mode**：選擇 **Transaction**
4. **Connection string**：選擇 **URI**
5. 複製顯示的 URL（類似 `postgresql://postgres.xxx:...@aws-0-xxx.pooler.supabase.com:6543/postgres`）
6. **手動添加參數**：在 URL 結尾加上 `?pgbouncer=true&connection_limit=1`

### 方法 2：自己構建

根據你的專案 ID `komwtkwhfvhuswfwvnwu`，Pooling URL 應該是：

```
postgresql://postgres.komwtkwhfvhuswfwvnwu:Jason92123!abc@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**關鍵差異**：
- **主機名稱**：`aws-0-ap-northeast-1.pooler.supabase.com`（不是 `db.xxx.supabase.co`）
- **用戶名**：`postgres.komwtkwhfvhuswfwvnwu`（不是 `postgres`）
- **Port**：`6543`（Transaction Pooling）
- **必須參數**：`?pgbouncer=true&connection_limit=1`

## 🔍 連接模式對比

| 連接類型 | 主機名稱 | Port | 用戶名 | 適用場景 |
|---------|---------|------|--------|---------|
| **Direct** | db.komwtkwhfvhuswfwvnwu.supabase.co | 5432 | `postgres` | 開發、Migration |
| **Transaction Pooling** | aws-0-ap-northeast-1.pooler.supabase.com | 6543 | `postgres.komwtkwhfvhuswfwvnwu` | Serverless Functions |
| **Session Pooling** | aws-0-ap-northeast-1.pooler.supabase.com | 5432 | `postgres.komwtkwhfvhuswfwvnwu` | 長連接應用 |

## ❓ 常見問題

### Q1：為什麼需要兩個 URL？

- **DATABASE_URL**：Vercel Serverless Functions 執行查詢時使用（Pooling）
- **DIRECT_URL**：Prisma 執行 migrations/introspection 時使用（Direct）

### Q2：如果 Connection Pooling 還是不行怎麼辦？

使用**選項 B（簡單方案）**，兩個環境變數都設為 Direct Connection：
```
DATABASE_URL=postgresql://postgres:Jason92123!abc@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres?connection_limit=1
DIRECT_URL=postgresql://postgres:Jason92123!abc@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres
```

這個方案可能有連接數限制，但對小型應用通常足夠。

### Q3：如何確認環境變數有正確設定？

1. 前往 Vercel Deployment Logs
2. 搜尋 `DATABASE_URL`
3. 應該會看到類似 `Using DATABASE_URL from environment` 的訊息
4. **不應該**看到密碼明文（Vercel 會自動隱藏）

### Q4：重新部署後還是 500 錯誤？

檢查 Runtime Logs：
```
https://vercel.com/jaa-acks-projects/web → Deployments → 最新部署 → Runtime Logs
```

搜尋關鍵字：
- `Prisma Client`
- `DATABASE_URL`
- `connection`
- `error`

## 🎯 快速檢查清單

- [ ] 從 Supabase Dashboard 獲取 Connection Pooling URL
- [ ] 確認 Pooling URL 主機名稱為 `aws-0-xxx.pooler.supabase.com`
- [ ] 確認用戶名為 `postgres.komwtkwhfvhuswfwvnwu`（含專案 ID）
- [ ] 在 Vercel 設定 `DATABASE_URL`（Pooling，含 `?pgbouncer=true&connection_limit=1`）
- [ ] 在 Vercel 設定 `DIRECT_URL`（Direct，Port 5432）
- [ ] 兩者都勾選所有環境（Production, Preview, Development）
- [ ] Git push schema.prisma 變更
- [ ] Vercel 重新部署（清除快取）
- [ ] 測試 API 端點
- [ ] 檢查 Runtime Logs

## 📊 變更摘要

### 已完成
- ✅ `web/prisma/schema.prisma` 添加 `directUrl` 支援
- ✅ 本地測試 Direct Connection 成功

### 待完成
- [ ] 從 Supabase 獲取正確的 Pooling URL
- [ ] 更新 Vercel 環境變數（DATABASE_URL + DIRECT_URL）
- [ ] 提交並推送 schema.prisma 變更
- [ ] Vercel 重新部署（清除快取）
- [ ] 驗證 API 正常運作

---

**下一步**：請你前往 [Supabase Database Settings](https://supabase.com/dashboard/project/komwtkwhfvhuswfwvnwu/settings/database) 複製 **Connection Pooling** 的 Transaction Mode URL，然後告訴我你看到的完整 URL（或直接在 Vercel 設定環境變數）。

**更新時間**：2025年12月28日
