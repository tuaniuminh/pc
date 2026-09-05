import React, { useState, useEffect } from 'react';
import { 
  Bug, 
  X, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  Play, 
  RefreshCw, 
  Cpu, 
  Activity, 
  Volume2, 
  ShieldCheck, 
  Tag, 
  SearchCode, 
  Music, 
  Clock, 
  Zap, 
  AlertOctagon,
  Radio,
  Wifi,
  Headphones,
  Timer as TimerIcon
} from 'lucide-react';
import { liveActivityService } from '../../services/liveActivityService';
import { audioEngine, SOUND_ACTIONS, SOUND_PRESETS } from '../../utils/audioEngine';
import { checkForUpdate } from '../../services/updateService';
import { Capacitor } from '@capacitor/core';

const APP_VERSION = 'v2.2.27';
const LOG_STORAGE_KEY = 'pcflex_debug_logs_v2';

const getStoredLogs = () => {
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveLogs = (logs) => {
  try {
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs.slice(0, 300)));
  } catch (e) {}
};

let logStore = getStoredLogs();
let listeners = [];

export const addAppLog = (type, message, data = null) => {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
  const entry = {
    id: Date.now() + Math.random(),
    time: timeStr,
    type, // 'info' | 'success' | 'warn' | 'error'
    message,
    data: data ? (typeof data === 'object' ? JSON.stringify(data) : String(data)) : null
  };
  logStore.unshift(entry);
  if (logStore.length > 300) logStore.pop();
  saveLogs(logStore);
  listeners.forEach(fn => fn([...logStore]));
};

// Tự động bắt tất cả console log & theo dõi đóng băng WebKit trong nền
if (typeof window !== 'undefined') {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = (...args) => {
    originalLog(...args);
    const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    addAppLog('info', msg);
  };

  console.warn = (...args) => {
    originalWarn(...args);
    const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    addAppLog('warn', msg);
  };

  console.error = (...args) => {
    originalError(...args);
    const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    addAppLog('error', msg);
  };

  let bgStartTime = 0;
  let bgInterval = null;
  let bgTicks = 0;
  let lastPulseTime = 0;

  document.addEventListener('visibilitychange', () => {
    const isHidden = document.hidden;
    if (isHidden) {
      bgStartTime = Date.now();
      lastPulseTime = Date.now();
      bgTicks = 0;
      addAppLog('warn', `[AppState] Ẩn app (document.hidden = true) - Bắt đầu giám sát chạy nền v5.0`);
      bgInterval = setInterval(() => {
        bgTicks++;
        const now = Date.now();
        const delta = now - lastPulseTime;
        lastPulseTime = now;

        // Nếu khoảng cách giữa 2 nhịp vượt quá 2.5s -> Cảnh báo WebKit bị gián đoạn
        if (delta > 2500) {
          addAppLog('error', `[EngineFreeze] Phát hiện WebKit bị iOS đóng băng ${(delta / 1000).toFixed(1)}s trong nền!`);
        }

        if (bgTicks % 3 === 0) {
          addAppLog('info', `[BackgroundPulse] Tiến trình nền: ${bgTicks}s (Độ lệch nhịp: ${(delta / 1000).toFixed(2)}s)`);
        }
      }, 1000);
    } else {
      if (bgInterval) clearInterval(bgInterval);
      const elapsed = bgStartTime > 0 ? ((Date.now() - bgStartTime) / 1000).toFixed(1) : 0;
      const missedTicks = Math.max(0, Math.round(elapsed - bgTicks));
      addAppLog('success', `[AppState] Mở lại app (document.hidden = false) - Thời gian ẩn: ${elapsed}s (Số nhịp ghi nhận: ${bgTicks}, Nhịp mất: ${missedTicks})`);
    }
  });
}

