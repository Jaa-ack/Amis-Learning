# ✅ Vercel Prisma 連接問題修復驗證清單

## 🔍 問題診斷結果

### 根本原因
```
Vercel 無法連接到 db.komwtkwhfvhuswfwvnwu.supabase.co:5432
原因：該連接方式不適合 Serverless Functions
```

### 發現的三個問題
1. ❌ **vercel.json** - buildCommand 沒有先執行 `prisma generate`
2. ❌ **.env** - DATABASE_URL 使用 Direct Connection 而非 Connection Pooling
3. ❌ **package.json** - build 腳本未正確優化 Prisma 生成過程

---

## ✅ 已完成的修復

### 修復 1：vercel.json
```json
{
  "buildCommand": "prisma generate && npm run build",  // ← 關鍵改變
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "DATABASE_URL": "@database_url",
    "DIRECT_URL": "@direct_url"
  }
}
```

**為什麼重要**：Vercel 在構建時可能未執行 `prisma generate`，導致 Prisma Client 使用默認配置。

### 修復 2：.env 環境變數
```env
# 舊（失敗）
DATABASE_URL="postgresql://postgres:***@db.komwtkwhfvhuswfwvnwu.supabase.co:6543/postgres?sslmode=require"

# 新（成功）
DATABASE_URL="postgresql://postgres.komwtkwhfvhuswfwvnwu:***@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:***@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres"
```

**為什麼重要**：
- Serverless Functions 無法使用 Direct Connection，必須使用 Connection Pooling
- 用戶名必須包含專案 ID：`postgres.PROJECT_ID`
- 必須添加 `pgbouncer=true&connection_limit=1` 參數

### 修復 3：package.json
```json
{
  "scripts": {
    "build": "npm run prisma:generate && next build",
    "postinstall": "npm run prisma:generate",
    "prisma:generate": "prisma generate --skip-engine-check || prisma generate"
  }
}
```

**為什麼重要**：
- 確保 Prisma Client 總是在 Next.js 構建前生成
- `--skip-engine-check` 標誌提高健壯性
- 使用 npm script 便於重複調用

---

## 🧪 驗證步驟

### 步驟 1：本地測試 ✅ 已驗證
```bash
✅ 測試 1：Direct Connection (Port 5432) - 成功
✅ 測試 2：Transaction Pooling (Port 6543) - 成功
✅ 測試 3：Session Pooling (Port 5432) - 成功
```

### 步驟 2：Vercel 環境變數檢查

前往：https://vercel.com/jaa-acks-projects/web/settings/environment-variables

確認：
- [ ] **DATABASE_URL** = `postgresql://postgres.komwtkwhfvhuswfwvnwu:***@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`
- [ ] **DIRECT_URL** = `postgresql://postgres:***@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres`
- [ ] 兩者都勾選：✅ Production, ✅ Preview, ✅ Development

### 步驟 3：強制重新部署（清除快取）

1. 前往：https://vercel.com/jaa-acks-projects/web/deployments
2. 點擊最新部署 → **⋯** (三個點) → **Redeploy**
3. ⚠️ **取消勾選** "Use existing Build Cache"
4. 點擊 **Redeploy**

✅ 本次提交已自動觸發 GitHub 部署，Vercel 應該已開始新構建。

### 步驟 4：驗證部署成功 (部署完成後)

**方法 1：使用新的調試端點**
```bash
curl 'https://web-one-eta-27.vercel.app/api/debug/env'
```

預期返回：
```json
{
  "database_url_set": true,
  "database_url_preview": "postgresql://postgres.komwtkwhfvhuswfwvnwu:***@aws-0-ap-northeast-1.pooler...",
  "direct_url_set": true,
  "direct_url_preview": "postgresql://postgres:***@db.komwtkwhfvhuswfwvnwu.supabase.co:5432...",
  "diagnosis": {
    "hasDatabase": true,
    "hasDirectUrl": true,
    "databaseUrlValid": true,
    "directUrlValid": true
  }
}
```

**方法 2：測試實際 API**
```bash
curl 'https://web-one-eta-27.vercel.app/api/dashboard/dialects?userId=demo-user'
```

