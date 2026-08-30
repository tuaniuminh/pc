import React, { useState, useEffect } from 'react';
import OrbVisualizer from './UI/OrbVisualizer';
import { audioEngine } from '../utils/audioEngine';
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
  CheckCircle2, 
  Award,
  Volume2,
  VolumeX,
  Music,
  AlertTriangle
} from 'lucide-react';

const Timer = ({ settings, userProfile, onOpenAIPlan, onToggleSFX, onToggleBGM }) => {
  // Trạng thái bài tập
  const [selectedGender, setSelectedGender] = useState(userProfile.gender || 'male');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedPresetType, setSelectedPresetType] = useState('goodMorning'); // 'goodMorning' | 'powerCombo' | 'nightRecovery' | 'custom'
  const [customPlansList, setCustomPlansList] = useState(getCustomPlans());
  const [selectedCustomPlan, setSelectedCustomPlan] = useState(null);

  // Trạng thái đếm nhịp
  const [isActive, setIsActive] = useState(false);
  const [actionState, setActionState] = useState('idle'); // 'idle' | 'squeezing' | 'relaxing' | 'reverse' | 'transition' | 'breathing'
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [currentRep, setCurrentRep] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [stageDuration, setStageDuration] = useState(1);

  // Thống kê buổi tập đang diễn ra
  const [sessionSqueezes, setSessionSqueezes] = useState(0);
  const [sessionReverseKegels, setSessionReverseKegels] = useState(0);
  const [sessionTotalSeconds, setSessionTotalSeconds] = useState(0);

  // Hộp thoại chúc mừng & cảnh báo đi tiểu
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedSummary, setCompletedSummary] = useState(null);
  const [showBladderWarning, setShowBladderWarning] = useState(true);

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
    const preset = lvl[selectedPresetType] || lvl.goodMorning;
    return preset.stages;
  };

  const getCurrentRoutineName = () => {
    if (selectedPresetType === 'custom' && selectedCustomPlan) {
      return selectedCustomPlan.planName || 'Giáo Án AI Cá Nhân Hóa';
    }
    const lvl = CLINICAL_LEVELS[selectedLevel]?.[selectedGender] || CLINICAL_LEVELS[1].male;
    const preset = lvl[selectedPresetType] || lvl.goodMorning;
    return `Cấp ${selectedLevel}: ${preset.name}`;
  };

  const currentStages = getCurrentStages();
  const currentStage = currentStages[currentStageIndex] || currentStages[0];

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
    setShowBladderWarning(false);
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
  };

  const handlePauseWorkout = () => {
    setIsActive(false);
    triggerHapticMedium();
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
  };

  const handleSkipStage = () => {
    if (!isActive) return;
    advanceToNextStage();
    triggerHapticMedium();
  };

  const completeSession = () => {
    setIsActive(false);
    setActionState('idle');
    triggerHapticSuccess();
    if (sfxEnabled) audioEngine.playCompletionSFX(settings.actionSounds);

    const sessionData = {
      level: selectedPresetType === 'custom' ? 'custom' : selectedLevel,
      routineType: selectedPresetType,
      routineName: getCurrentRoutineName(),
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
    <div className="flex flex-col h-full max-w-lg mx-auto px-4 py-1 justify-between">
      {/* 1. KHU VỰC ĐỒNG HỒ & BÀI TẬP CHÍNH (TRAINER CARD CHUẨN V1.2.41) */}
      <div className="glass-panel rounded-3xl p-3.5 border border-slate-200 dark:border-white/10 flex flex-col items-center justify-between relative shadow-sm">
        {/* Nút bật/tắt nhanh âm thanh (Âm báo & Nhạc nền) */}
        <div className="w-full flex items-center justify-between pb-1">
          <button
            onClick={() => {
              const next = !sfxEnabled;
              setSfxEnabled(next);
              if (next) audioEngine.playBeep(880, 0.1, 0.3);
            }}
            className={`flex items-center space-x-1.5 py-1 px-2.5 rounded-xl border text-[11px] font-bold transition-all ${
              sfxEnabled 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-neon shadow-sm'
                : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-gray-500'
            }`}
            title="Bật/Tắt âm thanh hiệu ứng"
          >
            {sfxEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>Âm báo</span>
          </button>

          <button
            onClick={() => {
              const next = !bgmActive;
              setBgmActive(next);
              if (next && isActive) audioEngine.startBGM();
              else if (!next) audioEngine.stopBGM();
            }}
            className={`flex items-center space-x-1.5 py-1 px-2.5 rounded-xl border text-[11px] font-bold transition-all ${
              bgmActive 
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-neon shadow-sm'
                : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-gray-500'
            }`}
            title="Bật/Tắt nhạc nền sóng biển thư giãn"
          >
            <Music size={14} />
            <span>Nhạc nền</span>
          </button>
        </div>

        {/* Quả Cầu Visualizer 3D Sinh Học (v1.2.41) */}
        <div className="my-1">
          <OrbVisualizer
            actionState={actionState}
            timeRemaining={timeRemaining}
            currentRep={currentRep}
            totalReps={currentStage?.reps || 0}
            stageLabel={currentStage?.label || ''}
            isActive={isActive}
          />
        </div>

        {/* Lời khuyên bàng quang */}
        {showBladderWarning && (
          <div className="w-full bg-amber-500/10 border border-amber-500/25 rounded-xl p-2 mb-2 flex items-center space-x-2 text-[10px] text-amber-700 dark:text-amber-300">
            <AlertTriangle size={13} className="shrink-0 text-amber-500" />
            <span><strong>Lời khuyên:</strong> Hãy đi tiểu sạch trước khi tập để bảo vệ bàng quang tốt nhất.</span>
          </div>
        )}

        {/* Cụm Nút Điều Khiển Chính (Đặt lại + Bắt đầu / Tạm dừng) */}
        <div className="w-full flex items-center space-x-2.5 pt-0.5">
          <button
            onClick={handleResetWorkout}
            disabled={!isActive && actionState === 'idle'}
            className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 border border-slate-200 dark:border-white/10"
            title="Đặt lại từ đầu"
          >
            <RotateCcw size={18} />
          </button>

          {!isActive ? (
            <button
              onClick={handleStartWorkout}
              className="flex-1 h-12 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-neon to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/30 flex items-center justify-center space-x-2 active:scale-95 transition-all"
            >
              <Play size={18} fill="currentColor" />
              <span>{actionState === 'idle' ? 'BẮT ĐẦU TẬP' : 'TIẾP TỤC'}</span>
            </button>
          ) : (
            <button
              onClick={handlePauseWorkout}
              className="flex-1 h-12 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/30 flex items-center justify-center space-x-2 active:scale-95 transition-all"
            >
              <Pause size={18} fill="currentColor" />
              <span>TẠM DỪNG</span>
            </button>
          )}

          <button
            onClick={handleSkipStage}
            disabled={!isActive}
            className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 border border-slate-200 dark:border-white/10"
            title="Bỏ qua sang chặng tiếp theo"
          >
            <SkipForward size={18} />
          </button>
        </div>
      </div>

      {/* 2. KHU VỰC CẤU HÌNH BÀI TẬP (LEVEL & ROUTINE SELECTOR CHUẨN V1.2.41) */}
      <div className="space-y-1.5 pt-1">
        {/* Gender + Level Selector Bar */}
        <div className="flex items-center space-x-1.5">
          {/* Nút chọn Giới tính Nam/Nữ */}
          <div className="flex bg-slate-200/80 dark:bg-white/5 p-0.5 rounded-xl border border-slate-300/60 dark:border-white/10 shrink-0">
            <button
              onClick={() => { if (!isActive) setSelectedGender('male'); }}
              disabled={isActive}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                selectedGender === 'male'
                  ? 'bg-blue-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-gray-400'
              }`}
            >
              Nam
            </button>
            <button
              onClick={() => { if (!isActive) setSelectedGender('female'); }}
              disabled={isActive}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                selectedGender === 'female'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-gray-400'
              }`}
            >
              Nữ
            </button>
          </div>

          {/* Cấp độ Tabs (1 - 5 + AI) */}
          <div className="flex-1 flex items-center justify-between bg-slate-200/80 dark:bg-white/5 p-0.5 rounded-xl border border-slate-300/60 dark:border-white/10">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  if (!isActive) {
                    setSelectedLevel(lvl);
                    if (selectedPresetType === 'custom') setSelectedPresetType('goodMorning');
                  }
                }}
                disabled={isActive}
                className={`flex-1 py-1 rounded-lg text-[11px] font-black transition-all ${
                  selectedLevel === lvl && selectedPresetType !== 'custom'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-gray-400'
                }`}
              >
                Cấp {lvl}
              </button>
            ))}
            <button
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
              disabled={isActive}
              className={`px-2 py-1 rounded-lg text-[11px] font-black transition-all flex items-center space-x-0.5 ${
                selectedPresetType === 'custom'
                  ? 'bg-cyan-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-gray-400'
              }`}
            >
              <Sparkles size={10} />
              <span>AI</span>
            </button>
          </div>
        </div>

        {/* 3 Bài tập mẫu trong Cấp độ hiện tại */}
        {selectedPresetType !== 'custom' ? (
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { type: 'goodMorning', name: 'Chào Buổi Sáng', icon: '🌅' },
              { type: 'powerCombo', name: 'Combo Sức Mạnh', icon: '⚡' },
              { type: 'nightRecovery', name: 'Phục Hồi Đêm', icon: '🌙' },
            ].map((p) => {
              const isSelected = selectedPresetType === p.type;
              return (
                <button
                  key={p.type}
                  onClick={() => { if (!isActive) setSelectedPresetType(p.type); }}
                  disabled={isActive}
                  className={`p-2 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-emerald-50/90 dark:bg-emerald-500/15 border-emerald-500 shadow-sm ring-1 ring-emerald-500/40'
                      : 'bg-white/80 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-75'
                  }`}
                >
                  <div className="text-sm">{p.icon}</div>
                  <div className="text-[11px] font-black text-slate-900 dark:text-white mt-0.5 line-clamp-1">
                    {p.name}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel p-2 rounded-2xl border border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles size={16} className="text-cyan-500" />
              <div>
                <div className="text-xs font-black text-slate-900 dark:text-white">
                  {selectedCustomPlan ? selectedCustomPlan.planName : "Chưa chọn giáo án"}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-gray-400">
                  {selectedCustomPlan?.stages?.length || 0} chặng tập do Gemini thiết kế
                </div>
              </div>
            </div>
            <button
              onClick={onOpenAIPlan}
              className="py-1 px-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-neon border border-cyan-500/30 text-[10px] font-bold"
            >
              Đổi Bài
            </button>
          </div>
        )}

        {/* Chỉ số nhanh buổi tập */}
        <div className="flex items-center justify-around py-1 px-3 bg-white/70 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 text-[10px] text-slate-600 dark:text-gray-300 font-semibold">
          <span>⚡ Đã siết: <strong className="text-emerald-600 dark:text-neon">{sessionSqueezes}</strong></span>
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
          <span>🌊 Ngược: <strong className="text-cyan-600 dark:text-cyan-neon">{sessionReverseKegels}</strong></span>
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
          <span>⏱️ Thời gian: <strong>{Math.floor(sessionTotalSeconds / 60)}p {sessionTotalSeconds % 60}s</strong></span>
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
