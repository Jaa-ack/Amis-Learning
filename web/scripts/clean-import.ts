/**
 * 阿美語詞彙清空與匯入腳本
 * 
 * 功能：
 * 1. 清空所有舊的 flashcard 和 dialect 資料
 * 2. 從 5 個 CSV 檔案重新匯入詞彙
 * 3. 自動合併 definition_1, definition_2, definition_3 為單一 meaning（逗號分隔）
 * 
 * 資料庫規則：
 * - 允許多個單字存在
 * - 不同語別可以有相同單字（如：秀姑巒的"水" 和 南勢的"水"）
 * - 同一語別內單字不重複（UNIQUE constraint: dialect_id + lemma）
 * - 允許單字沒有語別（dialect_id 可為 NULL）
 */

import { PrismaClient } from '@prisma/client';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import path from 'path';
import { readdirSync } from 'fs';

// 使用直接連線（Port 5432）避免連線池的 prepared statement 問題
const directUrl = process.env.DATABASE_URL?.replace(':6543/', ':5432/') || process.env.DATABASE_URL;
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: directUrl
    }
  }
});

const folder = path.resolve('/Users/jaaaaack/VSCode/Amis-Learninig/學習詞表');

// CSV 檔案與方言的對應關係
const dialectMap: Record<string, { code: string; name: string }> = {
  '學習詞表_秀姑巒阿美語.csv': { code: 'xiuguluan', name: '秀姑巒阿美語' },
  '學習詞表_南勢阿美語.csv': { code: 'nanshi', name: '南勢阿美語' },
  '學習詞表_恆春阿美語.csv': { code: 'hengchun', name: '恆春阿美語' },
  '學習詞表_海岸阿美語.csv': { code: 'haian', name: '海岸阿美語' },
  '學習詞表_馬蘭阿美語.csv': { code: 'malan', name: '馬蘭阿美語' },
};

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 步驟 1: 清空所有舊資料
 */
async function clearAllData() {
  console.log('🗑️  清空所有舊資料...');
  
  const flashcardCount = await prisma.flashcard.count();
  const dialectCount = await prisma.dialect.count();
  
  console.log(`  ℹ️  目前有 ${flashcardCount} 筆詞彙，${dialectCount} 個方言`);
  
  await prisma.flashcard.deleteMany({});
  console.log('  ✓ 已清空所有 flashcards');
  
  await prisma.dialect.deleteMany({});
  console.log('  ✓ 已清空所有 dialects\n');
}

/**
 * 步驟 2: 確保方言存在（如果不存在則創建）
 */
async function getOrCreateDialect(code: string, name: string): Promise<string> {
  let dialect = await prisma.dialect.findUnique({ where: { code } });
  if (!dialect) {
    dialect = await prisma.dialect.create({ data: { code, name } });
    console.log(`    ✓ 創建方言: ${name} (${code})`);
  }
  return dialect.id;
}

/**
 * 步驟 3: 匯入單一 CSV 檔案
 */
