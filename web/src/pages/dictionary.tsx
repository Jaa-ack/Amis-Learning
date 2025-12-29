import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import MobileLayout from '@/components/MobileLayout';

interface Flashcard {
  id: string;
  lemma: string;
  meaning: string | null;
  phonetic: string | null;
  dialect_id: string | null;
  dialect_name?: string;
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
  const [editLemma, setEditLemma] = useState('');
  const [editMeaning, setEditMeaning] = useState('');
  const [editDialectId, setEditDialectId] = useState('');
  const [editTags, setEditTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadDialects = async () => {
      try {
        const res = await api.get('/dashboard/dialects');
        const list: Dialect[] = (res.data.data || []).map((d: any) => ({
          id: d.dialect_id ?? d.id,
          code: d.code ?? '',
          name: d.name,
          region: d.region ?? null,
        }));
        setDialects(list);
        const saved = localStorage.getItem('selectedDialectId');
        if (saved && list.find((d) => d.id === saved)) {
          setSelectedDialect(saved);
        }
      } catch (error) {
        console.error('Failed to load dialects:', error);
      }
    };
    loadDialects();
  }, []);

  useEffect(() => {
    const loadAllCards = async () => {
      setLoading(true);
      try {
        const res = await api.get('/dictionary/all', {
          params: { dialectId: selectedDialect === 'all' ? undefined : selectedDialect },
        });
        const list = res.data.items || [];
        setItems(list);
        if (selectedCard) {
          const refreshed = list.find((item: Flashcard) => item.id === selectedCard.id);
          if (!refreshed) {
            setSelectedCard(null);
            setSentences([]);
          }
        }
      } catch (error) {
        console.error('Failed to load flashcards:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    loadAllCards();
  }, [selectedDialect]);

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
    setEditLemma(card.lemma || '');
    setEditMeaning(card.meaning || '');
    setEditDialectId(card.dialect_id || '');
    setEditTags(card.tags?.join(',') || '');
    loadSentences(card.id);
  };

  const handleUpdate = async () => {
    if (!selectedCard) return;
    setSaving(true);
    setMessage('');
    try {
      const tagsArray = editTags ? editTags.split(',').map((t) => t.trim()).filter(Boolean) : [];
      const res = await api.patch('/dictionary/card', {
        id: selectedCard.id,
        dialectId: editDialectId || null,
        lemma: editLemma,
        meaning: editMeaning,
        tags: tagsArray,
      });
      const updated: Flashcard = {
        ...selectedCard,
        ...res.data.flashcard,
        dialect_id: res.data.flashcard.dialectId,
      };
      setSelectedCard(updated);
      setItems((prev) =>
        prev.map((item) =>
          item.id === updated.id
            ? { ...item, lemma: updated.lemma, meaning: updated.meaning, tags: updated.tags, dialect_id: updated.dialect_id }
            : item
        )
      );
      setMessage('✅ 已更新單字');
    } catch (error: any) {
      setMessage(`❌ 更新失敗：${error.response?.data?.error || error.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDelete = async () => {
    if (!selectedCard) return;
    if (!confirm('確定要刪除這個單字嗎？此動作無法復原。')) return;
    setSaving(true);
    setMessage('');
    try {
      await api.delete('/dictionary/card', { data: { id: selectedCard.id } });
      setItems((prev) => prev.filter((item) => item.id !== selectedCard.id));
      setSelectedCard(null);
      setSentences([]);
      setMessage('✅ 已刪除單字');
    } catch (error: any) {
      setMessage(`❌ 刪除失敗：${error.response?.data?.error || error.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const filteredItems = searchQuery
    ? items.filter((item) =>
        item.lemma.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.meaning && item.meaning.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : items;

  const getDialectName = (dialectId: string | null) => {
    if (!dialectId) return '未分類';
    const dialect = dialects.find((d) => d.id === dialectId);
    return dialect?.name || dialectId;
  };

  return (
    <MobileLayout>
      <main className="px-4 py-4 space-y-4">
        <header className="space-y-1">
          <p className="text-sm text-text-muted">Amis Learning</p>
          <h1 className="text-2xl font-bold text-text">阿美語辭典管理</h1>
        </header>

        {message && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              message.startsWith('✅')
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {message}
          </div>
        )}

        <section className="rounded-xl bg-surface shadow-surface p-4 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-text">選擇語別</label>
              <select
                value={selectedDialect}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedDialect(value);
                  if (value !== 'all') localStorage.setItem('selectedDialectId', value);
                }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="all">全部語別</option>
                {dialects.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-72">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋單字或中文意思..."
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-surface shadow-surface border border-gray-100">
            <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-text">單字列表</div>
            <div className="max-h-[70vh] overflow-y-auto">
              {loading ? (
                <div className="py-6 text-center text-text-muted">載入中...</div>
              ) : filteredItems.length === 0 ? (
                <div className="py-6 text-center text-text-muted">
                  {searchQuery ? '沒有找到符合的單字' : '沒有單字資料'}
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {filteredItems.map((item) => (
                    <li
                      key={item.id}
                      onClick={() => handleCardClick(item)}
                      className={`cursor-pointer px-4 py-3 hover:bg-gray-50 transition ${
                        selectedCard?.id === item.id ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="text-base font-semibold text-primary">{item.lemma}</div>
                      <div className="text-sm text-text-muted">{item.meaning || '（無中文意思）'}</div>
                      <div className="text-xs text-text-muted mt-1">
                        {item.dialect_name || getDialectName(item.dialect_id)}
                        {item.phonetic && ` • ${item.phonetic}`}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-gray-100 px-4 py-2 text-center text-xs text-text-muted">
              共 {filteredItems.length} 個單字
            </div>
          </div>

          <div className="rounded-xl bg-surface shadow-surface border border-gray-100 p-4 space-y-3 min-h-[400px]">
            {selectedCard ? (
              <div className="space-y-3">
                <div>
                  <h3 className="text-xl font-bold text-text">{selectedCard.lemma}</h3>
                  <p className="text-sm text-text-muted">{selectedCard.dialect_name || getDialectName(selectedCard.dialect_id)}</p>
                </div>

                <div>
                  <div className="text-sm font-semibold text-text">中文意思</div>
                  <div className="text-sm text-text mt-1">{selectedCard.meaning || '（無中文意思）'}</div>
                </div>

                {selectedCard.phonetic && (
                  <div>
                    <div className="text-sm font-semibold text-text">發音</div>
                    <div className="text-sm text-text mt-1">{selectedCard.phonetic}</div>
                  </div>
                )}

                {selectedCard.tags && selectedCard.tags.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-text">標籤</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedCard.tags.map((tag, idx) => (
                        <span key={idx} className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <div className="text-sm font-semibold text-text">包含此單字的例句</div>
                  {sentences.length === 0 ? (
                    <div className="text-sm text-text-muted">（無例句）</div>
                  ) : (
                    <ul className="space-y-2 text-sm text-text">
                      {sentences.map((sentence) => (
                        <li key={sentence.id} className="rounded-md bg-background px-3 py-2">
                          <div className="font-semibold">{sentence.text}</div>
                          {sentence.translation && <div className="text-text-muted text-xs mt-1">{sentence.translation}</div>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <div className="text-sm font-semibold text-text">調整 / 刪除</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-text-muted">語別</label>
                      <select
                        value={editDialectId}
                        onChange={(e) => setEditDialectId(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <option value="">未分類</option>
                        {dialects.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-text-muted">單字</label>
                      <input
                        value={editLemma}
                        onChange={(e) => setEditLemma(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-text-muted">中文意思</label>
                      <input
                        value={editMeaning}
                        onChange={(e) => setEditMeaning(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-text-muted">標籤（逗號分隔）</label>
                      <input
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleUpdate}
                      disabled={saving}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition active:animate-press ${
                        saving ? 'bg-primary/60 cursor-not-allowed' : 'bg-primary hover:-translate-y-0.5'
                      }`}
                    >
                      {saving ? '更新中...' : '儲存變更'}
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={saving}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition active:animate-press ${
                        saving ? 'bg-red-400 cursor-not-allowed' : 'bg-red-500 hover:-translate-y-0.5'
                      }`}
                    >
                      刪除單字
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full grid place-content-center text-text-muted text-sm">請從左側列表選擇一個單字</div>
            )}
          </div>
        </section>
      </main>
    </MobileLayout>
  );
}
