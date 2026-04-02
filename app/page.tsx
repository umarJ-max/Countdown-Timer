'use client'

import { useState, useEffect, useRef } from 'react'

type Tab = 'timer' | 'stopwatch'

interface Lap {
  id: number
  total: number
  split: number
}

export default function App() {
  const [tab, setTab] = useState<Tab>('timer')

  // Timer state
  const [minutes, setMinutes] = useState(0)
  const [seconds, setSeconds] = useState(30)
  const [timeLeft, setTimeLeft] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerComplete, setTimerComplete] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Alert state
  const [notifEnabled, setNotifEnabled] = useState(false)
  const [vibrateEnabled, setVibrateEnabled] = useState(false)
  const [tooltip, setTooltip] = useState('')
  const tooltipTimer = useRef<NodeJS.Timeout | null>(null)

  // Stopwatch state
  const [elapsed, setElapsed] = useState(0)
  const [swRunning, setSwRunning] = useState(false)
  const [laps, setLaps] = useState<Lap[]>([])
  const swRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const accumulatedRef = useRef<number>(0)

  // Detect capabilities
  const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator
  const canNotify = typeof window !== 'undefined' && 'Notification' in window
  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)

  useEffect(() => {
    if (canNotify && Notification.permission === 'granted') setNotifEnabled(true)
    // Auto-enable vibration on mobile if available
    if (canVibrate && !isIOS) setVibrateEnabled(true)
  }, [])

  // Timer interval
  useEffect(() => {
    if (timerRunning && timeLeft > 0) {
      setTimerComplete(false)
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTimerRunning(false)
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerRunning, timeLeft])

  // Stopwatch interval
  useEffect(() => {
    if (swRunning) {
      startTimeRef.current = Date.now()
      swRef.current = setInterval(() => {
        setElapsed(accumulatedRef.current + (Date.now() - startTimeRef.current))
      }, 10)
    } else {
      if (swRef.current) clearInterval(swRef.current)
    }
    return () => { if (swRef.current) clearInterval(swRef.current) }
  }, [swRunning])

  const showTooltip = (msg: string) => {
    setTooltip(msg)
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    tooltipTimer.current = setTimeout(() => setTooltip(''), 3000)
  }

  const handleTimerComplete = () => {
    setTimerComplete(true)
    // Audio
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
    audio.play().catch(() => {})
    // Vibrate (Android)
    if (vibrateEnabled && canVibrate) {
      navigator.vibrate([300, 100, 300, 100, 500])
    }
    // Desktop notification
    if (notifEnabled && canNotify && Notification.permission === 'granted') {
      new Notification('Timer Complete', { body: 'Your countdown has finished.' })
    }
  }

  const handleAlertButton = async () => {
    // iOS — explain limitation
    if (isIOS) {
      showTooltip('On iOS, add this page to Home Screen to enable alerts.')
      return
    }
    // If vibration is the active alert method — toggle it off directly
    if (canVibrate && vibrateEnabled && !notifEnabled) {
      setVibrateEnabled(false)
      showTooltip('Vibration alerts off.')
      return
    }
    // Android Chrome: canNotify is true but permission will be denied — use vibration only
    if (canVibrate && !vibrateEnabled && !notifEnabled) {
      setVibrateEnabled(true)
      navigator.vibrate(200)
      showTooltip('Vibration alerts on.')
      return
    }
    // Desktop — notifications path
    if (canNotify) {
      if (notifEnabled) {
        setNotifEnabled(false)
        setVibrateEnabled(false)
        return
      }
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        setNotifEnabled(true)
        if (canVibrate) setVibrateEnabled(true)
      } else {
        // Fallback to vibration if available
        if (canVibrate) {
          setVibrateEnabled(true)
          navigator.vibrate(200)
          showTooltip('Vibration alerts on.')
        } else {
          showTooltip('Permission denied. Check browser settings.')
        }
      }
    } else {
      showTooltip('Alerts not supported in this browser.')
    }
  }

  // Derived alert status
  const alertsOn = notifEnabled || vibrateEnabled
  const alertLabel = isIOS ? 'IOS LIMIT' : alertsOn ? 'ALERTS ON' : 'ALERTS OFF'

  // Timer helpers
  const startTimer = () => {
    if (timeLeft === 0) setTimeLeft(minutes * 60 + seconds)
    setTimerComplete(false)
    setTimerRunning(true)
  }
  const pauseTimer = () => setTimerRunning(false)
  const resetTimer = () => { setTimerRunning(false); setTimeLeft(0); setTimerComplete(false) }

  // Stopwatch helpers
  const startSw = () => setSwRunning(true)
  const pauseSw = () => {
    accumulatedRef.current += Date.now() - startTimeRef.current
    setSwRunning(false)
  }
  const resetSw = () => {
    setSwRunning(false)
    accumulatedRef.current = 0
    setElapsed(0)
    setLaps([])
  }
  const recordLap = () => {
    const prevTotal = laps.length > 0 ? laps[laps.length - 1].total : 0
    setLaps(prev => [...prev, { id: prev.length + 1, total: elapsed, split: elapsed - prevTotal }])
  }

  // Format helpers
  const formatTimer = (totalSeconds: number) => ({
    mins: Math.floor(totalSeconds / 60).toString().padStart(2, '0'),
    secs: (totalSeconds % 60).toString().padStart(2, '0'),
  })
  const formatSw = (ms: number) => ({
    mins: Math.floor(ms / 60000).toString().padStart(2, '0'),
    secs: Math.floor((ms % 60000) / 1000).toString().padStart(2, '0'),
    centis: Math.floor((ms % 1000) / 10).toString().padStart(2, '0'),
  })
  const formatSwShort = (ms: number) => {
    const t = formatSw(ms)
    return `${t.mins}:${t.secs}.${t.centis}`
  }

  const total = minutes * 60 + seconds
  const progress = timeLeft > 0 && total > 0 ? ((total - timeLeft) / total) * 100 : 0
  const displayTime = timeLeft > 0 ? formatTimer(timeLeft) : formatTimer(total)
  const circumference = 2 * Math.PI * 54
  const dashOffset = circumference * (1 - progress / 100)
  const timerIdle = !timerRunning && timeLeft === 0
  const sw = formatSw(elapsed)
  const fastestLap = laps.length > 1 ? Math.min(...laps.map(l => l.split)) : null
  const slowestLap = laps.length > 1 ? Math.max(...laps.map(l => l.split)) : null

  return (
    <div className="root">
      <div className="card">

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${tab === 'timer' ? 'tab-active' : ''}`} onClick={() => setTab('timer')}>TIMER</button>
          <button className={`tab ${tab === 'stopwatch' ? 'tab-active' : ''}`} onClick={() => setTab('stopwatch')}>STOPWATCH</button>
          <div className={`tab-indicator ${tab === 'stopwatch' ? 'tab-indicator-right' : ''}`} />
        </div>

        {/* TIMER PANEL */}
        {tab === 'timer' && (
          <>
            <div className="panel-header">
              <span className="panel-label">COUNTDOWN</span>
              <div className="alert-wrap">
                <button
                  onClick={handleAlertButton}
                  className={`notif-btn ${alertsOn ? 'notif-on' : ''} ${isIOS ? 'notif-ios' : ''}`}
                >
                  <span className="notif-dot" />
                  {alertLabel}
                </button>
                {tooltip && <div className="tooltip">{tooltip}</div>}
              </div>
            </div>

            <div className="ring-container">
              <svg className="ring-svg" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" className="ring-track" />
                <circle cx="60" cy="60" r="54"
                  className={`ring-progress ${timerComplete ? 'ring-complete' : ''}`}
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                />
                {Array.from({ length: 60 }).map((_, i) => {
                  const angle = (i / 60) * 360 - 90
                  const rad = (angle * Math.PI) / 180
                  const isMajor = i % 5 === 0
                  const r1 = isMajor ? 46 : 48
                  return (
                    <line key={i}
                      x1={60 + r1 * Math.cos(rad)} y1={60 + r1 * Math.sin(rad)}
                      x2={60 + 51 * Math.cos(rad)} y2={60 + 51 * Math.sin(rad)}
                      className={isMajor ? 'tick-major' : 'tick-minor'}
                    />
                  )
                })}
              </svg>
              <div className={`time-display ${timerComplete ? 'time-complete' : ''} ${timerRunning ? 'time-running' : ''}`}>
                <span className="time-digits">{displayTime.mins}</span>
                <span className="time-colon">:</span>
                <span className="time-digits">{displayTime.secs}</span>
              </div>
              {timerComplete && <div className="done-label">DONE</div>}
            </div>

            {timerIdle && (
              <div className="inputs-row">
                <div className="input-group">
                  <input type="number" min="0" max="99" value={minutes}
                    onChange={e => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="time-input" />
                  <label className="input-label">MINUTES</label>
                </div>
                <div className="input-divider">:</div>
                <div className="input-group">
                  <input type="number" min="0" max="59" value={seconds}
                    onChange={e => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="time-input" />
                  <label className="input-label">SECONDS</label>
                </div>
              </div>
            )}

            <div className="controls-row">
              {!timerRunning ? (
                <button onClick={startTimer} disabled={minutes === 0 && seconds === 0} className="btn btn-start">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><polygon points="2,1 11,6 2,11" /></svg>
                  {timeLeft > 0 ? 'RESUME' : 'START'}
                </button>
              ) : (
                <button onClick={pauseTimer} className="btn btn-pause">
                  <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor"><rect x="0" y="0" width="3.5" height="12" /><rect x="6.5" y="0" width="3.5" height="12" /></svg>
                  PAUSE
                </button>
              )}
              <button onClick={resetTimer} className="btn btn-reset">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 6A4 4 0 1 1 3.5 9.5" /><polyline points="2,3 2,6 5,6" /></svg>
                RESET
              </button>
            </div>
          </>
        )}

        {/* STOPWATCH PANEL */}
        {tab === 'stopwatch' && (
          <>
            <div className="panel-header">
              <span className="panel-label">STOPWATCH</span>
              <span className="lap-count">{laps.length > 0 ? `${laps.length} LAP${laps.length > 1 ? 'S' : ''}` : '—'}</span>
            </div>

            <div className="sw-display-wrap">
              <div className={`sw-display ${swRunning ? 'sw-running' : ''}`}>
                <div className="sw-main">
                  <span className="sw-digits">{sw.mins}</span>
                  <span className="sw-colon">:</span>
                  <span className="sw-digits">{sw.secs}</span>
                  <span className="sw-centis">.{sw.centis}</span>
                </div>
              </div>
              {swRunning && <div className="sw-pulse-ring" />}
            </div>

            <div className="controls-row">
              {!swRunning ? (
                <button onClick={startSw} className="btn btn-start">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><polygon points="2,1 11,6 2,11" /></svg>
                  {elapsed > 0 ? 'RESUME' : 'START'}
                </button>
              ) : (
                <button onClick={pauseSw} className="btn btn-pause">
                  <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor"><rect x="0" y="0" width="3.5" height="12" /><rect x="6.5" y="0" width="3.5" height="12" /></svg>
                  PAUSE
                </button>
              )}
              <button onClick={recordLap} disabled={!swRunning} className="btn btn-lap">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="6" r="4" /><line x1="6" y1="2" x2="6" y2="1" /></svg>
                LAP
              </button>
              <button onClick={resetSw} className="btn btn-reset">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 6A4 4 0 1 1 3.5 9.5" /><polyline points="2,3 2,6 5,6" /></svg>
                RESET
              </button>
            </div>

            {laps.length > 0 && (
              <div className="lap-list">
                <div className="lap-list-header">
                  <span>#</span><span>SPLIT</span><span>TOTAL</span>
                </div>
                <div className="lap-rows">
                  {[...laps].reverse().map(lap => {
                    const isFastest = fastestLap !== null && lap.split === fastestLap
                    const isSlowest = slowestLap !== null && lap.split === slowestLap
                    return (
                      <div key={lap.id} className={`lap-row ${isFastest ? 'lap-fast' : ''} ${isSlowest ? 'lap-slow' : ''}`}>
                        <span className="lap-num">{lap.id.toString().padStart(2, '0')}</span>
                        <span className="lap-split">{formatSwShort(lap.split)}</span>
                        <span className="lap-total">{formatSwShort(lap.total)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Barlow:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .root {
          min-height: 100vh; background: #0a0a0a;
          display: flex; align-items: center; justify-content: center;
          padding: 24px; padding-bottom: 72px;
          font-family: 'Barlow', sans-serif;
          background-image:
            radial-gradient(circle at 20% 20%, rgba(255,160,60,0.04) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255,100,30,0.03) 0%, transparent 50%);
        }
        .card {
          width: 100%; max-width: 380px; background: #111;
          border: 1px solid #222; border-radius: 4px; padding: 0 0 28px;
          display: flex; flex-direction: column;
          box-shadow: 0 0 0 1px #1a1a1a, 0 24px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.04);
          overflow: hidden;
        }

        .tabs {
          display: grid; grid-template-columns: 1fr 1fr;
          position: relative; border-bottom: 1px solid #1e1e1e;
        }
        .tab {
          background: none; border: none; padding: 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 500; letter-spacing: 0.2em;
          color: #444; cursor: pointer; transition: color 0.2s; position: relative; z-index: 1;
        }
        .tab:hover { color: #666; }
        .tab-active { color: #f59e0b; }
        .tab-indicator {
          position: absolute; bottom: 0; left: 0; width: 50%; height: 1px;
          background: #f59e0b; transition: left 0.25s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 0 8px rgba(245,158,11,0.5);
        }
        .tab-indicator-right { left: 50%; }

        .panel-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 28px 0;
        }
        .panel-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; font-weight: 500; letter-spacing: 0.25em; color: #444;
        }
        .lap-count {
          font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.2em; color: #555;
        }

        /* Alert button */
        .alert-wrap { position: relative; }
        .notif-btn {
          display: flex; align-items: center; gap: 6px;
          background: none; border: 1px solid #222; border-radius: 2px;
          padding: 5px 10px; cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; letter-spacing: 0.15em; color: #444;
          transition: border-color 0.2s, color 0.2s;
        }
        .notif-btn:hover { border-color: #333; color: #666; }
        .notif-btn.notif-on { border-color: #f59e0b44; color: #f59e0b; }
        .notif-btn.notif-ios { border-color: #374151; color: #4b5563; cursor: default; }
        .notif-dot { width: 5px; height: 5px; border-radius: 50%; background: #333; transition: background 0.2s; }
        .notif-btn.notif-on .notif-dot { background: #f59e0b; box-shadow: 0 0 6px #f59e0b88; }
        .tooltip {
          position: absolute; right: 0; top: calc(100% + 8px);
          background: #1c1c1c; border: 1px solid #2a2a2a; border-radius: 2px;
          padding: 7px 10px; white-space: nowrap;
          font-family: 'JetBrains Mono', monospace; font-size: 9px;
          color: #aaa; letter-spacing: 0.05em; z-index: 10;
          animation: fade-in 0.15s ease;
        }
        .tooltip::before {
          content: ''; position: absolute; top: -5px; right: 14px;
          width: 8px; height: 8px; background: #1c1c1c;
          border-left: 1px solid #2a2a2a; border-top: 1px solid #2a2a2a;
          transform: rotate(45deg);
        }
        @keyframes fade-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

        /* Ring */
        .ring-container { position: relative; width: 200px; height: 200px; margin: 20px auto 0; }
        .ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
        .ring-track { fill: none; stroke: #1c1c1c; stroke-width: 3; }
        .ring-progress {
          fill: none; stroke: #f59e0b; stroke-width: 3; stroke-linecap: butt;
          transition: stroke-dashoffset 1s linear, stroke 0.4s;
          filter: drop-shadow(0 0 6px rgba(245,158,11,0.5));
        }
        .ring-progress.ring-complete { stroke: #22c55e; filter: drop-shadow(0 0 8px rgba(34,197,94,0.6)); }
        .tick-major { stroke: #2a2a2a; stroke-width: 1.5; stroke-linecap: butt; }
        .tick-minor { stroke: #1e1e1e; stroke-width: 0.8; stroke-linecap: butt; }
        .time-display {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center; gap: 2px;
        }
        .time-digits {
          font-family: 'JetBrains Mono', monospace; font-size: 42px; font-weight: 300;
          color: #e8e8e8; line-height: 1; transition: color 0.4s; letter-spacing: -0.02em;
        }
        .time-colon {
          font-family: 'JetBrains Mono', monospace; font-size: 36px; font-weight: 300;
          color: #555; line-height: 1; margin-bottom: 4px;
        }
        .time-running .time-digits { color: #fde68a; }
        .time-complete .time-digits { color: #86efac; }
        .done-label {
          position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%);
          font-family: 'JetBrains Mono', monospace; font-size: 9px;
          letter-spacing: 0.3em; color: #22c55e;
          animation: pulse-label 1s ease-in-out infinite;
        }
        @keyframes pulse-label { 0%,100%{opacity:1} 50%{opacity:0.4} }

        /* Inputs */
        .inputs-row {
          display: flex; align-items: flex-end; justify-content: center; gap: 12px;
          padding: 20px 28px 0;
        }
        .input-group { display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .input-label {
          font-family: 'JetBrains Mono', monospace; font-size: 9px;
          letter-spacing: 0.2em; color: #444; font-weight: 500;
        }
        .time-input {
          width: 80px; background: #0e0e0e; border: 1px solid #222; border-radius: 2px;
          padding: 10px 8px; color: #ddd;
          font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 300;
          text-align: center; outline: none; transition: border-color 0.2s, box-shadow 0.2s;
          -moz-appearance: textfield;
        }
        .time-input::-webkit-inner-spin-button, .time-input::-webkit-outer-spin-button { -webkit-appearance: none; }
        .time-input:focus { border-color: #f59e0b55; box-shadow: 0 0 0 3px rgba(245,158,11,0.07); }
        .input-divider {
          font-family: 'JetBrains Mono', monospace; font-size: 24px; color: #333;
          padding-bottom: 22px; font-weight: 300;
        }

        /* Stopwatch */
        .sw-display-wrap { position: relative; margin: 24px 0 0; width: 100%; }
        .sw-display {
          display: flex; align-items: baseline; justify-content: center;
          padding: 28px 32px; background: #0d0d0d;
          border-top: 1px solid #1c1c1c; border-bottom: 1px solid #1c1c1c;
          transition: border-color 0.3s;
        }
        .sw-display.sw-running { border-color: #f59e0b22; }
        .sw-main { display: flex; align-items: baseline; gap: 1px; }
        .sw-digits {
          font-family: 'JetBrains Mono', monospace; font-size: 52px; font-weight: 300;
          color: #e8e8e8; line-height: 1; letter-spacing: -0.03em; transition: color 0.3s;
        }
        .sw-running .sw-digits { color: #fde68a; }
        .sw-colon {
          font-family: 'JetBrains Mono', monospace; font-size: 44px; font-weight: 300;
          color: #555; line-height: 1; margin: 0 1px 3px;
        }
        .sw-centis {
          font-family: 'JetBrains Mono', monospace; font-size: 28px; font-weight: 300;
          color: #555; line-height: 1; margin-bottom: 2px; margin-left: 3px; transition: color 0.3s;
        }
        .sw-running .sw-centis { color: #f59e0b88; }
        .sw-pulse-ring {
          position: absolute; inset: 0; border: 1px solid #f59e0b15;
          pointer-events: none; animation: sw-pulse 2s ease-in-out infinite;
        }
        @keyframes sw-pulse { 0%,100%{opacity:1} 50%{opacity:0.2} }

        /* Controls */
        .controls-row { display: flex; gap: 10px; padding: 20px 28px 0; }
        .btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 13px 12px; border: 1px solid transparent; border-radius: 2px; cursor: pointer;
          font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 500;
          letter-spacing: 0.12em; transition: all 0.15s;
        }
        .btn:active { transform: scale(0.98); }
        .btn:disabled { opacity: 0.25; cursor: not-allowed; }
        .btn-start { background: #f59e0b11; border-color: #f59e0b44; color: #f59e0b; }
        .btn-start:hover:not(:disabled) { background: #f59e0b22; border-color: #f59e0b88; box-shadow: 0 0 20px rgba(245,158,11,0.15); }
        .btn-pause { background: #3b82f611; border-color: #3b82f644; color: #60a5fa; }
        .btn-pause:hover { background: #3b82f622; border-color: #3b82f688; }
        .btn-lap { background: #a855f711; border-color: #a855f744; color: #c084fc; }
        .btn-lap:hover:not(:disabled) { background: #a855f722; border-color: #a855f788; }
        .btn-reset { background: transparent; border-color: #222; color: #555; flex: 0 0 auto; padding: 13px 16px; }
        .btn-reset:hover { border-color: #333; color: #888; }

        /* Laps */
        .lap-list { margin: 16px 28px 0; border: 1px solid #1c1c1c; border-radius: 2px; overflow: hidden; }
        .lap-list-header {
          display: grid; grid-template-columns: 32px 1fr 1fr; padding: 8px 14px;
          background: #0d0d0d; border-bottom: 1px solid #1c1c1c;
          font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.2em; color: #444;
        }
        .lap-rows { max-height: 180px; overflow-y: auto; }
        .lap-rows::-webkit-scrollbar { width: 3px; }
        .lap-rows::-webkit-scrollbar-track { background: #111; }
        .lap-rows::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
        .lap-row {
          display: grid; grid-template-columns: 32px 1fr 1fr;
          padding: 9px 14px; border-bottom: 1px solid #161616; transition: background 0.15s;
        }
        .lap-row:last-child { border-bottom: none; }
        .lap-row:hover { background: #141414; }
        .lap-num { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #444; }
        .lap-split { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #bbb; }
        .lap-total { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #555; font-weight: 300; }
        .lap-fast .lap-split { color: #22c55e; }
        .lap-slow .lap-split { color: #ef4444; }
      `}</style>
    </div>
  )
}
