# 📋 功能測試清單

## 🎯 Dictionary 頁面測試

### 基本功能
- [ ] 頁面載入後自動顯示所有單字
- [ ] 顯示單字總數（應該有 3,131 個單字）
- [ ] 語別選擇器顯示 5 個阿美語方言
- [ ] 搜尋框可以過濾單字

### 語別篩選
- [ ] 選擇「全部語別」顯示所有單字
- [ ] 選擇「南勢阿美語」只顯示該語別單字
- [ ] 選擇「秀姑巒阿美語」只顯示該語別單字
- [ ] 選擇「海岸阿美語」只顯示該語別單字
- [ ] 選擇「馬蘭阿美語」只顯示該語別單字
- [ ] 選擇「恆春阿美語」只顯示該語別單字

### 搜尋功能
- [ ] 搜尋阿美語單字（例：kako）可以找到對應單字
- [ ] 搜尋中文意思（例：說）可以找到對應單字
- [ ] 清空搜尋框恢復完整列表

### 單字詳情
- [ ] 點擊單字後右側顯示詳細資訊
- [ ] 詳情包含：單字、中文意思、發音、語別、標籤
- [ ] 顯示包含該單字的例句
- [ ] 例句包含阿美語和中文翻譯

### UI/UX
- [ ] 左側單字列表可以滾動
- [ ] 選中的單字有藍色背景
- [ ] 滑鼠懸停單字有灰色背景
- [ ] 未選擇單字時右側顯示提示

---

## 📝 CMS 頁面測試

### 新增單字功能
- [ ] 頁面顯示語別選擇器
- [ ] 可以輸入單字（阿美語）
- [ ] 可以輸入發音
- [ ] 可以輸入中文意思
- [ ] 可以輸入標籤（逗號分隔）
- [ ] 點擊「新增單字」按鈕
- [ ] 成功後顯示綠色成功訊息
- [ ] 失敗後顯示紅色錯誤訊息
- [ ] 表單自動清空

### 新增例句功能
- [ ] 可以選擇語別
- [ ] 可以輸入例句（阿美語）
- [ ] 可以輸入中文翻譯
- [ ] 顯示該語別的所有單字列表
- [ ] 可以勾選例句包含的單字
- [ ] 顯示已選擇的單字數量
- [ ] 點擊「新增例句」按鈕
- [ ] 成功後顯示綠色成功訊息

### 驗證
- [ ] 不填單字無法提交
- [ ] 重複的單字（相同語別）應該報錯
- [ ] 不填例句無法提交
- [ ] 標籤正確分割（例：「動詞, 常用」→ ["動詞", "常用"]）

### UI/UX
- [ ] 表單排版清晰
- [ ] 必填欄位有星號標記
- [ ] 提交中按鈕顯示「新增中...」並禁用
- [ ] 成功訊息 3 秒後自動消失

---

## 📊 Dashboard 頁面測試

### 統計卡片
- [ ] 顯示「總單字數」
- [ ] 顯示「新單字」數量
- [ ] 顯示「學習中」數量
- [ ] 顯示「已複習」數量
- [ ] 數字正確（與資料庫一致）
- [ ] 卡片有不同的背景顏色

### 語別列表
- [ ] 顯示所有 5 個語別
- [ ] 每個語別顯示單字數量
- [ ] 響應式網格布局

### 優先級佇列
- [ ] 顯示表格標題
- [ ] 優先級有顏色標示：
  - [ ] P1 急迫 - 紅色
  - [ ] P2 重要 - 橙色
  - [ ] P3 一般 - 黃色
  - [ ] P4 低 - 綠色
- [ ] 顯示單字和中文意思
- [ ] 顯示複習次數
- [ ] 顯示間隔天數
- [ ] 顯示下次複習時間（今天/明天/X天後/逾期）
- [ ] 最多顯示 20 個單字
- [ ] 如果超過 20 個，顯示「還有 X 個單字未顯示」

