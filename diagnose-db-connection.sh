#!/bin/bash

# Supabase 連接診斷工具

echo "🔍 Supabase 連接診斷"
echo "=================="
echo ""

# 從 Supabase 複製你的實際密碼和 URL
DB_PASSWORD="Jason92123!abc"
DB_PROJECT="komwtkwhfvhuswfwvnwu"

echo "1️⃣  測試 Direct Connection (Port 5432)..."
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@db.${DB_PROJECT}.supabase.co:5432/postgres"
echo "URL: $DATABASE_URL"

npx prisma db execute --stdin --stdin <<< "SELECT 1;" 2>&1 || true
echo ""

echo "2️⃣  測試 Transaction Pooling (Port 6543)..."
# 注意：Pooling 的用戶名格式不同
DB_POOLING="postgresql://postgres.${DB_PROJECT}:${DB_PASSWORD}@aws-0-ap-northeast-1.pooler.supabase.co:6543/postgres?pgbouncer=true"
echo "URL: $DB_POOLING"

DATABASE_URL="$DB_POOLING" npx prisma db execute --stdin <<< "SELECT 1;" 2>&1 || true
echo ""

echo "3️⃣  測試 Session Pooling (Port 5432)..."
DB_SESSION="postgresql://postgres.${DB_PROJECT}:${DB_PASSWORD}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true"
echo "URL: $DB_SESSION"

DATABASE_URL="$DB_SESSION" npx prisma db execute --stdin <<< "SELECT 1;" 2>&1 || true
echo ""

echo "✅ 診斷完成"
echo "=================="
echo "上面哪個方案成功了，就用那個作為 Vercel 的 DATABASE_URL"
