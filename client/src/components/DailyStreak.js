import React, { useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

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
    <div style={{ background: 'linear-gradient(135deg, #fff0f5 0%, #fce4ec 100%)', borderTop: '1px solid #f8bbd0', borderBottom: '1px solid #f8bbd0' }}>
      <div className="container" style={{ padding: '22px 24px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}>
          {/* Streak count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 40, animation: streak.checkedToday ? 'pulse 1.5s ease-in-out infinite' : 'none' }}>🔥</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 20, color: '#c2185b', lineHeight: 1 }}>
                {streak.current}-day streak
              </div>
              <div style={{ fontSize: 12, color: '#9e9e9e', marginTop: 4 }}>
                Longest: {streak.longest} days
                {daysLeft > 0 && <> · <strong style={{ color: '#c2185b' }}>{daysLeft} days</strong> to {nextMilestone.reward} {nextMilestone.emoji}</>}
              </div>
            </div>
          </div>

          {/* Week dots */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {Array.from({ length: 7 }, (_, i) => {
              const filled = i < weekPos;
              return (
                <div key={i} style={{
                  width: 30, height: 30, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                  background: filled ? 'linear-gradient(135deg, #c2185b, #e91e63)' : 'white',
                  color: filled ? 'white' : '#bdbdbd',
                  border: filled ? 'none' : '2px dashed #f8bbd0',
                  transition: 'all 0.3s',
                }}>
                  {filled ? '✓' : i + 1}
                </div>
              );
            })}
          </div>

          {/* Progress to milestone */}
          <div style={{ flex: '1 1 180px', minWidth: 160, maxWidth: 260 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#9e9e9e', marginBottom: 5 }}>
              <span>🎁 7d = 10% OFF</span>
              <span>👑 30d = 25% OFF</span>
            </div>
            <div style={{ background: 'white', borderRadius: 50, height: 8, overflow: 'hidden', border: '1px solid #f8bbd0' }}>
              <div style={{
                height: '100%', width: `${progress}%`, borderRadius: 50,
                background: 'linear-gradient(90deg, #c2185b, #f06292)',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>

          {/* Check-in button */}
          <button
            onClick={handleCheckIn}
            disabled={streak.checkedToday || checking}
            style={{
              padding: '12px 26px', borderRadius: 50, border: 'none',
              background: streak.checkedToday ? '#e8f5e9' : 'linear-gradient(135deg, #c2185b, #e91e63)',
              color: streak.checkedToday ? '#388e3c' : 'white',
              fontWeight: 700, fontSize: 14,
              cursor: streak.checkedToday ? 'default' : 'pointer',
              boxShadow: streak.checkedToday ? 'none' : '0 4px 16px rgba(194,24,91,0.3)',
              whiteSpace: 'nowrap',
            }}
          >
            {streak.checkedToday ? '✅ Checked in today' : checking ? '⏳ Checking in...' : '🔥 Check In Today'}
          </button>
        </div>

        {/* Earned reward banner */}
        {earned && (
          <div className="animate-fade" style={{
            marginTop: 16, padding: '14px 20px', borderRadius: 16,
            background: 'linear-gradient(135deg, #c2185b, #880e4f)',
            display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 26 }}>🎉</span>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>
              You earned {earned.discountValue}% OFF!
            </span>
            <button
              onClick={() => copyCode(earned.code)}
              style={{
                background: 'white', color: '#c2185b', border: 'none', borderRadius: 10,
                padding: '8px 18px', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                fontFamily: 'monospace', letterSpacing: 1,
              }}
              title="Click to copy"
            >
              {earned.code} 📋
            </button>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
              Use at checkout · expires {new Date(earned.expiresAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
