import React from 'react';

/**
 * Quả Cầu Đồng Hồ Visualizer 3D Sinh Học Đỉnh Cao (Apple Design Award Quality)
 * Tối ưu hóa tuyệt mỹ cho cả 2 chế độ Sáng (Light Mode) và Tối (Dark OLED)
 * Tích hợp vật lý co giãn sinh học Cubic-Bezier mượt mà 120 FPS
 */
const OrbVisualizer = ({
  actionState = 'idle', // 'idle' | 'squeezing' | 'relaxing' | 'reverse' | 'transition' | 'breathing'
  timeRemaining = 0,
  currentRep = 0,
  totalReps = 20,
  stageLabel = '',
  routineName = 'Phục Hồi Ban Đêm',
  totalRoutineReps = 25,
  isActive = false
}) => {
  // Cấu hình trạng thái hiển thị chi tiết
  let config = {
    actionText: 'SẴN SÀNG',
    icon: '⚡',
    actionBadgeLight: 'bg-slate-100 text-slate-800 border-slate-300',
    actionBadgeDark: 'bg-white/10 text-gray-200 border-white/20',
    borderColorLight: 'border-slate-300',
    borderColorDark: 'border-white/15',
    timerGradientLight: 'from-slate-900 via-slate-800 to-slate-700',
    timerGradientDark: 'from-white via-slate-100 to-gray-300',
    glowShadowLight: '0 0 30px rgba(100, 116, 139, 0.15)',
    glowShadowDark: '0 0 35px rgba(59, 130, 246, 0.2)',
    orbScale: 'scale-100',
    subText: 'Bấm Bắt đầu để tập',
    accentColor: '#06b6d4'
  };

  if (actionState === 'squeezing') {
    config = {
      actionText: 'SIẾT CƠ PC',
      icon: '⚡',
      actionBadgeLight: 'bg-emerald-50 text-emerald-700 border-emerald-400 shadow-xs',
      actionBadgeDark: 'bg-emerald-500/20 text-neon border-emerald-500/50 shadow-neon',
      borderColorLight: 'border-emerald-500',
      borderColorDark: 'border-neon',
      timerGradientLight: 'from-emerald-800 via-teal-800 to-slate-900',
      timerGradientDark: 'from-white via-emerald-200 to-neon',
      glowShadowLight: '0 0 45px rgba(16, 185, 129, 0.35), inset 0 0 20px rgba(16, 185, 129, 0.15)',
      glowShadowDark: '0 0 60px rgba(16, 185, 129, 0.65), inset 0 0 25px rgba(16, 185, 129, 0.3)',
      orbScale: 'scale-[0.82]', // Co siết chặt lại biểu thị co cơ
      subText: 'Siết chặt cơ sàn chậu',
      accentColor: '#10b981'
    };
  } else if (actionState === 'relaxing') {
    config = {
      actionText: 'THẢ LỎNG',
      icon: '❄️',
      actionBadgeLight: 'bg-cyan-50 text-cyan-700 border-cyan-400 shadow-xs',
      actionBadgeDark: 'bg-cyan-500/20 text-cyan-neon border-cyan-500/50 shadow-cyan-glow',
      borderColorLight: 'border-cyan-500',
      borderColorDark: 'border-cyan-neon',
      timerGradientLight: 'from-cyan-800 via-blue-800 to-slate-900',
      timerGradientDark: 'from-white via-cyan-200 to-cyan-neon',
      glowShadowLight: '0 0 45px rgba(6, 182, 212, 0.35), inset 0 0 20px rgba(6, 182, 212, 0.15)',
      glowShadowDark: '0 0 60px rgba(6, 182, 212, 0.55), inset 0 0 25px rgba(6, 182, 212, 0.3)',
      orbScale: 'scale-[1.10]', // Giãn nở nhẹ nhàng biểu thị thả lỏng
      subText: 'Thả lỏng toàn bộ cơ thể',
      accentColor: '#06b6d4'
    };
  } else if (actionState === 'reverse') {
    config = {
      actionText: 'KEGEL NGƯỢC',
      icon: '🌊',
      actionBadgeLight: 'bg-violet-50 text-violet-700 border-violet-400 shadow-xs',
      actionBadgeDark: 'bg-violet-500/20 text-violet-neon border-violet-500/50 shadow-violet-glow',
      borderColorLight: 'border-violet-500',
      borderColorDark: 'border-violet-neon',
      timerGradientLight: 'from-violet-800 via-purple-800 to-slate-900',
      timerGradientDark: 'from-white via-violet-200 to-amber-300',
      glowShadowLight: '0 0 45px rgba(139, 92, 246, 0.35), inset 0 0 20px rgba(139, 92, 246, 0.15)',
      glowShadowDark: '0 0 60px rgba(139, 92, 246, 0.6), inset 0 0 25px rgba(139, 92, 246, 0.3)',
      orbScale: 'scale-[1.16]', // Nở rộng tối đa biểu thị đẩy nhẹ giãn sàn chậu
      subText: 'Đẩy nhẹ ra ngoài giãn sàn chậu',
      accentColor: '#8b5cf6'
    };
  } else if (actionState === 'transition') {
    config = {
      actionText: 'NGHỈ CHUYỂN BÀI',
      icon: '⏳',
      actionBadgeLight: 'bg-amber-50 text-amber-800 border-amber-400 shadow-xs',
      actionBadgeDark: 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-amber-glow',
      borderColorLight: 'border-amber-500',
      borderColorDark: 'border-amber-400',
      timerGradientLight: 'from-amber-800 via-orange-800 to-slate-900',
      timerGradientDark: 'from-white via-amber-200 to-amber-400',
      glowShadowLight: '0 0 40px rgba(245, 158, 11, 0.3), inset 0 0 15px rgba(245, 158, 11, 0.1)',
      glowShadowDark: '0 0 50px rgba(245, 158, 11, 0.5), inset 0 0 20px rgba(245, 158, 11, 0.2)',
      orbScale: 'scale-[0.96]',
      subText: 'Chuẩn bị chuyển sang chặng tiếp theo',
      accentColor: '#f59e0b'
    };
  } else if (actionState === 'breathing') {
    config = {
      actionText: 'THỞ BỤNG SÂU',
      icon: '🧘',
      actionBadgeLight: 'bg-emerald-50 text-emerald-700 border-emerald-400 shadow-xs',
      actionBadgeDark: 'bg-emerald-500/20 text-neon border-emerald-500/50',
      borderColorLight: 'border-emerald-500',
      borderColorDark: 'border-neon',
      timerGradientLight: 'from-emerald-800 via-teal-800 to-slate-900',
      timerGradientDark: 'from-white via-emerald-200 to-cyan-300',
      glowShadowLight: '0 0 40px rgba(16, 185, 129, 0.3)',
      glowShadowDark: '0 0 50px rgba(16, 185, 129, 0.5)',
      orbScale: 'scale-100',
      subText: 'Hít sâu phình bụng - thở chậm phục hồi',
      accentColor: '#10b981'
    };
  }

  // Định dạng số hiển thị 2 chữ số (00, 01, 02...)
  const formattedSeconds = timeRemaining < 10 ? `0${timeRemaining}` : `${timeRemaining}`;

  return (
    <div className="relative flex items-center justify-center select-none w-64 h-64 mx-auto my-2">
      {/* 1. Vành hào quang Aura phía sau (Radial Glow) */}
      <div
        className="absolute w-56 h-56 rounded-full pointer-events-none transition-all duration-700 ease-out"
        style={{
          boxShadow: isActive ? (document.documentElement.classList.contains('dark') ? config.glowShadowDark : config.glowShadowLight) : 'none',
          transform: 'translateZ(0)'
        }}
      />

      {/* 2. Vành Quỹ Đạo Kính Siêu Mảnh (Outer Orbital Glass Ring) */}
      <div 
        className="absolute w-[242px] h-[242px] rounded-full border border-slate-300/60 dark:border-white/10 pointer-events-none transition-all duration-700"
        style={{
          boxShadow: isActive ? `0 0 15px ${config.accentColor}25` : 'none',
          transform: 'translateZ(0)'
        }}
      />

      {/* 3. Quả cầu trung tâm 3D Sinh Học (3D Biological Sphere) */}
      <div
        className={`w-52 h-52 rounded-full border-[3px] flex flex-col items-center justify-center text-center p-4 relative cursor-default transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${config.borderColorLight} dark:${config.borderColorDark} ${config.orbScale} bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-[#1e293b] dark:via-[#0f172a] dark:to-[#020617] shadow-xl dark:shadow-[0_16px_45px_-8px_rgba(0,0,0,0.8)]`}
        style={{
          transform: 'translateZ(0)'
        }}
      >
        {/* Nhãn hành động (Pill Capsule Badge) */}
        <span className={`inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border transition-all duration-300 ${config.actionBadgeLight} dark:${config.actionBadgeDark}`}>
          <span>{config.icon}</span>
          <span>{config.actionText}</span>
        </span>

        {/* Đồng hồ đếm giây kỹ thuật số cỡ lớn (Digital Countdown) */}
        <div className={`font-mono text-6xl font-black tracking-tight leading-none my-1 bg-gradient-to-b ${config.timerGradientLight} dark:${config.timerGradientDark} bg-clip-text text-transparent drop-shadow-xs`}>
          {formattedSeconds}
        </div>

        {/* Hướng dẫn hành động ngắn gọn */}
        <span className="text-[11px] text-slate-700 dark:text-gray-200 font-extrabold max-w-[170px] line-clamp-1">
          {stageLabel || config.subText}
        </span>

        {/* Huy hiệu Thông tin Bài Tập & Hiệp tập */}
        <div className="mt-1 flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-white/5 border border-slate-300/50 dark:border-white/10 text-[9px] font-bold text-slate-600 dark:text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-neon" />
          <span className="truncate max-w-[120px]">{routineName}</span>
          <span>•</span>
          <span>{totalRoutineReps} lượt</span>
        </div>
      </div>
    </div>
  );
};

export default OrbVisualizer;
