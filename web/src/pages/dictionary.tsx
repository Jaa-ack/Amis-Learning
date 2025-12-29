import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Flashcard {
  id: string;
  lemma: string;
  meaning: string | null;
  phonetic: string | null;
  dialect_id: string | null;
  tags: string[];
}

interface Sentence {
  id: string;
  text: string;
  translation: string | null;
}

interface Dialect {
  id: string;
  code: string;
  name: string;
  region: string | null;
}

export default function Dictionary() {
  const [items, setItems] = useState<Flashcard[]>([]);
  const [dialects, setDialects] = useState<Dialect[]>([]);
  const [selectedDialect, setSelectedDialect] = useState<string>('all');
  const [selectedCard, setSelectedCard] = useState<Flashcard | null>(null);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 載入所有語別
  useEffect(() => {
    const loadDialects = async () => {
      try {
        const res = await api.get('/dashboard/dialects');
        setDialects(res.data.data || []);
      } catch (error) {
        console.error('Failed to load dialects:', error);
      }
    };
    loadDialects();
  }, []);

  // 載入所有單字
  useEffect(() => {
    const loadAllCards = async () => {
      setLoading(true);
      try {
        const res = await api.get('/dictionary/all', {
          params: { dialectId: selectedDialect === 'all' ? undefined : selectedDialect }
        });
        setItems(res.data.items || []);
      } catch (error) {
        console.error('Failed to load flashcards:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    loadAllCards();
  }, [selectedDialect]);

  // 載入單字的例句
  const loadSentences = async (flashcardId: string) => {
    try {
      const res = await api.get('/dictionary/sentences', { params: { flashcardId } });
      setSentences(res.data.sentences || []);
    } catch (error) {
      console.error('Failed to load sentences:', error);
      setSentences([]);
    }
  };

  const handleCardClick = (card: Flashcard) => {
    setSelectedCard(card);
    loadSentences(card.id);
  };

  const filteredItems = searchQuery
    ? items.filter(item =>
        item.lemma.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.meaning && item.meaning.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : items;

  const getDialectName = (dialectId: string | null) => {
    if (!dialectId) return '未分類';
    const dialect = dialects.find(d => d.id === dialectId);
    return dialect?.name || dialectId;
  };

  return (
    <main style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
      <h2>阿美語辭典</h2>

      {/* 語別選擇 */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 8, fontWeight: 'bold' }}>選擇語別：</label>
        <select
          value={selectedDialect}
          onChange={e => setSelectedDialect(e.target.value)}
          style={{ padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
        >
          <option value="all">全部語別</option>
          {dialects.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* 搜尋框 */}
      <input
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="搜尋單字或中文意思..."
        style={{
          fontSize: 16,
          padding: 12,
          width: '100%',
          marginBottom: 16,
          borderRadius: 4,
          border: '1px solid #ccc'
        }}
      />

      <div style={{ display: 'flex', gap: 16 }}>
        {/* 左側：單字列表 */}
        <div style={{ flex: 1, maxHeight: '70vh', overflowY: 'auto', border: '1px solid #ddd', borderRadius: 4 }}>
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center' }}>載入中...</div>
          ) : filteredItems.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
              {searchQuery ? '沒有找到符合的單字' : '沒有單字資料'}
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {filteredItems.map((item) => (
                <li
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  style={{
                    padding: 12,
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    backgroundColor: selectedCard?.id === item.id ? '#e3f2fd' : 'white',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={e => {
                    if (selectedCard?.id !== item.id) {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={e => {
                    if (selectedCard?.id !== item.id) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: 18, color: '#1976d2' }}>
                    {item.lemma}
                  </div>
                  <div style={{ color: '#666', fontSize: 14, marginTop: 4 }}>
                    {item.meaning || '（無中文意思）'}
                  </div>
                  <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                    {getDialectName(item.dialect_id)}
                    {item.phonetic && ` • ${item.phonetic}`}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div style={{ padding: 12, textAlign: 'center', color: '#999', borderTop: '1px solid #eee' }}>
            共 {filteredItems.length} 個單字
          </div>
        </div>

        {/* 右側：單字詳細資訊 */}
        <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: 4, padding: 16 }}>
          {selectedCard ? (
            <div>
              <h3 style={{ margin: '0 0 16px 0', color: '#1976d2' }}>{selectedCard.lemma}</h3>

              <div style={{ marginBottom: 12 }}>
                <strong>中文意思：</strong>
                <div style={{ marginTop: 4 }}>{selectedCard.meaning || '（無中文意思）'}</div>
              </div>

              {selectedCard.phonetic && (
                <div style={{ marginBottom: 12 }}>
                  <strong>發音：</strong>
                  <div style={{ marginTop: 4 }}>{selectedCard.phonetic}</div>
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <strong>語別：</strong>
                <div style={{ marginTop: 4 }}>{getDialectName(selectedCard.dialect_id)}</div>
              </div>

              {selectedCard.tags && selectedCard.tags.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <strong>標籤：</strong>
                  <div style={{ marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedCard.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: '#e3f2fd',
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 12
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 24, borderTop: '1px solid #eee', paddingTop: 16 }}>
                <strong>包含此單字的例句：</strong>
                {sentences.length === 0 ? (
                  <div style={{ marginTop: 8, color: '#666', fontSize: 14 }}>（無例句）</div>
                ) : (
                  <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                    {sentences.map((sentence) => (
                      <li key={sentence.id} style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight: 'bold', color: '#333' }}>{sentence.text}</div>
                        {sentence.translation && (
                          <div style={{ color: '#666', fontSize: 14, marginTop: 4 }}>
                            {sentence.translation}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div style={{ color: '#999', textAlign: 'center', marginTop: 40 }}>
              點擊左側單字以查看詳細資訊
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
