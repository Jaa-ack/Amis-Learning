# Vercel 環境變數設定指南

## 🎯 目標
在 Vercel 儀表板中正確設置 `DATABASE_URL` 和 `DIRECT_URL`，以便 Prisma 可以在 Serverless Functions 中連接到 Supabase PostgreSQL。

## 📋 必要環境變數

| 變數名稱 | 用途 | 值 |
|---------|------|-----|
| `DATABASE_URL` | 應用查詢用（Serverless，pooling）| `postgresql://postgres.komwtkwhfvhuswfwvnwu:*****@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Migration 用（Direct 連接） | `postgresql://postgres:*****@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres` |
| `SUPABASE_PASSWORD` | 用於 fallback pooling 構建 | 同上密碼部分 |
| `SUPABASE_REF` | 專案參考（可選，預設: komwtkwhfvhuswfwvnwu） | `komwtkwhfvhuswfwvnwu` |
| `SUPABASE_REGION` | Supabase 區域（可選，預設: ap-northeast-1） | `ap-northeast-1` |

## 🔑 取得 Supabase 認證資訊

1. 登入 [Supabase 控制台](https://app.supabase.com)
2. 選擇你的專案
3. 點擊 **Settings** → **Database** → **Connection string**
4. 選擇 **URI** 標籤
5. 複製三種連接方式的字串：
   - **Transaction Pooling** (Port 6543) → 用於 DATABASE_URL ✅
   - **Session Pooling** (Port 5432) → 備選方案
   - **Direct Connection** (Port 5432) → 用於 DIRECT_URL ✅

### 連接字串格式

**Transaction Pooling (DATABASE_URL)：**
```
postgresql://postgres.komwtkwhfvhuswfwvnwu:YOUR_PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**Direct Connection (DIRECT_URL)：**
```
postgresql://postgres:YOUR_PASSWORD@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres
```

## 🚀 在 Vercel 儀表板中設置變數

### 步驟 1：登入 Vercel
訪問 [Vercel 儀表板](https://vercel.com)

### 步驟 2：選擇專案
點擊你的 "web" 專案（Amis-Learning 的 Next.js 應用）

### 步驟 3：進入環境變數設定
導航到 **Settings** → **Environment Variables**

### 步驟 4：新增環境變數
點擊 **Add New** 按鈕，依序新增：

#### 4.1 DATABASE_URL
- **Name:** `DATABASE_URL`
- **Value:** (Supabase 中的 Transaction Pooling URI)
- **Environments:** Production, Preview, Development（全選）
- **Click:** Save

#### 4.2 DIRECT_URL
- **Name:** `DIRECT_URL`
- **Value:** (Supabase 中的 Direct Connection URI)
- **Environments:** Production, Preview, Development（全選）
- **Click:** Save

#### 4.3 SUPABASE_PASSWORD（備用）
- **Name:** `SUPABASE_PASSWORD`
- **Value:** 你的 Supabase 密碼
- **Environments:** Production, Preview, Development（全選）
- **Click:** Save

#### 4.4 SUPABASE_REF（可選）
- **Name:** `SUPABASE_REF`
- **Value:** `komwtkwhfvhuswfwvnwu`
- **Environments:** Production, Preview, Development（全選）
- **Click:** Save

#### 4.5 SUPABASE_REGION（可選）
- **Name:** `SUPABASE_REGION`
- **Value:** `ap-northeast-1`
- **Environments:** Production, Preview, Development（全選）
- **Click:** Save

### 步驟 5：保存並重新部署
設置完成後，點擊 Vercel 儀表板中的 **Redeploy** 按鈕重新構建和部署應用。

## ✅ 驗證設置

設置完成並重新部署後，測試以下端點：

### 1. 檢查調試端點
```
GET https://web-one-eta-27.vercel.app/api/debug/env
```

預期回應：
```json
{
  "database_url_set": true,
  "database_url_preview": "postgresql://postgres.komwtkwhfvhuswfwvnwu:***@aws-0-...",
  "direct_url_set": true,
  "diagnosis": {
    "hasDatabase": true,
    "hasDirectUrl": true,
    "databaseUrlValid": true,
    "directUrlValid": true
  }
}
```

### 2. 測試實際 API
```
GET https://web-one-eta-27.vercel.app/api/dashboard/dialects?userId=demo-user
```

預期回應（JSON 陣列，不是 500 錯誤）：
```json
{
  "data": [
    { "dialect_id": 1, "name": "Amis", "cards": 500 },
    { "dialect_id": 2, "name": "Standard Amis", "cards": 300 }
  ]
}
```

## 🔧 故障排查

### 問題：仍然看到 "Can't reach database server at db.komwtkwhfwvhuswfwvnwu.supabase.co:5432"

**原因：** DATABASE_URL 沒有正確設置或仍在使用 Direct Connection。

**解決步驟：**

1. **驗證環境變數**
   - 訪問 Vercel Settings → Environment Variables
   - 確認 DATABASE_URL 和 DIRECT_URL 都已設置
   - 如果名稱或值有誤，點擊編輯並修正

2. **清除快取並重新部署**
   - Vercel Dashboard → Deployments
   - 點擊最新部署的 **...** → **Redeploy**
   - 或按 **"Redeploy"** 按鈕

3. **檢查 Build Logs**
   - 訪問 Vercel Dashboard → Deployments
   - 點擊最新部署
   - 查看 **Build Logs** 確認 `prisma generate` 是否執行
   - 確認無 prisma 錯誤

4. **檢查 Runtime Logs**
   - 點擊最新部署 → **Runtime Logs**
   - 查看任何與 Prisma 相關的錯誤訊息
   - 如果看到密碼相關錯誤，檢查連接字串中的密碼是否正確

5. **嘗試備選方案**
   - 在 DATABASE_URL 中改用 **Session Pooling** (Port 5432)：
   ```
   postgresql://postgres.komwtkwhfvhuswfwvnwu:PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
   ```
   - 再次部署

### 問題：密碼錯誤或連接被拒絕

**原因：** Supabase 密碼不匹配或連接字串格式有誤。

**解決步驟：**

1. 重新登入 Supabase 控制台
2. 進入 **Settings** → **Database** → **Connection string**
3. 確認你複製的密碼正確
4. 檢查連接字串中是否含有特殊字符（如 `@`, `:`, `%`），需要 URL 編碼
5. 在 Vercel 中更新環境變數

### 問題：prisma generate 失敗

**原因：** 構建時 Prisma Client 生成有問題。

**解決步驟：**

1. 查看 Vercel Build Logs，找到具體的 Prisma 錯誤
2. 通常是因為 schema.prisma 有語法錯誤
3. 在本地驗證：
   ```bash
   cd /Users/jaaaaack/VSCode/Amis-Learning/web
   npx prisma generate
   ```
4. 修正任何錯誤後重新推送到 GitHub

## 📝 快速參考

### 必填環境變數（最少配置）

```
DATABASE_URL=postgresql://postgres.komwtkwhfvhuswfwvnwu:***@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:***@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres
```

### 完整環境變數（推薦配置）

```
DATABASE_URL=postgresql://postgres.komwtkwhfvhuswfwvnwu:***@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:***@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres
SUPABASE_PASSWORD=***
SUPABASE_REF=komwtkwhfvhuswfwvnwu
SUPABASE_REGION=ap-northeast-1
```

## 🎓 為什麼需要這兩個 URL？

- **DATABASE_URL** (Pooling): Vercel Serverless Functions 會並行建立許多連接。Direct PostgreSQL 連接無法支持無限擴展。Pooling 通過 PgBouncer 管理連接數，確保穩定性。

- **DIRECT_URL** (Direct): Prisma migrate 和 introspection 操作需要完整的 PostgreSQL 連接權限，Pooling 連接無法支持這些操作。

## 📞 如果問題仍未解決

1. 檢查 GitHub 上的 [Prisma + Vercel + Supabase 最佳實踐](https://www.prisma.io/docs/deployment/guides/deploying-to-vercel)
2. 查看 Supabase 文檔中的 [Connection pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooling-with-pgbouncer)
3. 在 Vercel Deployments 中檢查完整的 Build 和 Runtime Logs
4. 確認 Supabase 項目狀態，訪問 [Supabase Status](https://status.supabase.com)
