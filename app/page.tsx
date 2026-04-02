'use client'

import { useState, useEffect, useRef } from 'react'

export default function Timer() {
  const [minutes, setMinutes] = useState(5)
  const [seconds, setSeconds] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true)
    }
  }, [])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      setIsComplete(false)
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false)
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, timeLeft])

  const handleTimerComplete = () => {
    setIsComplete(true)
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
    audio.play().catch(() => {})
    if (notificationsEnabled && Notification.permission === 'granted') {
      new Notification('Timer Complete', { body: 'Your countdown has finished.' })
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      if (notificationsEnabled) {
        setNotificationsEnabled(false)
        return
      }
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === 'granted')
    } else {
      alert('Notifications not supported in this browser')
    }
  }

  const startTimer = () => {
    if (timeLeft === 0) setTimeLeft(minutes * 60 + seconds)
    setIsComplete(false)
    setIsRunning(true)
  }

  const pauseTimer = () => setIsRunning(false)

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(0)
    setIsComplete(false)
  }

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return { mins: mins.toString().padStart(2, '0'), secs: secs.toString().padStart(2, '0') }
  }

  const total = minutes * 60 + seconds
  const progress = timeLeft > 0 && total > 0 ? ((total - timeLeft) / total) * 100 : 0
  const displayTime = timeLeft > 0 ? formatTime(timeLeft) : formatTime(total)

  const circumference = 2 * Math.PI * 54
  const dashOffset = circumference * (1 - progress / 100)

  const isIdle = !isRunning && timeLeft === 0

  return (
    <div className="timer-root">
      <div className="timer-card">

        {/* Header */}
        <div className="timer-header">
          <span className="timer-label-top">COUNTDOWN</span>
          <button
            onClick={requestNotificationPermission}
            className={`notif-btn ${notificationsEnabled ? 'notif-on' : ''}`}
            title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
          >
            <span className="notif-dot" />
            {notificationsEnabled ? 'ALERTS ON' : 'ALERTS OFF'}
          </button>
        </div>

        {/* Ring Display */}
        <div className="ring-container">
          <svg className="ring-svg" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" className="ring-track" />
            <circle
              cx="60" cy="60" r="54"
              className={`ring-progress ${isComplete ? 'ring-complete' : ''}`}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
            {/* Tick marks */}
            {Array.from({ length: 60 }).map((_, i) => {
              const angle = (i / 60) * 360 - 90
              const rad = (angle * Math.PI) / 180
              const isMajor = i % 5 === 0
              const r1 = isMajor ? 46 : 48
              const r2 = 51
              return (
                <line
                  key={i}
                  x1={60 + r1 * Math.cos(rad)}
                  y1={60 + r1 * Math.sin(rad)}
                  x2={60 + r2 * Math.cos(rad)}
                  y2={60 + r2 * Math.sin(rad)}
                  className={`tick ${isMajor ? 'tick-major' : 'tick-minor'}`}
                />
              )
            })}
          </svg>

          <div className={`time-display ${isComplete ? 'time-complete' : ''} ${isRunning ? 'time-running' : ''}`}>
            <span className="time-digits">{displayTime.mins}</span>
            <span className="time-colon">:</span>
            <span className="time-digits">{displayTime.secs}</span>
          </div>

          {isComplete && <div className="complete-label">DONE</div>}
        </div>

        {/* Inputs — only when idle */}
        {isIdle && (
          <div className="inputs-row">
            <div className="input-group">
              <label className="input-label">MIN</label>
              <input
                type="number"
                min="0"
                max="99"
                value={minutes}
                onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                className="time-input"
              />
            </div>
            <div className="input-divider">:</div>
            <div className="input-group">
              <label className="input-label">SEC</label>
              <input
                type="number"
                min="0"
                max="59"
                value={seconds}
                onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                className="time-input"
              />
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="controls-row">
          {!isRunning ? (
            <button
              onClick={startTimer}
              disabled={minutes === 0 && seconds === 0}
              className="btn btn-start"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <polygon points="2,1 13,7 2,13" />
              </svg>
              {timeLeft > 0 ? 'RESUME' : 'START'}
            </button>
          ) : (
            <button onClick={pauseTimer} className="btn btn-pause">
              <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
                <rect x="0" y="0" width="4" height="14" />
                <rect x="8" y="0" width="4" height="14" />
              </svg>
              PAUSE
            </button>
          )}
          <button onClick={resetTimer} className="btn btn-reset">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 6.5A4.5 4.5 0 1 1 4 10.5" />
              <polyline points="2,3.5 2,6.5 5,6.5" />
            </svg>
            RESET
          </button>
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Barlow:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .timer-root {
          min-height: 100vh;
          background: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          padding-bottom: 72px;
          font-family: 'Barlow', sans-serif;
          background-image:
            radial-gradient(circle at 20% 20%, rgba(255,160,60,0.04) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255,100,30,0.03) 0%, transparent 50%);
        }

        .timer-card {
          width: 100%;
          max-width: 380px;
          background: #111;
          border: 1px solid #222;
          border-radius: 4px;
          padding: 32px 28px 28px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          box-shadow:
            0 0 0 1px #1a1a1a,
            0 24px 64px rgba(0,0,0,0.8),
            inset 0 1px 0 rgba(255,255,255,0.04);
        }

        /* Header */
        .timer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .timer-label-top {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.25em;
          color: #444;
        }
        .notif-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: 1px solid #222;
          border-radius: 2px;
          padding: 5px 10px;
          cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.15em;
          color: #444;
          transition: border-color 0.2s, color 0.2s;
        }
        .notif-btn:hover { border-color: #333; color: #666; }
        .notif-btn.notif-on { border-color: #f59e0b44; color: #f59e0b; }
        .notif-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #333;
          transition: background 0.2s;
        }
        .notif-btn.notif-on .notif-dot { background: #f59e0b; box-shadow: 0 0 6px #f59e0b88; }

        /* Ring */
        .ring-container {
          position: relative;
          width: 200px;
          height: 200px;
          margin: 0 auto;
        }
        .ring-svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }
        .ring-track {
          fill: none;
          stroke: #1c1c1c;
          stroke-width: 3;
        }
        .ring-progress {
          fill: none;
          stroke: #f59e0b;
          stroke-width: 3;
          stroke-linecap: butt;
          transition: stroke-dashoffset 1s linear, stroke 0.4s;
          filter: drop-shadow(0 0 6px rgba(245,158,11,0.5));
        }
        .ring-progress.ring-complete {
          stroke: #22c55e;
          filter: drop-shadow(0 0 8px rgba(34,197,94,0.6));
        }
        .tick { stroke-linecap: butt; }
        .tick-major { stroke: #2a2a2a; stroke-width: 1.5; }
        .tick-minor { stroke: #1e1e1e; stroke-width: 0.8; }

        .time-display {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
        }
        .time-digits {
          font-family: 'JetBrains Mono', monospace;
          font-size: 42px;
          font-weight: 300;
          color: #e8e8e8;
          line-height: 1;
          transition: color 0.4s;
          letter-spacing: -0.02em;
        }
        .time-colon {
          font-family: 'JetBrains Mono', monospace;
          font-size: 36px;
          font-weight: 300;
          color: #555;
          line-height: 1;
          margin-bottom: 4px;
        }
        .time-running .time-digits { color: #fde68a; }
        .time-complete .time-digits { color: #86efac; }

        .complete-label {
          position: absolute;
          bottom: 18px;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.3em;
          color: #22c55e;
          animation: pulse-label 1s ease-in-out infinite;
        }
        @keyframes pulse-label {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* Inputs */
        .inputs-row {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 12px;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .input-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.2em;
          color: #444;
          font-weight: 500;
        }
        .time-input {
          width: 80px;
          background: #0e0e0e;
          border: 1px solid #222;
          border-radius: 2px;
          padding: 10px 8px;
          color: #ddd;
          font-family: 'JetBrains Mono', monospace;
          font-size: 22px;
          font-weight: 300;
          text-align: center;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          -moz-appearance: textfield;
        }
        .time-input::-webkit-inner-spin-button,
        .time-input::-webkit-outer-spin-button { -webkit-appearance: none; }
        .time-input:focus {
          border-color: #f59e0b55;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.07);
        }
        .input-divider {
          font-family: 'JetBrains Mono', monospace;
          font-size: 24px;
          color: #333;
          padding-bottom: 6px;
          font-weight: 300;
        }

        /* Controls */
        .controls-row {
          display: flex;
          gap: 10px;
        }
        .btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px 16px;
          border: 1px solid transparent;
          border-radius: 2px;
          cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          transition: all 0.15s;
        }
        .btn:active { transform: scale(0.98); }
        .btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .btn-start {
          background: #f59e0b11;
          border-color: #f59e0b44;
          color: #f59e0b;
        }
        .btn-start:hover:not(:disabled) {
          background: #f59e0b22;
          border-color: #f59e0b88;
          box-shadow: 0 0 20px rgba(245,158,11,0.15);
        }

        .btn-pause {
          background: #3b82f611;
          border-color: #3b82f644;
          color: #60a5fa;
        }
        .btn-pause:hover {
          background: #3b82f622;
          border-color: #3b82f688;
        }

        .btn-reset {
          background: transparent;
          border-color: #222;
          color: #555;
          flex: 0 0 auto;
          padding: 13px 18px;
        }
        .btn-reset:hover {
          border-color: #333;
          color: #888;
        }
      `}</style>
    </div>
  )
}
