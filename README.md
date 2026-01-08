# 阿美語智慧學習平台 (Amis Language Learning Platform)

![Badge](https://img.shields.io/badge/Status-就緒部署-brightgreen) ![Node](https://img.shields.io/badge/Node-18+-blue) ![Next.js](https://img.shields.io/badge/Next.js-14-black)

基於 **SM-2 間隔重複演算法**的智能阿美語學習系統，針對行動端體驗優化。

🔗 **GitHub**: https://github.com/Jaa-ack/Amis-Learning  
📊 **資料庫**: Neon (PostgreSQL，3,130 筆詞彙 × 5 方言)  
🌐 **部署**: https://amis-learning.vercel.app (生產環境待配置)

---

## ✅ 專案完成狀態

### 📦 第 1-5 階段：已完成 ✅

| 階段 | 工作內容 | 狀態 |
|------|--------|------|
| **1. 架構與設計** | 技術棧、Prisma Schema、演算法設計 | ✅ |
| **2. 後端實現** | 8 個 API routes（Next.js Serverless） | ✅ |
| **3. 前端實現** | 5 個主頁面 + 3 個 UI 元件 | ✅ |
| **4. 資料庫遷移** | Docker → Supabase (PostgreSQL) | ✅ |
| **5. 資料匯入** | 3,131 筆詞彙 + 5 個方言 | ✅ |

### 🚀 第 6 階段：部署至 Vercel（待環境變數配置）⭐

**前置條件**：已從 Supabase 完成資料遷移至 Neon（2024 年底完成）

```bash
# 1️⃣ 設定 Vercel 環境變數（在 Vercel 儀表板中）
# Production & Preview 環境均設定以下：
DATABASE_URL="postgresql://neondb_owner:npg_XXXXXXXXXXXX@ep-polished-darkness-a1ivnj13-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://neondb_owner:npg_XXXXXXXXXXXX@ep-polished-darkness-a1ivnj13.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# 2️⃣ 推送至 GitHub（自動觸發 Vercel 重新部署）
git push origin main

# 3️⃣ 驗證部署成功
curl https://amis-learning.vercel.app/api/debug/db-test
# 預期回應：{ "status": "HEALTHY", "tables": 5 }

# 4️⃣ 測試學習功能
# 訪問 https://amis-learning.vercel.app
# 選擇方言 → 開始學習 → 點擊評分按鈕 → 查看進度同步
```

**技術細節**：
- `DATABASE_URL`: Neon Pooler URL（適合 Vercel 無伺服器環境）
- `DIRECT_URL`: Neon Direct URL（用於 Prisma 遷移）
- 支援連接池 (`pgbouncer=true`)，減少連接開銷

---

## 🎯 核心功能

| 功能 | 路由 | 說明 |
|------|------|------|
| 📚 **智能學習** | `/study` | 選擇方言 → 10個單字 → 4級熟練度評分 → 自動跳轉測驗 |
| ✏️ **拼寫測驗** | `/test` | 主動回憶拼寫 → 相似度評分 → 詳細結果分析 |
| 🔍 **詞彙搜尋** | `/dictionary` | 模糊查詢 (pg_trgm) |
| 📝 **內容管理** | `/cms` | 新增詞彙、例句、智能連結 |
| 📊 **學習儀表板** | `/dashboard` | 統計與方言分布 |

### 🧠 學習系統特色

**SM-2 間隔重複演算法**
- ✅ 科學化記憶增強（基於遺忘曲線理論）
- ✅ 4級熟練度評分：完全不會 → 有點印象 → 基本熟悉 → 非常熟練
- ✅ 智能優先級排序：測驗失敗 > 困難單字 > 到期複習 > 新單字
- ✅ 自動調整複習間隔（1天 → 6天 → 動態延長）

**學習 → 測驗循環**
- ✅ 每學習 10 個單字自動進入測驗模式
- ✅ 拼寫測驗強化主動回憶（測驗效應）
- ✅ 錯誤單字立即標記為最高優先級
- ✅ 詳細結果分析與進度追蹤

**參考理論**：
- 遺忘曲線（Ebbinghaus, 1885）
- 間隔效應（Spacing Effect）
- 測驗效應（Testing Effect）
- 主動回憶（Active Recall）

詳見：[學習演算法文檔](docs/learning-algorithm.md)

### 數據統計

- **5 個方言**: 秀姑巒、南勢、恆春、海岸、馬蘭
- **3,131 筆詞彙**: 
  - 秀姑巒阿美語：761 筆
  - 南勢阿美語：372 筆
  - 恆春阿美語：727 筆
  - 海岸阿美語：655 筆
  - 馬蘭阿美語：616 筆

---

## 🛠️ 技術堆疊

```
前端層      Next.js 14 + React 18 + TypeScript
API 層      Next.js API Routes (Serverless)
資料庫      PostgreSQL (Neon - 免費伺服器)
ORM         Prisma
部署        Vercel
```

---

## 📁 專案結構

```
Amis-Learning/
├── web/                          # Next.js 應用
│   ├── src/
│   │   ├── pages/               # 頁面 + API routes
│   │   │   ├── study.tsx
│   │   │   ├── test.tsx
│   │   │   ├── dictionary.tsx
│   │   │   ├── cms.tsx
│   │   │   ├── dashboard.tsx
│   │   │   └── api/              # REST API
│   │   │       ├── cards/next.ts
│   │   │       ├── reviews/
│   │   │       ├── cms/
│   │   │       └── dictionary/
│   │   ├── components/
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Tooltip.tsx
│   │   └── lib/
│   │       ├── api.ts
│   │       └── prisma.ts
│   ├── prisma/
│   │   └── schema.prisma         # 資料庫結構
│   ├── scripts/
│   │   └── clean-import.ts       # 資料匯入腳本
│   └── package.json
├── docs/                         # 技術文檔
│   ├── tech-architecture.md
│   ├── algorithms.md
│   └── ui-ux.md
└── README.md                     # 本文件
```

---

## 🚀 快速開始

### 前置需求
- Node.js 18+
- npm 9+
- Git
- 可選：Neon 帳戶（開發環境已配置）

### 本地開發

```bash
# 1. 複製環境設定
cd web
cp .env.example .env.local

# 2. 編輯 .env.local，填入 DATABASE_URL（Neon 連接字串）
# DATABASE_URL="postgresql://neondb_owner:npg_XXXX@ep-polished-darkness-a1ivnj13-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"

# 3. 安裝依賴
npm install

# 4. 測試資料庫連接
npm run check-counts

# 5. 啟動開發伺服器
npm run dev
```

開啟 http://localhost:3000 → 選擇方言 → 開始學習

### 可用命令

```bash
npm run dev              # 開發伺服器
npm run build            # 生產構建  
npm run start            # 啟動生產伺服器
npm run import           # 重新匯入 CSV 資料
npm run check-counts     # 檢查資料庫記錄數
npm run seed             # 初始化示範資料
```

---

## 🔐 環境變數設定

### Neon 連接字串取得

1. 前往 [Neon Console](https://console.neon.tech/)
2. 選擇專案 → **Connection String**
3. 選擇 **Pooler** 版本（適合 Vercel 無伺服器環境）
4. 複製完整連接字串，包含密碼

### 本地開發 (.env.local)
```env
DATABASE_URL="postgresql://neondb_owner:npg_XXXX@ep-polished-darkness-a1ivnj13-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=1"
NEXT_PUBLIC_API_BASE="http://localhost:3000"
```

### Vercel 生產環境
在 [Vercel Dashboard](https://vercel.com) 中設定環境變數（Project Settings → Environment Variables）：
```
DATABASE_URL = postgresql://neondb_owner:npg_XXXX@ep-polished-darkness-a1ivnj13-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=1
DIRECT_URL = postgresql://neondb_owner:npg_XXXX@ep-polished-darkness-a1ivnj13.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

> **提示**：
> - `DATABASE_URL`（Pooler）：用於 API 路由查詢
> - `DIRECT_URL`（Direct）：用於 Prisma 遷移腳本
> - 連接池 (`pgbouncer=true`) 減少無伺服器環境的連接開銷

---

## 🌐 部署到 Vercel

### 快速部署

1. 在 Vercel Dashboard 設定環境變數（如上節）
2. 推送至 GitHub：
```bash
git add .
git commit -m "chore: update env config"
git push origin main
```
3. Vercel 自動重新部署
4. 訪問 https://amis-learning.vercel.app

### 驗證部署成功

```bash
# 檢查資料庫連接
curl https://amis-learning.vercel.app/api/debug/db-test
# 預期回應：{ "status": "HEALTHY", "tables": 5 }

# 檢查環境變數
curl https://amis-learning.vercel.app/api/debug/env
# 應顯示 DATABASE_URL 已設置（密碼隱藏）

# 測試學習功能
# 打開 https://amis-learning.vercel.app
# 1. 選擇方言（如 "阿美語"）
# 2. 開始學習 10 個單字
# 3. 點擊評分按鈕（應顯示 "⏳ 儲存中..."）
# 4. 完成後進入測驗頁面
# 5. 進度應已同步至 Neon 資料庫
```

### 方法 C：GitHub 自動部署

```bash
# 推送 commit 自動觸發部署
git add .
git commit -m "Trigger Vercel deployment"
git push origin main
```

---

## ✅ 部署驗證清單

部署完成後 (約 2-3 分鐘)，檢查以下項目：

- [ ] 首頁正常加載：https://amis-learning.vercel.app
- [ ] 儀表板顯示 5 個方言：/dashboard
- [ ] 搜尋功能正常：/dictionary
- [ ] API 連接成功（查看部署日誌無 ERROR）

### 測試命令

```bash
# 方言清單
curl 'https://amis-learning.vercel.app/api/dashboard/dialects?userId=demo-user'

# 搜尋詞彙
curl 'https://amis-learning.vercel.app/api/dictionary/search?q=水&userId=demo-user'

# 獲取下一張卡片
curl 'https://amis-learning.vercel.app/api/cards/next?dialectId=xiuguluan&userId=demo-user'
```

---

## 🔧 資料庫設定（最終版）

### 首次部署：建立索引

Neon 資料庫已自動建立所有必要的索引與擴展。若手動執行，可使用：

- 最終索引腳本：[db/final-indexes.sql](db/final-indexes.sql)
- 性能文檔：[PERFORMANCE.md](PERFORMANCE.md)

此腳本包含模糊搜尋、複習排程、查詢加速與外鍵索引。

---

## 🐛 常見問題解答

### Q: 連接 Neon 失敗?
**A:** 
- 確認 `DATABASE_URL` 包含 Pooler URL
- 確認密碼中的特殊字符已正確編碼
- 檢查是否加上 `?sslmode=require`
- 驗證：`curl https://amis-learning.vercel.app/api/debug/db-test`

### Q: Vercel 部署失敗?
**A:** 
- 在 Vercel Dashboard 檢查環境變數是否已設定
- 確認 `DATABASE_URL` 和 `DIRECT_URL` 都已設置
- 查看部署日誌找出錯誤信息

### Q: 學習進度未儲存?
**A:**
- 檢查網路連接是否正常
- 等待 "⏳ 儲存中..." 提示消失後再關閉頁面
- 打開瀏覽器開發工具（F12）檢查 `/api/reviews` 是否有 405 或其他錯誤
- 若多次失敗，進度會保留在本地快取中

### Q: 模糊搜尋無結果?
**A:**
- 確認已執行 `CREATE EXTENSION IF NOT EXISTS pg_trgm` 
- 確認詞彙表（flashcards）有足夠資料
- 試著搜尋完整單字而非片段
- 檢查詞彙確實存在於資料庫

---

## 🎓 技術文檔 / 性能

詳細文檔位於 `docs/` 目錄：

 - **[tech-architecture.md](docs/tech-architecture.md)** — 系統架構、技術選型理由
 - **[algorithms.md](docs/algorithms.md)** — SM-2 演算法細節、Smart Linker 實現
 - **[ui-ux.md](docs/ui-ux.md)** — iPhone 介面設計、使用者體驗指南
 - **[PERFORMANCE.md](PERFORMANCE.md)** — 資料庫性能優化最終版（整合指南）

---

## 🎯 後續改進方向

### 優先級 🔴 - 立即完成
- [x] Vercel 部署
- [ ] 部署驗證與監控

### 優先級 🟡 - 本月完成
- [ ] 用戶認證系統（GitHub OAuth）
- [ ] 登入/註冊頁面
- [ ] 用戶會話管理
- [ ] 完整前端 UI 測試

### 優先級 🟢 - 後期完成
- [ ] Smart Linker 自動詞彙關聯優化
- [ ] 完整測試套件（單元 + 集成）
- [ ] 分析儀表板與進度追蹤
- [ ] 移動應用版本
- [ ] 多語言支援

---

## 📞 支援資源

- [Vercel 文檔](https://vercel.com/docs)
- [Next.js 官方指南](https://nextjs.org/docs)
- [Neon 文檔](https://neon.tech/docs)
- [Prisma 文檔](https://www.prisma.io/docs/)
- [PostgreSQL 模糊搜尋](https://www.postgresql.org/docs/current/pgtrgm.html)

---

## 📄 授權

MIT License - 詳見 LICENSE 文件

---

**最後更新**: 2025年12月28日  
**專案狀態**: ✅ 就緒部署
