import React, { useState, useEffect, useRef } from 'react';
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
  getCustomPlans,
  getActiveRoutine,
  saveActiveRoutine
} from '../services/storageService';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle,
  Award,
  ChevronRight,
  Layers,
  Clock,
  Zap,
  Volume2,
  VolumeX
} from 'lucide-react';

const Timer = ({ settings, userProfile, onOpenAIPlan }) => {
  // Lấy dữ liệu bài tập
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedPresetType, setSelectedPresetType] = useState('goodMorning'); // 'goodMorning' | 'powerCombo' | 'nightRecovery' | 'custom'
  const [customPlansList, setCustomPlansList] = useState(getCustomPlans());
  const [selectedCustomPlan, setSelectedCustomPlan] = useState(null);

  // Trạng thái vòng lặp bài tập
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

  // Lấy cấu hình các stages của bài tập hiện tại
  const getCurrentStages = () => {
    if (selectedPresetType === 'custom' && selectedCustomPlan) {
      return selectedCustomPlan.stages || [
        { type: 'normal', squeeze: 3, relax: 3, reps: 15, label: 'Siết Tùy Chỉnh 3s' }
      ];
    }
    const gender = userProfile.gender || 'male';
    const lvl = CLINICAL_LEVELS[selectedLevel]?.[gender] || CLINICAL_LEVELS[1].male;
    const preset = lvl[selectedPresetType] || lvl.goodMorning;
    return preset.stages;
  };

  const getCurrentRoutineName = () => {
    if (selectedPresetType === 'custom' && selectedCustomPlan) {
      return selectedCustomPlan.planName || 'Giáo Án AI Cá Nhân Hóa';
    }
    const gender = userProfile.gender || 'male';
    const lvl = CLINICAL_LEVELS[selectedLevel]?.[gender] || CLINICAL_LEVELS[1].male;
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
  }, [selectedLevel, selectedPresetType, selectedCustomPlan]);

  // Quản lý Screen Wake Lock & BGM
  useEffect(() => {
    if (isActive) {
      requestWakeLock();
      if (settings.bgmEnabled) audioEngine.startBGM();
    } else {
      releaseWakeLock();
      audioEngine.stopBGM();
    }
    return () => {
      releaseWakeLock();
      audioEngine.stopBGM();
    };
  }, [isActive, settings.bgmEnabled]);

  // Main Engine Interval Loop
  useEffect(() => {
    let timer = null;

    if (isActive) {
      timer = setInterval(() => {
        setSessionTotalSeconds(s => s + 1);

        setTimeRemaining(prev => {
          if (prev > 1) {
            // Beep đếm ngược 3s cuối nếu là lượt siết dài
            if (prev <= 4 && stageDuration >= 5 && settings.soundEnabled) {
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
      // Đã xong thời gian nghỉ chuyển bài -> Sang chặng kế tiếp
      advanceToNextStage();
      return;
    }

    if (actionState === 'squeezing') {
      // Vừa siết xong -> Chuyển sang thả lỏng
      if (stage.type === 'reverse') {
        setSessionReverseKegels(r => r + 1);
      } else {
        setSessionSqueezes(s => s + 1);
      }

      if (stage.relax > 0) {
        setActionState('relaxing');
        setTimeRemaining(stage.relax);
        setStageDuration(stage.relax);
        if (settings.soundEnabled) audioEngine.playSoundPreset(settings.reversePreset || 'preset_5');
        triggerHapticMedium();
      } else {
        advanceRepOrStage();
      }
    } else if (actionState === 'relaxing' || actionState === 'idle') {
      // Vừa thả lỏng xong -> Sang Rep tiếp theo hoặc chặng tiếp
      advanceRepOrStage();
    }
  };

  const advanceRepOrStage = () => {
    const stage = currentStages[currentStageIndex];
    if (!stage) return;

    if (currentRep < stage.reps) {
      // Sang Rep tiếp theo trong cùng chặng
      setCurrentRep(r => r + 1);
      startSqueezePhase(stage);
    } else {
      // Đã xong toàn bộ reps của chặng này
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
        if (settings.soundEnabled) audioEngine.playSoundPreset('preset_27');
        triggerHapticHeavy();
      } else {
        startSqueezePhase(nextStage);
      }
    } else {
      // HOÀN THÀNH TOÀN BỘ BUỔI TẬP!
      completeSession();
    }
  };

  const startSqueezePhase = (stage) => {
    if (stage.type === 'reverse') {
      setActionState('reverse');
      setTimeRemaining(stage.squeeze);
      setStageDuration(stage.squeeze);
      if (settings.soundEnabled) audioEngine.playSoundPreset(settings.reversePreset || 'preset_1');
      triggerHapticHeavy();
    } else if (stage.type === 'breathing') {
      setActionState('breathing');
      setTimeRemaining(stage.squeeze);
      setStageDuration(stage.squeeze);
      if (settings.soundEnabled) audioEngine.playSoundPreset('preset_45');
      triggerHapticMedium();
    } else {
      setActionState('squeezing');
      setTimeRemaining(stage.squeeze);
      setStageDuration(stage.squeeze);
      if (settings.soundEnabled) audioEngine.playSoundPreset(settings.soundPreset || 'preset_14');
      triggerHapticHeavy();
    }
  };

  const handleStartWorkout = () => {
    audioEngine.resumeContext();
    setShowBladderWarning(false);
    setIsActive(true);

    if (actionState === 'idle') {
      const firstStage = currentStages[currentStageIndex];
      if (firstStage.type === 'transition') {
        setActionState('transition');
        setTimeRemaining(firstStage.relax || 10);
        setStageDuration(firstStage.relax || 10);
      } else {
        startSqueezePhase(firstStage);
      }
    }
  };

  const handlePauseWorkout = () => {
    setIsActive(false);
  };

  const handleResetWorkout = () => {
    setIsActive(false);
    setActionState('idle');
    setCurrentStageIndex(0);
    setCurrentRep(1);
    const firstStage = currentStages[0];
    setTimeRemaining(firstStage.squeeze || 1);
    setStageDuration(firstStage.squeeze || 1);
    setSessionSqueezes(0);
    setSessionReverseKegels(0);
    setSessionTotalSeconds(0);
  };

  const handleSkipStage = () => {
    if (currentStageIndex < currentStages.length - 1) {
      advanceToNextStage();
    } else {
      completeSession();
    }
  };

  const completeSession = () => {
    setIsActive(false);
    setActionState('idle');
    if (settings.soundEnabled) audioEngine.playSoundPreset('preset_20');
    triggerHapticSuccess();

    const sessionData = {
      level: selectedLevel,
      presetType: selectedPresetType,
      routineName: getCurrentRoutineName(),
      duration: sessionTotalSeconds,
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
    <div className="flex flex-col h-full max-w-lg mx-auto px-4 py-2 justify-between">
      {/* 1. TOP CAROUSEL: CHỌN CẤP ĐỘ (LEVEL 1-5) & BÀI TẬP LÂM SÀNG */}
      <div className="space-y-2.5">
        {/* Cấp độ Tabs (1 - 5) */}
        <div className="flex items-center justify-between bg-slate-200/80 dark:bg-white/5 p-1 rounded-2xl border border-slate-300/60 dark:border-white/10">
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
              className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedLevel === lvl && selectedPresetType !== 'custom'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              } ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1 ${
              selectedPresetType === 'custom'
                ? 'bg-cyan-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-gray-400'
            }`}
          >
            <Sparkles size={12} />
            <span>AI</span>
          </button>
        </div>

        {/* 3 Bài tập mẫu trong Cấp độ hiện tại */}
        {selectedPresetType !== 'custom' ? (
          <div className="grid grid-cols-3 gap-2">
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
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-emerald-50/90 dark:bg-emerald-500/15 border-emerald-500 shadow-sm ring-1 ring-emerald-500/40'
                      : 'bg-white/80 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-75'
                  }`}
                >
                  <div className="text-base">{p.icon}</div>
                  <div className="text-[11px] font-black text-slate-900 dark:text-white mt-1 line-clamp-1">
                    {p.name}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel p-3 rounded-2xl border border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles size={18} className="text-cyan-500" />
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
              className="py-1 px-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-neon border border-cyan-500/30 text-[10px] font-bold"
            >
              Đổi Bài
            </button>
          </div>
        )}
      </div>

      {/* 2. CẢNH BÁO ĐI TIỂU TRƯỚC KHI TẬP */}
      {showBladderWarning && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-2.5 flex items-center space-x-2.5 text-xs text-amber-700 dark:text-amber-300 animate-pulse">
          <AlertTriangle size={16} className="shrink-0 text-amber-500" />
          <div className="text-[11px] leading-tight">
            <strong>Lời khuyên:</strong> Hãy đi tiểu sạch trước khi tập để bảo vệ bàng quang và cảm nhận cơ sàn chậu tốt nhất.
          </div>
        </div>
      )}

      {/* 3. BỘ ĐỒNG HỒ HUD & QUẢ CẦU VISUALIZER TRUNG TÂM */}
      <div className="my-auto py-2 flex flex-col items-center justify-center">
        <OrbVisualizer
          actionState={actionState}
          timeRemaining={timeRemaining}
          stageDuration={stageDuration}
          currentRep={currentRep}
          totalReps={currentStage?.reps || 0}
          stageLabel={currentStage?.label || ''}
          stageIndex={currentStageIndex}
          totalStages={currentStages.length}
          isActive={isActive}
        />

        {/* Thanh Tiến Trình Phân Đoạn (Segmented Stage Progress Bar) */}
        <div className="w-full max-w-[280px] mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-gray-400">
            <span>Chặng {currentStageIndex + 1} / {currentStages.length}</span>
            <span className="text-emerald-600 dark:text-neon">
              {currentStage?.type === 'reverse' ? '🌊 Kegel Ngược' : currentStage?.type === 'transition' ? '⏳ Nghỉ' : '⚡ Siết Cơ'}
            </span>
          </div>
          <div className="flex space-x-1.5 h-2 bg-slate-200 dark:bg-white/10 rounded-full p-0.5 overflow-hidden">
            {currentStages.map((st, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div
                  key={idx}
                  className={`h-full rounded-full transition-all duration-300 ${
                    isPast
                      ? 'bg-emerald-500 flex-1'
                      : isCurrent
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 flex-1 ring-1 ring-white/50'
                      : 'bg-slate-300 dark:bg-white/10 flex-1'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. NÚT ĐIỀU KHIỂN KHỔNG LỒ (BẮT ĐẦU / TẠM DỪNG / KẾT THÚC) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center space-x-3">
          {/* Nút Reset */}
          <button
            onClick={handleResetWorkout}
            disabled={!isActive && actionState === 'idle'}
            className="w-14 h-14 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
            title="Đặt lại từ đầu"
          >
            <RotateCcw size={20} />
          </button>

          {/* Nút Chính Khổng Lồ */}
          {!isActive ? (
            <button
              onClick={handleStartWorkout}
              className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-emerald-500 via-neon to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-oled dark:text-oled font-black text-base uppercase tracking-wider shadow-lg shadow-emerald-500/30 flex items-center justify-center space-x-2.5 active:scale-95 transition-all"
            >
              <Play size={22} fill="currentColor" />
              <span>{actionState === 'idle' ? 'BẮT ĐẦU TẬP' : 'TIẾP TỤC'}</span>
            </button>
          ) : (
            <button
              onClick={handlePauseWorkout}
              className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-base uppercase tracking-wider shadow-lg shadow-amber-500/30 flex items-center justify-center space-x-2.5 active:scale-95 transition-all"
            >
              <Pause size={22} fill="currentColor" />
              <span>TẠM DỪNG</span>
            </button>
          )}

          {/* Nút Bỏ qua chặng */}
          <button
            onClick={handleSkipStage}
            disabled={!isActive}
            className="w-14 h-14 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
            title="Bỏ qua sang chặng tiếp theo"
          >
            <SkipForward size={20} />
          </button>
        </div>

        {/* Chỉ số nhanh buổi tập hiện tại */}
        <div className="flex items-center justify-around py-1.5 px-3 bg-white/60 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 text-[11px] text-slate-600 dark:text-gray-300 font-semibold">
          <span>⚡ Đã siết: <strong className="text-emerald-600 dark:text-neon">{sessionSqueezes}</strong></span>
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
          <span>🌊 Ngược: <strong className="text-cyan-600 dark:text-cyan-neon">{sessionReverseKegels}</strong></span>
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
          <span>⏱️ Thời gian: <strong>{Math.floor(sessionTotalSeconds / 60)}p {sessionTotalSeconds % 60}s</strong></span>
        </div>
      </div>

      {/* 5. CELEBRATION MODAL (HOÀN THÀNH BUỔI TẬP) */}
      {showCelebration && completedSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-sm p-6 rounded-3xl space-y-4 border border-emerald-500/40 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 dark:text-neon flex items-center justify-center mx-auto shadow-neon animate-bounce">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">XUẤT SẮC!</h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                Bạn đã hoàn thành trọn vẹn bài tập: <br />
                <strong className="text-emerald-600 dark:text-neon">{completedSummary.routineName}</strong>
              </p>
            </div>

            {/* Chỉ số hoàn thành */}
            <div className="grid grid-cols-3 gap-2 py-2">
              <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <div className="text-xs text-slate-400">Lượt Siết</div>
                <div className="text-lg font-black text-emerald-600 dark:text-neon">{completedSummary.totalSqueezes}</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <div className="text-xs text-slate-400">Kegel Ngược</div>
                <div className="text-lg font-black text-cyan-600 dark:text-cyan-neon">{completedSummary.totalReverseKegels}</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <div className="text-xs text-slate-400">Thời Lượng</div>
                <div className="text-lg font-black text-amber-500">{Math.round(completedSummary.duration / 60)}p</div>
              </div>
            </div>

            {/* Huy hiệu mới mở khóa nếu có */}
            {completedSummary.newlyUnlocked?.length > 0 && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-left space-y-1">
                <div className="text-[10px] font-extrabold uppercase text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                  <Award size={12} />
                  <span>MỞ KHÓA HUY HIỆU MỚI!</span>
                </div>
                {completedSummary.newlyUnlocked.map((b) => (
                  <div key={b.id} className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <span>{b.icon}</span>
                    <span>{b.name} - {b.desc}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowCelebration(false)}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-neon active:scale-95 transition-all"
            >
              TIẾP TỤC & ĐÓNG
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timer;
