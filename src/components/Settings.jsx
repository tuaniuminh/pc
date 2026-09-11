import React, { useState, useRef } from 'react';
import { 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Volume2, 
  ExternalLink,
  Play, 
  Vibrate, 
  User, 
  Download, 
  Upload, 
  Music, 
  Check, 
  Headphones, 
  Bug,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Info
} from 'lucide-react';
import { testGeminiApiKey } from '../services/geminiService';
import { 
  audioEngine, 
  SOUND_STUDIO_PRESETS, 
  SOUND_CATEGORIES, 
  SOUND_ACTIONS 
} from '../utils/audioEngine';
import { exportBackupJSON, importBackupJSON } from '../services/storageService';
import { triggerHapticMedium, triggerHapticLight } from '../utils/hapticsUtils';

const SETTINGS_APP_VERSION = 'v2.2.31';

const Settings = ({ settings, onUpdateSettings, onNavigateToAI }) => {
  // Navigation & Subpage State
  const [activeSubpage, setActiveSubpage] = useState(null); // null | 'sound_studio' | 'haptics' | 'profile' | 'gemini' | 'backup' | 'debug'
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartRef = useRef({ x: 0, y: 0, isEdge: false, isHorizontal: false });

  const [showKey, setShowKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [backupMessage, setBackupMessage] = useState(null);

  // Sound Studio State
  const [activeActionKey, setActiveActionKey] = useState('squeeze'); // 'squeeze' | 'relax' | 'reverse' | 'transition' | 'complete'
  const [activeCategory, setActiveCategory] = useState('all');

  const actionSounds = settings.actionSounds || {
    squeeze: 'preset_14',
    relax: 'preset_5',
    reverse: 'preset_1',
    transition: 'preset_27',
    complete: 'preset_20'
  };

  // ==================== CỬ CHỈ NATIVE VUỐT MÉP TRÁI ĐỂ TRỞ VỀ ====================
  const handleTouchStart = (e) => {
    if (!activeSubpage) return;
    const touch = e.touches[0];
    const isEdge = touch.clientX <= 55;
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      isEdge,
      isHorizontal: false
    };
  };

  const handleTouchMove = (e) => {
    if (!activeSubpage || !touchStartRef.current.isEdge) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    if (deltaX < 0) return;

    if (!touchStartRef.current.isHorizontal) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (absX > 8 && absX > absY * 1.2) {
        touchStartRef.current.isHorizontal = true;
        setIsDragging(true);
      } else if (absY > 8) {
        touchStartRef.current.isEdge = false;
        return;
      }
    }

    if (touchStartRef.current.isHorizontal) {
      if (e.cancelable) e.preventDefault();
      setDragOffset(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (!activeSubpage) return;
    if (touchStartRef.current.isEdge && touchStartRef.current.isHorizontal) {
      if (dragOffset > 75) {
        triggerHapticLight();
        setActiveSubpage(null);
      }
    }
    setDragOffset(0);
    setIsDragging(false);
    touchStartRef.current = { x: 0, y: 0, isEdge: false, isHorizontal: false };
  };

  const navigateTo = (subpage) => {
    setActiveSubpage(subpage);
    triggerHapticLight();
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const goBack = () => {
    setActiveSubpage(null);
    triggerHapticLight();
  };

  const handleKeyChange = (val) => {
    onUpdateSettings({ ...settings, apiKey: val.trim() });
    setTestResult(null);
  };

  const handleTestKey = async () => {
    if (!settings.apiKey) {
      setTestResult({ success: false, message: "Vui lòng nhập API Key trước khi kiểm tra." });
      return;
    }
    setTestingKey(true);
    setTestResult(null);
    const res = await testGeminiApiKey(settings.apiKey);
    setTestResult(res);
    setTestingKey(false);
  };

  const handleVolumeChange = (e) => {
    const val = parseInt(e.target.value, 10);
    onUpdateSettings({ ...settings, volume: val });
  };

  const handleToggleHaptics = () => {
    const newVal = settings.hapticsEnabled === false ? true : false;
    onUpdateSettings({ ...settings, hapticsEnabled: newVal });
    if (newVal) triggerHapticMedium();
  };

  const handleSelectSoundForAction = (presetId) => {
    const updated = {
      ...actionSounds,
      [activeActionKey]: presetId
    };
    onUpdateSettings({ ...settings, actionSounds: updated });
    triggerHapticLight();
    audioEngine.playSoundPreset(presetId);
  };

  const handleExportBackup = () => {
    triggerHapticMedium();
    exportBackupJSON();
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result;
      if (typeof content === 'string') {
        const res = importBackupJSON(content);
        if (res.success) {
          setBackupMessage({ success: true, text: "Khôi phục dữ liệu thành công! Vui lòng tải lại ứng dụng." });
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setBackupMessage({ success: false, text: "Lỗi tệp sao lưu: " + res.error });
        }
      }
    };
    reader.readAsText(file);
  };

  const filteredPresets = SOUND_STUDIO_PRESETS.filter(p => {
    if (activeCategory === 'all') return true;
    return p.cat === activeCategory;
  });

  const currentAssignedId = actionSounds[activeActionKey] || 'preset_1';
  const currentActionObj = SOUND_ACTIONS.find(a => a.key === activeActionKey) || SOUND_ACTIONS[0];

  return (
    <div 
      className="relative min-h-[85vh] select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* CỬ CHỈ VUỐT: Biểu tượng chỉ dẫn kéo mép trái sang phải */}
      {isDragging && dragOffset > 10 && (
        <div 
          className="fixed left-3 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-slate-900/90 text-white backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/20 pointer-events-none transition-transform"
          style={{ 
            transform: `translateY(-50%) scale(${Math.min(1.25, 0.8 + dragOffset / 150)})`, 
            opacity: Math.min(1, dragOffset / 40) 
          }}
        >
          <ChevronLeft size={22} className="text-emerald-400" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. GIAO DIỆN CHÍNH: MENU CÀI ĐẶT PHONG CÁCH FACEBOOK / IOS                */}
      {/* ========================================================================= */}
      {!activeSubpage && (
        <div className="p-4 sm:p-5 space-y-4 max-w-lg mx-auto animate-fade-in">
          {/* Header Title */}
          <div className="pb-1">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Cài Đặt Hệ Thống
            </h2>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
              Quản lý âm thanh, xúc giác, trí tuệ nhân tạo và dữ liệu
            </p>
          </div>

          {/* THẺ ĐẦU TRANG: HỒ SƠ SINH HỌC (ACCOUNTS CENTER STYLE) */}
          <div 
            onClick={() => navigateTo('profile')}
            className="glass-panel p-4 rounded-3xl border border-amber-300/40 dark:border-amber-500/20 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 dark:hover:bg-white/5 transition-all active:scale-[0.99] shadow-xs"
          >
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-500 flex items-center justify-center text-xl shrink-0 shadow-xs">
                {settings.gender === 'female' ? '👩' : '👨'}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                  Hồ Sơ Sức Khỏe Sinh Học
                </div>
                <div className="text-xs text-slate-500 dark:text-gray-400 truncate mt-0.5">
                  {settings.gender === 'female' ? 'Nữ giới' : 'Nam giới'} • Sinh năm {settings.birthYear || 1995}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 shrink-0 text-slate-400 dark:text-gray-500 pl-2">
              <span className="text-[11px] font-semibold hidden sm:inline text-amber-600 dark:text-amber-400">Chi tiết</span>
              <ChevronRight size={18} />
            </div>
          </div>

          {/* NHÓM 1: TRẢI NGHIỆM TẬP LUYỆN & ÂM THANH */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-500 dark:text-gray-400 px-3 uppercase tracking-wider">
              Trải Nghiệm & Âm Thanh
            </div>
            <div className="glass-panel rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
              {/* Item: Sound Studio */}
              <div
                onClick={() => navigateTo('sound_studio')}
                className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 dark:hover:bg-white/5 transition-all active:scale-[0.99]"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-violet-500/15 text-violet-500 flex items-center justify-center shrink-0">
                    <Headphones size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      Sound Studio 50 Âm Thanh
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-gray-400 truncate mt-0.5">
                      Âm lượng {settings.volume !== undefined ? settings.volume : 80}% • {settings.sfxEnabled !== false ? 'Âm báo bật' : 'Âm báo tắt'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0 pl-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-300 font-bold border border-violet-500/20">
                    50 Presets
                  </span>
                  <ChevronRight size={18} className="text-slate-400 dark:text-gray-500" />
                </div>
              </div>

              {/* Item: Rung Phản Hồi */}
              <div
                onClick={() => navigateTo('haptics')}
                className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 dark:hover:bg-white/5 transition-all active:scale-[0.99]"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-neon flex items-center justify-center shrink-0">
                    <Vibrate size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      Phản Hồi Rung Xúc Giác
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-gray-400 truncate mt-0.5">
                      Rung Taptic Engine chuẩn xác theo từng nhịp tập
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0 pl-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={handleToggleHaptics}
                    className={`w-11 h-6 rounded-full p-0.5 transition-all ${
                      settings.hapticsEnabled !== false ? 'bg-emerald-500 shadow-sm' : 'bg-slate-300 dark:bg-white/20'
                    }`}
                  >
                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                      settings.hapticsEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                  <ChevronRight size={18} className="text-slate-400 dark:text-gray-500 cursor-pointer" onClick={() => navigateTo('haptics')} />
                </div>
              </div>
            </div>
          </div>

          {/* NHÓM 2: TRÍ TUỆ NHÂN TẠO & KẾT NỐI */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-500 dark:text-gray-400 px-3 uppercase tracking-wider">
              Trí Tuệ Nhân Tạo & Cá Nhân Hóa
            </div>
            <div className="glass-panel rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
              {/* Item: Google Gemini API Key */}
              <div
                onClick={() => navigateTo('gemini')}
                className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 dark:hover:bg-white/5 transition-all active:scale-[0.99]"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-neon flex items-center justify-center shrink-0">
                    <Key size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      Google Gemini API Key
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-gray-400 truncate mt-0.5">
                      {settings.apiKey ? 'Trí tuệ nhân tạo Gemini 3.7 Flash đã sẵn sàng' : 'Chưa cấu hình khóa API Gemini'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0 pl-2">
                  <span className={`w-2 h-2 rounded-full ${settings.apiKey ? 'bg-emerald-500 shadow-neon' : 'bg-slate-400'}`} />
                  <ChevronRight size={18} className="text-slate-400 dark:text-gray-500" />
                </div>
              </div>
            </div>
          </div>

          {/* NHÓM 3: DỮ LIỆU & HỆ THỐNG */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-500 dark:text-gray-400 px-3 uppercase tracking-wider">
              Dữ Liệu & Hệ Thống
            </div>
            <div className="glass-panel rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
              {/* Item: Sao Lưu & Khôi Phục */}
              <div
                onClick={() => navigateTo('backup')}
                className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 dark:hover:bg-white/5 transition-all active:scale-[0.99]"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                    <Download size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      Sao Lưu & Khôi Phục Dữ Liệu
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-gray-400 truncate mt-0.5">
                      Xuất hoặc nhập file JSON bài tập và lịch sử
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0 pl-2">
                  <ChevronRight size={18} className="text-slate-400 dark:text-gray-500" />
                </div>
              </div>

              {/* Item: Con Bọ Debug */}
              <div
                onClick={() => navigateTo('debug')}
                className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 dark:hover:bg-white/5 transition-all active:scale-[0.99]"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-slate-500/15 text-slate-700 dark:text-gray-300 flex items-center justify-center shrink-0">
                    <Bug size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      Nút Tròn Con Bọ (Debug Logger)
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-gray-400 truncate mt-0.5">
                      Nút chẩn đoán lỗi phần cứng, âm thanh & OTA
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0 pl-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => {
                      const newVal = settings.debugLoggerEnabled === false ? true : false;
                      onUpdateSettings({ ...settings, debugLoggerEnabled: newVal });
                      if (newVal) triggerHapticMedium();
                    }}
                    className={`w-11 h-6 rounded-full p-0.5 transition-all ${
                      settings.debugLoggerEnabled !== false ? 'bg-emerald-500 shadow-sm' : 'bg-slate-300 dark:bg-white/20'
                    }`}
                  >
                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                      settings.debugLoggerEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                  <ChevronRight size={18} className="text-slate-400 dark:text-gray-500 cursor-pointer" onClick={() => navigateTo('debug')} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer App Version */}
          <div className="text-center pt-3 pb-2 text-[11px] text-slate-400 dark:text-gray-500 font-mono">
            PC Flex • Phiên bản {SETTINGS_APP_VERSION}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. GIAO DIỆN CON (SUBPAGES) VỚI NATIVE VUỐT MÉP TRÁI ĐỂ TRỞ VỀ            */}
      {/* ========================================================================= */}
      {activeSubpage && (
        <div 
          className="p-4 sm:p-5 space-y-5 max-w-lg mx-auto animate-fade-in"
          style={{
            transform: `translateX(${dragOffset}px)`,
            transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
            opacity: isDragging ? Math.max(0.75, 1 - (dragOffset / 400)) : 1
          }}
        >
          {/* Thanh Tiêu Đề Điều Hướng Quay Lại Kiểu Native iOS / Facebook */}
          <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={goBack}
              className="py-1.5 px-3 -ml-2 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-gray-200 hover:bg-slate-200 dark:hover:bg-white/20 font-bold text-xs flex items-center space-x-1 transition-all active:scale-95 shrink-0"
            >
              <ChevronLeft size={18} className="text-emerald-500" />
              <span>Cài đặt</span>
            </button>

            <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider truncate px-2 text-center">
              {activeSubpage === 'sound_studio' && 'Sound Studio'}
              {activeSubpage === 'haptics' && 'Phản Hồi Rung'}
              {activeSubpage === 'profile' && 'Hồ Sơ Sinh Học'}
              {activeSubpage === 'gemini' && 'Google Gemini AI'}
              {activeSubpage === 'backup' && 'Sao Lưu & Khôi Phục'}
              {activeSubpage === 'debug' && 'Trạm Gỡ Lỗi'}
            </div>

            <div className="w-16" /> {/* Cân bằng khoảng trống bên phải */}
          </div>

          {/* ---------------- SUBPAGE 1: SOUND STUDIO 50 ÂM THANH ---------------- */}
          {activeSubpage === 'sound_studio' && (
            <div className="space-y-4">
              <div className="glass-panel p-5 rounded-3xl space-y-4 border border-violet-300/40 dark:border-violet-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-neon flex items-center justify-center shrink-0">
                      <Headphones size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Phòng Thu 50 Âm Thanh</h3>
                      <p className="text-[11px] text-slate-500 dark:text-gray-400">Phối âm riêng biệt cho từng nhịp tập</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-500/20 font-bold">
                    50 Presets
                  </span>
                </div>

                {/* Âm Lượng Loa Ứng Dụng */}
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center space-x-1.5">
                      <Volume2 size={14} className="text-violet-500" />
                      <span>Âm Lượng Loa Ứng Dụng</span>
                    </div>
                    <span className="font-mono text-violet-600 dark:text-violet-400">{settings.volume !== undefined ? settings.volume : 80}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={settings.volume !== undefined ? settings.volume : 80}
                    onChange={handleVolumeChange}
                    className="w-full accent-violet-500 h-1.5 bg-slate-300 dark:bg-white/10 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Bật/Tắt Âm báo & Nhạc nền */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Volume2 size={15} className="text-violet-500" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Âm Báo Hiệu (SFX)</div>
                        <div className="text-[10px] text-slate-500 dark:text-gray-400">Chuông nhịp tập</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = settings.sfxEnabled === false ? true : false;
                        onUpdateSettings({ ...settings, sfxEnabled: next, soundEnabled: next });
                        if (next) {
                          triggerHapticMedium();
                          audioEngine.playBeep(880, 0.1, 0.3);
                        }
                      }}
                      className={`w-11 h-6 rounded-full p-0.5 transition-all ${
                        settings.sfxEnabled !== false && settings.soundEnabled !== false ? 'bg-violet-500' : 'bg-slate-300 dark:bg-white/20'
                      }`}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                        settings.sfxEnabled !== false && settings.soundEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Music size={15} className="text-cyan-500" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Nhạc Thiền (BGM)</div>
                        <div className="text-[10px] text-slate-500 dark:text-gray-400">Nhạc nền êm dịu</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = settings.bgmActive === true ? false : true;
                        onUpdateSettings({ ...settings, bgmActive: next, bgmEnabled: next });
                        if (next) triggerHapticMedium();
                      }}
                      className={`w-11 h-6 rounded-full p-0.5 transition-all ${
                        settings.bgmActive === true || settings.bgmEnabled === true ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-white/20'
                      }`}
                    >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                        settings.bgmActive === true || settings.bgmEnabled === true ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Bộ Chọn 5 Nhịp Tập Cần Gán Âm Thanh */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-gray-300">
                    Chọn nhịp tập để phối âm:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {SOUND_ACTIONS.map(act => {
                      const isSelected = activeActionKey === act.key;
                      const assignedId = actionSounds[act.key] || act.defaultPreset;
                      const assignedPreset = SOUND_STUDIO_PRESETS.find(p => p.id === assignedId);

                      return (
                        <button
                          key={act.key}
                          type="button"
                          onClick={() => {
                            setActiveActionKey(act.key);
                            triggerHapticLight();
                          }}
                          className={`p-2.5 rounded-2xl border text-left transition-all ${
                            isSelected 
                              ? 'bg-violet-500/15 border-violet-500 text-slate-900 dark:text-white shadow-xs' 
                              : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:border-slate-300'
                          }`}
                        >
                          <div className="text-xs font-black truncate">{act.name}</div>
                          <div className="text-[10px] flex items-center space-x-1 mt-1 opacity-90 truncate text-violet-600 dark:text-violet-300 font-semibold">
                            <span>{assignedPreset?.icon || '🎵'}</span>
                            <span className="truncate">{assignedPreset?.name || 'Mặc định'}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Thanh Lọc Thể Loại Âm Thanh */}
                <div className="flex items-center space-x-1 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {SOUND_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat.id);
                        triggerHapticLight();
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-[11px] ${
                        activeCategory === cat.id
                          ? 'bg-violet-500 text-white shadow-xs'
                          : 'bg-slate-200/80 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Danh Sách 50 Âm Thanh Preset Có Nút Nghe Thử & Gán */}
                <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 select-none">
                  {filteredPresets.map(preset => {
                    const isAssigned = currentAssignedId === preset.id;

                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectSoundForAction(preset.id)}
                        className={`p-2.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${
                          isAssigned
                            ? 'bg-violet-500/20 border-violet-500 text-slate-900 dark:text-white shadow-xs'
                            : 'bg-slate-100/70 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-200/60 dark:hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <span className="text-xl shrink-0">{preset.icon}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-black truncate">{preset.name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-gray-400 truncate">{preset.desc}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              audioEngine.playSoundPreset(preset.id);
                              triggerHapticLight();
                            }}
                            className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white transition-all active:scale-90"
                            title="Nghe thử"
                          >
                            <Play size={12} fill="currentColor" />
                          </button>

                          {isAssigned && (
                            <div className="w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center shadow-xs">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ---------------- SUBPAGE 2: PHẢN HỒI RUNG XÚC GIÁC ---------------- */}
          {activeSubpage === 'haptics' && (
            <div className="space-y-4">
              <div className="glass-panel p-5 rounded-3xl space-y-4 border border-emerald-300/40 dark:border-emerald-500/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-neon flex items-center justify-center shrink-0">
                    <Vibrate size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Phản Hồi Rung Xúc Giác</h3>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400">Rung Taptic Engine chuẩn xác từng nhịp siết Kegel</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Rung Khi Tập & Chạm Nút</div>
                    <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">Bật phản hồi rung xúc giác trên thiết bị</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleHaptics}
                    className={`w-12 h-7 rounded-full p-1 transition-all shrink-0 ${
                      settings.hapticsEnabled !== false ? 'bg-emerald-500 shadow-sm' : 'bg-slate-300 dark:bg-white/20'
                    }`}
                  >
                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                      settings.hapticsEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Thử Nghiệm Các Kiểu Rung */}
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-gray-200">
                    Thử nghiệm độ phản hồi:
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => triggerHapticLight()}
                      className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500 text-center active:scale-95 transition-all"
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Nhẹ</div>
                      <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">Chạm phím</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerHapticMedium()}
                      className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500 text-center active:scale-95 transition-all"
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Vừa</div>
                      <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">Nhịp siết</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHapticMedium();
                        setTimeout(triggerHapticMedium, 150);
                      }}
                      className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500 text-center active:scale-95 transition-all"
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Kép</div>
                      <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">Hoàn thành</div>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start space-x-2.5">
                  <ShieldCheck size={16} className="shrink-0 mt-0.5 text-emerald-500" />
                  <span className="text-[11px] leading-relaxed">
                    Phản hồi rung Taptic Engine giúp bạn cảm nhận rõ ràng từng nhịp siết - nhả cơ sàn chậu mà không cần phải liên tục nhìn vào màn hình điện thoại.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- SUBPAGE 3: HỒ SƠ SINH HỌC ---------------- */}
          {activeSubpage === 'profile' && (
            <div className="space-y-4">
              <div className="glass-panel p-5 rounded-3xl space-y-4 border border-amber-300/40 dark:border-amber-500/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Hồ Sơ Sức Khỏe Sinh Học</h3>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400">Cá nhân hóa phác đồ tập luyện sàn chậu chuẩn y khoa</p>
                  </div>
                </div>

                {/* Lựa chọn giới tính */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-gray-300">Giới tính sinh học:</label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => onUpdateSettings({ ...settings, gender: 'male' })}
                      className={`py-3 rounded-2xl border text-xs font-black transition-all ${
                        settings.gender !== 'female'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-600 dark:text-cyan-400 shadow-xs'
                          : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400'
                      }`}
                    >
                      ♂️ Nam giới
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateSettings({ ...settings, gender: 'female' })}
                      className={`py-3 rounded-2xl border text-xs font-black transition-all ${
                        settings.gender === 'female'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-600 dark:text-rose-400 shadow-xs'
                          : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400'
                      }`}
                    >
                      ♀️ Nữ giới
                    </button>
                  </div>
                </div>

                {/* Năm sinh */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-gray-300">Năm sinh:</label>
                  <input
                    type="number"
                    value={settings.birthYear || 1995}
                    onChange={(e) => onUpdateSettings({ ...settings, birthYear: parseInt(e.target.value, 10) || 1995 })}
                    min={1940}
                    max={2015}
                    className="w-full mt-1.5 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl p-3.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start space-x-2.5">
                  <Info size={16} className="shrink-0 mt-0.5 text-amber-500" />
                  <span className="text-[11px] leading-relaxed">
                    Giới tính và độ tuổi sinh học quyết định cấu trúc giải phẫu của nhóm cơ mu cụt (PC) và cơ nâng hậu môn, giúp Trợ Lý AI đề xuất thời gian siết - nhả thích hợp nhất.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- SUBPAGE 4: GOOGLE GEMINI AI KEY ---------------- */}
          {activeSubpage === 'gemini' && (
            <div className="space-y-4">
              <div className="glass-panel p-5 rounded-3xl space-y-4 border border-cyan-300/40 dark:border-cyan-500/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-100 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-neon flex items-center justify-center shrink-0">
                    <Key size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Google Gemini API Key</h3>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400">Kết nối trực tiếp trí tuệ nhân tạo Gemini 3.7 Flash</p>
                  </div>
                </div>

                {/* Input Key */}
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={settings.apiKey || ''}
                    onChange={(e) => handleKeyChange(e.target.value)}
                    placeholder="Dán mã API Key (AIzaSy...)"
                    className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl p-3.5 pr-11 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white p-1"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Test Result Message */}
                {testResult && (
                  <div className={`p-3.5 rounded-2xl text-xs flex items-start space-x-2 border transition-all ${
                    testResult.success 
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300' 
                      : 'bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/30 text-red-700 dark:text-red-400'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-bold">{testResult.success ? "Kết Nối Thành Công!" : "Kết Nối Thất Bại"}</div>
                      <div className="text-[11px] mt-0.5 opacity-90">{testResult.message}</div>
                    </div>
                  </div>
                )}

                {/* Nút Kiểm Tra & Lấy Key */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleTestKey}
                    disabled={testingKey}
                    className="flex-1 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {testingKey ? (
                      <div className="w-4 h-4 border-2 border-slate-600 dark:border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles size={14} className="text-cyan-500" />
                    )}
                    <span>{testingKey ? "Đang Kiểm Tra..." : "Kiểm Tra Kết Nối API"}</span>
                  </button>

                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-4 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold text-xs flex items-center justify-center space-x-1.5 border border-cyan-500/30 transition-all active:scale-95 text-center"
                  >
                    <span>Lấy Key Miễn Phí</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- SUBPAGE 5: SAO LƯU & KHÔI PHỤC ---------------- */}
          {activeSubpage === 'backup' && (
            <div className="space-y-4">
              <div className="glass-panel p-5 rounded-3xl space-y-4 border border-slate-200 dark:border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-gray-300 flex items-center justify-center shrink-0">
                    <Download size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Sao Lưu & Khôi Phục Dữ Liệu</h3>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400">Xuất hoặc nhập file JSON bài tập tùy chỉnh và lịch sử</p>
                  </div>
                </div>

                {backupMessage && (
                  <div className={`p-3.5 rounded-2xl text-xs ${backupMessage.success ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'}`}>
                    {backupMessage.text}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="py-3 px-4 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-95"
                  >
                    <Download size={15} />
                    <span>Xuất Sao Lưu JSON</span>
                  </button>

                  <label className="py-3 px-4 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white font-bold text-xs flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-95 text-center">
                    <Upload size={15} />
                    <span>Nhập Sao Lưu</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] text-slate-500 dark:text-gray-400 leading-relaxed">
                  Tệp sao lưu JSON lưu trữ toàn vẹn lịch sử tập luyện, các danh hiệu huy hiệu đã mở khóa và bộ giáo án cá nhân hóa. Dữ liệu hoàn toàn riêng tư trên máy của bạn.
                </div>
              </div>
            </div>
          )}

          {/* ---------------- SUBPAGE 6: TRẠM GỠ LỖI (DEBUG LOGGER) ---------------- */}
          {activeSubpage === 'debug' && (
            <div className="space-y-4">
              <div className="glass-panel p-5 rounded-3xl space-y-4 border border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                      <Bug size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Nút Tròn Con Bọ (Debug)</h3>
                      <p className="text-[11px] text-slate-500 dark:text-gray-400">Trạm chẩn đoán lỗi phần cứng & phần mềm</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newVal = settings.debugLoggerEnabled === false ? true : false;
                      onUpdateSettings({ ...settings, debugLoggerEnabled: newVal });
                      if (newVal) triggerHapticMedium();
                    }}
                    className={`w-12 h-7 rounded-full p-1 transition-all shrink-0 ${
                      settings.debugLoggerEnabled !== false ? 'bg-emerald-500 shadow-sm' : 'bg-slate-300 dark:bg-white/20'
                    }`}
                  >
                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                      settings.debugLoggerEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">Tính năng nút tròn Con Bọ nổi:</div>
                  <ul className="space-y-2 text-slate-500 dark:text-gray-400 text-[11px] list-disc list-inside leading-relaxed">
                    <li><strong className="text-slate-700 dark:text-gray-300">Phần cứng & Hiệu năng:</strong> Giám sát FPS tức thời, trạng thái bộ nhớ RAM, pin và nhiệt độ thiết bị.</li>
                    <li><strong className="text-slate-700 dark:text-gray-300">Âm thanh Web Audio:</strong> Kiểm tra trạng thái kích hoạt AudioContext và danh mục âm thanh nền iOS.</li>
                    <li><strong className="text-slate-700 dark:text-gray-300">Cập nhật OTA:</strong> Bảng kiểm tra phiên bản GitHub Releases, tải và cài đặt trực tiếp.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;
