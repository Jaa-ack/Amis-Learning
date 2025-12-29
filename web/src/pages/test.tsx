import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';

interface TestResult {
  correct: number;
  total: number;
  items: Array<{
    flashcard: any;
    userInput: string;
    similarity: number;
    isCorrect: boolean;
  }>;
}

export default function Test() {
  const router = useRouter();
  const { dialectId, fromStudy } = router.query;
  
  const [items, setItems] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<TestResult['items']>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (router.isReady) {
      loadTestItems();
    }
  }, [router.isReady]);

  const loadTestItems = async () => {
    setLoading(true);
    // 根據演算法獲取需要測驗的單字
    // 優先順序：1) 最近學習的 2) 需要複習的 3) 容易忘記的
    const params: any = { limit: 10 };
    
    // 使用已選擇的語系，若無則使用 URL 參數
    const selectedDialectId = localStorage.getItem('selectedDialectId');
    if (selectedDialectId) {
      params.dialectId = selectedDialectId;
    } else if (dialectId) {
      params.dialectId = dialectId;
    }
    
    const res = await api.get('/cards/next', { params });
    setItems(res.data.items || []);
    setSessionId(`test-${params.dialectId || 'all'}-${Date.now()}`);
    setLoading(false);
  };

  const item = items[current];

  const submitSpell = async () => {
    if (!item) return;
    
    const similarity = similarityPercent(input, item.lemma);
    const isCorrect = similarity >= 85; // 85% 以上視為正確
    const score = similarity >= 100 ? 4 : similarity >= 85 ? 3 : similarity >= 70 ? 2 : 1;
    
    // 提交測驗結果（標記為 POST_TEST）
    await api.post('/reviews', { 
      flashcardId: item.id, 
      mode: 'SPELL', 
      score, 
      similarity,
      isPostTest: true,  // 標記為測驗模式
      sessionId 
    });

    // 記錄測驗結果
    const newResults = [...results, {
      flashcard: item,
      userInput: input,
      similarity,
      isCorrect
    }];
    setResults(newResults);
    setInput('');

    // 移動到下一題或結束測驗
    if (current < items.length - 1) {
      setCurrent(current + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitSpell();
    }
  };

  // 顯示測驗結果
  if (isFinished) {
    const correctCount = results.filter(r => r.isCorrect).length;
    const totalCount = results.length;
    const percentage = Math.round((correctCount / totalCount) * 100);

    return (
      <main style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
        <h2>測驗結果</h2>
        <div style={{ 
          textAlign: 'center', 
          padding: 40, 
          background: percentage >= 80 ? '#dcfce7' : percentage >= 60 ? '#fef9c3' : '#fee2e2',
          borderRadius: 16,
          marginBottom: 20
        }}>
          <div style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 8 }}>
            {percentage}%
          </div>
          <div style={{ fontSize: 18, color: '#666' }}>
            答對 {correctCount} / {totalCount} 題
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h3>詳細結果</h3>
          {results.map((r, i) => (
            <div 
              key={i} 
              style={{ 
                padding: 16, 
                marginBottom: 12, 
                borderRadius: 12,
                background: r.isCorrect ? '#f0fdf4' : '#fef2f2',
                border: `2px solid ${r.isCorrect ? '#86efac' : '#fca5a5'}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontWeight: 'bold' }}>{r.flashcard.meaning}</div>
                <div style={{ color: r.isCorrect ? '#16a34a' : '#dc2626' }}>
                  {r.isCorrect ? '✓' : '✗'} {r.similarity}%
                </div>
              </div>
              <div style={{ fontSize: 14, color: '#666' }}>
                正確答案: <span style={{ fontWeight: 'bold' }}>{r.flashcard.lemma}</span>
              </div>
              {!r.isCorrect && (
                <div style={{ fontSize: 14, color: '#dc2626' }}>
                  您的答案: <span style={{ fontWeight: 'bold' }}>{r.userInput}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <button 
            onClick={() => router.push('/study')}
            style={{
              padding: 16,
              fontSize: 18,
              borderRadius: 12,
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            繼續學習
          </button>
          <button 
            onClick={() => {
              setIsFinished(false);
              setResults([]);
              setCurrent(0);
              loadTestItems();
            }}
            style={{
              padding: 16,
              fontSize: 18,
              borderRadius: 12,
              background: 'white',
              color: '#3b82f6',
              border: '2px solid #3b82f6',
              cursor: 'pointer'
            }}
          >
            再測驗一次
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>拼寫測驗</h2>
        <div style={{ fontSize: 14, color: '#666' }}>
          題目 {current + 1}/{items.length}
        </div>
      </div>

      {fromStudy && (
        <div style={{ 
          padding: 12, 
          background: '#eff6ff', 
          borderRadius: 8, 
          marginBottom: 20,
          fontSize: 14,
          color: '#1e40af'
        }}>
          💡 學習 10 個單字後的複習測驗，測試您的記憶效果
        </div>
      )}

      {item ? (
        <>
          <div style={{ 
            padding: 40, 
            background: '#f9fafb', 
            borderRadius: 16, 
            textAlign: 'center',
            marginBottom: 20 
          }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>請拼寫以下單字</div>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>{item.meaning}</div>
            {item.phonetic && (
              <div style={{ fontSize: 16, color: '#666', marginTop: 8, fontStyle: 'italic' }}>
                /{item.phonetic}/
              </div>
            )}
          </div>

          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyPress={handleKeyPress}
            placeholder="輸入阿美語拼寫..."
            autoFocus
            style={{ 
              fontSize: 24, 
              padding: 16, 
              width: '100%',
              borderRadius: 12,
              border: '2px solid #e5e7eb',
              marginBottom: 12,
              boxSizing: 'border-box'
            }} 
          />

          <button 
            onClick={submitSpell} 
            disabled={!input.trim()}
            style={{ 
              padding: 16, 
              width: '100%',
              fontSize: 18,
              borderRadius: 12,
              background: input.trim() ? '#3b82f6' : '#e5e7eb',
              color: input.trim() ? 'white' : '#9ca3af',
              border: 'none',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 'bold'
            }}
          >
            提交答案
          </button>
        </>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          載入測驗題目...
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          目前沒有可測驗的單字，請先在學習模式學習或在 CMS 新增資料。
        </div>
      )}
    </main>
  );
}

function similarityPercent(a: string, b: string) {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  const maxLen = Math.max(na.length, nb.length);
  let same = 0;
  for (let i = 0; i < Math.min(na.length, nb.length); i++) {
    if (na[i] === nb[i]) same++;
  }
  return Math.round((same / maxLen) * 100);
}

function normalize(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
