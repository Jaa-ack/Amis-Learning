# Vercel 部署完整指南

## ✅ 你已經完成
- GitHub Repository: https://github.com/Jaa-ack/Amis-Learninig
- Vercel 已連接 GitHub
- Supabase 資料庫已設定

---

## 📋 部署檢查清單

### ☑️ 步驟 1：確保 .env 不會被上傳

已建立 `.gitignore` 檔案，包含：
```
.env
.env.local
web/.env
```

**驗證**：
```bash
cd /Users/jaaaaack/VSCode/Amis-Learninig
git status
```
確認 `.env` 不在清單中（應該被忽略）。

---

### ☑️ 步驟 2：推送程式碼到 GitHub

```bash
cd /Users/jaaaaack/VSCode/Amis-Learninig

# 加入所有檔案（.env 會被自動排除）
git add .

# 提交
git commit -m "Ready for Vercel deployment"

# 推送到你的 repo
git push origin main
```

---

### ☑️ 步驟 3：在 Vercel 設定專案

#### 3.1 設定 Root Directory

1. 前往 https://vercel.com/
2. 找到你的專案（Amis-Learninig）
3. 點擊 **Settings**
4. 左側選單 → **General**
5. 找到 **Root Directory**
6. 點擊 **Edit** → 輸入 `web` → **Save**

#### 3.2 設定環境變數（重要！）

1. 在 Settings 左側選單 → **Environment Variables**
2. 點擊 **Add New**
3. 輸入：
   - **Name**: `DATABASE_URL`
   - **Value**: `postgresql://postgres:Jason92123!abc@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres?sslmode=require`
   - **Environments**: 勾選 **Production**, **Preview**, **Development**
4. 點擊 **Save**

---

### ☑️ 步驟 4：觸發重新部署

1. 在 Vercel Dashboard → 你的專案
2. 點擊 **Deployments** 標籤
3. 找到最新的部署
4. 點擊右側的 **⋯** (三點) → **Redeploy**
5. 在彈出視窗勾選 **Use existing Build Cache**
6. 點擊 **Redeploy**

**或直接推送新 commit 自動觸發**：
```bash
git commit --allow-empty -m "Trigger Vercel deployment"
git push origin main
```

---

### ☑️ 步驟 5：驗證部署成功

部署完成後（約 2-3 分鐘），Vercel 會顯示你的網址，例如：
```
https://amis-learninig.vercel.app
```

**測試以下 API**：

1. 健康檢查：
   ```
   https://你的網址.vercel.app/api/health
   ```
   應返回：`{"ok":true}`

2. 方言列表：
   ```
   https://你的網址.vercel.app/api/dashboard/dialects
   ```
   應顯示 5 個方言及其單字數量

3. 測試前端頁面：
   - `/dashboard` — 統計儀表板
   - `/dictionary` — 字典查詢

---

## ⚠️ 常見問題

### Q: 部署後顯示 500 錯誤？
**A**: 檢查 Environment Variables 的 `DATABASE_URL` 是否正確設定。

### Q: API 顯示 "Can't reach database"？
**A**: 確認 `DATABASE_URL` 包含 `?sslmode=require`。

### Q: 前端顯示但 API 無資料？
**A**: 
1. 檢查 Supabase 是否已匯入資料（在本地執行 `npm run import`）
2. 確認已建立索引（執行 `web/supabase-indexes.sql`）

### Q: Git 顯示 .env 要被上傳？
**A**: 確認 `.gitignore` 檔案存在且包含 `.env`。執行：
```bash
git rm --cached web/.env
git commit -m "Remove .env from git"
```

---

## 🎯 完整部署步驟總結

```bash
# 1. 確認目前在專案根目錄
cd /Users/jaaaaack/VSCode/Amis-Learninig

# 2. 檢查 .env 是否被忽略
git status | grep .env
# （應該沒有任何輸出，代表已被忽略）

# 3. 推送到 GitHub
git add .
git commit -m "Deploy to Vercel with environment protection"
git push origin main

# 4. 前往 Vercel 設定
# - Settings → General → Root Directory = web
# - Settings → Environment Variables → 新增 DATABASE_URL
# - Deployments → Redeploy

# 5. 等待部署完成（約 2-3 分鐘）

# 6. 測試你的網站
# https://amis-learninig.vercel.app
```

---

## 📞 需要幫助？

如果遇到問題，提供以下資訊：
1. Vercel 部署錯誤訊息（在 Deployments → 點擊失敗的部署 → Runtime Logs）
2. 瀏覽器 Console 錯誤（F12 → Console）
3. 你執行的步驟與卡住的位置