async function importFile(file: string): Promise<{ success: number; error: number; skipped: number }> {
  const meta = dialectMap[path.basename(file)];
  if (!meta) { 
    console.warn('  ⚠️  未知的方言檔案，跳過:', file); 
    return { success: 0, error: 0, skipped: 0 };
  }
  
  console.log(`\n📂 匯入 ${path.basename(file)}`);
  const dialectId = await getOrCreateDialect(meta.code, meta.name);

  return new Promise<{ success: number; error: number; skipped: number }>((resolve, reject) => {
    const stream = createReadStream(path.join(folder, file));
    const parser = parse({ 
      columns: true, 
      skip_empty_lines: true,
      relax_column_count: true,  // 允許欄位數不一致
      trim: true
    });
    
    const records: any[] = [];
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        records.push(record);
      }
    });

    parser.on('error', reject);

    parser.on('end', async () => {
      console.log(`  📋 解析到 ${records.length} 筆記錄`);
      
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        
        // 提取單字（支援多種欄位名稱）
        const lemma = (record.term || record.lemma || record.word || record['單字'] || '').toString().trim();
        
        if (!lemma) {
          skippedCount++;
          continue;
        }
        
        // 合併所有 definition 欄位為單一翻譯（逗號分隔）
        const defs: string[] = [];
        if (record.definition_1) defs.push(record.definition_1.toString().trim());
        if (record.definition_2) defs.push(record.definition_2.toString().trim());
        if (record.definition_3) defs.push(record.definition_3.toString().trim());
        if (record.meaning) {
          const m = record.meaning.toString().trim();
          if (m && !defs.includes(m)) defs.push(m);
        }
        if (record['意思']) {
          const m = record['意思'].toString().trim();
          if (m && !defs.includes(m)) defs.push(m);
        }
        
        const meaning = defs.filter(d => d && d.length > 0).join(', ');
        const phonetic = (record.phonetic || record['音標'] || '').toString().trim() || null;

        try {
          // 使用 upsert 避免重複（依據 dialect_id + lemma 唯一約束）
          await prisma.flashcard.upsert({
            where: {
              dialectId_lemma: {
                dialectId,
                lemma
              }
            },
            update: {
              meaning,
              phonetic
            },
            create: {
              dialectId,
              lemma,
              meaning,
              phonetic,
              tags: []
            }
          });
          
          successCount++;
          
          // 每 50 筆顯示進度
          if (successCount % 50 === 0) {
            process.stdout.write(`  ⏳ 進度: ${successCount}/${records.length}\r`);
            await delay(30);  // 避免過載
          }
        } catch (e) {
          errorCount++;
          if (errorCount <= 5) {  // 只顯示前 5 個錯誤
            console.error(`  ❌ 錯誤 [${i + 1}/${records.length}] "${lemma}": ${(e as any)?.message?.split('\n')[0]}`);
          }
        }
      }
      
      console.log(`\n  ✅ 完成 ${path.basename(file)}`);
      console.log(`     成功: ${successCount} | 失敗: ${errorCount} | 跳過: ${skippedCount}`);
      
      resolve({ success: successCount, error: errorCount, skipped: skippedCount });
    });

    stream.pipe(parser);
  });
}

/**
 * 主程式
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   阿美語學習平台 - 資料庫清空與重新匯入                  ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  try {
    // 步驟 1: 清空舊資料
    await clearAllData();
    
    // 步驟 2: 讀取所有 CSV 檔案
    const csvFiles = readdirSync(folder).filter(f => f.endsWith('.csv'));
    const validFiles = csvFiles.filter(f => dialectMap[f]);
    
    console.log(`📊 找到 ${csvFiles.length} 個 CSV 檔案，其中 ${validFiles.length} 個可識別\n`);
    
    if (csvFiles.length !== validFiles.length) {
      const unknownFiles = csvFiles.filter(f => !dialectMap[f]);
      console.log('⚠️  以下檔案無法識別，將跳過:');
      unknownFiles.forEach(f => console.log(`   - ${f}`));
      console.log('');
    }
    
    // 步驟 3: 依序匯入每個方言
    let totalSuccess = 0;
    let totalError = 0;
    let totalSkipped = 0;
    
    for (const file of validFiles) {
      const result = await importFile(file);
      totalSuccess += result.success;
      totalError += result.error;
      totalSkipped += result.skipped;
      await delay(500);  // 方言之間間隔 0.5 秒
    }
    
    // 步驟 4: 顯示最終統計
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    匯入完成統計                           ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log(`║  成功匯入: ${totalSuccess.toString().padEnd(10)} 筆                               ║`);
    console.log(`║  匯入失敗: ${totalError.toString().padEnd(10)} 筆                               ║`);
    console.log(`║  跳過記錄: ${totalSkipped.toString().padEnd(10)} 筆（空白單字）                ║`);
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log(`║  總計處理: ${(totalSuccess + totalError + totalSkipped).toString().padEnd(10)} 筆                               ║`);
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    // 驗證最終結果
    const finalCount = await prisma.flashcard.count();
    const dialectCount = await prisma.dialect.count();
    console.log(`✓ 驗證: 資料庫現有 ${finalCount} 筆詞彙，${dialectCount} 個方言`);
    
    if (totalError > 0) {
      console.log('\n⚠️  有部分記錄匯入失敗，請檢查上方錯誤訊息');
      process.exit(1);
    }
    
  } catch (e) {
    console.error('\n❌ 匯入過程發生錯誤:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 執行主程式
main().then(() => {
  console.log('\n✅ 程式執行完畢');
  process.exit(0);
});
