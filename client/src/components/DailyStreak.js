import React, { useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './DailyStreak.css';

const MILESTONES = [
  { day: 7, reward: '10% OFF', emoji: '🎁' },
  { day: 30, reward: '25% OFF', emoji: '👑' },
];

export default function DailyStreak() {
  const { user } = useAuth();
  const [streak, setStreak] = useState(null);
  const [checking, setChecking] = useState(false);
  const [earned, setEarned] = useState(null);

  useEffect(() => {
    if (!user) return;
    authAPI.getStreak().then(({ data }) => setStreak(data)).catch(() => {});
  }, [user]);

  if (!user || !streak) return null;

  const handleCheckIn = async () => {
    setChecking(true);
    try {
      const { data } = await authAPI.checkIn();
      setStreak(data);
      if (data.reward) {
        setEarned(data.reward);
        toast.success(`🎉 ${data.current}-day streak! You earned ${data.reward.discountValue}% OFF — code: ${data.reward.code}`, { autoClose: 8000 });
      } else {
        toast.success(`🔥 Day ${data.current} — streak going strong!`, { autoClose: 2500 });
      }
    } catch {
      toast.error('Check-in failed. Try again!');
    } finally {
      setChecking(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => toast.info('Coupon code copied! 📋', { autoClose: 1500 }));
  };

  const nextMilestone = MILESTONES.find(m => streak.current < m.day) || MILESTONES[MILESTONES.length - 1];
  const progress = Math.min(100, (streak.current / nextMilestone.day) * 100);
  const daysLeft = Math.max(0, nextMilestone.day - streak.current);

  // last 7 day-dots: filled based on streak position in current week
  const weekPos = streak.current === 0 ? 0 : ((streak.current - 1) % 7) + 1;

  return (
    <div className="streak-banner">
      <div className="container streak-inner">
        <div className="streak-row">
          {/* Streak count */}
          <div className="streak-count-wrap">
            <div className={`streak-fire ${streak.checkedToday ? 'checked-today' : ''}`}>🔥</div>
            <div>
              <div className="streak-count-text">
                {streak.current}-day streak
              </div>
              <div className="streak-longest-text">
                Longest: {streak.longest} days
                {daysLeft > 0 && <> · <strong className="streak-days-left">{daysLeft} days</strong> to {nextMilestone.reward} {nextMilestone.emoji}</>}
              </div>
            </div>
          </div>

          {/* Week dots */}
          <div className="streak-week-dots">
            {Array.from({ length: 7 }, (_, i) => {
              const filled = i < weekPos;
              return (
                <div key={i} className={`streak-dot ${filled ? 'filled' : ''}`}>
                  {filled ? '✓' : i + 1}
                </div>
              );
            })}
          </div>

          {/* Progress to milestone */}
          <div className="streak-progress-wrap">
            <div className="streak-progress-labels">
              <span>🎁 7d = 10% OFF</span>
              <span>👑 30d = 25% OFF</span>
            </div>
            <div className="streak-progress-track">
              <div className="streak-progress-fill" style={{ '--progress': `${progress}%` }} />
            </div>
          </div>

          {/* Check-in button */}
          <button
            onClick={handleCheckIn}
            disabled={streak.checkedToday || checking}
            className={`streak-checkin-btn ${streak.checkedToday ? 'checked' : ''}`}
          >
            {streak.checkedToday ? '✅ Checked in today' : checking ? '⏳ Checking in...' : '🔥 Check In Today'}
          </button>
        </div>

        {/* Earned reward banner */}
        {earned && (
          <div className="animate-fade streak-earned-banner">
            <span className="streak-earned-emoji">🎉</span>
            <span className="streak-earned-text">
              You earned {earned.discountValue}% OFF!
            </span>
            <button
              onClick={() => copyCode(earned.code)}
              className="streak-copy-btn"
              title="Click to copy"
            >
              {earned.code} 📋
            </button>
            <span className="streak-expiry-text">
              Use at checkout · expires {new Date(earned.expiresAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
