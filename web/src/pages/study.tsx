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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // 載入方言列表和恢復已選擇的語系
  useEffect(() => {
    setLoading(true);
    api.get('/dashboard/dialects')
      .then(res => {
        const list: Dialect[] = res.data.dialects || [];
        setDialects(list);

        const saved = localStorage.getItem('selectedDialectId');
        const fallback = list.length > 0 ? list[0].id : null;
        const toUse = saved && list.find((d: Dialect) => d.id === saved) ? saved : fallback;
        if (toUse) {
          setSelectedDialect(toUse);
          loadCards(toUse);
        } else {
          setSelectedDialect(null);
          setItems([]);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('載入方言失敗:', err);
        setError('無法載入方言列表。請確認資料庫連接正常。');
        setLoading(false);
      });
  }, []);

  // 選擇方言後載入字卡
  const loadCards = async (dialectId: string) => {
    setLoading(true);
    setSelectedDialect(dialectId);
    const res = await api.get('/cards/next', { 
      params: { dialectId, limit: 10 } 
    });
    setItems(res.data.items || []);
    setCurrent(0);
    setStudiedCount(0);
    setLoading(false);
  };

  const item = items[current];

  const rate = async (proficiency: number) => {
    if (!item) return;
    try {
      // 提交複習結果（使用 SM-2 演算法）
      await api.post('/reviews', { 
        flashcardId: item.id, 
        mode: 'CHOICE', 
        score: proficiency
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
      }
    } catch (err: any) {
      console.error('提交複習結果失敗', err);
      alert(`提交失敗：${err?.response?.data?.error || err.message}`);
    }
  };

  return (
    <main style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ margin: 0 }}>學習模式</h2>
          <div style={{ fontSize: 14, color: '#666' }}>進度: {studiedCount}/10</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={selectedDialect || ''}
            onChange={e => {
              const id = e.target.value;
              setSelectedDialect(id);
              localStorage.setItem('selectedDialectId', id);
              loadCards(id);
            }}
            style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc', minWidth: 180 }}
          >
            {dialects.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <button
            onClick={() => selectedDialect && loadCards(selectedDialect)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
          >
            重新載入
          </button>
        </div>
      </div>
      
      {error && (
        <div style={{ padding: 12, background: '#fee2e2', borderRadius: 8, color: '#b91c1c', marginBottom: 12 }}>
          錯誤：{error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          載入中...
        </div>
      ) : !selectedDialect ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          尚未有可用的語別，請先在 CMS 新增方言與單字。
        </div>
      ) : item ? (
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
          目前沒有可學習的單字，請先在 CMS 新增資料，或點擊「重新載入」。
        </div>
      )}
    </main>
  );
}
