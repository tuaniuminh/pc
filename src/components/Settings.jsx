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
  Smartphone
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

const SETTINGS_APP_VERSION = 'v2.0.6';

const Settings = ({ settings, onUpdateSettings, onNavigateToAI }) => {
  const [showKey, setShowKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [backupMessage, setBackupMessage] = useState(null);

  // In-App Update State
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateCheckState, setUpdateCheckState] = useState(null);

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
    onUpdateSettings({ ...settings, apiKey: val });
    setTestResult(null);
  };

  const handleTestKey = async () => {
    if (!settings.apiKey || !settings.apiKey.trim()) {
      setTestResult({
        success: false,
        message: "Vui lòng nhập API Key trước khi kiểm tra."
      });
      return;
    }

    setTestingKey(true);
    setTestResult(null);

    try {
      const res = await testGeminiApiKey(settings.apiKey);
      setTestResult({
        success: true,
        message: `Kết nối thành công! Đang kết nối mô hình: ${res.activeModel || 'Google Gemini 3.7 Flash'}. Hệ thống sẵn sàng phân tích cho bạn.`
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || "Lỗi kiểm tra API Key. Vui lòng kiểm tra lại tính chính xác của Key."
      });
    } finally {
      setTestingKey(false);
    }
  };

  const handleAssignSound = (presetId) => {
    const updatedActionSounds = {
      ...actionSounds,
      [activeActionKey]: presetId
    };
    onUpdateSettings({
      ...settings,
      actionSounds: updatedActionSounds,
      // Đồng bộ trường cũ nếu có
      soundPreset: activeActionKey === 'squeeze' ? presetId : settings.soundPreset,
      reversePreset: activeActionKey === 'reverse' ? presetId : settings.reversePreset
    });
    audioEngine.playSoundPreset(presetId);
    triggerHapticLight();
  };

  const handleFileImport = (e) => {
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
          Tùy chỉnh âm thanh độc lập 5 nhịp tập, rung Taptic Engine và Gemini AI
        </p>
      </div>

      {/* SECTION 1: CẤU HÌNH GOOGLE GEMINI API KEY */}
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
            className="py-3 px-4 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-300 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20 dark:text-cyan-neon dark:border-cyan-500/30 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95"
          >
            <span>Lấy Key Miễn Phí</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* SECTION 2: STUDIO CÀI ĐẶT 50 ÂM THANH TOÀN DIỆN CHO 5 NHỊP TẬP */}
      <div className="glass-panel p-5 rounded-3xl space-y-4 border border-emerald-300/40 dark:border-emerald-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-neon flex items-center justify-center">
              <Headphones size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Studio 50 Âm Thanh Nhịp Tập</h3>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">Gán độc lập âm thanh cho từng loại nhịp co thắt</p>
            </div>
          </div>
        </div>

        {/* Bảng tổng hợp âm thanh đang gán */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
          {SOUND_ACTIONS.map((act) => {
            const assignedId = actionSounds[act.key] || act.defaultPreset;
            const presetObj = SOUND_STUDIO_PRESETS.find(p => p.id === assignedId) || SOUND_STUDIO_PRESETS[0];
            const isTabActive = activeActionKey === act.key;

            return (
              <button
                key={act.key}
                type="button"
                onClick={() => {
                  setActiveActionKey(act.key);
                  audioEngine.playSoundPreset(assignedId);
                }}
                className={`p-2 rounded-2xl border text-left transition-all ${
                  isTabActive
                    ? 'bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500/40 shadow-sm'
                    : 'bg-slate-100/70 dark:bg-white/5 border-slate-200 dark:border-white/10'
                }`}
              >
                <div className="text-[10px] font-extrabold text-slate-500 dark:text-gray-400">{act.name}</div>
                <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate mt-0.5">
                  {presetObj.icon} {presetObj.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Thanh lọc thể loại (Categories) */}
        <div className="pt-2 border-t border-slate-200 dark:border-white/5">
          <div className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-between">
            <span>Chọn âm thanh cho: <strong className="text-emerald-600 dark:text-neon">{currentActionObj.name}</strong></span>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SOUND_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách 50 Sound Presets Card */}
        <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 pt-1">
          {filteredPresets.map((preset) => {
            const isAssigned = currentAssignedId === preset.id;

            return (
              <div
                key={preset.id}
                onClick={() => handleAssignSound(preset.id)}
                className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                  isAssigned
                    ? 'bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500/40'
                    : 'bg-slate-100/60 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-emerald-500/30'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2">
                  <span className="text-lg shrink-0">{preset.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <span className="truncate">{preset.name}</span>
                      {isAssigned && (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black shrink-0">
                          ĐANG DÙNG
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-gray-400 truncate">
                      {preset.desc}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    audioEngine.playSoundPreset(preset.id);
                  }}
                  className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-white/10 text-emerald-600 dark:text-neon flex items-center justify-center shrink-0 active:scale-95"
                  title="Nghe thử"
                >
                  <Play size={12} fill="currentColor" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: PHẢN HỒI RUNG HAPTICS TAPTIC ENGINE */}
      <div className="glass-panel p-5 rounded-3xl space-y-4 border border-violet-300/40 dark:border-violet-500/20">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <Vibrate size={16} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Rung Taptic Engine (iOS)</h3>
            <p className="text-[11px] text-slate-500 dark:text-gray-400">Cảm giác rung vật lý khi chạm và siết cơ</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Bật Rung Haptic Taptic Engine</div>
            <div className="text-[11px] text-slate-500 dark:text-gray-400">Rung nhịp đập khi co siết cơ sàn chậu</div>
          </div>
          <button
            type="button"
            onClick={() => {
              const newVal = !settings.hapticsEnabled;
              onUpdateSettings({ ...settings, hapticsEnabled: newVal });
              if (newVal) triggerHapticMedium();
            }}
            className={`w-12 h-7 rounded-full p-1 transition-all ${
              settings.hapticsEnabled !== false ? 'bg-violet-500 shadow-sm' : 'bg-slate-300 dark:bg-white/20'
            }`}
          >
            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
              settings.hapticsEnabled !== false ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* SECTION 4: DYNAMIC ISLAND & LIVE ACTIVITIES (iOS 16.1+) */}
      <div className="glass-panel p-5 rounded-3xl space-y-4 border border-cyan-300/40 dark:border-cyan-500/20">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-neon flex items-center justify-center">
            <Smartphone size={16} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Dynamic Island & Live Activities</h3>
            <p className="text-[11px] text-slate-500 dark:text-gray-400">Hiển thị nhịp tập Kegel trên màn hình khóa & Đảo thích ứng (iOS 16.1+)</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Kích Hoạt Live Activities</div>
            <div className="text-[11px] text-slate-500 dark:text-gray-400">Hiển thị nhịp siết/thả khi khóa máy hoặc chuyển app</div>
          </div>
          <button
            type="button"
            onClick={() => {
              const newVal = settings.liveActivitiesEnabled === false ? true : false;
              onUpdateSettings({ ...settings, liveActivitiesEnabled: newVal });
            }}
            className={`w-12 h-7 rounded-full p-1 transition-all ${
              settings.liveActivitiesEnabled !== false ? 'bg-cyan-500 shadow-sm' : 'bg-slate-300 dark:bg-white/20'
            }`}
          >
            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
              settings.liveActivitiesEnabled !== false ? 'translate-x-5' : 'translate-x-0'
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
            <p className="text-[11px] text-slate-500 dark:text-gray-400">Cấu hình giới tính để AI tối ưu hóa bài tập sàn chậu</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => onUpdateSettings({ ...settings, gender: 'male' })}
            className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all ${
              settings.gender !== 'female'
                ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30'
                : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500'
            }`}
          >
            👨 Nam Giới (PC Muscle)
          </button>
          <button
            type="button"
            onClick={() => onUpdateSettings({ ...settings, gender: 'female' })}
            className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all ${
              settings.gender === 'female'
                ? 'bg-pink-500/15 border-pink-500 text-pink-700 dark:text-pink-300 ring-1 ring-pink-500/30'
                : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500'
            }`}
          >
            👩 Nữ Giới (Pelvic Floor)
          </button>
        </div>

        <div className="pt-2">
          <label className="text-[11px] font-bold text-slate-700 dark:text-gray-300">
            Năm sinh của bạn:
          </label>
          <input
            type="number"
            value={settings.birthYear || 1995}
            onChange={(e) => onUpdateSettings({ ...settings, birthYear: parseInt(e.target.value) || 1995 })}
            min={1940}
            max={2015}
            className="w-full mt-1 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl p-3 text-xs text-slate-900 dark:text-white font-mono focus:outline-none"
          />
        </div>
      </div>

      {/* SECTION 6: CẬP NHẬT ỨNG DỤNG (TROLLSTORE OTA UPDATE) */}
      <div className="glass-panel p-5 rounded-3xl space-y-4 border border-cyan-500/30">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Smartphone size={16} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Cập Nhật Ứng Dụng</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-bold">
                v2.0.6
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
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => installViaTrollStore(updateCheckState.ipaDownloadUrl)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 text-white font-black text-xs shadow-md active:scale-95 transition-all"
                  >
                    ⚡ Cài Qua TrollStore
                  </button>
                  <button
                    type="button"
                    onClick={() => openDirectDownload(updateCheckState.ipaDownloadUrl)}
                    className="py-2 px-3 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white font-bold text-xs active:scale-95 transition-all"
                  >
                    Tải IPA
                  </button>
                </div>
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
      </div>
    </div>
  );
};

export default Settings;
