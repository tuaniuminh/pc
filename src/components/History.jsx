import React, { useState, useEffect } from 'react';
import { 
  History as HistoryIcon, 
  Trash2, 
  Flame, 
  Clock, 
  Calendar, 
  Trophy, 
  Zap, 
  CheckCircle2,
  Award,
  Lock,
  Sparkles,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Info,
  Edit2,
  Check,
  RotateCcw
} from 'lucide-react';
import { 
  getHistory, 
  getHistoryStats, 
  clearHistory, 
  deleteHistoryItem,
  BADGES_LIST, 
  getUnlockedBadges, 
  recalibrateAndSyncAllData
} from '../services/storageService';

const History = ({ onStartWorkout, activeTab }) => {
  const [activeSubtab, setActiveSubtab] = useState('calendar'); // 'calendar' | 'badges'
  const [historyList, setHistoryList] = useState(getHistory());
  const [stats, setStats] = useState(getHistoryStats());
  const [unlockedBadges, setUnlockedBadges] = useState(getUnlockedBadges());
  const [isEditing, setIsEditing] = useState(false);
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // null | { type: 'single', id: string } | { type: 'all' }

  const refreshData = () => {
    recalibrateAndSyncAllData();
    setHistoryList(getHistory());
    setStats(getHistoryStats());
    setUnlockedBadges(getUnlockedBadges());
  };

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'single') {
      deleteHistoryItem(deleteTarget.id);
    } else if (deleteTarget.type === 'all') {
      clearHistory();
      setIsEditing(false);
    }
    refreshData();
    setSelectedDayDetail(null);
    setDeleteTarget(null);
  };

  const unlockedCount = unlockedBadges.length;
  const totalBadgesCount = BADGES_LIST.length;
  const badgeProgress = Math.round((unlockedCount / totalBadgesCount) * 100);

  // ==================== TÍNH TOÁN LỊCH VẾT LỬA (STREAK HEATMAP) ====================
  const viewYear = currentViewDate.getFullYear();
  const viewMonth = currentViewDate.getMonth(); // 0-11
  const today = new Date();
  const isCurrentMonthView = today.getFullYear() === viewYear && today.getMonth() === viewMonth;

  const formatDurationText = (secVal) => {
    const sec = Number(secVal) || 0;
    if (sec <= 0) return '1 phút';
    const mins = Math.floor(sec / 60);
    const remSec = sec % 60;
    if (mins === 0) return `${remSec}s`;
    if (remSec === 0) return `${mins} phút`;
    return `${mins}p ${remSec}s`;
  };

  const formatShortDuration = (secVal) => {
    const sec = Number(secVal) || 0;
    if (sec <= 0) return '1p';
    const mins = Math.floor(sec / 60);
    const remSec = sec % 60;
    if (mins === 0) return `${remSec}s`;
    if (remSec === 0) return `${mins}p`;
    return `${mins}p ${remSec}s`;
  };

  // Gom nhóm lịch sử theo ngày YYYY-MM-DD
  const workoutsMap = {};
  historyList.forEach((item) => {
    if (!item.date) return;
    const d = new Date(item.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!workoutsMap[key]) {
      workoutsMap[key] = { count: 0, totalSqueezes: 0, totalReverseKegels: 0, totalDuration: 0, sessions: [] };
    }
    workoutsMap[key].count += 1;
    workoutsMap[key].totalSqueezes += (item.totalSqueezes || 0);
    workoutsMap[key].totalReverseKegels += (item.totalReverseKegels || 0);
    workoutsMap[key].totalDuration += (item.duration || item.durationSeconds || 0);
    workoutsMap[key].sessions.push(item);
  });

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // T2 là 0, CN là 6

  let activeDaysThisMonth = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (workoutsMap[key] && workoutsMap[key].count > 0) {
      activeDaysThisMonth += 1;
    }
  }

  const handlePrevMonth = () => {
    setCurrentViewDate(new Date(viewYear, viewMonth - 1, 1));
    setSelectedDayDetail(null);
  };

  const handleNextMonth = () => {
    setCurrentViewDate(new Date(viewYear, viewMonth + 1, 1));
    setSelectedDayDetail(null);
  };

  const handleGoToday = () => {
    setCurrentViewDate(new Date());
    setSelectedDayDetail(null);
  };

  const handleSelectDay = (dayNum, dayData) => {
    setSelectedDayDetail({
      dateStr: `${String(dayNum).padStart(2, '0')}/${String(viewMonth + 1).padStart(2, '0')}/${viewYear}`,
      count: dayData ? dayData.count : 0,
      totalSqueezes: dayData ? dayData.totalSqueezes : 0,
      totalReverseKegels: dayData ? dayData.totalReverseKegels : 0,
      totalDuration: dayData ? dayData.totalDuration : 0,
      sessions: dayData ? dayData.sessions : []
    });
  };

  return (
    <div className="p-4 sm:p-5 space-y-5 max-w-lg mx-auto">
      {/* Title & Subtab Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Thành Tích & Lịch Sử
          </h2>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
            Nhật ký hoạt động và bộ sưu tập huy hiệu sàn chậu
          </p>
        </div>

        {/* Chuyển đổi Subtab */}
        <div className="flex bg-slate-200 dark:bg-white/10 p-1 rounded-2xl border border-slate-300 dark:border-white/10 text-xs font-bold">
          <button
            onClick={() => setActiveSubtab('calendar')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeSubtab === 'calendar' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 dark:text-gray-400'
            }`}
          >
            Lịch Tập
          </button>
          <button
            onClick={() => setActiveSubtab('badges')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeSubtab === 'badges' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 dark:text-gray-400'
            }`}
          >
            Huy Hiệu
          </button>
        </div>
      </div>

      {/* 4 Thống Kê Tổng Quan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="glass-panel p-3.5 rounded-2xl border border-emerald-300/40 dark:border-emerald-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-gray-400">
            <span className="text-[11px] font-bold">Tổng Buổi</span>
            <Calendar size={14} className="text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-2">
            {stats.totalWorkouts}
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl border border-neon/40 dark:border-neon/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-gray-400">
            <span className="text-[11px] font-bold">Lượt Siết</span>
            <Zap size={14} className="text-emerald-600 dark:text-neon" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-neon mt-2">
            {stats.totalSqueezes}
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl border border-cyan-300/40 dark:border-cyan-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-gray-400">
            <span className="text-[11px] font-bold">Kegel Ngược</span>
            <Sparkles size={14} className="text-cyan-500" />
          </div>
          <div className="text-xl font-black text-cyan-600 dark:text-cyan-neon mt-2">
            {stats.totalReverseKegels}
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl border border-amber-300/40 dark:border-amber-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-gray-400">
            <span className="text-[11px] font-bold">Streak Lửa</span>
            <Flame size={14} className="text-amber-500 animate-pulse" />
          </div>
          <div className="text-xl font-black text-amber-500 mt-2">
            {stats.streak} ngày
          </div>
        </div>
      </div>

      {/* ==================== SUBTAB 1: LỊCH VẾT LỬA & DANH SÁCH BUỔI TẬP ==================== */}
      {activeSubtab === 'calendar' && (
        <div className="space-y-6">
          {/* BẢNG NHẬT KÝ HOẠT ĐỘNG THÁNG (STREAK CALENDAR HEATMAP) */}
          <div className="glass-panel p-5 rounded-3xl space-y-4 border border-amber-300/40 dark:border-amber-500/20">
            {/* Header Lịch */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Calendar size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Nhật Ký Hoạt Động Tháng</h3>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400">
                    Đã rèn luyện {activeDaysThisMonth}/{daysInMonth} ngày trong tháng
                  </p>
                </div>
              </div>

              {/* Bộ điều hướng tháng */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={handlePrevMonth}
                  className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-gray-300 active:scale-95"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={handleGoToday}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-[10px] font-bold text-slate-700 dark:text-gray-300 active:scale-95"
                >
                  Tháng {viewMonth + 1}/{viewYear}
                </button>
                <button
                  onClick={handleNextMonth}
                  className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-gray-300 active:scale-95"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Thứ trong tuần */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 dark:text-gray-500">
              <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span className="text-amber-500">CN</span>
            </div>

            {/* Ma Trận Ô Ngày (Streak Heatmap Grid) */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Padding offset các ngày đầu tháng */}
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`offset-${i}`} className="aspect-square rounded-xl bg-transparent" />
              ))}

              {/* Các ngày trong tháng */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayData = workoutsMap[dateKey];
                const count = dayData ? dayData.count : 0;
                const isToday = isCurrentMonthView && today.getDate() === dayNum;

                // 4 Cấp độ nhiệt (Heat Level)
                let heatClass = 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-400 border border-slate-200/60 dark:border-white/5';
                if (count === 1) {
                  heatClass = 'bg-emerald-500/25 border border-emerald-500/50 text-emerald-800 dark:text-emerald-300 font-bold';
                } else if (count === 2) {
                  heatClass = 'bg-cyan-500/30 border border-cyan-500/60 text-cyan-800 dark:text-cyan-200 font-black shadow-sm';
                } else if (count >= 3) {
                  heatClass = 'bg-gradient-to-tr from-amber-500 to-red-500 border border-amber-400 text-white font-black shadow-amber-glow';
                }

                return (
                  <button
                    key={`day-${dayNum}`}
                    onClick={() => handleSelectDay(dayNum, dayData)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-90 ${heatClass} ${
                      isToday ? 'ring-2 ring-emerald-500' : ''
                    }`}
                  >
                    <span className="text-xs">{dayNum}</span>
                    {count > 0 && (
                      <span className="text-[8px] leading-none mt-0.5 opacity-90">
                        {count >= 3 ? '🔥' : `${count}b`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Chú thích mức độ nhiệt (Legend) */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/5 text-[10px] text-slate-500 dark:text-gray-400">
              <span>Mức độ:</span>
              <div className="flex items-center space-x-2">
                <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-md bg-slate-200 dark:bg-white/10 inline-block" /> <span>Nghỉ</span></span>
                <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-md bg-emerald-500/30 inline-block" /> <span>1 bài</span></span>
                <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-md bg-cyan-500/40 inline-block" /> <span>2 bài</span></span>
                <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-md bg-amber-500 inline-block" /> <span>3+ bài</span></span>
              </div>
            </div>
          </div>

          {/* CHI TIẾT NGÀY ĐƯỢC CHỌN */}
          {selectedDayDetail && (
            <div className="glass-panel p-4 rounded-2xl border border-cyan-500/30 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                <span>🗓️ Chi tiết ngày: {selectedDayDetail.dateStr}</span>
                <span className="text-emerald-600 dark:text-neon">{selectedDayDetail.count} buổi tập</span>
              </div>
              {selectedDayDetail.count > 0 ? (
                <div className="space-y-1.5 pt-1 text-xs">
                  {selectedDayDetail.sessions.map((sess, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{sess.routineName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-gray-400">
                          {sess.totalSqueezes} lượt siết • {sess.totalReverseKegels} lượt ngược • {formatDurationText(sess.duration || sess.durationSeconds)}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(sess.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-1">Chưa có dữ liệu buổi tập nào trong ngày này.</div>
              )}
            </div>
          )}

          {/* DANH SÁCH CHI TIẾT CÁC BUỔI TẬP (CÓ NÚT SỬA / XÓA) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <HistoryIcon size={16} className="text-emerald-500" />
                <span>Chi Tiết Các Buổi Tập ({historyList.length})</span>
              </h3>

              <div className="flex items-center space-x-2">
                {historyList.length > 0 && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`py-1 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                      isEditing
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-gray-300'
                    }`}
                  >
                    {isEditing ? <Check size={12} /> : <Edit2 size={12} />}
                    <span>{isEditing ? "Xong" : "Sửa"}</span>
                  </button>
                )}

                {isEditing && (
                  <button
                    onClick={() => setDeleteTarget({ type: 'all' })}
                    className="py-1 px-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-bold flex items-center space-x-1"
                  >
                    <Trash2 size={12} />
                    <span>Xóa Hết</span>
                  </button>
                )}
              </div>
            </div>

            {/* Danh sách thẻ buổi tập */}
            {historyList.length > 0 ? (
              <div className="space-y-2">
                {historyList.map((item) => (
                  <div
                    key={item.id}
                    className="glass-panel p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      {isEditing && (
                        <button
                          onClick={() => setDeleteTarget({ type: 'single', id: item.id })}
                          className="w-7 h-7 rounded-lg bg-red-500/15 text-red-500 flex items-center justify-center active:scale-95 shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <div>
                        <div className="text-xs font-black text-slate-900 dark:text-white">
                          {item.routineName || `Buổi tập Cấp ${item.level || 1}`}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5 flex items-center space-x-2">
                          <span className="text-emerald-600 dark:text-neon font-bold">⚡ {item.totalSqueezes || 0} siết</span>
                          <span>•</span>
                          <span className="text-cyan-600 dark:text-cyan-neon font-bold">🌊 {item.totalReverseKegels || 0} ngược</span>
                          <span>•</span>
                          <span>⏱️ {formatShortDuration(item.duration || item.durationSeconds)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-[10px] text-slate-400 font-mono">
                      {item.date ? new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel p-8 rounded-3xl text-center space-y-3 border border-dashed border-slate-300 dark:border-white/10">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <Zap size={24} />
                </div>
                <div className="text-xs text-slate-500 dark:text-gray-400">
                  Chưa có buổi tập nào được lưu lại. Hãy bắt đầu ngay bài tập đầu tiên!
                </div>
                <button
                  onClick={onStartWorkout}
                  className="py-2.5 px-5 rounded-2xl bg-emerald-500 text-white font-bold text-xs shadow-neon active:scale-95 transition-all"
                >
                  Bắt Đầu Tập Ngay
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== SUBTAB 2: TỦ HUY HIỆU & DANH HIỆU ==================== */}
      {activeSubtab === 'badges' && (
        <div className="space-y-4">
          {/* Thanh tiến độ mở khóa huy hiệu */}
          <div className="glass-panel p-5 rounded-3xl border border-amber-300/40 dark:border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy size={18} className="text-amber-500" />
                <span className="text-sm font-black text-slate-900 dark:text-white">Bộ Sưu Tập Danh Hiệu</span>
              </div>
              <span className="text-xs font-extrabold text-amber-500">
                {unlockedCount} / {totalBadgesCount} ({badgeProgress}%)
              </span>
            </div>
            <div className="h-2.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${badgeProgress}%` }}
              />
            </div>
          </div>

          {/* Lưới các huy hiệu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {BADGES_LIST.map((badge) => {
              const isUnlocked = unlockedBadges.includes(badge.id);

              return (
                <div
                  key={badge.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-start space-x-3 ${
                    isUnlocked
                      ? 'glass-panel border-amber-300/60 dark:border-amber-500/30 shadow-sm'
                      : 'bg-slate-100/60 dark:bg-white/5 border-slate-200 dark:border-white/5 opacity-40'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                    isUnlocked ? 'bg-amber-100 dark:bg-amber-500/20 shadow-sm' : 'bg-slate-200 dark:bg-white/10 grayscale'
                  }`}>
                    {isUnlocked ? badge.icon : <Lock size={16} className="text-slate-400" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {badge.name}
                      </h4>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-gray-300">
                        {badge.rarity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
                      {badge.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA BUỔI TẬP (GLASS-MORPHISM) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-xs p-5 rounded-3xl space-y-4 border border-red-500/30 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {deleteTarget.type === 'all' ? "Xóa Toàn Bộ Lịch Sử?" : "Xóa Buổi Tập Này?"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                Hành động này sẽ xóa dữ liệu vĩnh viễn và cập nhật lại thống kê chuỗi ngày tập.
              </p>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-200 dark:bg-white/10 font-bold text-xs text-slate-700 dark:text-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 font-bold text-xs text-white shadow-sm active:scale-95"
              >
                Xóa Luôn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
