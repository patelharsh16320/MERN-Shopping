import React, { useState, useEffect } from 'react';

export default function ScrollButtons() {
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setShowTop(scrolled > 300);
      setShowBottom(total > 300 && scrolled < total - 50);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const btnStyle = {
    width: 42, height: 42, borderRadius: '50%', border: 'none',
    background: 'linear-gradient(135deg, #c2185b, #e91e63)',
    color: 'white', fontSize: 18, fontWeight: 700,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(194,24,91,0.35)',
    transition: 'all 0.25s ease',
  };

  return (
    <div style={{
      position: 'fixed', right: 20, bottom: 28,
      display: 'flex', flexDirection: 'column', gap: 10, zIndex: 9999,
    }}>
      {showTop && (
        <button
          style={btnStyle}
          title="Scroll to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          ↑
        </button>
      )}
      {showBottom && (
        <button
          style={btnStyle}
          title="Scroll to bottom"
          onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })}
        >
          ↓
        </button>
      )}
    </div>
  );
}
