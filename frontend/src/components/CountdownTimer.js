import React, { useState, useEffect } from 'react';
import './CountdownTimer.css';

const getTimeLeft = (endDate) => {
  const total = new Date(endDate) - new Date();
  if (total <= 0) return null;

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { total, days, hours, minutes, seconds };
};

export default function CountdownTimer({ endDate, compact = false }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(endDate));

  useEffect(() => {
    setTimeLeft(getTimeLeft(endDate));
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(endDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (!timeLeft) {
    return (
      <div className={`countdown ${compact ? 'countdown--compact' : ''} countdown--expired`}>
        <span>⚠️ Deadline passed</span>
      </div>
    );
  }

  if (compact) {
    const { days, hours, minutes, seconds } = timeLeft;
    const isUrgent = days === 0 && hours < 6;

    return (
      <div className={`countdown countdown--compact ${isUrgent ? 'countdown--urgent' : ''}`}>
        <span className="countdown__compact-icon">⏱</span>
        <span className="countdown__compact-text">
          {days > 0 ? `${days}d ` : ''}
          {hours > 0 ? `${hours}h ` : ''}
          {days === 0 ? `${minutes}m ${seconds}s` : `${hours}h`} remaining
        </span>
      </div>
    );
  }

  const { days, hours, minutes, seconds } = timeLeft;
  const isUrgent = days === 0 && hours < 6;

  const units = [
    { label: 'Days', value: days },
    { label: 'Hours', value: hours },
    { label: 'Minutes', value: minutes },
    { label: 'Seconds', value: seconds },
  ];

  return (
    <div className={`countdown ${isUrgent ? 'countdown--urgent' : ''}`}>
      <div className="countdown__header">
        <span className="countdown__icon">⏱</span>
        <span className="countdown__label">Time Remaining</span>
      </div>
      <div className="countdown__units">
        {units.map(({ label, value }) => (
          <div key={label} className="countdown__unit">
            <div className="countdown__digit">
              {String(value).padStart(2, '0')}
            </div>
            <div className="countdown__unit-label">{label}</div>
          </div>
        ))}
      </div>
      {isUrgent && (
        <div className="countdown__urgent-msg">🔥 Due very soon!</div>
      )}
    </div>
  );
}
