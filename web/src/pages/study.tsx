import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';
import { Card } from '@/components/Card';
import { BottomSheet } from '@/components/BottomSheet';

interface Dialect {
  id: string;
  code: string;
  name: string;
}

export default function Study() {
  const router = useRouter();
  const [dialects, setDialects] = useState<Dialect[]>([]);
  const [selectedDialect, setSelectedDialect] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [studiedCount, setStudiedCount] = useState(0);
  const [sessionId, setSessionId] = useState<string>('');

  // 載入方言列表
  useEffect(() => {
    api.get('/dashboard/dialects', { params: { userId: 'demo-user' } })
      .then(res => setDialects(res.data.dialects || []));
  }, []);

  // 選擇方言後載入字卡
  const loadCards = async (dialectId: string) => {
    setSelectedDialect(dialectId);
    const res = await api.get('/cards/next', { 
      params: { userId: 'demo-user', dialectId, limit: 10 } 
    });
    setItems(res.data.items || []);
    setCurrent(0);
    setStudiedCount(0);
    // 創建學習會話 ID
    setSessionId(`study-${dialectId}-${Date.now()}`);
  };

  const item = items[current];

  const rate = async (proficiency: number) => {
    if (!item) return;
    
    // 提交複習結果（使用 SM-2 演算法）
    await api.post('/reviews', { 
      userId: 'demo-user', 
      flashcardId: item.id, 
      mode: 'CHOICE', 
      score: proficiency,
      sessionId 
    });

    const newStudied = studiedCount + 1;
    setStudiedCount(newStudied);

    // 每學習 10 個單字，自動跳轉到測驗
    if (newStudied >= 10) {
      router.push(`/test?dialectId=${selectedDialect}&fromStudy=true`);
      return;
    }

    // 移動到下一張卡片
    if (current < items.length - 1) {
      setCurrent(current + 1);
    } else {
      // 本輪學習完成
      alert(`完成 ${newStudied} 個單字學習！`);
      setSelectedDialect(null);
    }
  };

  // 如果尚未選擇方言，顯示選擇介面
  if (!selectedDialect) {
    return (
      <main style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
        <h2>選擇學習語別</h2>
        <p style={{ color: '#666', marginBottom: 20 }}>
          選擇一個阿美語方言開始學習。系統會根據 SM-2 間隔重複演算法為您推薦最適合複習的單字。
        </p>
        <div style={{ display: 'grid', gap: 12 }}>
          {dialects.map(d => (
            <button
              key={d.id}
              onClick={() => loadCards(d.id)}
              style={{
                padding: '16px 20px',
                fontSize: 18,
                borderRadius: 12,
                border: '2px solid #e0e0e0',
                background: 'white',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.background = '#eff6ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e0e0e0';
                e.currentTarget.style.background = 'white';
              }}
            >
              {d.name}
            </button>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>學習模式</h2>
        <div style={{ fontSize: 14, color: '#666' }}>
          進度: {studiedCount}/10
        </div>
      </div>
      
      {item ? (
        <>
          <Card 
            front={item.lemma} 
            back={
              <>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{item.meaning}</div>
                {item.phonetic && (
                  <div style={{ fontSize: 16, opacity: 0.7, fontStyle: 'italic' }}>
                    /{item.phonetic}/
                  </div>
                )}
              </>
            } 
          />
          <BottomSheet>
            <div style={{ marginBottom: 12, fontSize: 14, color: '#666', textAlign: 'center' }}>
              評估您對這個單字的熟練程度
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { score: 1, label: '完全不會', color: '#ef4444' },
                { score: 2, label: '有點印象', color: '#f59e0b' },
                { score: 3, label: '基本熟悉', color: '#3b82f6' },
                { score: 4, label: '非常熟練', color: '#10b981' }
              ].map(({ score, label, color }) => (
                <button 
                  key={score} 
                  onClick={() => rate(score)} 
                  style={{ 
                    padding: '16px 8px',
                    fontSize: 16,
                    borderRadius: 12,
                    border: 'none',
                    background: color,
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'transform 0.1s'
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ fontSize: 20, fontWeight: 'bold' }}>{score}</div>
                  <div style={{ fontSize: 12 }}>{label}</div>
                </button>
              ))}
            </div>
          </BottomSheet>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          載入中...
        </div>
      )}
    </main>
  );
}
