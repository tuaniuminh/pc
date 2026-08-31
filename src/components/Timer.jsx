import React, { useState, useEffect } from 'react';
import OrbVisualizer from './UI/OrbVisualizer';
import { audioEngine } from '../utils/audioEngine';
import { liveActivityService } from '../services/liveActivityService';
import { 
  triggerHapticHeavy, 
  triggerHapticMedium, 
  triggerHapticSuccess, 
  triggerHapticHeartbeat 
} from '../utils/hapticsUtils';
import { 
  saveHistorySession, 
  requestWakeLock, 
  releaseWakeLock, 
  CLINICAL_LEVELS,
  getCustomPlans
} from '../services/storageService';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Sparkles, 
  Award,
  Volume2,
  VolumeX,
  Music
} from 'lucide-react';

const Timer = ({ settings, userProfile, onOpenAIPlan, onWorkoutActiveChange }) => {
  // Trạng thái bài tập
  const [selectedGender, setSelectedGender] = useState(userProfile.gender || 'male');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedPresetType, setSelectedPresetType] = useState('nightRecovery'); // 'goodMorning' | 'powerCombo' | 'nightRecovery' | 'custom'
  const [customPlansList, setCustomPlansList] = useState(getCustomPlans());
  const [selectedCustomPlan, setSelectedCustomPlan] = useState(null);

  // Trạng thái đếm nhịp
  const [isActive, setIsActive] = useState(false);

  // Đồng bộ trạng thái bài tập đang chạy với ứng dụng để khóa chuyển Tab
  useEffect(() => {
    if (onWorkoutActiveChange) {
      onWorkoutActiveChange(isActive);
    }
  }, [isActive, onWorkoutActiveChange]);
  const [actionState, setActionState] = useState('idle'); // 'idle' | 'squeezing' | 'relaxing' | 'reverse' | 'transition' | 'breathing'
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [currentRep, setCurrentRep] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(1);
  const [stageDuration, setStageDuration] = useState(1);

  // Thống kê buổi tập đang diễn ra
  const [sessionSqueezes, setSessionSqueezes] = useState(0);
  const [sessionReverseKegels, setSessionReverseKegels] = useState(0);
  const [sessionTotalSeconds, setSessionTotalSeconds] = useState(0);

  // Hộp thoại chúc mừng & cảnh báo đi tiểu
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedSummary, setCompletedSummary] = useState(null);

  // Quick sound toggles
  const [sfxEnabled, setSfxEnabled] = useState(settings.soundEnabled ?? true);
  const [bgmActive, setBgmActive] = useState(settings.bgmEnabled ?? false);

  // Lấy cấu hình các stages của bài tập hiện tại
  const getCurrentStages = () => {
    if (selectedPresetType === 'custom' && selectedCustomPlan) {
      return selectedCustomPlan.stages || [
        { type: 'normal', squeeze: 3, relax: 3, reps: 15, label: 'Siết Tùy Chỉnh 3s' }
      ];
    }
    const lvl = CLINICAL_LEVELS[selectedLevel]?.[selectedGender] || CLINICAL_LEVELS[1].male;
    const preset = lvl[selectedPresetType] || lvl.nightRecovery || lvl.goodMorning;
    return preset.stages;
  };

  const getCurrentRoutineObj = () => {
    if (selectedPresetType === 'custom' && selectedCustomPlan) {
      return {
        name: selectedCustomPlan.planName || 'Giáo Án Tùy Chỉnh AI',
        meta: `${selectedCustomPlan.stages?.length || 0} chặng tập đa giai đoạn`,
        icon: '★'
      };
    }
    const lvl = CLINICAL_LEVELS[selectedLevel]?.[selectedGender] || CLINICAL_LEVELS[1].male;
    return lvl[selectedPresetType] || lvl.nightRecovery || lvl.goodMorning;
  };

  const currentStages = getCurrentStages();
  const currentStage = currentStages[currentStageIndex] || currentStages[0];
  const currentRoutine = getCurrentRoutineObj();

  // Tính tổng số lượt tập trong toàn bộ bài
  const totalRoutineReps = currentStages.reduce((sum, st) => {
    if (st.type === 'transition') return sum;
    return sum + (st.reps || 0);
  }, 0);

  // Tổng số lượt tập đã hoàn thành tới thời điểm hiện tại
  const currentCompletedReps = currentStages.slice(0, currentStageIndex).reduce((sum, st) => {
    if (st.type === 'transition') return sum;
    return sum + (st.reps || 0);
  }, 0) + (actionState !== 'idle' ? currentRep - 1 : 0);

  // Khởi tạo thời gian khi đổi bài tập
  useEffect(() => {
    if (!isActive) {
      setCurrentStageIndex(0);
      setCurrentRep(1);
      setActionState('idle');
      const firstStage = currentStages[0];
      if (firstStage) {
        if (firstStage.type === 'transition') {
          setTimeRemaining(firstStage.relax || 10);
          setStageDuration(firstStage.relax || 10);
        } else {
          setTimeRemaining(firstStage.squeeze || 1);
          setStageDuration(firstStage.squeeze || 1);
        }
      }
      setSessionSqueezes(0);
      setSessionReverseKegels(0);
      setSessionTotalSeconds(0);
    }
  }, [selectedLevel, selectedGender, selectedPresetType, selectedCustomPlan]);

  // Quản lý Screen Wake Lock & BGM
  useEffect(() => {
    if (isActive) {
      requestWakeLock();
      if (bgmActive) audioEngine.startBGM();
    } else {
      releaseWakeLock();
      audioEngine.stopBGM();
    }
    return () => {
      releaseWakeLock();
      audioEngine.stopBGM();
    };
  }, [isActive, bgmActive]);

  // Main Engine Interval Loop
  useEffect(() => {
    let timer = null;

    if (isActive) {
      timer = setInterval(() => {
        setSessionTotalSeconds(s => s + 1);

        setTimeRemaining(prev => {
          if (prev > 1) {
            // Beep đếm ngược 3s cuối nếu là lượt siết dài
            if (prev <= 4 && stageDuration >= 5 && sfxEnabled) {
              audioEngine.playBeep(800, 0.08, 0.2);
              triggerHapticHeartbeat();
            }

            // Cập nhật Live Activities & Dynamic Island trên màn hình khóa
            liveActivityService.updateLiveActivity({
              actionState,
              timeRemaining: prev - 1,
              currentRep,
              totalReps: totalRoutineReps,
              stageLabel: currentStage?.label || (actionState === 'squeezing' ? 'Siết cơ PC' : actionState === 'relaxing' ? 'Thả lỏng' : 'Kegel ngược')
            });

            return prev - 1;
          } else {
            // Hết giây của phase hiện tại -> Chuyển đổi trạng thái kế tiếp
            handlePhaseTransition();
            return 0;
          }
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isActive, actionState, currentStageIndex, currentRep, stageDuration]);

  // Xử lý chuyển đổi giữa Siết (Squeeze) <-> Thả lỏng (Relax) <-> Sang Rep tiếp theo hoặc Chặng tiếp theo
  const handlePhaseTransition = () => {
    const stage = currentStages[currentStageIndex];
    if (!stage) return;

    if (stage.type === 'transition') {
      advanceToNextStage();
      return;
    }

    if (actionState === 'squeezing' || actionState === 'reverse' || actionState === 'breathing') {
      if (stage.type === 'reverse') {
        setSessionReverseKegels(r => r + 1);
      } else {
        setSessionSqueezes(s => s + 1);
      }

      if (stage.relax > 0) {
        setActionState('relaxing');
        setTimeRemaining(stage.relax);
        setStageDuration(stage.relax);
        if (sfxEnabled) audioEngine.playRelaxSFX(settings.actionSounds);
        triggerHapticMedium();
      } else {
        advanceRepOrStage();
      }
    } else if (actionState === 'relaxing' || actionState === 'idle') {
      advanceRepOrStage();
    }
  };

  const advanceRepOrStage = () => {
    const stage = currentStages[currentStageIndex];
    if (!stage) return;

    if (currentRep < stage.reps) {
      setCurrentRep(r => r + 1);
      startSqueezePhase(stage);
    } else {
      advanceToNextStage();
    }
  };

  const advanceToNextStage = () => {
    if (currentStageIndex < currentStages.length - 1) {
      const nextIndex = currentStageIndex + 1;
      setCurrentStageIndex(nextIndex);
      setCurrentRep(1);
      const nextStage = currentStages[nextIndex];

      if (nextStage.type === 'transition') {
        setActionState('transition');
        setTimeRemaining(nextStage.relax || 10);
        setStageDuration(nextStage.relax || 10);
        if (sfxEnabled) audioEngine.playTransitionRestSFX(settings.actionSounds);
        triggerHapticHeavy();
      } else {
        startSqueezePhase(nextStage);
      }
    } else {
      completeSession();
    }
  };

  const startSqueezePhase = (stage) => {
    if (stage.type === 'reverse') {
      setActionState('reverse');
      setTimeRemaining(stage.squeeze);
      setStageDuration(stage.squeeze);
      if (sfxEnabled) audioEngine.playReverseKegelSFX(settings.actionSounds);
      triggerHapticHeavy();
    } else if (stage.type === 'breathing') {
      setActionState('breathing');
      setTimeRemaining(stage.squeeze);
      setStageDuration(stage.squeeze);
      if (sfxEnabled) audioEngine.playSoundPreset('preset_45');
      triggerHapticMedium();
    } else {
      setActionState('squeezing');
      setTimeRemaining(stage.squeeze);
      setStageDuration(stage.squeeze);
      if (sfxEnabled) audioEngine.playSqueezeSFX(settings.actionSounds);
      triggerHapticHeavy();
    }
  };

  const handleStartWorkout = () => {
    audioEngine.resumeContext();
    setIsActive(true);

    if (actionState === 'idle') {
      const stage = currentStages[0];
      if (stage) {
        if (stage.type === 'transition') {
          setActionState('transition');
          setTimeRemaining(stage.relax || 10);
          setStageDuration(stage.relax || 10);
          if (sfxEnabled) audioEngine.playTransitionRestSFX(settings.actionSounds);
        } else {
          startSqueezePhase(stage);
        }
      }
    }

    // Kích hoạt Live Activities & Dynamic Island trên màn hình khóa
    liveActivityService.startLiveActivity({
      routineName: currentRoutine.name,
      totalReps: totalRoutineReps,
      actionState: 'squeezing',
      timeRemaining: currentStages[0]?.squeeze || 1,
      currentRep: 1,
      stageLabel: currentStages[0]?.label || 'Siết cơ PC'
    });
  };

  const handlePauseWorkout = () => {
    setIsActive(false);
    triggerHapticMedium();
    liveActivityService.stopLiveActivity();
  };

  const handleResetWorkout = () => {
    setIsActive(false);
    setActionState('idle');
    setCurrentStageIndex(0);
    setCurrentRep(1);
    setSessionSqueezes(0);
    setSessionReverseKegels(0);
    setSessionTotalSeconds(0);
    const firstStage = currentStages[0];
    if (firstStage) {
      setTimeRemaining(firstStage.squeeze || 1);
      setStageDuration(firstStage.squeeze || 1);
    }
    triggerHapticMedium();
    liveActivityService.stopLiveActivity();
  };

  const completeSession = () => {
    setIsActive(false);
    setActionState('idle');
    triggerHapticSuccess();
    if (sfxEnabled) audioEngine.playCompletionSFX(settings.actionSounds);
    liveActivityService.stopLiveActivity();

    const sessionData = {
      level: selectedPresetType === 'custom' ? 'custom' : selectedLevel,
      routineType: selectedPresetType,
      routineName: currentRoutine.name,
      gender: selectedGender,
      durationSeconds: sessionTotalSeconds,
      totalSqueezes: sessionSqueezes,
      totalReverseKegels: sessionReverseKegels
    };

    const { newlyUnlocked } = saveHistorySession(sessionData);

    setCompletedSummary({
      ...sessionData,
      newlyUnlocked
    });
    setShowCelebration(true);
  };

  return (
    <div className="p-4 sm:p-5 space-y-5 max-w-lg mx-auto">
      {/* 1. KHU VỰC ĐỒNG HỒ & BÀI TẬP CHÍNH (TRAINER CARD ĐỒNG BỘ SÁNG / TỐI) */}
      <div className="glass-panel rounded-[32px] p-5 border border-slate-200 dark:border-white/10 space-y-4 shadow-md dark:shadow-xl transition-colors duration-300">
        {/* Nút bật/tắt nhanh âm thanh (Âm báo & Nhạc nền dạng Pill) */}
        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={() => {
              const next = !sfxEnabled;
              setSfxEnabled(next);
              if (next) audioEngine.playBeep(880, 0.1, 0.3);
            }}
            className={`flex items-center space-x-2 py-2 px-5 rounded-full border text-xs font-bold transition-all active:scale-95 ${
              sfxEnabled 
                ? 'bg-slate-200/90 dark:bg-white/10 border-slate-300 dark:border-white/15 text-slate-900 dark:text-white shadow-xs'
                : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400 dark:text-gray-500'
            }`}
          >
            {sfxEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span>Âm báo</span>
          </button>

          <button
            onClick={() => {
              const next = !bgmActive;
              setBgmActive(next);
              if (next && isActive) audioEngine.startBGM();
              else if (!next) audioEngine.stopBGM();
            }}
            className={`flex items-center space-x-2 py-2 px-5 rounded-full border text-xs font-bold transition-all active:scale-95 ${
              bgmActive 
                ? 'bg-slate-200/90 dark:bg-white/10 border-slate-300 dark:border-white/15 text-slate-900 dark:text-white shadow-xs'
                : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400 dark:text-gray-500'
            }`}
          >
            <Music size={15} />
            <span>Nhạc nền</span>
          </button>
        </div>

        {/* Quả Cầu Visualizer 3D Sinh Học (Sáng & Tối) */}
        <OrbVisualizer
          actionState={actionState}
          timeRemaining={timeRemaining}
          currentRep={currentRep}
          totalReps={currentStage?.reps || 0}
          stageLabel={currentStage?.label || ''}
          routineName={currentRoutine.name}
          totalRoutineReps={totalRoutineReps}
          isActive={isActive}
        />

        {/* Chi tiết Lượt tập & Thanh tiến trình logic cũ (Chặng đã hoàn thành sẽ tự động ẩn đi) */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-sm font-extrabold text-slate-800 dark:text-gray-200">
            <span>Lượt tập:</span>
            <span className="font-mono text-base text-cyan-600 dark:text-cyan-400 font-black">
              {currentCompletedReps} / {totalRoutineReps}
            </span>
          </div>

          {/* Thanh Tiến Trình Phân Đoạn (Chặng đã hoàn thành tự động trượt ẩn sang trái) */}
          <div className="h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden flex gap-1 p-0.5">
            {currentStages.map((st, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              if (isPast) {
                // ĐÃ HOÀN THÀNH -> Ẩn hoàn toàn chặng này
                return (
                  <div
                    key={idx}
                    className="w-0 max-w-0 min-w-0 opacity-0 pointer-events-none -mr-1 scale-x-0 transition-all duration-500 overflow-hidden"
                  />
                );
              }

              const stagePercent = isCurrent 
                ? Math.min(100, Math.round(((actionState === 'idle' ? 0 : currentRep) / (st.reps || 1)) * 100))
                : 0;

              return (
                <div 
                  key={idx} 
                  className="h-full flex-1 bg-slate-300/70 dark:bg-white/5 rounded-full overflow-hidden relative transition-all duration-500"
                >
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-teal-400 transition-all duration-500 rounded-full"
                    style={{ width: `${stagePercent}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Nhãn Giai Đoạn Chi Tiết (Chỉ hiển thị các chặng chưa và đang tập để không bị dồn chữ) */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-gray-400 font-semibold pt-0.5">
            {currentStages.map((st, idx) => {
              if (idx < currentStageIndex) return null; // Ẩn nhãn của chặng đã qua

              const isCurrent = idx === currentStageIndex;
              return (
                <span 
                  key={idx}
                  className={`flex-1 text-center transition-all duration-300 line-clamp-1 px-1 ${
                    isCurrent ? 'text-cyan-600 dark:text-cyan-400 font-extrabold scale-105' : 'text-slate-400 dark:text-gray-500'
                  }`}
                >
                  {st.label || (st.type === 'reverse' ? `Kegel ngược ${st.squeeze}s` : st.type === 'breathing' ? 'Thở bụng' : `Siết ${st.squeeze}s`)}
                </span>
              );
            })}
          </div>
        </div>

        {/* Lời khuyên bàng quang (Hộp Lưu ý màu sắc rõ nét trên cả nền sáng và tối) */}
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/30 rounded-2xl p-3.5 flex items-start space-x-3 text-xs text-red-900 dark:text-red-200">
          <span className="text-lg shrink-0 mt-0.5">🚽</span>
          <div className="text-[11px] leading-relaxed">
            <strong className="text-red-700 dark:text-red-400">Lưu ý:</strong> Nên đi tiểu sạch bàng quang trước khi tập để bảo vệ sức khỏe và đạt hiệu quả tốt nhất.
          </div>
        </div>

        {/* Cụm Nút Điều Khiển Chính (Đặt lại + Bắt đầu dạng Pill) */}
        <div className="flex items-center space-x-3 pt-1">
          <button
            onClick={handleResetWorkout}
            disabled={!isActive && actionState === 'idle'}
            className="w-1/2 py-3.5 rounded-2xl bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white font-extrabold text-sm flex items-center justify-center space-x-2 border border-slate-300 dark:border-white/10 transition-all active:scale-95 disabled:opacity-40"
          >
            <RotateCcw size={16} />
            <span>Đặt lại</span>
          </button>

          {!isActive ? (
            <button
              onClick={handleStartWorkout}
              className="w-1/2 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
            >
              <Play size={16} fill="currentColor" />
              <span>{actionState === 'idle' ? 'Bắt đầu' : 'Tiếp tục'}</span>
            </button>
          ) : (
            <button
              onClick={handlePauseWorkout}
              className="w-1/2 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
            >
              <Pause size={16} fill="currentColor" />
              <span>Tạm dừng</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. KHU VỰC CẤU HÌNH BÀI TẬP (WORKOUT CONFIGURATION CARD CHUẨN SÁNG & TỐI) */}
      <div className="glass-panel rounded-[32px] p-5 border border-slate-200 dark:border-white/10 space-y-4 shadow-md dark:shadow-xl transition-colors duration-300">
        <div>
          <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Cấu Hình Bài Tập
          </h3>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            Chọn bài tập được lập trình sẵn hoặc tùy chỉnh theo ý muốn của bạn.
          </p>
        </div>

        {/* Gender Selection Group */}
        <div className="grid grid-cols-2 gap-2.5 p-1 bg-slate-200/70 dark:bg-white/5 rounded-2xl border border-slate-300/50 dark:border-white/5">
          <button
            onClick={() => { if (!isActive) setSelectedGender('male'); }}
            disabled={isActive}
            className={`py-3 rounded-xl font-extrabold text-sm transition-all ${
              selectedGender === 'male'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Nam giới
          </button>
          <button
            onClick={() => { if (!isActive) setSelectedGender('female'); }}
            disabled={isActive}
            className={`py-3 rounded-xl font-extrabold text-sm transition-all ${
              selectedGender === 'female'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Nữ giới
          </button>
        </div>

        {/* Level Selector Bar */}
        <div className="flex items-center space-x-3 pt-1">
          <span className="text-sm font-bold text-slate-700 dark:text-gray-400 shrink-0">Cấp độ:</span>
          <div className="flex-1 flex items-center justify-between space-x-1.5">
            {[1, 2, 3, 4, 5].map((lvl) => {
              const isSelected = selectedLevel === lvl && selectedPresetType !== 'custom';
              return (
                <button
                  key={lvl}
                  onClick={() => {
                    if (!isActive) {
                      setSelectedLevel(lvl);
                      if (selectedPresetType === 'custom') setSelectedPresetType('nightRecovery');
                    }
                  }}
                  disabled={isActive}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                    isSelected
                      ? 'bg-cyan-400 text-slate-950 shadow-sm'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/5'
                  }`}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        </div>

        {/* Danh Sách Các Bài Tập Trong Cấp Độ Hiện Tại */}
        <div className="space-y-3 pt-2">
          {/* Card 1: Chào Buổi Sáng */}
          <div
            onClick={() => { if (!isActive) setSelectedPresetType('goodMorning'); }}
            className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex items-center space-x-3.5 ${
              selectedPresetType === 'goodMorning'
                ? 'bg-amber-50/80 dark:bg-white/10 border-amber-500 ring-2 ring-amber-500/40 shadow-sm'
                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-amber-500/40'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0">
              🌅
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-black text-amber-600 dark:text-amber-400">
                Chào Buổi Sáng
              </div>
              <div className="text-xs text-slate-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                20 lượt siết 1s - thả 2s | 5 lượt Kegel ngược giãn chậu
              </div>
            </div>
          </div>

          {/* Card 2: Combo Sức Mạnh */}
          <div
            onClick={() => { if (!isActive) setSelectedPresetType('powerCombo'); }}
            className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex items-center space-x-3.5 ${
              selectedPresetType === 'powerCombo'
                ? 'bg-emerald-50/80 dark:bg-white/10 border-emerald-500 ring-2 ring-emerald-500/40 shadow-sm'
                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-emerald-500/40'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xl font-black text-emerald-500 dark:text-emerald-400 shrink-0">
              ★
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-black text-emerald-600 dark:text-neon">
                Combo Sức Mạnh
              </div>
              <div className="text-xs text-slate-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                Siết nhanh 20 lượt 1s | Giữ 24 lượt 3s | Giữ 10 lượt 5s + Cooldown
              </div>
            </div>
          </div>

          {/* Card 3: Phục Hồi Ban Đêm */}
          <div
            onClick={() => { if (!isActive) setSelectedPresetType('nightRecovery'); }}
            className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex items-center space-x-3.5 ${
              selectedPresetType === 'nightRecovery'
                ? 'bg-violet-50/80 dark:bg-white/10 border-violet-500 ring-2 ring-violet-500/40 shadow-sm'
                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-violet-500/40'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-xl shrink-0">
              🌙
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-black text-violet-600 dark:text-violet-400">
                Phục Hồi Ban Đêm
              </div>
              <div className="text-xs text-slate-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                15 lượt siết nhanh | 10 lượt Kegel ngược | 5 lượt hít thở sâu
              </div>
            </div>
          </div>

          {/* Card 4: Thiết Kế Bài Tập Mới (Dashed Border) */}
          <div
            onClick={() => {
              if (!isActive) {
                const plans = getCustomPlans();
                setCustomPlansList(plans);
                if (plans.length > 0) {
                  setSelectedCustomPlan(plans[0]);
                  setSelectedPresetType('custom');
                } else {
                  onOpenAIPlan();
                }
              }
            }}
            className={`p-4 rounded-2xl border border-dashed border-slate-300 dark:border-white/20 text-left cursor-pointer transition-all flex items-center space-x-3.5 hover:border-cyan-500/50 ${
              selectedPresetType === 'custom'
                ? 'bg-cyan-500/10 border-cyan-500 ring-2 ring-cyan-500/40'
                : 'bg-transparent'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg font-black text-amber-500 shrink-0">
              C
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-1.5">
                <span>Thiết Kế Bài Tập Mới</span>
                <Sparkles size={13} className="text-cyan-500" />
              </div>
              <div className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                Tùy chỉnh đa giai đoạn, nghỉ chuyển chặng & Kegel ngược
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CELEBRATION MODAL (HOÀN THÀNH BUỔI TẬP) */}
      {showCelebration && completedSummary && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 border border-emerald-500/40 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 dark:text-neon mx-auto flex items-center justify-center text-3xl border border-emerald-500/40 shadow-neon animate-bounce">
              🎉
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                XUẤT SẮC HOÀN THÀNH!
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                {completedSummary.routineName}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-white/5 p-3 rounded-2xl border border-slate-200 dark:border-white/5 text-center">
              <div>
                <div className="text-[10px] text-slate-400">Lượt Siết</div>
                <div className="text-base font-black text-emerald-600 dark:text-neon mt-0.5">
                  {completedSummary.totalSqueezes}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Kegel Ngược</div>
                <div className="text-base font-black text-cyan-600 dark:text-cyan-neon mt-0.5">
                  {completedSummary.totalReverseKegels}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Thời Gian</div>
                <div className="text-base font-black text-amber-500 mt-0.5">
                  {Math.floor(completedSummary.durationSeconds / 60)}p {completedSummary.durationSeconds % 60}s
                </div>
              </div>
            </div>

            {completedSummary.newlyUnlocked && completedSummary.newlyUnlocked.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-2.5 text-left flex items-center space-x-2.5">
                <Award size={22} className="text-amber-500 shrink-0" />
                <div className="text-xs">
                  <strong className="text-amber-500">Mở khóa huy hiệu mới:</strong>
                  <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                    {completedSummary.newlyUnlocked[0].icon} {completedSummary.newlyUnlocked[0].name}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowCelebration(false)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-lg active:scale-95 transition-all"
            >
              Tiếp Tục Rèn Luyện
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timer;
