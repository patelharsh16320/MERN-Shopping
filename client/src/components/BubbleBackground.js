import React from 'react';

const bubbles = [
  { size: 55,  left: '4%',  delay: '0s',   duration: '13s', color: 'rgba(194,24,91,0.06)' },
  { size: 35,  left: '14%', delay: '2.5s', duration: '10s', color: 'rgba(240,98,146,0.06)' },
  { size: 80,  left: '24%', delay: '5s',   duration: '16s', color: 'rgba(194,24,91,0.04)' },
  { size: 28,  left: '36%', delay: '1.2s', duration: '9s',  color: 'rgba(255,128,171,0.07)' },
  { size: 65,  left: '50%', delay: '7s',   duration: '15s', color: 'rgba(194,24,91,0.05)' },
  { size: 45,  left: '62%', delay: '3.5s', duration: '12s', color: 'rgba(240,98,146,0.06)' },
  { size: 75,  left: '73%', delay: '6s',   duration: '14s', color: 'rgba(194,24,91,0.05)' },
  { size: 32,  left: '82%', delay: '0.8s', duration: '9s',  color: 'rgba(255,128,171,0.08)' },
  { size: 50,  left: '91%', delay: '8s',   duration: '17s', color: 'rgba(194,24,91,0.04)' },
  { size: 42,  left: '47%', delay: '10s',  duration: '13s', color: 'rgba(240,98,146,0.05)' },
];

export default function BubbleBackground() {
  return (
    <div className="bubbles-bg">
      {bubbles.map((b, i) => (
        <div
          key={i}
          className="bubble"
          style={{
            width: b.size,
            height: b.size,
            left: b.left,
            background: b.color,
            border: `1px solid rgba(194,24,91,0.08)`,
            animationDelay: b.delay,
            animationDuration: b.duration,
          }}
        />
      ))}
    </div>
  );
}
