import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';
import MobileLayout from '@/components/MobileLayout';

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
  const [flipped, setFlipped] = useState(false); // 卡片翻面狀態

  // 載入方言列表和恢復已選擇的語系
  useEffect(() => {
    setLoading(true);
    api.get('/dashboard/dialects')
      .then(res => {
        const list: Dialect[] = (res.data.data || []).map((d: any) => ({
          id: d.dialect_id ?? d.id,
          code: d.code ?? '',
          name: d.name,
        }));
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
      setCurrent(prev => {
        if (prev < items.length - 1) {
          return prev + 1;
        } else {
          // 本輪學習完成
          alert(`完成 ${newStudied} 個單字學習！`);
          return prev;
        }
      });
    } catch (err: any) {
      console.error('提交複習結果失敗', err);
      alert(`提交失敗：${err?.response?.data?.error || err.message}`);
    }
  };

  return (
    <MobileLayout>
      <main className="px-4 py-3">
        {/* Header: daily progress & dialect selector */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <h2 className="m-0 text-lg font-semibold">學習模式</h2>
            <div className="text-sm text-text-muted">進度: {studiedCount}/10</div>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="px-3 py-2 rounded-md border border-gray-300 min-w-[180px] bg-surface"
              value={selectedDialect || ''}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedDialect(id);
                localStorage.setItem('selectedDialectId', id);
                loadCards(id);
              }}
            >
              {dialects.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => selectedDialect && loadCards(selectedDialect)}
              className="px-3 py-2 rounded-md border border-gray-300 bg-surface"
            >
              重新載入
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-md mb-3 bg-red-100 text-red-700">錯誤：{error}</div>
        )}

        {loading ? (
          <div className="text-center py-10 text-text-muted">載入中...</div>
        ) : !selectedDialect ? (
          <div className="text-center py-10 text-text-muted">
            尚未有可用的語別，請先在 CMS 新增方言與單字。
          </div>
        ) : item ? (
          <>
            {/* Flashcard */}
            <div
              className="h-64 rounded-lg bg-surface shadow-surface flex items-center justify-center text-2xl select-none mb-24"
              onClick={() => setFlipped((v) => !v)}
            >
              <div className={flipped ? 'animate-flip' : ''}>
                {flipped ? (
                  <div className="text-center px-4">
                    <div className="text-2xl mb-2">{item.meaning}</div>
                    {item.phonetic && (
                      <div className="text-base opacity-70 italic">/{item.phonetic}/</div>
                    )}
                  </div>
                ) : (
                  <div className="text-3xl font-bold">{item.lemma}</div>
                )}
              </div>
            </div>

            {/* Bottom controls in thumb zone (fixed above nav) */}
            <div className="fixed bottom-16 left-0 right-0 px-4">
              {!flipped ? (
                <button
                  className="w-full py-3 rounded-lg bg-primary text-white text-lg active:animate-press"
                  onClick={() => setFlipped(true)}
                >
                  顯示答案
                </button>
              ) : (
                <div>
                  <div className="mb-2 text-center text-sm text-text-muted">評估您對這個單字的熟練程度</div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { score: 1, label: 'Again', cls: 'bg-primary' },
                      { score: 2, label: 'Hard', cls: 'bg-accent-yellow' },
                      { score: 3, label: 'Good', cls: 'bg-secondary' },
                      { score: 4, label: 'Easy', cls: 'bg-accent-green' },
                    ].map(({ score, label, cls }) => (
                      <button
                        key={score}
                        onClick={() => {
                          setFlipped(false);
                          rate(score);
                        }}
                        className={`py-3 rounded-lg text-white flex flex-col items-center gap-1 active:animate-press ${cls}`}
                      >
                        <div className="text-base font-bold">{score}</div>
                        <div className="text-[11px]">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-text-muted">
            目前沒有可學習的單字，請先在 CMS 新增資料，或點擊「重新載入」。
          </div>
        )}
      </main>
    </MobileLayout>
  );
}
