import React from 'react';

/**
 * Quả Cầu Đồng Hồ Visualizer 3D Sinh Học (Khôi phục & Cải tiến từ bản v1.2.41)
 * Hiệu ứng co giãn 3D sinh học theo từng nhịp co thắt cơ sàn chậu (Cubic-Bezier Physics)
 */
const OrbVisualizer = ({
  actionState = 'idle', // 'idle' | 'squeezing' | 'relaxing' | 'reverse' | 'transition' | 'breathing'
  timeRemaining = 0,
  currentRep = 0,
  totalReps = 20,
  stageLabel = '',
  isActive = false
}) => {
  // Cấu hình trạng thái hiển thị
  let config = {
    actionText: 'SẴN SÀNG',
    actionColor: 'text-emerald-500 dark:text-neon',
    borderColor: 'border-emerald-500/40 dark:border-neon/40',
    timerGradient: 'from-slate-900 via-emerald-700 to-teal-800 dark:from-white dark:via-emerald-200 dark:to-neon',
    glowShadow: '0 0 35px rgba(16, 185, 129, 0.25)',
    orbScale: 'scale-100',
    subText: 'Bấm Bắt đầu để tập'
  };

  if (actionState === 'squeezing') {
    config = {
      actionText: 'SIẾT CƠ PC',
      actionColor: 'text-emerald-500 dark:text-neon',
      borderColor: 'border-emerald-500 dark:border-neon',
      timerGradient: 'from-emerald-600 via-neon to-teal-400 dark:from-white dark:via-emerald-300 dark:to-neon',
      glowShadow: '0 0 50px rgba(16, 185, 129, 0.55), inset 0 0 20px rgba(16, 185, 129, 0.2)',
      orbScale: 'scale-[0.82]', // Co siết chặt lại biểu thị co cơ
      subText: totalReps > 0 ? `Hiệp ${currentRep} / ${totalReps} • Siết chặt cơ sàn chậu` : 'Siết chặt cơ sàn chậu'
    };
  } else if (actionState === 'relaxing') {
    config = {
      actionText: 'THẢ LỎNG',
      actionColor: 'text-cyan-500 dark:text-cyan-neon',
      borderColor: 'border-cyan-500 dark:border-cyan-neon',
      timerGradient: 'from-cyan-600 via-blue-500 to-indigo-500 dark:from-white dark:via-cyan-200 dark:to-cyan-neon',
      glowShadow: '0 0 55px rgba(6, 182, 212, 0.45), inset 0 0 20px rgba(6, 182, 212, 0.2)',
      orbScale: 'scale-[1.10]', // Giãn nở nhẹ nhàng biểu thị thả lỏng
      subText: totalReps > 0 ? `Hiệp ${currentRep} / ${totalReps} • Thả lỏng toàn bộ cơ thể` : 'Thả lỏng toàn bộ cơ thể'
    };
  } else if (actionState === 'reverse') {
    config = {
      actionText: 'KEGEL NGƯỢC',
      actionColor: 'text-violet-500 dark:text-violet-neon',
      borderColor: 'border-violet-500 dark:border-violet-neon',
      timerGradient: 'from-violet-600 via-purple-500 to-amber-500 dark:from-white dark:via-violet-200 dark:to-amber-400',
      glowShadow: '0 0 55px rgba(139, 92, 246, 0.5), inset 0 0 20px rgba(139, 92, 246, 0.2)',
      orbScale: 'scale-[1.16]', // Nở rộng tối đa biểu thị đẩy nhẹ giãn sàn chậu
      subText: totalReps > 0 ? `Hiệp ${currentRep} / ${totalReps} • Đẩy nhẹ ra ngoài giãn sàn chậu` : 'Đẩy nhẹ ra ngoài giãn sàn chậu'
    };
  } else if (actionState === 'transition') {
    config = {
      actionText: 'NGHỈ CHUYỂN BÀI',
      actionColor: 'text-amber-500 dark:text-amber-400',
      borderColor: 'border-amber-500/70 dark:border-amber-400/70',
      timerGradient: 'from-amber-600 via-orange-500 to-amber-400 dark:from-white dark:via-amber-200 dark:to-amber-400',
      glowShadow: '0 0 45px rgba(245, 158, 11, 0.4), inset 0 0 15px rgba(245, 158, 11, 0.15)',
      orbScale: 'scale-[0.96]',
      subText: 'Chuẩn bị chuyển sang chặng tiếp theo'
    };
  } else if (actionState === 'breathing') {
    config = {
      actionText: 'THỞ BỤNG SÂU',
      actionColor: 'text-emerald-500 dark:text-neon',
      borderColor: 'border-emerald-500/60 dark:border-neon/60',
      timerGradient: 'from-emerald-600 via-teal-500 to-cyan-500 dark:from-white dark:via-emerald-200 dark:to-cyan-300',
      glowShadow: '0 0 45px rgba(16, 185, 129, 0.4)',
      orbScale: 'scale-100',
      subText: 'Hít sâu phình bụng - thở chậm phục hồi'
    };
  }

  // Định dạng số hiển thị 2 chữ số (00, 01, 02...)
  const formattedSeconds = timeRemaining < 10 ? `0${timeRemaining}` : `${timeRemaining}`;

  return (
    <div className="relative flex items-center justify-center select-none w-56 h-56 my-1">
      {/* 1. Hào quang Glow phía sau quả cầu (orb-glow) */}
      <div
        className="absolute w-48 h-48 rounded-full pointer-events-none transition-all duration-700 ease-out"
        style={{
          boxShadow: isActive ? config.glowShadow : '0 0 30px rgba(59, 130, 246, 0.12)',
          transform: 'translateZ(0)'
        }}
      />

      {/* 2. Quả cầu trung tâm 3D (visualizer-orb) */}
      <div
        className={`w-44 h-44 rounded-full border-[3px] flex flex-col items-center justify-center text-center p-3 relative cursor-default transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${config.borderColor} ${config.orbScale}`}
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 60%, rgba(2, 6, 23, 1) 100%)',
          boxShadow: '0 10px 35px rgba(0, 0, 0, 0.4), inset 0 2px 6px rgba(255, 255, 255, 0.12)',
          transform: 'translateZ(0)'
        }}
      >
        {/* Nhãn hành động (orb-action) */}
        <span className={`text-[11px] font-black uppercase tracking-wider mb-0.5 transition-colors duration-300 ${config.actionColor}`}>
          {config.actionText}
        </span>

        {/* Đồng hồ đếm giây kỹ thuật số cỡ lớn (orb-timer) */}
        <div className={`font-mono text-5xl font-black tracking-tight leading-none my-0.5 bg-gradient-to-b ${config.timerGradient} bg-clip-text text-transparent drop-shadow-sm`}>
          {formattedSeconds}
        </div>

        {/* Dòng trạng thái phụ (orb-sub-text) */}
        <span className="text-[10px] text-slate-400 dark:text-gray-400 font-medium max-w-[140px] line-clamp-1 mt-0.5">
          {stageLabel || config.subText}
        </span>
      </div>
    </div>
  );
};

export default OrbVisualizer;
