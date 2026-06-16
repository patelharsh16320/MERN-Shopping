import React from 'react';
import './Loader.css';

export default function Loader({ text = 'Loading...' }) {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <p className="loader-text">{text}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-card-img" />
      <div className="skeleton-card-body">
        <div className="skeleton skeleton-line-1" />
        <div className="skeleton skeleton-line-2" />
        <div className="skeleton skeleton-line-3" />
        <div className="skeleton skeleton-btn" />
      </div>
    </div>
  );
}