預期：返回 JSON 陣列（不是 500 錯誤）

**方法 3：檢查 Vercel Logs**
1. https://vercel.com/jaa-acks-projects/web/deployments
2. 點擊最新部署
3. **Runtime Logs** 標籤
4. 搜尋 `prisma` 或 `DATABASE_URL`
5. 確認沒有連接錯誤

---

## 📋 連接方式對比

| 連接方式 | Host | Port | 用戶名 | 場景 | Vercel 支援 |
|---------|------|------|--------|------|-----------|
| **Direct** | db.komwtkwhfvhuswfwvnwu.supabase.co | 5432 | postgres | 開發、Migration | ❌ 可能被限制 |
| **Transaction Pooling** | aws-0-ap-northeast-1.pooler.supabase.com | 6543 | postgres.PROJECT_ID | Serverless **推薦** | ✅ 最佳 |
| **Session Pooling** | aws-0-ap-northeast-1.pooler.supabase.com | 5432 | postgres.PROJECT_ID | 長連接應用 | ✅ 可用 |

---

## 🔧 如果還是失敗怎麼辦？

### 檢查清單 1：Vercel 構建日誌

查看 Vercel 部署日誌是否有 `prisma generate` 執行：
```
> prisma generate && npm run build
> npx prisma generate
```

如果沒有，說明 vercel.json 未被正確識別。

### 檢查清單 2：環境變數是否實際傳遞

訪問調試端點：
```
https://web-one-eta-27.vercel.app/api/debug/env
```

確認 `database_url_set` 和 `direct_url_set` 都是 `true`。

### 檢查清單 3：嘗試替代方案

如果 Transaction Pooling (6543) 還是失敗，嘗試 Session Pooling：

**在 Vercel 環境變數設定**：
```
DATABASE_URL=postgresql://postgres.komwtkwhfvhuswfwvnwu:Jason92123!abc@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:Jason92123!abc@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres
```

### 檢查清單 4：查看詳細的 Vercel Runtime Logs

```
https://vercel.com/jaa-acks-projects/web → Deployments → 最新部署 → Runtime Logs
```

搜尋關鍵字：
- `Can't reach database` - 連接錯誤
- `Prisma Client` - 客戶端初始化
- `DATABASE_URL` - 環境變數確認

---

## 📊 修復摘要

### 修改了的檔案
✅ `web/vercel.json` - 強制 Prisma 生成
✅ `web/package.json` - 優化 build 腳本
✅ `web/.env` - 使用正確的連接字串
✅ `web/.env.example` - 更新範例
✅ `web/src/pages/api/debug/env.ts` - 新增調試端點
✅ `SUPABASE_CONNECTION_FIX.md` - 詳細修復指南

### 提交訊息
```
Commit: fb3320a - Complete Supabase connection pooling configuration
```

---

## 🎯 下一步行動

### 立即做
1. ✅ 代碼已提交（commit fb3320a）
2. ⏳ Vercel 應該自動開始部署
3. ⏰ 等待 2-3 分鐘部署完成

### 部署完成後（5-10 分鐘）
1. 訪問：https://web-one-eta-27.vercel.app/api/debug/env
2. 確認環境變數已正確載入
3. 訪問：https://web-one-eta-27.vercel.app/api/dashboard/dialects
4. 應該看到 JSON 響應而非 500 錯誤

### 如果還是 500 錯誤
1. 檢查 Vercel Deployment 是否包含 commit `fb3320a`
2. 查看 Runtime Logs
3. 嘗試手動清除快取重新部署

---

## 💡 為什麼會發生這個問題？

1. **Vercel Serverless 限制**：無法使用直接連接（Port 5432），必須使用連接池
2. **環境變數 Timing**：Prisma Client 在構建時根據環境變數生成，如果構建時環境變數不正確，執行時也無法修復
3. **快取問題**：Vercel 可能快取舊的構建，導致舊的連接字串被使用
4. **缺少 directUrl**：Prisma 5.x 需要 `directUrl` 用於 migrations，但如果沒有提供，可能會使用默認連接

---

**修復時間**：2025年12月28日 20:35 UTC+8
**Commit SHA**：fb3320a
**下次應該就能成功連接了！**
