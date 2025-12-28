# ⚡ 快速開始指南

## 🎯 現在您的專案已準備好部署！

### 目前狀態
- ✅ 本地資料夾：`/Users/jaaaaack/VSCode/Amis-Learning`
- ✅ GitHub 倉庫：https://github.com/Jaa-ack/Amis-Learning
- ✅ 資料庫：3,131 筆詞彙已匯入到 Supabase
- ⏳ **待完成：部署到 Vercel**

---

## 🚀 部署到 Vercel（3 步驟）

### 1️⃣ 登入 Vercel
```bash
cd /Users/jaaaaack/VSCode/Amis-Learning/web
npx vercel login
```
選擇 GitHub 授權

### 2️⃣ 部署
```bash
npx vercel --prod -e DATABASE_URL='postgresql://postgres:Jason92123!abc@db.komwtkwhfvhuswfwvnwu.supabase.co:6543/postgres?sslmode=require'
```

### 3️⃣ 訪問應用
Vercel 會提供一個 URL，例如：
```
https://amis-learning.vercel.app
```

---

## 📚 詳細指南

更多細節請查看：
- [VERCEL_DEPLOY_STEPS.md](./VERCEL_DEPLOY_STEPS.md) — 完整部署指南
- [COMPLETION_STATUS.md](./COMPLETION_STATUS.md) — 完成狀態和後續步驟

---

## 💻 本地開發

```bash
cd web
npm run dev              # 啟動開發伺服器（http://localhost:3000）
npm run build            # 生產構建
npm run start            # 啟動生產伺服器
npm run import           # 重新匯入資料（使用 clean-import.ts）
```

---

## 🔑 API 示例

### 獲取方言列表
```bash
curl 'http://localhost:3000/api/dashboard/dialects?userId=demo-user'
```

### 搜尋詞彙
```bash
curl 'http://localhost:3000/api/dictionary/search?q=水&dialectId=xiuguluan&userId=demo-user'
```

### 獲取下一張卡片
```bash
curl 'http://localhost:3000/api/cards/next?dialectId=xiuguluan&userId=demo-user'
```

---

## 📊 項目結構

```
Amis-Learning/
├── web/                          # Next.js 前端 + API Routes
│   ├── src/
│   │   ├── pages/               # 頁面和 API routes
│   │   ├── components/          # UI 組件
│   │   └── lib/                 # 工具函數
│   ├── prisma/                  # 資料庫 ORM schema
│   ├── scripts/
│   │   └── clean-import.ts      # 資料匯入腳本
│   └── package.json
├── server/                       # (備用) Fastify 後端
├── docs/                         # 文檔
│   ├── tech-architecture.md     # 技術架構
│   ├── algorithms.md            # SM-2 算法
│   └── ui-ux.md                 # UI/UX 設計
├── README.md
├── COMPLETION_STATUS.md          # ✅ 完成清單
└── VERCEL_DEPLOY_STEPS.md        # 部署指南
```

---

## ✨ 核心功能

- 📚 5 個阿美語方言詞彙庫（3,131 筆）
- 🧠 SM-2 間隔重複算法
- 📝 詞彙複習系統
- 🎯 測驗功能
- 🔍 模糊搜尋
- 📊 學習儀表板

---

## 🔐 環境變數

```env
# .env（已配置）
DATABASE_URL=postgresql://postgres:Jason92123!abc@db.komwtkwhfvhuswfwvnwu.supabase.co:6543/postgres?sslmode=require
NEXT_PUBLIC_API_BASE=https://amis-learning.vercel.app
```

---

## 📞 需要幫助？

查看詳細文檔：
- [VERCEL_DEPLOY_STEPS.md](./VERCEL_DEPLOY_STEPS.md) — 完整部署流程
- [COMPLETION_STATUS.md](./COMPLETION_STATUS.md) — 待完成任務
- [docs/](./docs/) — 技術文檔

