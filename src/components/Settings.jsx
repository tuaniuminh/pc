import React, { useState } from 'react';
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
  Smartphone,
  Bug,
  Zap
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
import { checkForUpdate, installViaTrollStore, openDirectDownload, downloadIPAInApp } from '../services/updateService';

const SETTINGS_APP_VERSION = 'v2.2.5';

const Settings = ({ settings, onUpdateSettings, onNavigateToAI }) => {
  const [showKey, setShowKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [backupMessage, setBackupMessage] = useState(null);

  // In-App Update State
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateCheckState, setUpdateCheckState] = useState(null);
  const [isDownloadingIPA, setIsDownloadingIPA] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);

  const handleInAppDownloadInSettings = async (url) => {
    try {
      setIsDownloadingIPA(true);
      triggerHapticMedium();
      await downloadIPAInApp(url, (data) => {
        setDownloadProgress(data);
      });
      triggerHapticLight();
    } catch (e) {
      alert(`Lỗi tải: ${e.message || e}`);
    } finally {
      setIsDownloadingIPA(false);
    }
  };

  const handleCheckUpdateManual = async () => {
    setIsCheckingUpdate(true);
    setUpdateCheckState(null);
    try {
      const res = await checkForUpdate(SETTINGS_APP_VERSION);
      if (res && res.hasUpdate) {
        setUpdateCheckState(res);
      } else {
        setUpdateCheckState({
          hasUpdate: false,
          message: res?.error ? `Lỗi: ${res.error}` : `🎉 Bạn đang sử dụng phiên bản mới nhất (${SETTINGS_APP_VERSION})!`
        });
      }
    } catch (e) {
      setUpdateCheckState({
        hasUpdate: false,
        message: `Lỗi kết nối: ${e.message || e}`
      });
    } finally {
      setIsCheckingUpdate(false);
    }
  };

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
    <div className="p-4 sm:p-6 space-y-6 pb-28 max-w-lg mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Cài Đặt Hệ Thống
        </h2>
        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
          Cập nhật phần mềm, âm thanh phòng thu 50 presets, rung và AI
        </p>
      </div>

      {/* SECTION 1: CẬP NHẬT ỨNG DỤNG & CÔNG TẮC CON BỌ CHẨN ĐOÁN (ĐƯỢC ĐƯA LÊN ĐẦU TIÊN) */}
      <div className="glass-panel p-5 rounded-3xl space-y-4 border border-cyan-500/30">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Smartphone size={16} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Cập Nhật Ứng Dụng</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-bold">
                {SETTINGS_APP_VERSION}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-gray-400">Kiểm tra bản mới trên GitHub & cài đặt 1 chạm qua TrollStore</p>
          </div>
        </div>

        {updateCheckState && (
          <div className={`p-3 rounded-2xl text-xs ${updateCheckState.hasUpdate ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400'}`}>
            {updateCheckState.hasUpdate ? (
              <div className="space-y-2">
                <div className="font-bold flex items-center space-x-1">
                  <Sparkles size={14} className="text-emerald-500" />
                  <span>Đã có phiên bản mới: {updateCheckState.tagName}!</span>
                </div>
                <p className="text-[11px] opacity-90">{updateCheckState.releaseName}</p>
                {isDownloadingIPA ? (
                  <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-cyan-300">Đang tải bản cập nhật...</span>
                      <div className="flex items-center space-x-2">
                        {downloadProgress?.speed && (
                          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-1.5 py-0.5 rounded font-bold">
                            {downloadProgress.speed}
                          </span>
                        )}
                        <span className="font-mono font-bold text-emerald-400">
                          {downloadProgress ? Math.round((downloadProgress.progress || 0) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/10">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-200"
                        style={{ width: `${Math.max(5, Math.round((downloadProgress?.progress || 0) * 100))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                      <span>{downloadProgress?.downloadedMB ? `${downloadProgress.downloadedMB} MB` : 'Đang nạp...'}</span>
                      <span>{downloadProgress?.totalMB ? `${downloadProgress.totalMB} MB` : ''}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleInAppDownloadInSettings(updateCheckState.ipaDownloadUrl)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center space-x-1"
                    >
                      <Zap size={13} fill="currentColor" />
                      <span>⚡ Tải & Cài Đặt Trực Tiếp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openDirectDownload(updateCheckState.ipaDownloadUrl)}
                      className="py-2.5 px-3 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white font-bold text-xs active:scale-95 transition-all"
                    >
                      Tải Safari
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <span>{updateCheckState.message || "Bạn đang sử dụng phiên bản mới nhất!"}</span>
            )}
          </div>
        )}

        <button
          type="button"
          disabled={isCheckingUpdate}
          onClick={handleCheckUpdateManual}
          className="w-full py-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 hover:bg-cyan-500/25 text-cyan-600 dark:text-cyan-400 font-black text-xs flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
        >
          {isCheckingUpdate ? (
            <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          <span>{isCheckingUpdate ? "Đang kiểm tra GitHub Releases..." : "🔍 Kiểm Tra Bản Cập Nhật Mới"}</span>
        </button>

        {/* CÔNG TẮC BẬT/TẮT HOÀN TOÀN CON BỌ CHẨN ĐOÁN (DEBUG LOGGER) */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/10">
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Bug size={14} className="text-emerald-500" />
              <span>Nút Tròn Con Bọ (Debug Logger)</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-gray-400">Bật/tắt nút tròn chẩn đoán lỗi nổi ở góc màn hình</div>
          </div>
          <button
            type="button"
            onClick={() => {
              const newVal = settings.debugLoggerEnabled === false ? true : false;
              onUpdateSettings({ ...settings, debugLoggerEnabled: newVal });
              if (newVal) triggerHapticMedium();
            }}
            className={`w-12 h-7 rounded-full p-1 transition-all ${
              settings.debugLoggerEnabled !== false ? 'bg-emerald-500 shadow-sm' : 'bg-slate-300 dark:bg-white/20'
            }`}
          >
            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
              settings.debugLoggerEnabled !== false ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* SECTION 2: CẤU HÌNH GOOGLE GEMINI API KEY */}
      <div className="glass-panel p-5 rounded-3xl space-y-4 border border-cyan-300/40 dark:border-cyan-500/20">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-neon flex items-center justify-center">
            <Key size={16} />
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

        {/* Test Key & Get Free Key Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="button"
            onClick={handleTestKey}
            disabled={testingKey}
            className="flex-1 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50"
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
            className="py-3 px-4 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold text-xs flex items-center justify-center space-x-1.5 border border-cyan-500/30 transition-all active:scale-95"
          >
            <span>Lấy Key Miễn Phí</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* SECTION 3: SOUND STUDIO PHÒNG THU ÂM THANH (50 PRESETS) */}
      <div className="glass-panel p-5 rounded-3xl space-y-4 border border-violet-300/40 dark:border-violet-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-neon flex items-center justify-center">
              <Headphones size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Sound Studio 50 Âm Thanh</h3>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">Gán âm thanh riêng biệt cho từng nhịp Siết, Thả lỏng, Kegel ngược</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-500/20 font-bold">
            50 Presets
          </span>
        </div>

        {/* Thanh Điều Chỉnh Âm Lượng Tổng */}
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

        {/* TÙY CHỌN BẬT/TẮT ÂM BÁO & NHẠC NỀN TRONG CÀI ĐẶT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {/* 1. Bật/Tắt Âm báo hiệu */}
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Volume2 size={15} className="text-violet-500" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Âm Báo Hiệu (SFX)</div>
                <div className="text-[10px] text-slate-500 dark:text-gray-400">Âm thanh chuông nhịp tập</div>
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

          {/* 2. Bật/Tắt Nhạc nền thiền */}
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Music size={15} className="text-cyan-500" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Nhạc Nền Thiền (BGM)</div>
                <div className="text-[10px] text-slate-500 dark:text-gray-400">Nhạc nền êm dịu khi tập</div>
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

        {/* Bộ Selector 5 Nhịp Tập Cần Gán Âm Thanh */}
        <div className="space-y-1.5">
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

        {/* Danh Sách Cuộn 50 Âm Thanh Preset Có Nút Nghe Thử & Gán */}
        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 select-none">
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

      {/* SECTION 4: PHẢN HỒI RUNG (TAPTIC ENGINE HAPTICS) */}
      <div className="glass-panel p-5 rounded-3xl space-y-4 border border-emerald-300/40 dark:border-emerald-500/20">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-neon flex items-center justify-center">
            <Vibrate size={16} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Rung Phản Hồi Xúc Giác</h3>
            <p className="text-[11px] text-slate-500 dark:text-gray-400">Rung Taptic Engine chuẩn xác từng nhịp siết Kegel</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Rung Khi Tập & Chạm Nút</div>
            <div className="text-[11px] text-slate-500 dark:text-gray-400">Rung nhịp siết cơ và tương tác nút bấm</div>
          </div>
          <button
            type="button"
            onClick={handleToggleHaptics}
            className={`w-12 h-7 rounded-full p-1 transition-all ${
              settings.hapticsEnabled !== false ? 'bg-emerald-500 shadow-sm' : 'bg-slate-300 dark:bg-white/20'
            }`}
          >
            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
              settings.hapticsEnabled !== false ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* SECTION 5: HỒ SƠ NGƯỜI DÙNG (GIỚI TÍNH & NĂM SINH) */}
      <div className="glass-panel p-5 rounded-3xl space-y-4 border border-amber-300/40 dark:border-amber-500/20">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <User size={16} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Hồ Sơ Sức Khỏe Sinh Học</h3>
            <p className="text-[11px] text-slate-500 dark:text-gray-400">Định lượng cường độ tập và cá nhân hóa lộ trình AI</p>
          </div>
        </div>

        {/* Lựa chọn giới tính */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-gray-300">Giới tính sinh học:</label>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, gender: 'male' })}
              className={`py-2.5 rounded-2xl border text-xs font-black transition-all ${
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
              className={`py-2.5 rounded-2xl border text-xs font-black transition-all ${
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
            className="w-full mt-1 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl p-3 text-xs text-slate-900 dark:text-white font-mono focus:outline-none"
          />
        </div>
      </div>

      {/* SECTION 6: SAO LƯU & KHÔI PHỤC DỮ LIỆU */}
      <div className="glass-panel p-5 rounded-3xl space-y-4 border border-slate-200 dark:border-white/10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-gray-300 flex items-center justify-center">
            <Download size={16} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Sao Lưu & Khôi Phục Dữ Liệu</h3>
            <p className="text-[11px] text-slate-500 dark:text-gray-400">Xuất hoặc nhập dữ liệu lịch sử và bài tập tùy chỉnh</p>
          </div>
        </div>

        {backupMessage && (
          <div className={`p-3 rounded-xl text-xs ${backupMessage.success ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'}`}>
            {backupMessage.text}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleExportBackup}
            className="py-3 px-3 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95"
          >
            <Download size={14} />
            <span>Xuất Sao Lưu JSON</span>
          </button>

          <label className="py-3 px-3 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer transition-all active:scale-95">
            <Upload size={14} />
            <span>Nhập Sao Lưu</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default Settings;
