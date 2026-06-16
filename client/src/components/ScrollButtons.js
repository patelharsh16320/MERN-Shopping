import React, { useState, useEffect } from 'react';
import './ScrollButtons.css';

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

  return (
    <div className="scroll-btn-wrap">
      {showTop && (
        <button
          className="scroll-btn"
          title="Scroll to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          ↑
        </button>
      )}
      {showBottom && (
        <button
          className="scroll-btn"
          title="Scroll to bottom"
          onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })}
        >
          ↓
        </button>
      )}
    </div>
  );
}
