# 阿美語智慧學習平台 (Amis Language Learning Platform)

![Badge](https://img.shields.io/badge/Status-就緒部署-brightgreen) ![Node](https://img.shields.io/badge/Node-18+-blue) ![Next.js](https://img.shields.io/badge/Next.js-14-black)

基於 **SM-2 間隔重複演算法**的智能阿美語學習系統，針對行動端體驗優化。

🔗 **GitHub**: https://github.com/Jaa-ack/Amis-Learning  
📊 **資料庫**: Supabase (3,131 筆詞彙 × 5 方言)  
🌐 **部署**: https://web-one-eta-27.vercel.app ✅

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

### 🚀 第 6 階段：部署至 Vercel（待完成）⭐

```bash
# 1️⃣ 登入 Vercel
cd /Users/jaaaaack/VSCode/Amis-Learning/web
npx vercel login

# 2️⃣ 部署到生產環境
npx vercel --prod -e DATABASE_URL='postgresql://postgres:Jason92123!abc@db.komwtkwhfvhuswfwvnwu.supabase.co:6543/postgres?sslmode=require'

# 3️⃣ 完成！訪問 Vercel 提供的 URL
# https://amis-learning.vercel.app
```

---

## 🎯 核心功能

| 功能 | 路由 | 說明 |
|------|------|------|
| 📚 **智能學習** | `/study` | SM-2 演算法，優先級複習 (P1-P4) |
| ✏️ **拼寫測驗** | `/test` | 相似度評分自動改卷 |
| 🔍 **詞彙搜尋** | `/dictionary` | 模糊查詢 (pg_trgm) |
| 📝 **內容管理** | `/cms` | 新增詞彙、例句、智能連結 |
| 📊 **學習儀表板** | `/dashboard` | 統計與方言分布 |

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
資料庫      PostgreSQL (Supabase)
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
- Supabase 帳戶

### 本地開發

```bash
# 1. 複製環境設定
cd web
cp .env.example .env

# 2. 編輯 .env，填入 DATABASE_URL
# DATABASE_URL=postgresql://postgres:密碼@...supabase.co:5432/postgres?sslmode=require

# 3. 安裝依賴
npm install

# 4. 初始化資料庫
npx prisma generate
npx prisma db push

# 5. 匯入詞彙資料（首次）
npm run import

# 6. 啟動開發伺服器
npm run dev
```

開啟 http://localhost:3000

### 可用命令

```bash
npm run dev              # 開發伺服器
npm run build            # 生產構建
npm run start            # 啟動生產伺服器
npm run import           # 重新匯入資料
```

---

## 🔐 環境變數設定

### Supabase 連接字串取得

1. 前往 [Supabase Dashboard](https://app.supabase.com/)
2. 選擇專案 → **Settings** → **Database**
3. 複製 **Connection string** (選擇 **Connection Pooling** 模式用於 Vercel)
4. **Port 6543** (Pooling) 適合 Serverless，**Port 5432** (Direct) 適合開發

### 本地開發 (.env)
```env
DATABASE_URL=postgresql://postgres:密碼@db.xxx.supabase.co:5432/postgres?sslmode=require
NEXT_PUBLIC_API_BASE=http://localhost:3000
```

### Vercel 生產 (Vercel Dashboard)
```
DATABASE_URL=postgresql://postgres:密碼@db.xxx.supabase.co:6543/postgres?sslmode=require
NEXT_PUBLIC_API_BASE=https://amis-learning.vercel.app
```

---

## 🌐 部署到 Vercel

### 方法 A：使用 Vercel CLI（推薦）

```bash
# 1️⃣ 登入
cd web
npx vercel login

# 2️⃣ 部署（自動設定）
npx vercel --prod -e DATABASE_URL='postgresql://postgres:密碼@db.xxx.supabase.co:6543/postgres?sslmode=require'

# 3️⃣ 查看部署狀態
npx vercel status
npx vercel logs --follow
```

### 方法 B：使用 Vercel Web 介面

1. 前往 https://vercel.com/new
2. **Import Git Repository** → 選擇 `Amis-Learning`
3. **Framework**: Next.js（自動選擇）
4. **Root Directory**: `web`
5. **Environment Variables**:
   - Key: `DATABASE_URL`
   - Value: Supabase 連接字串（Port 6543）
6. 點擊 **Deploy**

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

## 🔧 資料庫設定

### 首次部署：建立索引

在 Supabase **SQL Editor** 執行：

```sql
-- 啟用擴充
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 模糊搜尋索引
CREATE INDEX IF NOT EXISTS idx_flashcards_lemma_trgm
  ON flashcards USING gin (lemma gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sentences_text_trgm
  ON sentences USING gin (text gin_trgm_ops);

-- 複習排程索引
CREATE INDEX IF NOT EXISTS idx_user_card_stats_next_review
  ON user_card_stats (next_review_at);

CREATE INDEX IF NOT EXISTS idx_user_card_stats_user_priority
  ON user_card_stats (user_id, current_priority);
```

或直接匯入 `db/indexes.sql`：

```bash
# 使用 Supabase CLI
supabase db push

# 或手動複製 db/indexes.sql 內容到 SQL Editor
```

---

## 🐛 常見問題解答

### Q: 連接 Supabase 失敗 (P1001)?
**A:** 
- 確認 `DATABASE_URL` 格式正確
- Port **6543** (Pooling) 用於 Vercel，**5432** (Direct) 用於開發
- 末尾加入 `?sslmode=require`
- 檢查密碼是否包含特殊字符（需 URL encode）

### Q: Vercel 部署失敗?
**A:** 查看部署日誌：
```bash
npx vercel logs --follow
```
常見原因：
- 環境變數未設定
- Node.js 版本不兼容
- 依賴安裝失敗

### Q: 資料匯入失敗?
**A:**
- 確認 DATABASE_URL 正確
- 檢查 CSV 編碼為 UTF-8
- 執行：`npx prisma generate` 後再匯入

### Q: 模糊搜尋無結果?
**A:**
- 確認已執行 `CREATE EXTENSION pg_trgm`
- 確認已建立 Trigram 索引
- 檢查詞彙確實存在於資料庫

---

## 🎓 技術文檔

詳細文檔位於 `docs/` 目錄：

- **[tech-architecture.md](docs/tech-architecture.md)** — 系統架構、技術選型理由
- **[algorithms.md](docs/algorithms.md)** — SM-2 演算法細節、Smart Linker 實現
- **[ui-ux.md](docs/ui-ux.md)** — iPhone 介面設計、使用者體驗指南

---

## 🎯 後續改進方向

### 優先級 🔴 - 立即完成
- [x] Vercel 部署
- [ ] 部署驗證與監控

### 優先級 🟡 - 本月完成
- [ ] 用戶認證系統（Supabase Auth / GitHub OAuth）
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
- [Supabase 文檔](https://supabase.com/docs)
- [Prisma 文檔](https://www.prisma.io/docs/)
- [PostgreSQL 模糊搜尋](https://www.postgresql.org/docs/current/pgtrgm.html)

---

## 📄 授權

MIT License - 詳見 LICENSE 文件

---

**最後更新**: 2025年12月28日  
**專案狀態**: ✅ 就緒部署
