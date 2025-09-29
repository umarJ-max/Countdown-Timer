'use client'

import { useState, useEffect, useRef } from 'react'

export default function Timer() {
  const [minutes, setMinutes] = useState(5)
  const [seconds, setSeconds] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true)
    }
  }, [])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
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
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
    audio.play().catch(() => {})
    
    if (notificationsEnabled && Notification.permission === 'granted') {
      new Notification('⏰ Timer Complete!', {
        body: 'Your countdown timer has finished.'
      })
    }
  }

  const requestNotificationPermission = async () => {
    console.log('Button clicked!')
    if ('Notification' in window) {
      if (notificationsEnabled) {
        console.log('Disabling notifications')
        setNotificationsEnabled(false)
        return
      }
      console.log('Requesting permission...')
      const permission = await Notification.requestPermission()
      console.log('Permission result:', permission)
      setNotificationsEnabled(permission === 'granted')
    } else {
      console.log('Notifications not supported')
      alert('Notifications not supported in this browser')
    }
  }

  const startTimer = () => {
    if (timeLeft === 0) setTimeLeft(minutes * 60 + seconds)
    setIsRunning(true)
  }

  const pauseTimer = () => setIsRunning(false)

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(0)
  }

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = timeLeft > 0 ? ((minutes * 60 + seconds - timeLeft) / (minutes * 60 + seconds)) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 pb-20">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Countdown Timer</h1>
          <button
            onClick={requestNotificationPermission}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              notificationsEnabled 
                ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
            }`}
          >
            {notificationsEnabled ? '🔔 Notifications On' : '🔕 Enable Notifications'}
          </button>
        </div>
        
        {!isRunning && timeLeft === 0 && (
          <div className="space-y-6 mb-8">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-white/80 text-sm mb-2">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white text-center text-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div className="flex-1">
                <label className="block text-white/80 text-sm mb-2">Seconds</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white text-center text-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            </div>
          </div>
        )}

        <div className="relative mb-8">
          <div className="w-48 h-48 mx-auto relative">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                className="transition-all duration-1000 ease-linear"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-mono font-bold text-white">
                {timeLeft > 0 ? formatTime(timeLeft) : formatTime(minutes * 60 + seconds)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {!isRunning ? (
            <button
              onClick={startTimer}
              disabled={minutes === 0 && seconds === 0}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              ▶️ Start Timer
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              ⏸️ Pause Timer
            </button>
          )}
          <button
            onClick={resetTimer}
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            🔄 Reset Timer
          </button>
        </div>
      </div>
    </div>
  )
}