### 錯誤處理
- [ ] 載入失敗顯示錯誤訊息
- [ ] 有「重試」按鈕
- [ ] 載入中顯示「載入中...」

---

## 🔗 API 測試

### Dictionary API

**GET /api/dictionary/all**
```bash
# 測試 1：獲取所有單字
curl 'https://web-one-eta-27.vercel.app/api/dictionary/all'

# 測試 2：獲取特定語別單字
curl 'https://web-one-eta-27.vercel.app/api/dictionary/all?dialectId=<DIALECT_ID>'
```
預期：返回 JSON 包含 items 陣列

**GET /api/dictionary/sentences**
```bash
# 測試：獲取單字的例句
curl 'https://web-one-eta-27.vercel.app/api/dictionary/sentences?flashcardId=<FLASHCARD_ID>'
```
預期：返回 JSON 包含 sentences 陣列

### CMS API

**POST /api/cms/flashcards**
```bash
curl -X POST 'https://web-one-eta-27.vercel.app/api/cms/flashcards' \
  -H 'Content-Type: application/json' \
  -d '{
    "dialectId": "<DIALECT_ID>",
    "lemma": "測試單字",
    "phonetic": "test",
    "meaning": "測試",
    "tags": ["測試"]
  }'
```
預期：返回 { card: {...} }

**POST /api/cms/sentences**
```bash
curl -X POST 'https://web-one-eta-27.vercel.app/api/cms/sentences' \
  -H 'Content-Type: application/json' \
  -d '{
    "dialectId": "<DIALECT_ID>",
    "text": "測試例句",
    "translation": "This is a test",
    "linkedWordIds": ["<FLASHCARD_ID>"]
  }'
```
預期：返回 { sentence: {...}, manualLinks: 1 }

### Dashboard API

**GET /api/dashboard/dialects**
```bash
curl 'https://web-one-eta-27.vercel.app/api/dashboard/dialects?userId=demo-user'
```
預期：返回 { data: [{dialect_id, name, cards}] }

**GET /api/dashboard/priority**
```bash
curl 'https://web-one-eta-27.vercel.app/api/dashboard/priority?userId=demo-user'
```
預期：返回 { data: [{flashcard_id, lemma, meaning, priority, ...}] }

---

## 🐛 已知問題/注意事項

### 資料庫連接
- ⚠️ 確保 Vercel 環境變數已設定：
  - `DATABASE_URL`: Supabase Connection Pooling URL
  - `DIRECT_URL`: Supabase Direct Connection URL
- ⚠️ 如果 API 返回 500 錯誤，檢查 Vercel Runtime Logs

### 測試資料
- 📌 目前使用 `demo-user` 作為測試用戶
- 📌 資料庫應該已經有 3,131 個阿美語單字
- 📌 可能需要先在 CMS 新增一些例句才能測試 Dictionary 的例句功能

### 本地測試
```bash
cd /Users/jaaaaack/VSCode/Amis-Learning/web

# 設定環境變數
export DATABASE_URL='postgresql://postgres:Jason92123!abc@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres'
export DIRECT_URL='postgresql://postgres:Jason92123!abc@db.komwtkwhfvhuswfwvnwu.supabase.co:5432/postgres'

# 啟動開發伺服器
npm run dev

# 訪問各頁面
# http://localhost:3000/dictionary
# http://localhost:3000/cms
# http://localhost:3000/dashboard
```

---

## ✅ 測試進度

完成 Dictionary 測試：[ ] 0 / 20
完成 CMS 測試：[ ] 0 / 18
完成 Dashboard 測試：[ ] 0 / 17
完成 API 測試：[ ] 0 / 6

**總進度：0 / 61**

---

**建議測試順序**：
1. 先測試 Dashboard（確認資料庫有資料）
2. 測試 Dictionary（查看現有單字）
3. 測試 CMS（新增單字和例句）
4. 回到 Dictionary 測試新增的例句

**更新時間**：2025年12月28日
