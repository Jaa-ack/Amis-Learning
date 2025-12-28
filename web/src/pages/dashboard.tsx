import useSWR from 'swr';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';
const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function Dashboard() {
  const { data: dialects } = useSWR(`${API_BASE}/dashboard/dialects`, fetcher);
  const { data: priority } = useSWR(`${API_BASE}/dashboard/priority?userId=demo-user`, fetcher);
  return (
    <main style={{ padding: 16 }}>
      <h2>Dashboard</h2>
      <section>
        <h3>Dialects</h3>
        <ul>
          {dialects?.data?.map((d: any) => <li key={d.dialect_id}>{d.name}: {d.cards}</li>)}
        </ul>
      </section>
      <section>
        <h3>Priority Queue</h3>
        <ul>
          {priority?.data?.map((r: any, i: number) => <li key={i}>P{r.priority} — {r.flashcard_id}</li>)}
        </ul>
      </section>
    </main>
  );
}