const DebugLogger = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([...logStore]);
  const [copied, setCopied] = useState(false);
  const [diagInfo, setDiagInfo] = useState({});
  const [nativeDiag, setNativeDiag] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [soundSettings, setSoundSettings] = useState({});
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' | 'sensors' | 'ota'

  const refreshDiagnostics = async () => {
    const plugins = Capacitor?.Plugins ? Object.keys(Capacitor.Plugins) : [];
    const isLiveActivityAvail = Capacitor?.isPluginAvailable ? Capacitor.isPluginAvailable('LiveActivityPlugin') : false;
    const audioCtx = audioEngine?.audioCtx;
    
    let settings = {};
    try {
      const raw = localStorage.getItem('pcflex_settings_v3') || localStorage.getItem('pc_flex_settings');
      if (raw) settings = JSON.parse(raw);
    } catch (e) {}
    setSoundSettings(settings);

    const info = {
      appVersion: APP_VERSION,
      platform: Capacitor.getPlatform(),
      isNative: Capacitor.isNativePlatform(),
      pluginsCount: plugins.length,
      registeredPlugins: plugins.join(', ') || 'None',
      liveActivityAvailable: isLiveActivityAvail,
      screenLogical: `${window.innerWidth}x${window.innerHeight}`,
      screenPhysical: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
      pixelRatio: window.devicePixelRatio || 1,
      audioState: audioCtx ? audioCtx.state : 'uninitialized',
      sampleRate: audioCtx ? audioCtx.sampleRate : 0,
      volumeSetting: `${settings.volume !== undefined ? settings.volume : 80}%`,
      hapticsSetting: settings.hapticsEnabled !== false ? 'BẬT' : 'TẮT',
      squeezePreset: settings.actionSounds?.squeeze || 'preset_14',
      relaxPreset: settings.actionSounds?.relax || 'preset_5',
      reversePreset: settings.actionSounds?.reverse || 'preset_1',
      userAgent: navigator.userAgent
    };
    setDiagInfo(info);

    // Chạy truy vấn Native sâu
    try {
      const natRes = await liveActivityService.getNativeDiagnostics();
      setNativeDiag(natRes);
    } catch (e) {
      setNativeDiag({ error: String(e) });
    }
  };

  useEffect(() => {
    const listener = (newLogs) => setLogs(newLogs);
    listeners.push(listener);

    refreshDiagnostics();
    addAppLog('info', `[AppInit] Khởi động Trạm Chẩn Đoán Cấp Chuyên Gia v5.0 (${APP_VERSION})`);

    return () => {
      listeners = listeners.filter(fn => fn !== listener);
    };
  }, []);

  const handleRunFullDiagnosticScan = async () => {
    setScanning(true);
    addAppLog('info', '================ BẮT ĐẦU QUÉT CHẨN ĐOÁN TOÀN DIỆN v5.0 ================');
    
    // TẦNG 1: Capacitor Bridge & Plugins
    const plugins = Capacitor?.Plugins ? Object.keys(Capacitor.Plugins) : [];
    addAppLog('info', `[Scan 1/5] Capacitor Native Bridge: ${Capacitor.isNativePlatform() ? 'NATIVE OK' : 'WEB'} - Plugins (${plugins.length}): ${plugins.join(', ')}`);

    // TẦNG 2: ActivityKit & Dynamic Island State
    try {
      const nat = await liveActivityService.getNativeDiagnostics();
      setNativeDiag(nat);
      addAppLog('info', `[Scan 2/4] Nhiệt độ máy: ${nat?.thermalState || 'Bình thường'} | Chế độ tiết kiệm pin: ${nat?.isLowPowerModeEnabled ? 'BẬT' : 'TẮT'}`);
      addAppLog('info', `[Scan 2/4] Pin: ${nat?.batteryLevelPercent >= 0 ? nat.batteryLevelPercent + '%' : 'N/A'} (${nat?.batteryState || 'N/A'})`);
    } catch (e) {
      addAppLog('error', `[Scan 2/4] Lỗi truy vấn phần cứng: ${e.message || String(e)}`);
    }

    // TẦNG 3: Audio Session & Route Detector
    const audioCtx = audioEngine?.audioCtx;
    addAppLog('info', `[Scan 3/4] Web Audio State: ${audioCtx ? audioCtx.state : 'uninitialized'} (${audioCtx?.sampleRate || 0}Hz)`);
    addAppLog('info', `[Scan 3/4] Audio Route Hiện Tại: ${nativeDiag?.currentAudioRoute || 'Loa ngoài iPhone'} | Interruption: ${nativeDiag?.lastInterruption || 'None'}`);

    // TẦNG 4: Kiểm tra kết nối GitHub OTA API & In-App Downloader
    try {
      const startTime = Date.now();
      const otaRes = await checkForUpdate(APP_VERSION);
      const pingMs = Date.now() - startTime;
      addAppLog('success', `[Scan 4/4] GitHub OTA API Ping: ${pingMs}ms | Bản mới nhất trên GitHub: ${otaRes.tagName || 'None'}`);
    } catch (e) {
      addAppLog('warn', `[Scan 4/4] GitHub OTA API Check: ${e.message || String(e)}`);
    }

    addAppLog('info', '================ HOÀN THÀNH QUÉT CHẨN ĐOÁN (v2.1.0) ================');
    setScanning(false);
  };

  const handleTestAudioPreset = (actionKey) => {
    audioEngine.resumeContext();
    if (actionKey === 'squeeze') {
      audioEngine.playSqueezeSFX(soundSettings.actionSounds);
      addAppLog('info', `[AudioTest] Phát âm thanh Siết (${diagInfo.squeezePreset}) ở âm lượng ${diagInfo.volumeSetting}`);
    } else if (actionKey === 'relax') {
      audioEngine.playRelaxSFX(soundSettings.actionSounds);
      addAppLog('info', `[AudioTest] Phát âm thanh Thả lỏng (${diagInfo.relaxPreset}) ở âm lượng ${diagInfo.volumeSetting}`);
    } else if (actionKey === 'reverse') {
      audioEngine.playReverseKegelSFX(soundSettings.actionSounds);
      addAppLog('info', `[AudioTest] Phát âm thanh Kegel ngược (${diagInfo.reversePreset}) ở âm lượng ${diagInfo.volumeSetting}`);
    }
  };

  const handleCopyLogs = () => {
    const summary = [
      `=== PC FLEX ULTRA DIAGNOSTIC REPORT [${diagInfo.appVersion}] ===`,
      `Platform: ${diagInfo.platform} (Native: ${diagInfo.isNative})`,
      `App Version: ${diagInfo.appVersion}`,
      `Screen Viewport: ${diagInfo.screenLogical} | Physical: ${diagInfo.screenPhysical} (DPR: ${diagInfo.pixelRatio})`,
      `LiveActivityPlugin Available: ${diagInfo.liveActivityAvailable}`,
      `iOS areActivitiesEnabled: ${nativeDiag?.areActivitiesEnabled ?? 'chưa quét'}`,
      `Has PlugIns Folder: ${nativeDiag?.hasPlugInsFolder ?? 'chưa quét'} | Widget Extension: ${nativeDiag?.hasWidgetExtension ?? 'chưa quét'}`,
      `PlugIns List: ${nativeDiag?.plugInsList?.join(', ') || 'none'}`,
      `Active Activities in SpringBoard: ${nativeDiag?.activeActivitiesCount ?? 0}`,
      `Activity State: ${nativeDiag?.lastActivityState ?? 'Idle'} | Total Dispatched Updates: ${nativeDiag?.totalUpdatesDispatched ?? 0}`,
      `Device Thermal State: ${nativeDiag?.thermalState ?? 'Chưa quét'} | Low Power Mode: ${nativeDiag?.isLowPowerModeEnabled ? 'BẬT' : 'TẮT'}`,
      `Battery Level: ${nativeDiag?.batteryLevelPercent !== undefined && nativeDiag.batteryLevelPercent >= 0 ? nativeDiag.batteryLevelPercent + '%' : 'N/A'} (${nativeDiag?.batteryState ?? 'N/A'})`,
      `Current Audio Route: ${nativeDiag?.currentAudioRoute ?? 'Loa ngoài'}`,
      `Audio Interruption History: ${nativeDiag?.lastInterruption ?? 'None'}`,
      `Audio Context State: ${diagInfo.audioState} (${diagInfo.sampleRate}Hz)`,
      `User Sound Presets: Siết=${diagInfo.squeezePreset} | Thả=${diagInfo.relaxPreset} | Ngược=${diagInfo.reversePreset}`,
      `User Settings: Âm lượng: ${diagInfo.volumeSetting} | Rung: ${diagInfo.hapticsSetting}`,
      `Registered Plugins (${diagInfo.pluginsCount}): ${diagInfo.registeredPlugins}`,
      `UserAgent: ${diagInfo.userAgent}`,
      '=================================',
      '',
      ...logs.map(l => `[${l.time}] [${l.type.toUpperCase()}] ${l.message}${l.data ? ' -> ' + l.data : ''}`)
    ].join('\n');

    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClearLogs = () => {
    logStore = [];
    setLogs([]);
    saveLogs([]);
  };

  return (
    <>
      {/* Nút tròn Con Bọ nổi cố định góc dưới bên phải */}
      <button
        onClick={() => { setIsOpen(true); refreshDiagnostics(); }}
        className="fixed bottom-24 right-4 z-50 w-11 h-11 rounded-full bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10 active:scale-95 transition-all hover:bg-emerald-500/30"
        title="Nhật ký con bọ (Debug)"
      >
        <Bug className="w-5 h-5 animate-pulse" />
      </button>

      {/* Modal Console Logs Toàn Màn Hình với Safe Area Inset */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col px-4 pb-6 text-xs font-mono select-text"
          style={{ paddingTop: 'max(env(safe-area-inset-top, 48px), 3.25rem)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">Trạm Chẩn Đoán Siêu Sâu Con Bọ v6.0</h3>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                    {APP_VERSION}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400">iOS 16.6+ • 4-Layer Sensors & Dynamic Island Inspector</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLogs}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1 text-[11px]"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Đã sao chép' : 'Sao chép'}
              </button>
              <button
                onClick={handleClearLogs}
                className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-red-400"
                title="Xóa log"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Diagnostics Widget Status Box */}
          <div className="my-3 p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 text-[11px] space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-1.5 rounded bg-black/40">
                <span className="text-zinc-400 flex items-center gap-1"><Cpu className="w-3 h-3 text-cyan-400" /> Nền tảng:</span>
                <span className="font-bold text-cyan-300">{diagInfo.platform} (Native: {String(diagInfo.isNative)})</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-black/40">
                <span className="text-zinc-400 flex items-center gap-1"><Activity className="w-3 h-3 text-emerald-400" /> Quyền LiveAct:</span>
                <span className={`font-bold ${nativeDiag?.areActivitiesEnabled ? 'text-emerald-400' : 'text-red-400'}`}>
                  {nativeDiag ? (nativeDiag.areActivitiesEnabled ? 'BẬT' : 'TẮT') : 'Đang đọc...'}
                </span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-black/40">
                <span className="text-zinc-400 flex items-center gap-1"><Headphones className="w-3 h-3 text-purple-400" /> Kênh Âm Thanh:</span>
                <span className="font-bold text-purple-300 truncate max-w-[90px]">{nativeDiag?.currentAudioRoute || 'Loa ngoài'}</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-black/40">
                <span className="text-zinc-400 flex items-center gap-1"><Radio className="w-3 h-3 text-amber-400" /> Gián Đoạn:</span>
                <span className="font-bold text-amber-300 truncate max-w-[90px]">{nativeDiag?.lastInterruption || 'None'}</span>
              </div>
            </div>

            {/* Thanh kiểm tra âm thanh trực tiếp */}
            <div className="p-2 rounded bg-black/50 border border-zinc-800 space-y-1">
              <div className="text-[10px] text-zinc-400 flex items-center gap-1 font-bold">
                <Music className="w-3 h-3 text-pink-400" /> Thử Nghiệm Âm Thanh Preset Cài Đặt:
              </div>
              <div className="flex gap-1.5 pt-1">
                <button
                  onClick={() => handleTestAudioPreset('squeeze')}
                  className="flex-1 py-1 px-1.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold active:scale-95"
                >
                  ⚡ Siết
                </button>
                <button
                  onClick={() => handleTestAudioPreset('relax')}
                  className="flex-1 py-1 px-1.5 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold active:scale-95"
                >
                  ❄️ Thả
                </button>
                <button
                  onClick={() => handleTestAudioPreset('reverse')}
                  className="flex-1 py-1 px-1.5 rounded bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-bold active:scale-95"
                >
                  🌊 Ngược
                </button>
              </div>
            </div>

            {/* Thuật toán quét chuyên sâu 5 bước Button */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleRunFullDiagnosticScan}
                disabled={scanning}
                className="flex-1 py-1.5 px-2 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold hover:bg-cyan-500/30 flex items-center justify-center gap-1.5 text-[11px] transition-all"
              >
                <SearchCode className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
                {scanning ? 'Đang chạy thuật toán quét 5 bước...' : '🔍 Quét Sâu Toàn Bộ Hệ Thống v5.0'}
              </button>
              <button
                onClick={refreshDiagnostics}
                className="py-1.5 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center gap-1"
                title="Làm mới"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Logs List Area */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 select-text">
            {logs.length === 0 ? (
              <div className="text-center py-10 text-zinc-600">Chưa có nhật ký ghi nhận nào. Bấm nút Quét Sâu ở trên để kiểm tra toàn bộ hệ thống.</div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2 rounded border text-[11px] leading-relaxed break-all ${
                    log.type === 'error'
                      ? 'bg-red-500/10 border-red-500/30 text-red-300 font-bold'
                      : log.type === 'warn'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : log.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[9px] opacity-70 mb-0.5">
                    <span className="font-semibold uppercase tracking-wider">[{log.type}]</span>
                    <span>{log.time}</span>
                  </div>
                  <div>{log.message}</div>
                  {log.data && (
                    <div className="mt-1 p-1 bg-black/50 rounded text-zinc-400 text-[10px]">
                      {log.data}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DebugLogger;
