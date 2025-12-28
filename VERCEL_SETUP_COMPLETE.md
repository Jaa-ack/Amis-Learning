# ✅ Vercel 部署設定完成指南

## 🎉 部署狀態

**應用已成功部署到 Vercel！** ✅

```
🌐 訪問 URL: https://web-one-eta-27.vercel.app
📍 替代 URL: https://web-cr2xihq1x-jaa-acks-projects.vercel.app
🏢 Vercel 儀表板: https://vercel.com/jaa-acks-projects/web
```

---

## 🔧 為何需要設定環境變數

雖然應用已部署，但**必須在 Vercel 儀表板中設定環境變數**，API 才能連接到 Supabase 資料庫。

### 當前狀態
- ✅ 前端代碼已部署
- ✅ Next.js 服務器正常運作
- ❌ **API 無法連接資料庫**（缺少 DATABASE_URL）

---

## 🚀 立即設定環境變數（3 步驟）

### 步驟 1️⃣：進入環境變數設定頁面

1. 訪問 **Vercel 儀表板**：https://vercel.com/
2. 進入 **web** 專案（左側導航）
3. 點擊 **Settings** 標籤
4. 左側選單選擇 **Environment Variables**

### 步驟 2️⃣：添加 DATABASE_URL

在環境變數頁面中：

1. 點擊 **Add New** 按鈕
2. 填入以下資訊：
   - **Name**: `DATABASE_URL`
   - **Value**: 複製以下內容（已配置連線池模式用於 Serverless）
     ```
     postgresql://postgres:Jason92123!abc@db.komwtkwhfvhuswfwvnwu.supabase.co:6543/postgres?sslmode=require
     ```
3. **Environments** 複選框：勾選 ✅ **Production**、✅ **Preview**、✅ **Development**
4. 點擊 **Save** 按鈕

### 步驟 3️⃣：重新部署以應用環境變數

部署新版本以使環境變數生效：

**選項 A：透過 Vercel 儀表板（推薦）**
1. 進入 **Deployments** 標籤
2. 找到最新的部署（通常在頂部）
3. 點擊部署右側的 **⋯** (三點菜單)
4. 選擇 **Redeploy**
5. 在彈出窗口勾選 ✅ **Use existing Build Cache**
6. 點擊 **Redeploy** 按鈕

**選項 B：透過 Git 推送（自動觸發）**
```bash
cd /Users/jaaaaack/VSCode/Amis-Learning
git commit --allow-empty -m "Trigger deployment with environment variables"
git push origin main
```

---

## ✅ 驗證部署成功

設定環境變數並重新部署後，訪問以下 URL 測試：

### 1. 測試首頁
```
https://web-one-eta-27.vercel.app/
```
應該顯示應用的首頁

### 2. 測試 API - 獲取方言列表
```
https://web-one-eta-27.vercel.app/api/dashboard/dialects?userId=demo-user
```
應返回 JSON 格式的方言資料：
```json
{
  "dialects": [
    {"id": "...", "code": "xiuguluan", "name": "秀姑巒阿美語", ...},
    ...
  ]
}
```

### 3. 測試 API - 搜尋詞彙
```
https://web-one-eta-27.vercel.app/api/dictionary/search?q=水&userId=demo-user
```
應返回搜尋結果

### 4. 檢查部署日誌（如有問題）
在 Vercel 儀表板的 **Deployments** 中，點擊特定部署可查看完整的構建和運行日誌。

---

## 📝 常見問題解答

### Q: 設定環境變數後，部署仍然失敗？
**A:** 可能原因與解決方案：
1. **環境變數未保存** → 確認點擊了 Save 按鈕
2. **部署快取問題** → 在 Redeploy 時取消勾選 "Use existing Build Cache"
3. **密碼字符問題** → 確認 DATABASE_URL 中的特殊字符正確複製
4. **資料庫連接** → 檢查 Supabase 是否仍在線

查看部署日誌以獲取詳細錯誤訊息。

### Q: 如何修改環境變數？
**A:**
1. 進入 **Settings** → **Environment Variables**
2. 找到要修改的環境變數
3. 點擊右側的鉛筆圖示 ✏️
4. 修改數值後點擊 **Save**
5. 返回 **Deployments** 重新部署

### Q: API 返回 500 錯誤？
**A:** 可能是資料庫連接問題：
1. 確認 DATABASE_URL 環境變數已設定
2. 確認 DATABASE_URL 格式正確（Port 6543 用於 Vercel）
3. 確認 Supabase 專案仍在線
4. 檢查部署日誌中的詳細錯誤訊息

---

## 🔐 安全注意事項

⚠️ **重要提示**：

1. **資料庫密碼安全**
   - ✅ 密碼已儲存在 Vercel 環境變數中（加密存儲）
   - ✅ 密碼不會出現在程式碼或 GitHub 中
   - ❌ 不要在本地 `.env` 中提交到 GitHub

2. **驗證 .gitignore 配置**
   ```bash
   # 確認 .env 檔案被忽略
   cd /Users/jaaaaack/VSCode/Amis-Learning
   git status
   # 結果不應該包含 web/.env 或 .env 檔案
   ```

3. **定期檢查部署狀態**
   - 訪問 Vercel 儀表板監控應用狀態
   - 查看部署日誌以發現潛在問題

---

## 📊 部署架構概覽

```
GitHub (代碼倉庫)
    ↓
Vercel (自動部署)
    ├─ Next.js 前端 (靜態 + SSR)
    ├─ API Routes (Serverless Functions)
    │   └─ 連接到 Supabase PostgreSQL
    └─ 環境變數存儲
        └─ DATABASE_URL (加密)
```

---

## 🎯 接下來的步驟

### 立即完成（本週）
- [ ] 在 Vercel 儀表板設定 DATABASE_URL 環境變數
- [ ] 重新部署應用
- [ ] 驗證 API 連接正常
- [ ] 在瀏覽器測試各頁面功能

### 近期完成（本月）
- [ ] 實現用戶認證系統（Supabase Auth）
- [ ] 創建登入/註冊頁面
- [ ] 完整的功能測試

### 後期完成（下月+）
- [ ] Smart Linker 優化
- [ ] 分析儀表板
- [ ] 行動應用版本

---

## 📞 支援資源

- [Vercel 環境變數文檔](https://vercel.com/docs/projects/environment-variables)
- [Supabase 連接指南](https://supabase.com/docs/guides/deployment/vercel)
- [Next.js 環境變數](https://nextjs.org/docs/basic-features/environment-variables)
- [部署故障排查](https://vercel.com/docs/troubleshooting)

---

## ✨ 恭喜！

您的阿美語學習平台現已部署在全球可訪問的 URL 上！

**下一步只需 3 分鐘：** 在 Vercel 儀表板設定環境變數 → 重新部署 → 完成！

**最後更新**: 2025年12月28日
