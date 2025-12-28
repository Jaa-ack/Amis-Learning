# Vercel 環境變數診斷與修復指南

## 🔍 現在的問題

即使設置了環境變數，部署仍然顯示：
```
Can't reach database server at db.komwtkwhfvhuswfwvnwu.supabase.co:5432
```

這表示 **Prisma 在 Runtime 時仍然使用 Direct Connection (5432)** 而不是 Connection Pooling (6543)。

### 根本原因

1. **DATABASE_URL 在 Runtime 時未被讀取**
   - Vercel 環境變數可能沒有被正確傳遞到 Node.js 進程
   - 或者環境變數設置的名稱/值有誤

2. **Prisma Client 初始化時沒有正確的連接 URL**
   - 導致 Prisma 回到預設的 Direct Connection

## 🛠️ 診斷步驟

### 步驟 1：驗證環境變數是否在 Vercel 中設置

1. 訪問 [Vercel Dashboard](https://vercel.com)
2. 選擇 **web** 專案
3. 進入 **Settings** → **Environment Variables**
4. 確認以下變數存在：
   - `DATABASE_URL` ✓
   - `DIRECT_URL` ✓
   - `SUPABASE_PASSWORD` ✓
   - `SUPABASE_REF` ✓
   - `SUPABASE_REGION` ✓

**如果任何變數缺失，現在添加它們。**

### 步驟 2：驗證環境變數值格式

在 Vercel Environment Variables 頁面，**點擊每個變數查看完整值**（不是預覽）：

**DATABASE_URL 應該看起來像：**
```
postgresql://postgres.komwtkwhfvhuswfwvnwu:YOUR_PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

✅ 必須包含：
- `pooler.supabase.com` (不是 `db.xxx.supabase.co`)
- `:6543` (不是 `:5432`)
- `pgbouncer=true`
- `connection_limit=1`

❌ 錯誤的格式：
```
postgresql://postgres:PASSWORD@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres  ❌ (Direct, wrong!)
postgresql://postgres.komwtkwhfvhuswfwvnwu@pooler...  ❌ (缺少密碼)
```

**DIRECT_URL 應該看起來像：**
```
postgresql://postgres:YOUR_PASSWORD@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres
```

✅ 必須包含：
- `db.xxx.supabase.co` (Direct host)
- `:5432` (Direct port)

**SUPABASE_PASSWORD 應該是：**
```
YOUR_ACTUAL_PASSWORD
```
（就是密碼，不是完整的連接字串）

**SUPABASE_REF 應該是：**
```
komwtkwhfvhuswfwvnwu
```

**SUPABASE_REGION 應該是：**
```
ap-northeast-1
```

### 步驟 3：測試調試端點

部署後，訪問：
```
https://web-one-eta-27.vercel.app/api/debug/env
```

預期回應：
```json
{
  "database_url_set": true,
  "database_url_preview": "postgresql://postgres.komwtkwhfvhuswfwvnwu:***@aws-0-ap-northeast-1...",
  "direct_url_set": true,
  "supabase_password_set": true,
  "diagnosis": {
    "hasDatabase": true,
    "databaseUrlValid": true,
    "canBuildFallback": true,
    "fallbackReady": true
  }
}
```

### 問題解讀

#### 情況 A：`database_url_set: false` 且 `supabase_password_set: false`
**問題：** 環境變數沒有被 Vercel 傳遞到應用

**解決：**
1. Vercel Dashboard → Environment Variables 重新檢查
2. 確認所有變數都選中了正確的 Environment（Production, Preview, Development）
3. 點擊 **Redeploy** 按鈕重新部署

#### 情況 B：`database_url_set: false` 但 `supabase_password_set: true`
**問題：** DATABASE_URL 未設置，但 fallback 可用

**行為：** 應用應該使用 fallback 連接池 URL 連接到資料庫

**驗證：** 嘗試訪問 API 端點如 `/api/dashboard/dialects`

#### 情況 C：所有 `*_set: true` 但仍然 500 錯誤
**問題：** DATABASE_URL 或 DIRECT_URL 的值有誤

**解決步驟：**
1. 重新檢查連接字串格式（見上面的格式要求）
2. 確認密碼中沒有特殊字符需要 URL 編碼
3. 在 Vercel 中更新變數
4. 點擊 Redeploy

## 🔄 強制重新部署步驟

有時 Vercel 的快取會導致環境變數未被更新。強制重新部署：

1. 訪問 [Vercel Dashboard](https://vercel.com)
2. 選擇 **web** 專案 → **Deployments**
3. 找到最新的失敗部署
4. 點擊 **...** → **Redeploy**（或點擊 **Redeploy** 按鈕）
5. 點擊 **Redeploy** 確認
6. 等待 5-10 分鐘構建完成

## 📊 檢查 Build 和 Runtime Logs

### Build Logs（構建日誌）
1. Vercel Dashboard → Deployments → 最新部署 → **Logs**
2. 查看是否有以下信息：
   - ✓ `Prisma schema loaded`
   - ✓ `Generated Prisma Client`
   - ✓ `Compiled successfully`

### Runtime Logs（運行時日誌）
訪問 API 端點後查看運行時日誌：
1. Vercel Dashboard → Deployments → 最新部署 → **Runtime Logs**
2. 查看錯誤訊息，尋找與數據庫連接相關的信息
3. 如果看到 `5432` 或 Direct host，表示環境變數未被載入

## ✅ 最終驗證清單

部署並確保 5432 連接錯誤解決後：

- [ ] 訪問 `/api/debug/env` 顯示所有變數已設置
- [ ] 訪問 `/api/dashboard/dialects` 返回 JSON 陣列（不是 500）
- [ ] 訪問 `/study` 頁面可加載
- [ ] 訪問 `/dictionary` 頁面可加載
- [ ] 訪問 `/cms` 頁面可加載
- [ ] 選擇一個詞進入測試
- [ ] 提交測試結果

## 🚨 如果問題仍未解決

### 備選方案 1：清除 Vercel 快取

1. Vercel Dashboard → Settings → Git
2. 找到 "Deployment Protection" 和 "Build Cache"
3. 點擊 **Clear Cache**
4. 重新部署

### 備選方案 2：嘗試 Session Pooling

某些情況下 Transaction Pooling (6543) 可能有問題。嘗試 Session Pooling (5432 with pgbouncer)：

修改 DATABASE_URL：
```
postgresql://postgres.komwtkwhfvhuswfwvnwu:PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

（唯一的區別是端口從 6543 改為 5432）

### 備選方案 3：檢查 Supabase 連接狀態

1. 訪問 [Supabase Dashboard](https://app.supabase.com)
2. 選擇你的專案
3. 進入 **Settings** → **Database** → **Connection pooling**
4. 確認 Connection Pooling 已啟用
5. 檢查 Pooling 連接的狀態

### 備選方案 4：查看 Supabase 日誌

1. Supabase Dashboard → 你的專案 → **Database** → **Logs**
2. 查看是否有連接被拒絕或認證失敗的日誌

## 💡 技術背景

### 為什麼 Pooling 而不是 Direct？

- **Direct Connection (5432)**：PostgreSQL 為每個連接維護一個伺服器進程
  - Vercel 有無限自動擴展的函數
  - 導致連接數無限增長 → 數據庫崩潰
  
- **Connection Pooling (PgBouncer, 6543)**：複用連接
  - 限制最大連接數
  - 更適合 Serverless 架構
  - 推薦用於生產環境

### 為什麼需要 DIRECT_URL？

Prisma 5.x 架構分離：
- `DATABASE_URL`：應用查詢（可用 Pooling）
- `DIRECT_URL`：遷移和 introspection（必須 Direct）

這讓 Prisma 可以同時支持：
- 應用的 Serverless 部署（Pooling）
- 管理員的本地遷移操作（Direct）

## 📞 更多資源

- [Prisma + Vercel 最佳實踐](https://www.prisma.io/docs/deployment/guides/deploying-to-vercel)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooling-with-pgbouncer)
- [Vercel 環境變數](https://vercel.com/docs/projects/environment-variables)
