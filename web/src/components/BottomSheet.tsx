import { useEffect } from 'react';

export function BottomSheet({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // noop placeholder for iOS keyboard-aware
  }, []);
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
      borderTopLeftRadius: 16, borderTopRightRadius: 16,
      boxShadow: '0 -10px 30px rgba(0,0,0,0.1)', padding: 16
    }}>
      {children}
    </div>
  );
}
