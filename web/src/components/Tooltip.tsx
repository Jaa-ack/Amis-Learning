export function Tooltip({ text }: { text: string }) {
  return (
    <div style={{ position: 'absolute', background: '#fff', padding: 8, borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.15)' }}>
      {text}
    </div>
  );
}
