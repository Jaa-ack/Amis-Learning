import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Dialect {
  dialect_id: string;
  name: string;
  cards: number;
}

interface PriorityItem {
  flashcard_id: string;
  lemma: string;
  meaning: string | null;
  priority: number;
  next_review_at: string | null;
  interval_days: number;
  repetitions: number;
}

interface Stats {
  total: number;
  new: number;
  learning: number;
  reviewed: number;
}

export default function Dashboard() {
  const userId = 'demo-user';
  const [dialects, setDialects] = useState<Dialect[]>([]);
  const [priority, setPriority] = useState<PriorityItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [dialectsRes, priorityRes] = await Promise.all([
        api.get('/dashboard/dialects', { params: { userId } }),
        api.get('/dashboard/priority', { params: { userId } }),
      ]);

      setDialects(dialectsRes.data.data || []);
      setPriority(priorityRes.data.data || []);

      // 計算統計
      const allCards = priorityRes.data.data || [];
      const statsData = {
        total: allCards.length,
        new: allCards.filter((c: any) => c.status === 'NEW').length,
        learning: allCards.filter((c: any) => c.status === 'LEARNING').length,
        reviewed: allCards.filter((c: any) => c.status === 'REVIEWED').length,
      };
      setStats(statsData);
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      setError(err.response?.data?.error || err.message || '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return '#d32f2f'; // 紅色 - 急迫
      case 2: return '#f57c00'; // 橙色 - 重要
      case 3: return '#fbc02d'; // 黃色 - 一般
      case 4: return '#388e3c'; // 綠色 - 低優先
      default: return '#757575'; // 灰色
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return '急迫';
      case 2: return '重要';
      case 3: return '一般';
      case 4: return '低';
      default: return '未知';
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '未設定';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return '逾期';
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '明天';
    return `${diffDays} 天後`;
  };

  if (loading) {
    return (
      <main style={{ padding: 16, textAlign: 'center', paddingTop: 40 }}>
        <div>載入中...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ padding: 20, backgroundColor: '#f8d7da', color: '#721c24', borderRadius: 4 }}>
          <strong>錯誤：</strong> {error}
          <button
            onClick={loadData}
            style={{ marginLeft: 16, padding: '4px 12px', cursor: 'pointer' }}
          >
            重試
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
      <h2>學習儀表板</h2>

      {/* 統計卡片 */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 4, backgroundColor: '#e3f2fd' }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>總單字數</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1976d2' }}>{stats.total}</div>
          </div>
          <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 4, backgroundColor: '#fff3e0' }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>新單字</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#f57c00' }}>{stats.new}</div>
          </div>
          <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 4, backgroundColor: '#fff9c4' }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>學習中</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#f9a825' }}>{stats.learning}</div>
          </div>
          <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 4, backgroundColor: '#e8f5e9' }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>已複習</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#388e3c' }}>{stats.reviewed}</div>
          </div>
        </div>
      )}

      {/* 語別列表 */}
      <section style={{ marginBottom: 24, padding: 16, border: '1px solid #ddd', borderRadius: 4 }}>
        <h3>各語別單字數量</h3>
        {dialects.length === 0 ? (
          <div style={{ color: '#666', textAlign: 'center', padding: 20 }}>沒有語別資料</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
            {dialects.map((d) => (
              <div
                key={d.dialect_id}
                style={{
                  padding: 12,
                  border: '1px solid #e0e0e0',
                  borderRadius: 4,
                  backgroundColor: '#fafafa',
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>{d.name}</div>
                <div style={{ color: '#666' }}>{d.cards} 個單字</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 優先級佇列 */}
      <section style={{ padding: 16, border: '1px solid #ddd', borderRadius: 4 }}>
        <h3>學習優先級佇列（前 20 個）</h3>
        {priority.length === 0 ? (
          <div style={{ color: '#666', textAlign: 'center', padding: 20 }}>
            沒有待學習的單字
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: 12, textAlign: 'left' }}>優先級</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>單字</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>中文意思</th>
                  <th style={{ padding: 12, textAlign: 'center' }}>複習次數</th>
                  <th style={{ padding: 12, textAlign: 'center' }}>間隔天數</th>
                  <th style={{ padding: 12, textAlign: 'center' }}>下次複習</th>
                </tr>
              </thead>
              <tbody>
                {priority.slice(0, 20).map((item, index) => (
                  <tr
                    key={index}
                    style={{
                      borderBottom: '1px solid #eee',
                      backgroundColor: index % 2 === 0 ? 'white' : '#fafafa',
                    }}
                  >
                    <td style={{ padding: 12 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: 12,
                          backgroundColor: getPriorityColor(item.priority),
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}
                      >
                        P{item.priority} {getPriorityLabel(item.priority)}
                      </span>
                    </td>
                    <td style={{ padding: 12, fontWeight: 'bold' }}>{item.lemma}</td>
                    <td style={{ padding: 12, color: '#666' }}>{item.meaning || '（無）'}</td>
                    <td style={{ padding: 12, textAlign: 'center' }}>{item.repetitions}</td>
                    <td style={{ padding: 12, textAlign: 'center' }}>{item.interval_days}</td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      {formatDate(item.next_review_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {priority.length > 20 && (
          <div style={{ marginTop: 12, textAlign: 'center', color: '#666', fontSize: 14 }}>
            還有 {priority.length - 20} 個單字未顯示
          </div>
        )}
      </section>
    </main>
  );
}
