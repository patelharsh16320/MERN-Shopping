import React from 'react';
import './BubbleBackground.css';

const BUBBLE_COUNT = 10;

export default function BubbleBackground() {
  return (
    <div className="bubbles-bg">
      {Array.from({ length: BUBBLE_COUNT }, (_, i) => (
        <div key={i} className="bubble" />
      ))}
    </div>
  );
}
