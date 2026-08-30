import React from 'react';

/**
 * Quả Cầu Visualizer HUD 120 FPS cho PC Flex (Kegel & Pelvic Floor Trainer)
 * Hỗ trợ co siết (Squeeze), thả lỏng (Relax), Kegel ngược (Reverse Kegel) và nghỉ chuyển bài (Transition Rest)
 */
const OrbVisualizer = ({
  actionState = 'idle', // 'idle' | 'squeezing' | 'relaxing' | 'reverse' | 'transition' | 'breathing'
  timeRemaining = 0,
  stageDuration = 1,
  currentRep = 0,
  totalReps = 20,
  stageLabel = '',
  stageIndex = 0,
  totalStages = 1,
  isActive = false
}) => {
  const size = 260;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const progress = stageDuration > 0 ? ((stageDuration - timeRemaining) / stageDuration) * 100 : 0;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Cấu hình màu sắc, gradient và hiệu ứng theo trạng thái
  let stateConfig = {
    title: 'SẴN SÀNG',
    icon: '⚡',
    gradientId: 'idleGradient',
    orbBg: 'radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(6, 182, 212, 0.15) 60%, transparent 100%)',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    scaleClass: 'scale-100'
  };

  if (actionState === 'squeezing') {
    stateConfig = {
      title: 'SIẾT CƠ PC',
      icon: '⚡',
      gradientId: 'squeezeGradient',
      orbBg: 'radial-gradient(circle, rgba(16, 185, 129, 0.6) 0%, rgba(52, 211, 153, 0.3) 50%, transparent 85%)',
      glowColor: 'rgba(16, 185, 129, 0.6)',
      badgeClass: 'bg-emerald-500/20 text-emerald-600 dark:text-neon border-emerald-500/50 shadow-neon',
      scaleClass: 'scale-90 animate-pulse-fast'
    };
  } else if (actionState === 'relaxing') {
    stateConfig = {
      title: 'THẢ LỎNG',
      icon: '❄️',
      gradientId: 'relaxGradient',
      orbBg: 'radial-gradient(circle, rgba(6, 182, 212, 0.5) 0%, rgba(59, 130, 246, 0.25) 60%, transparent 85%)',
      glowColor: 'rgba(6, 182, 212, 0.5)',
      badgeClass: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-neon border-cyan-500/50 shadow-cyan-glow',
      scaleClass: 'scale-105'
    };
  } else if (actionState === 'reverse') {
    stateConfig = {
      title: 'KEGEL NGƯỢC',
      icon: '🌊',
      gradientId: 'reverseGradient',
      orbBg: 'radial-gradient(circle, rgba(139, 92, 246, 0.6) 0%, rgba(245, 158, 11, 0.3) 60%, transparent 90%)',
      glowColor: 'rgba(139, 92, 246, 0.6)',
      badgeClass: 'bg-violet-500/20 text-violet-600 dark:text-violet-neon border-violet-500/50 shadow-violet-glow',
      scaleClass: 'scale-110'
    };
  } else if (actionState === 'transition') {
    stateConfig = {
      title: 'NGHỈ CHUYỂN BÀI',
      icon: '⏳',
      gradientId: 'transitionGradient',
      orbBg: 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, rgba(59, 130, 246, 0.2) 60%, transparent 85%)',
      glowColor: 'rgba(245, 158, 11, 0.4)',
      badgeClass: 'bg-amber-500/20 text-amber-600 dark:text-amber-neon border-amber-500/50 shadow-amber-glow',
      scaleClass: 'scale-95'
    };
  } else if (actionState === 'breathing') {
    stateConfig = {
      title: 'THỞ BỤNG SÂU',
      icon: '🧘',
      gradientId: 'breathingGradient',
      orbBg: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(139, 92, 246, 0.3) 60%, transparent 90%)',
      glowColor: 'rgba(16, 185, 129, 0.4)',
      badgeClass: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/50',
      scaleClass: 'scale-100 animate-orb-expand'
    };
  }

  return (
    <div className="relative flex items-center justify-center select-none">
      {/* 1. Lớp hào quang Radial Glow nền phía sau */}
      <div
        className="absolute w-64 h-64 rounded-full blur-3xl opacity-30 dark:opacity-45 transition-all duration-700 pointer-events-none"
        style={{
          background: stateConfig.orbBg,
          transform: 'translateZ(0)'
        }}
      />

      {/* 2. Quả cầu trung tâm biến hình động theo nhịp co/giãn */}
      <div
        className={`absolute w-44 h-44 rounded-full transition-all duration-500 flex items-center justify-center ${stateConfig.scaleClass}`}
        style={{
          background: stateConfig.orbBg,
          boxShadow: isActive ? `0 0 35px ${stateConfig.glowColor}` : 'none',
          filter: 'blur(1px)',
          transform: 'translateZ(0)'
        }}
      />

      {/* 3. Vòng SVG Progress Bar quét mượt mà 120 FPS */}
      <svg width={size} height={size} className="transform -rotate-90 z-10">
        <defs>
          <linearGradient id="idleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          <linearGradient id="squeezeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#00ff88" />
          </linearGradient>

          <linearGradient id="relaxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>

          <linearGradient id="reverseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>

          <linearGradient id="transitionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>

          <linearGradient id="breathingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>

        {/* Vòng nền rãnh */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200/80 dark:text-white/10 fill-transparent"
        />

        {/* Vòng quét tiến độ 120 FPS */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${stateConfig.gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="fill-transparent"
          style={{
            transition: isActive ? 'stroke-dashoffset 980ms linear' : 'stroke-dashoffset 300ms ease-out',
            filter: isActive ? `drop-shadow(0 0 12px ${stateConfig.glowColor})` : 'none',
            willChange: 'stroke-dashoffset'
          }}
        />
      </svg>

      {/* 4. Thông tin trung tâm Quả cầu */}
      <div className="absolute z-20 flex flex-col items-center justify-center text-center px-4">
        {/* Nhãn trạng thái */}
        <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full mb-1 tracking-wider border backdrop-blur-md transition-all ${stateConfig.badgeClass}`}>
          {stateConfig.icon} {stateConfig.title}
        </span>

        {/* Đồng hồ đếm giây kỹ thuật số cỡ lớn */}
        <div className="font-mono text-5xl sm:text-6xl font-black tracking-tighter leading-none text-slate-900 dark:text-white my-0.5">
          {timeRemaining}
        </div>

        {/* Chỉ số Hiệp & Chặng */}
        <div className="flex flex-col items-center text-[11px] font-semibold text-slate-500 dark:text-gray-400">
          {actionState === 'transition' ? (
            <span className="text-amber-500 dark:text-amber-400 font-bold">Chuyển sang chặng kế tiếp</span>
          ) : totalReps > 0 ? (
            <span>Hiệp <strong className="text-slate-900 dark:text-white font-bold">{currentRep}</strong> / {totalReps}</span>
          ) : (
            <span>Tự do</span>
          )}
          
          {stageLabel && (
            <span className="text-[10px] text-slate-400 dark:text-gray-500 line-clamp-1 max-w-[170px] mt-0.5">
              {stageLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrbVisualizer;
