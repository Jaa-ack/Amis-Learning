# 🔧 Vercel Supabase 連接修復指南

## ❌ 問題診斷

**錯誤**：`Can't reach database server at db.komwtkwhfvhuswfwvnwu.supabase.co:5432`

**根本原因**：
1. Vercel 環境變數設定不正確或不完整
2. DATABASE_URL 指向 Port 5432，但該連接被防火牆/網路限制
3. DIRECT_URL 環境變數可能未設定

---

## ✅ 解決方案

### 方案 A：使用 Supabase Connection Pooling（推薦）

#### 步驟 1：從 Supabase 獲取 Pooling URL

1. 登入 https://supabase.com/dashboard/project/komwtkwhfvhuswfwvnwu/settings/database
2. 找到 **Connection Pooling** 區塊
3. **Pool mode** 選擇 **Transaction**
4. **Connection string** 選擇 **URI**
5. 複製顯示的連接字串（應該類似）：
   ```
   postgresql://postgres.komwtkwhfvhuswfwvnwu:密碼@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
   ```

#### 步驟 2：在 Vercel 設定環境變數

前往：https://vercel.com/jaa-acks-projects/web/settings/environment-variables

**刪除或更新現有的 DATABASE_URL**，然後設定：

**DATABASE_URL**（最重要）：
```
postgresql://postgres.komwtkwhfvhuswfwvnwu:Jason92123!abc@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

⚠️ **重點**：
- 主機名：`aws-0-ap-northeast-1.pooler.supabase.com`（不是 `db.komwtkwhfvhuswfwvnwu.supabase.co`）
- Port：`6543`
- 用戶名：`postgres.komwtkwhfvhuswfwvnwu`（包含專案 ID）
- 參數：`?pgbouncer=true&connection_limit=1`

**DIRECT_URL**（用於 migrations）：
```
postgresql://postgres:Jason92123!abc@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres
```

#### 步驟 3：重新部署

1. 前往：https://vercel.com/jaa-acks-projects/web/deployments
2. 找最新部署 → 點擊 **⋯** (三個點) → **Redeploy**
3. ⚠️ **取消勾選** "Use existing Build Cache"
4. 點擊 **Redeploy**

#### 步驟 4：測試

部署完成後：
```bash
curl 'https://web-one-eta-27.vercel.app/api/dashboard/dialects?userId=demo-user'
```

應該返回 JSON 而非 500 錯誤。

---

### 方案 B：使用 Session Pooling（如果方案 A 失敗）

**DATABASE_URL**：
```
postgresql://postgres.komwtkwhfvhuswfwvnwu:Jason92123!abc@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true
```

⚠️ Port 改為 `5432`，其他相同。

---

### 方案 C：設定 Supabase IP 白名單（如果還是失敗）

1. 前往 Supabase Dashboard → **Project Settings** → **Database**
2. 找 **IP Whitelist** 或 **Network** 設定
3. 添加 `0.0.0.0/0` 允許所有 IP（不安全，只用於測試）
4. 或添加 Vercel IP 範圍：
   ```
   52.84.0.0/16
   52.200.0.0/16
   ```

---

## 🔍 驗證環境變數

### 查看 Vercel 環境變數

1. 前往 https://vercel.com/jaa-acks-projects/web/settings/environment-variables
2. 確認 **DATABASE_URL** 已設定
3. 確認 **DIRECT_URL** 已設定
4. 兩者都勾選 ✅ **Production**, ✅ **Preview**, ✅ **Development**

### 檢查 Prisma 配置

確認 `web/prisma/schema.prisma` 包含：

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}
```

---

## 📋 完整檢查清單

- [ ] DATABASE_URL 指向 `aws-0-ap-northeast-1.pooler.supabase.com`（Pooling）
- [ ] DATABASE_URL 包含 `?pgbouncer=true&connection_limit=1`
- [ ] DATABASE_URL 用戶名為 `postgres.komwtkwhfvhuswfwvnwu`（含專案 ID）
- [ ] DATABASE_URL Port 為 `6543`（Transaction）或 `5432`（Session）
- [ ] DIRECT_URL 指向 `db.komwtkwhfvhuswfwvnwu.supabase.co:5432`
- [ ] 兩個環境變數都勾選所有環境
- [ ] schema.prisma 有 `directUrl = env("DIRECT_URL")`
- [ ] Vercel 已重新部署（清除快取）
- [ ] 檢查 Vercel Runtime Logs 確認環境變數載入正確

---

## 🐛 進階除錯

### 查看 Vercel Logs

1. 前往：https://vercel.com/jaa-acks-projects/web/deployments
2. 點擊最新部署
3. **Runtime Logs** 標籤
4. 搜尋 `DATABASE_URL` 確認環境變數已載入

### 本地測試

```bash
cd /Users/jaaaaack/VSCode/Amis-Learning/web

# 方案 A：Transaction Pooling
DATABASE_URL='postgresql://postgres.komwtkwhfvhuswfwvnwu:Jason92123!abc@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1' \
DIRECT_URL='postgresql://postgres:Jason92123!abc@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres' \
npm run dev

# 訪問：http://localhost:3000/api/dashboard/dialects?userId=demo-user
```

### 測試不同的連接方式

```bash
# 測試 1：Direct Connection
DIRECT_URL='postgresql://postgres:Jason92123!abc@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres' \
DATABASE_URL='postgresql://postgres:Jason92123!abc@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres' \
npx prisma db execute --stdin <<< "SELECT 1;"

# 測試 2：Transaction Pooling
DATABASE_URL='postgresql://postgres.komwtkwhfvhuswfwvnwu:Jason92123!abc@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' \
DIRECT_URL='postgresql://postgres:Jason92123!abc@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres' \
npx prisma db execute --stdin <<< "SELECT 1;"

# 測試 3：Session Pooling
DATABASE_URL='postgresql://postgres.komwtkwhfvhuswfwvnwu:Jason92123!abc@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true' \
DIRECT_URL='postgresql://postgres:Jason92123!abc@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres' \
npx prisma db execute --stdin <<< "SELECT 1;"
```

---

## 🎯 建議步驟順序

1. ✅ **立即執行**：前往 Vercel 設定 DATABASE_URL（方案 A）
2. ✅ **立即執行**：確保 DIRECT_URL 已設定
3. ✅ **立即執行**：重新部署（清除快取）
4. ⏳ **等待 2-3 分鐘**：部署完成
5. 🔍 **測試**：執行 curl 命令確認成功
6. ❌ 如果還是失敗：查看 Vercel Logs 找具體錯誤
7. 🔄 如果需要：嘗試方案 B（Session Pooling）

---

## 📞 常見問題

**Q：為什麼本地成功但 Vercel 失敗？**
A：環境變數未正確設定或 Vercel 缓存了舊設定，需要清除快取重新部署。

**Q：Pooling URL 的主機名應該是什麼？**
A：應該是 `aws-0-ap-northeast-1.pooler.supabase.com`，而不是 `db.komwtkwhfvhuswfwvnwu.supabase.co`

**Q：用戶名為什麼要包含專案 ID？**
A：Supabase Pooling 要求用戶名格式為 `postgres.PROJECT_ID`

**Q：pgbouncer=true 是必須的嗎？**
A：是的，對於 Vercel Serverless Functions 是必需的。

---

**更新時間**：2025年12月28日
