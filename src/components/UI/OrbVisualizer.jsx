import React from 'react';

/**
 * Quả Cầu Đồng Hồ Visualizer 3D Sinh Học (Hỗ trợ hoàn hảo Giao diện Sáng & Tối)
 * Hiệu ứng co giãn 3D sinh học theo từng nhịp co thắt cơ sàn chậu (Cubic-Bezier Physics)
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
  // Cấu hình trạng thái hiển thị
  let config = {
    actionText: 'SẴN SÀNG',
    actionColor: 'text-slate-700 dark:text-gray-300',
    borderColor: 'border-slate-300 dark:border-white/10',
    timerGradient: 'from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-gray-100 dark:to-gray-300',
    glowShadow: '0 0 35px rgba(59, 130, 246, 0.15)',
    orbScale: 'scale-100',
    subText: 'Bấm Bắt đầu để tập'
  };

  if (actionState === 'squeezing') {
    config = {
      actionText: 'SIẾT CƠ',
      actionColor: 'text-emerald-600 dark:text-neon',
      borderColor: 'border-emerald-500 dark:border-neon',
      timerGradient: 'from-emerald-700 via-teal-700 to-slate-900 dark:from-white dark:via-emerald-300 dark:to-neon',
      glowShadow: '0 0 50px rgba(16, 185, 129, 0.45), inset 0 0 20px rgba(16, 185, 129, 0.2)',
      orbScale: 'scale-[0.82]', // Co siết chặt lại biểu thị co cơ
      subText: 'Siết chặt cơ sàn chậu'
    };
  } else if (actionState === 'relaxing') {
    config = {
      actionText: 'THẢ LỎNG',
      actionColor: 'text-cyan-600 dark:text-cyan-neon',
      borderColor: 'border-cyan-500 dark:border-cyan-neon',
      timerGradient: 'from-cyan-700 via-blue-700 to-slate-900 dark:from-white dark:via-cyan-200 dark:to-cyan-neon',
      glowShadow: '0 0 55px rgba(6, 182, 212, 0.4), inset 0 0 20px rgba(6, 182, 212, 0.2)',
      orbScale: 'scale-[1.10]', // Giãn nở nhẹ nhàng biểu thị thả lỏng
      subText: 'Thả lỏng toàn bộ cơ thể'
    };
  } else if (actionState === 'reverse') {
    config = {
      actionText: 'KEGEL NGƯỢC',
      actionColor: 'text-violet-600 dark:text-violet-neon',
      borderColor: 'border-violet-500 dark:border-violet-neon',
      timerGradient: 'from-violet-700 via-purple-700 to-amber-700 dark:from-white dark:via-violet-200 dark:to-amber-300',
      glowShadow: '0 0 55px rgba(139, 92, 246, 0.45), inset 0 0 20px rgba(139, 92, 246, 0.2)',
      orbScale: 'scale-[1.16]', // Nở rộng tối đa biểu thị đẩy nhẹ giãn sàn chậu
      subText: 'Đẩy nhẹ ra ngoài giãn sàn chậu'
    };
  } else if (actionState === 'transition') {
    config = {
      actionText: 'NGHỈ CHUYỂN',
      actionColor: 'text-amber-600 dark:text-amber-300',
      borderColor: 'border-amber-500 dark:border-amber-400',
      timerGradient: 'from-amber-700 via-orange-700 to-slate-900 dark:from-white dark:via-amber-200 dark:to-amber-300',
      glowShadow: '0 0 45px rgba(245, 158, 11, 0.35), inset 0 0 15px rgba(245, 158, 11, 0.15)',
      orbScale: 'scale-[0.96]',
      subText: 'Chuẩn bị chuyển sang chặng tiếp theo'
    };
  } else if (actionState === 'breathing') {
    config = {
      actionText: 'THỞ BỤNG',
      actionColor: 'text-emerald-600 dark:text-neon',
      borderColor: 'border-emerald-500 dark:border-neon',
      timerGradient: 'from-emerald-700 via-teal-700 to-slate-900 dark:from-white dark:via-emerald-200 dark:to-cyan-300',
      glowShadow: '0 0 45px rgba(16, 185, 129, 0.35)',
      orbScale: 'scale-100',
      subText: 'Hít sâu phình bụng - thở chậm phục hồi'
    };
  }

  // Định dạng số hiển thị 2 chữ số (00, 01, 02...)
  const formattedSeconds = timeRemaining < 10 ? `0${timeRemaining}` : `${timeRemaining}`;

  return (
    <div className="relative flex items-center justify-center select-none w-64 h-64 mx-auto my-2">
      {/* 1. Hào quang Glow phía sau quả cầu (orb-glow) */}
      <div
        className="absolute w-56 h-56 rounded-full pointer-events-none transition-all duration-700 ease-out"
        style={{
          boxShadow: isActive ? config.glowShadow : '0 0 35px rgba(59, 130, 246, 0.15)',
          transform: 'translateZ(0)'
        }}
      />

      {/* 2. Quả cầu trung tâm 3D (visualizer-orb) đồng bộ hoàn hảo Giao diện Sáng & Tối */}
      <div
        className={`w-52 h-52 rounded-full border-[3px] flex flex-col items-center justify-center text-center p-4 relative cursor-default transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${config.borderColor} ${config.orbScale} bg-gradient-to-br from-white via-slate-50 to-slate-200 dark:from-[#1e293b] dark:via-[#0f172a] dark:to-[#020617] shadow-lg dark:shadow-2xl`}
        style={{
          transform: 'translateZ(0)'
        }}
      >
        {/* Nhãn hành động (orb-action) */}
        <span className={`text-[12px] font-black uppercase tracking-widest mb-0.5 transition-colors duration-300 ${config.actionColor}`}>
          {config.actionText}
        </span>

        {/* Đồng hồ đếm giây kỹ thuật số cỡ lớn (orb-timer) */}
        <div className={`font-mono text-6xl font-black tracking-tight leading-none my-1 bg-gradient-to-b ${config.timerGradient} bg-clip-text text-transparent drop-shadow-xs`}>
          {formattedSeconds}
        </div>

        {/* Dòng trạng thái 1 (orb-sub-text) */}
        <span className="text-[11px] text-slate-700 dark:text-gray-300 font-bold max-w-[170px] line-clamp-1">
          {stageLabel || config.subText}
        </span>

        {/* Dòng trạng thái 2 (Routine name - Total reps) */}
        <span className="text-[10px] text-slate-500 dark:text-gray-400 font-medium max-w-[170px] line-clamp-1 mt-0.5">
          {routineName} - {totalRoutineReps} lượt
        </span>
      </div>
    </div>
  );
};

export default OrbVisualizer;
