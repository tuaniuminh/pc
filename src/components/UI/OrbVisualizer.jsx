import React from 'react';

/**
 * Quả Cầu Đồng Hồ Sinh Học Visualizer 3D Siêu Đẳng Cấp (Apple Design & Cyber-Health Aesthetics)
 * Viền phát sáng xung quanh hoạt động theo cơ chế MỜ DẦN (Fade Out) mượt mà theo từng giây đếm ngược về 0
 * Đồ họa Glassmorphism, chiều sâu ánh sáng 3D và vật lý co giãn sinh học mượt mà 120 FPS
 */
const OrbVisualizer = ({
  actionState = 'idle', // 'idle' | 'squeezing' | 'relaxing' | 'reverse' | 'transition' | 'breathing'
  timeRemaining = 0,
  stageDuration = 5,
  currentRep = 0,
  totalReps = 20,
  stageLabel = '',
  routineName = 'Phục Hồi Ban Đêm',
  totalRoutineReps = 25,
  isActive = false
}) => {
  // Cấu hình trạng thái màu sắc, ánh sáng & hiệu ứng
  let config = {
    actionText: 'SẴN SÀNG',
    icon: '⚡',
    themeColor: '#06b6d4',
    badgeClass: 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-cyan-300 border-slate-300 dark:border-white/20',
    ringGradient: ['#06b6d4', '#3b82f6'],
    glowShadow: '0 0 35px rgba(6, 182, 212, 0.25)',
    orbScale: 'scale-100',
    subText: 'Bấm Bắt đầu để tập',
    ringColor: '#06b6d4'
  };

  if (actionState === 'squeezing') {
    config = {
      actionText: 'SIẾT CƠ PC',
      icon: '⚡',
      themeColor: '#10b981',
      badgeClass: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20',
      ringGradient: ['#10b981', '#059669', '#34d399'],
      glowShadow: '0 0 55px rgba(16, 185, 129, 0.45), inset 0 0 25px rgba(16, 185, 129, 0.2)',
      orbScale: 'scale-[0.84]', // Co siết biểu thị co cơ sàn chậu
      subText: 'Siết chặt cơ sàn chậu',
      ringColor: '#10b981'
    };
  } else if (actionState === 'relaxing') {
    config = {
      actionText: 'THẢ LỎNG',
      icon: '❄️',
      themeColor: '#06b6d4',
      badgeClass: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20',
      ringGradient: ['#06b6d4', '#0284c7', '#38bdf8'],
      glowShadow: '0 0 55px rgba(6, 182, 212, 0.45), inset 0 0 25px rgba(16, 182, 212, 0.2)',
      orbScale: 'scale-[1.12]', // Giãn nở biểu thị thả lỏng
      subText: 'Thả lỏng toàn bộ cơ thể',
      ringColor: '#06b6d4'
    };
  } else if (actionState === 'reverse') {
    config = {
      actionText: 'KEGEL NGƯỢC',
      icon: '🌊',
      themeColor: '#8b5cf6',
      badgeClass: 'bg-violet-500/20 text-violet-600 dark:text-violet-300 border-violet-500/40 shadow-sm shadow-violet-500/20',
      ringGradient: ['#8b5cf6', '#7c3aed', '#c084fc'],
      glowShadow: '0 0 55px rgba(139, 92, 246, 0.45), inset 0 0 25px rgba(139, 92, 246, 0.2)',
      orbScale: 'scale-[1.18]', // Đẩy nhẹ giãn nở tối đa
      subText: 'Đẩy nhẹ ra ngoài giãn sàn chậu',
      ringColor: '#8b5cf6'
    };
  } else if (actionState === 'transition') {
    config = {
      actionText: 'NGHỈ CHUYỂN BÀI',
      icon: '⏳',
      themeColor: '#f59e0b',
      badgeClass: 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20',
      ringGradient: ['#f59e0b', '#d97706', '#fbbf24'],
      glowShadow: '0 0 45px rgba(245, 158, 11, 0.4), inset 0 0 20px rgba(245, 158, 11, 0.15)',
      orbScale: 'scale-[0.96]',
      subText: 'Chuẩn bị chuyển sang chặng tiếp theo',
      ringColor: '#f59e0b'
    };
  } else if (actionState === 'breathing') {
    config = {
      actionText: 'THỞ BỤNG SÂU',
      icon: '🧘',
      themeColor: '#10b981',
      badgeClass: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40',
      ringGradient: ['#10b981', '#14b8a6', '#6ee7b7'],
      glowShadow: '0 0 45px rgba(16, 185, 129, 0.4)',
      orbScale: 'scale-100',
      subText: 'Hít sâu phình bụng - thở chậm phục hồi',
      ringColor: '#10b981'
    };
  }

  // TÍNH TOÁN ĐỘ MỜ DẦN (FADE RATIO) KHI ĐỒNG HỒ ĐẾM LÙI VỀ 0
  const maxSec = Math.max(1, stageDuration || 1);
  const currentSec = Math.max(0, timeRemaining || 0);
  const fadeRatio = !isActive || actionState === 'idle' 
    ? 0.35 
    : Math.max(0.12, currentSec / maxSec);

  const formattedSeconds = timeRemaining < 10 ? `0${timeRemaining}` : `${timeRemaining}`;

  return (
    <div className="relative flex items-center justify-center select-none w-72 h-72 mx-auto my-2">
      {/* 1. Hào quang Aura phát sáng lan tỏa phía sau (Mờ dần theo thời gian thực về 0) */}
      <div
        className="absolute w-60 h-60 rounded-full pointer-events-none transition-all duration-500 ease-out"
        style={{
          boxShadow: isActive ? config.glowShadow : 'none',
          opacity: fadeRatio
        }}
      />

      {/* 2. Vòng Quỹ Đạo Viền Kính Phát Sáng Neon (Mờ dần đều khi đồng hồ về 0) */}
      <div 
        className="absolute w-[236px] h-[236px] rounded-full border-2 pointer-events-none transition-all duration-300 ease-out"
        style={{
          borderColor: config.themeColor,
          opacity: fadeRatio,
          boxShadow: isActive ? `0 0 20px ${config.themeColor}80` : 'none'
        }}
      />

      {/* 3. Quả cầu trung tâm 3D Sinh Học (3D Biological Orb Glass) */}
      <div
        className={`w-52 h-52 rounded-full border-2 flex flex-col items-center justify-center text-center p-4 relative cursor-default transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${config.orbScale} bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-900/90 dark:via-slate-950/95 dark:to-black/95 backdrop-blur-2xl shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.9)]`}
        style={{
          borderColor: isActive ? `${config.themeColor}${Math.round(fadeRatio * 255).toString(16).padStart(2, '0')}` : 'rgba(255, 255, 255, 0.15)'
        }}
      >
        {/* Nhãn hành động (Capsule Pill Badge) */}
        <span className={`inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border transition-all duration-300 ${config.badgeClass}`}>
          <span className="text-xs">{config.icon}</span>
          <span>{config.actionText}</span>
        </span>

        {/* Đồng hồ đếm giây kỹ thuật số cỡ lớn sắc nét (Hero Typography Countdown) */}
        <div className="font-mono text-[68px] font-black tracking-tighter leading-none my-0.5 text-slate-900 dark:text-white drop-shadow-md">
          {formattedSeconds}
        </div>

        {/* Hướng dẫn hành động ngắn gọn */}
        <span className="text-xs text-slate-700 dark:text-gray-200 font-extrabold max-w-[170px] truncate px-1">
          {stageLabel || config.subText}
        </span>

        {/* Huy hiệu Thông tin Hiệp tập & Bài tập */}
        <div className="mt-1.5 flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-bold text-slate-600 dark:text-gray-400">
          <span 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: config.themeColor }}
          />
          <span className="truncate max-w-[110px]">{routineName}</span>
          <span>•</span>
          <span className="text-cyan-600 dark:text-cyan-400 font-mono font-extrabold">{totalRoutineReps} lượt</span>
        </div>
      </div>
    </div>
  );
};

export default OrbVisualizer;
