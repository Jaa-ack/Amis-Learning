import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';
import MobileLayout from '@/components/MobileLayout';

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

interface TestAnswer {
  flashcardId: string;
  userInput: string;
  similarity: number;
  isCorrect: boolean;
}

export default function Test() {
  const router = useRouter();
  const { dialectId, fromStudy } = router.query;
  
  const [items, setItems] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [current, setCurrent] = useState(0);
  const [testAnswers, setTestAnswers] = useState<TestAnswer[]>([]); // 本地儲存所有答案
  const [results, setResults] = useState<TestResult['items']>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isGrading, setIsGrading] = useState(false);

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
    setLoading(false);
  };

  const item = items[current];

  const submitSpell = async () => {
    if (!item || submitting) return;
    setSubmitting(true);
    
    try {
      const na = normalize(input);
      const nb = normalize(item.lemma);
      const similarity = similarityPercent(na, nb);
      const isCorrect = na === nb; // 必須 100% 相同才視為正確

      // 先儲存到本地，不立即提交到資料庫
      const newAnswer: TestAnswer = {
        flashcardId: item.id,
        userInput: input,
        similarity,
        isCorrect
      };
      const newAnswers = [...testAnswers, newAnswer];
      setTestAnswers(newAnswers);
      setInput('');

      // 移動到下一題或結束測驗
      if (current < items.length - 1) {
        setCurrent(current + 1);
      } else {
        // 所有題目完成，準備評分
        await gradeAndSubmit(newAnswers);
      }
    } catch (err: any) {
      console.error('提交測驗結果失敗', err);
      alert(`提交失敗：${err?.response?.data?.error || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const gradeAndSubmit = async (answers: TestAnswer[]) => {
    setIsGrading(true);
    try {
      // 計算結果
      const resultItems = answers.map(ans => {
        const flashcard = items.find(i => i.id === ans.flashcardId);
        return {
          flashcard,
          userInput: ans.userInput,
          similarity: ans.similarity,
          isCorrect: ans.isCorrect
        };
      });
      setResults(resultItems);

      // 批次提交到資料庫
      const reviewSubmissions = answers.map(ans => {
        const isCorrect = ans.isCorrect;
        const score = isCorrect ? 4 : ans.similarity >= 85 ? 3 : ans.similarity >= 70 ? 2 : 1;
        return api.post('/reviews', {
          flashcardId: ans.flashcardId,
          mode: 'SPELL',
          score,
          similarity: ans.similarity,
          isPostTest: true
        });
      });

      await Promise.all(reviewSubmissions);
      setIsFinished(true);
    } catch (err: any) {
      console.error('評分和提交失敗', err);
      alert(`評分失敗：${err?.response?.data?.error || err.message}`);
    } finally {
      setIsGrading(false);
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
      <MobileLayout>
        <main style={{ padding: '16px', maxWidth: '100%', margin: '0 auto' }}>
          <h2 style={{ fontSize: 20, marginBottom: 20 }}>測驗結果</h2>
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
            <div style={{ fontSize: 16, color: '#666' }}>
              答對 {correctCount} / {totalCount} 題
            </div>
          </div>

          <div style={{ marginBottom: 80 }}>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>詳細結果</h3>
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
                  <div style={{ fontWeight: 'bold', fontSize: 14 }}>{r.flashcard.meaning}</div>
                  <div style={{ color: r.isCorrect ? '#16a34a' : '#dc2626', fontSize: 14 }}>
                    {r.isCorrect ? '✓' : '✗'} {r.similarity}%
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#666' }}>
                  正確答案: <span style={{ fontWeight: 'bold' }}>{r.flashcard.lemma}</span>
                </div>
                {!r.isCorrect && (
                  <div style={{ fontSize: 13, color: '#dc2626' }}>
                    您的答案: <span style={{ fontWeight: 'bold' }}>{r.userInput}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ 
            position: 'fixed', 
            bottom: 60, 
            left: 0, 
            right: 0, 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            padding: 16,
            background: 'white',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
          }}>
            <button 
              onClick={() => router.push('/study')}
              style={{
                padding: 12,
                fontSize: 16,
                borderRadius: 12,
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              繼續學習
            </button>
            <button 
              onClick={() => {
                setIsFinished(false);
                setResults([]);
                setTestAnswers([]);
                setCurrent(0);
                loadTestItems();
              }}
              style={{
                padding: 12,
                fontSize: 16,
                borderRadius: 12,
                background: 'white',
                color: '#3b82f6',
                border: '2px solid #3b82f6',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              再測驗一次
            </button>
          </div>
        </main>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <main style={{ padding: '16px', maxWidth: '100%', margin: '0 auto', paddingBottom: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>拼寫測驗</h2>
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
              <div style={{ fontSize: 28, fontWeight: 'bold', wordBreak: 'break-word' }}>
                {item.meaning}
              </div>
              {item.phonetic && (
                <div style={{ fontSize: 14, color: '#666', marginTop: 8, fontStyle: 'italic' }}>
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
              autoComplete="off"
              spellCheck="false"
              style={{ 
                fontSize: 18, 
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
              disabled={!input.trim() || submitting || isGrading}
              style={{ 
                padding: 16, 
                width: '100%',
                fontSize: 16,
                borderRadius: 12,
                background: input.trim() && !submitting && !isGrading ? '#3b82f6' : '#e5e7eb',
                color: input.trim() && !submitting && !isGrading ? 'white' : '#9ca3af',
                border: 'none',
                cursor: input.trim() && !submitting && !isGrading ? 'pointer' : 'not-allowed',
                fontWeight: 'bold'
              }}
            >
              {isGrading ? '評分中...' : submitting ? '提交中...' : '提交答案'}
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
    </MobileLayout>
  );
}

function similarityPercent(a: string, b: string) {
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  let same = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) same++;
  }
  return Math.round((same / maxLen) * 100);
}

function normalize(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
