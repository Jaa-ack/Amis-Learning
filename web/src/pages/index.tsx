import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: 16 }}>
      <h1>Amis Learning</h1>
      <nav style={{ display: 'grid', gap: 12 }}>
        <Link href="/study">Study</Link>
        <Link href="/test">Test</Link>
        <Link href="/dictionary">Dictionary</Link>
        <Link href="/cms">CMS</Link>
        <Link href="/dashboard">Dashboard</Link>
      </nav>
    </main>
  );
}
