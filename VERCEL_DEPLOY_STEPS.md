# 🚀 Vercel 部署步驟（互動式）

## 📋 目前進度
✅ 代碼已推送到 GitHub: https://github.com/Jaa-ack/Amis-Learning.git
✅ Vercel CLI 已安裝
⏳ **待完成：登入 Vercel 並部署**

---

## 🔐 步驟 1：登入 Vercel

```bash
cd /Users/jaaaaack/VSCode/Amis-Learning/web
npx vercel login
```

**操作說明：**
1. 終端會提示選擇登入方式（Email 或 GitHub）
2. 選擇 GitHub（推薦）
3. 按照瀏覽器提示完成授權
4. 回到終端確認登入成功

---

## 🎯 步驟 2：部署到 Vercel

### 方式 A：自動偵測（推薦）

```bash
npx vercel --prod
```

Vercel 會自動詢問並預設建議：
```
? Set up and deploy "~/Amis-Learning/web"? [Y/n] Y
? Which scope should contain your new project? [您的帳號]
? Link to existing project? [y/N] N
? What's your project's name? amis-learning
? In which directory is your code located? ./
? Want to modify these settings? [y/N] N
```

### 方式 B：連接 GitHub 倉庫（使用 Vercel 網頁介面）

1. 訪問 https://vercel.com/new
2. 選擇 "Import Git Repository"
3. 搜尋並選擇 `Amis-Learning`
4. 選擇分支：`main`
5. Framework: Next.js（應自動選擇）
6. Root Directory: `./web`
7. 添加環境變數（見下方）
8. 點擊 "Deploy"

---

## 🔐 環境變數設定（重要！）

部署前必須設定 `DATABASE_URL`，否則 API 會無法連接資料庫。

**在 Vercel 儀表板中：**

1. 進入專案設定 → Environment Variables
2. 添加以下變數：

| 名稱 | 值 | 備註 |
|------|-----|------|
| `DATABASE_URL` | `postgresql://postgres:Jason92123!abc@db.komwtkwhfvhuswfwvnwu.supabase.co:6543/postgres?sslmode=require` | ⚠️ 使用 Port 6543（連線池模式） |
| `NEXT_PUBLIC_API_BASE` | `https://amis-learning.vercel.app` | 部署完成後才能確定 |

**或在命令行中添加（部署時）：**

```bash
npx vercel --prod \
  -e DATABASE_URL='postgresql://postgres:Jason92123!abc@db.komwtkwhfvhuswfwvnwu.supabase.co:6543/postgres?sslmode=require'
```

---

## ✅ 部署後驗證

### 1️⃣ 檢查部署狀態

```bash
npx vercel status
```

### 2️⃣ 訪問應用

部署完成後，Vercel 會提供一個 URL：
```
https://amis-learning.vercel.app
```

### 3️⃣ 檢查日誌

如有問題，查看部署日誌：

```bash
npx vercel logs --follow
```

### 4️⃣ 測試 API 連接

```bash
# 檢查方言列表
curl https://amis-learning.vercel.app/api/dashboard/dialects?userId=demo-user

# 應返回 5 個方言的 JSON
```

---

## 🔧 常見部署問題

### ❌ 問題 1：「P1001 Can't reach database server」

**原因：** DATABASE_URL 使用了 Port 5432（直接連接）而非 Port 6543（連線池）

**解決：**
```
✅ 確保 DATABASE_URL 包含 :6543
❌ 不要使用 :5432
```

### ❌ 問題 2：「build failed」

**檢查步驟：**
```bash
# 本地測試 build
cd web
npm run build

# 查看詳細錯誤
npm run build -- --verbose
```

### ❌ 問題 3：「Prisma client not generated」

**解決：**
```bash
# 確保生成了 Prisma Client
npx prisma generate

# 本地測試
npm run dev
```

---

## 📝 Vercel 項目設定

**Build Command:** `npm run build`
**Output Directory:** `.next`
**Install Command:** `npm install`
**Node.js Version:** 18.x（Vercel 預設）

---

## 🎯 部署完成後的後續步驟

### 1. 更新 GitHub README
```markdown
# Amis Learning Platform

線上演示：https://amis-learning.vercel.app

## 部署狀態
- ✅ 前端：Vercel
- ✅ 後端：Vercel Serverless
- ✅ 資料庫：Supabase
```

### 2. 配置自定域名（可選）
在 Vercel 儀表板 → Settings → Domains

### 3. 設置 GitHub Actions（可選）
自動在每次提交時部署

### 4. 實現認證系統（必須）
目前所有請求都使用 `demo-user`

---

## 📞 需要幫助？

如果遇到問題：

1. 檢查 Vercel 儀表板日誌
2. 查看終端輸出的詳細錯誤
3. 確認環境變數已正確設定
4. 檢查 Supabase 連線狀態

---

**✅ 部署完成後，所有步驟即告完成！**
