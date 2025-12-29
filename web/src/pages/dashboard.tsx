import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import MobileLayout from '@/components/MobileLayout';
import { Flame, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

type DialectCount = { id: string; name: string; cards: number };
type Flashcard = { id: string; lemma: string; meaning?: string; dialect?: string };

export default function Dashboard() {
  const [dialects, setDialects] = useState<DialectCount[]>([]);
  const [recent, setRecent] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const [dialectRes, cardRes] = await Promise.all([
          api.get('/dashboard/dialects'),
          api.get('/cards/next', { params: { limit: 5 } }),
        ]);

        const counts = (dialectRes.data.data || []).map((d: any) => ({
          id: d.dialect_id ?? d.id,
          name: d.name,
          cards: Number(d.cards || 0),
        }));
        setDialects(counts);

        const items = (cardRes.data.items || []).slice(0, 5).map((c: any) => ({
          id: c.id,
          lemma: c.lemma,
          meaning: c.meaning,
          dialect: c.dialect?.name || '',
        }));
        setRecent(items);
      } catch (err) {
        console.error('Dashboard load error', err);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const totalCards = useMemo(() => dialects.reduce((sum, d) => sum + d.cards, 0), [dialects]);

  const donutStyle = useMemo(() => {
    if (!dialects.length || totalCards === 0) return {};
    const colors = ['#E63946', '#1D3557', '#FFB703', '#2A9D8F', '#6B7280'];
    let current = 0;
    const stops = dialects.map((d, idx) => {
      const start = current;
      const slice = (d.cards / totalCards) * 360;
      const end = current + slice;
      current = end;
      return `${colors[idx % colors.length]} ${start}deg ${end}deg`;
    });
    return {
      background: `conic-gradient(${stops.join(', ')})`,
    } as CSSProperties;
  }, [dialects, totalCards]);

  return (
    <MobileLayout>
      <main className="px-4 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-text">學習儀表板</h1>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1 text-sm text-text-muted active:animate-press"
          >
            <RefreshCw size={16} /> 刷新
          </button>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Streak */}
          <section className="rounded-xl bg-surface shadow-surface p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-text-muted">連續學習</div>
              <div className="text-3xl font-bold text-text mt-1 flex items-center gap-2">
                <Flame className="text-accent-yellow" />
                7 天
              </div>
              <div className="text-xs text-text-muted mt-1">保持火焰！每日 10 單字。</div>
            </div>
            <div className="w-14 h-14 rounded-full bg-accent-yellow/10 flex items-center justify-center">
              <Flame className="text-accent-yellow" size={28} />
            </div>
          </section>

          {/* Donut Chart */}
          <section className="rounded-xl bg-surface shadow-surface p-4 flex items-center gap-4">
            <div className="relative w-28 h-28 shrink-0">
              <div className="absolute inset-0 rounded-full" style={donutStyle}></div>
              <div className="absolute inset-3 rounded-full bg-surface flex items-center justify-center text-sm text-text">
                {totalCards || 0} 張
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="text-sm font-semibold text-text">方言分布</div>
              <div className="space-y-1 text-sm">
                {dialects.map((d, idx) => {
                  const colors = ['bg-primary', 'bg-secondary', 'bg-accent-yellow', 'bg-accent-green', 'bg-text-muted'];
                  const percent = totalCards ? Math.round((d.cards / totalCards) * 100) : 0;
                  return (
                    <div key={d.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-3 h-3 rounded-full ${colors[idx % colors.length]}`}></span>
                        <span className="text-text">{d.name}</span>
                      </div>
                      <div className="text-text-muted text-xs">{d.cards} 張 · {percent}%</div>
                    </div>
                  );
                })}
                {!dialects.length && (
                  <div className="text-text-muted text-sm">尚無方言資料</div>
                )}
              </div>
            </div>
          </section>

          {/* Recent Learned Words */}
          <section className="rounded-xl bg-surface shadow-surface p-4 md:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-text">最近學習的單字</div>
                <div className="text-xs text-text-muted">最新 5 筆</div>
              </div>
            </div>
            <div className="space-y-2">
              {recent.map((w) => (
                <div key={w.id} className="flex items-center justify-between px-3 py-2 rounded-md bg-background">
                  <div>
                    <div className="text-base font-semibold text-text">{w.lemma}</div>
                    <div className="text-sm text-text-muted">{w.meaning || '—'}</div>
                  </div>
                  {w.dialect && <div className="text-xs text-text-muted">{w.dialect}</div>}
                </div>
              ))}
              {!recent.length && (
                <div className="text-text-muted text-sm">尚無學習記錄，開始一輪學習吧！</div>
              )}
            </div>
          </section>
        </div>

        {loading && (
          <div className="text-center text-sm text-text-muted">載入中...</div>
        )}
      </main>
    </MobileLayout>
  );
}
