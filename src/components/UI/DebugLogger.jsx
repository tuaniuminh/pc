import React, { useState, useEffect } from 'react';
import { Bug, X, Copy, Trash2, CheckCircle2, Play, RefreshCw, Cpu, Activity, Volume2, ShieldCheck, Tag } from 'lucide-react';
import { liveActivityService } from '../../services/liveActivityService';
import { audioEngine } from '../../utils/audioEngine';
import { Capacitor } from '@capacitor/core';

const APP_VERSION = 'v1.7.7';
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
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs.slice(0, 200)));
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
  if (logStore.length > 200) logStore.pop();
  saveLogs(logStore);
  listeners.forEach(fn => fn([...logStore]));
};

// Tự động bắt tất cả console log & sự kiện background
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

  document.addEventListener('visibilitychange', () => {
    const isHidden = document.hidden;
    if (isHidden) {
      bgStartTime = Date.now();
      bgTicks = 0;
      addAppLog('warn', `[AppState] Ẩn app (document.hidden = true) - Bắt đầu đo nhịp nền`);
      bgInterval = setInterval(() => {
        bgTicks++;
        if (bgTicks % 3 === 0) {
          addAppLog('info', `[BackgroundPulse] Tiến trình nền vẫn đang chạy: ${bgTicks}s`);
        }
      }, 1000);
    } else {
      if (bgInterval) clearInterval(bgInterval);
      const elapsed = bgStartTime > 0 ? ((Date.now() - bgStartTime) / 1000).toFixed(1) : 0;
      addAppLog('success', `[AppState] Mở lại app (document.hidden = false) - Thời gian ẩn: ${elapsed}s (Số nhịp nền: ${bgTicks})`);
    }
  });
}

const DebugLogger = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([...logStore]);
  const [copied, setCopied] = useState(false);
  const [diagInfo, setDiagInfo] = useState({});

  const refreshDiagnostics = () => {
    const plugins = Capacitor?.Plugins ? Object.keys(Capacitor.Plugins) : [];
    const isLiveActivityAvail = Capacitor?.isPluginAvailable ? Capacitor.isPluginAvailable('LiveActivityPlugin') : false;
    const audioCtx = audioEngine?.audioCtx;
    
    let settings = {};
    try {
      const raw = localStorage.getItem('pcflex_settings_v3') || localStorage.getItem('pc_flex_settings');
      if (raw) settings = JSON.parse(raw);
    } catch (e) {}

    setDiagInfo({
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
      userAgent: navigator.userAgent
    });
  };

  useEffect(() => {
    const listener = (newLogs) => setLogs(newLogs);
    listeners.push(listener);

    refreshDiagnostics();
    addAppLog('info', `[AppInit] Khởi tạo Con Bọ Siêu Chẩn Đoán v2.5 cho iPhone 14 Pro Max (${APP_VERSION})`);

    return () => {
      listeners = listeners.filter(fn => fn !== listener);
    };
  }, []);

  const handleCopyLogs = () => {
    const summary = [
      `=== PC FLEX ULTRA DIAGNOSTIC REPORT [${diagInfo.appVersion}] ===`,
      `Platform: ${diagInfo.platform} (Native: ${diagInfo.isNative})`,
      `App Version: ${diagInfo.appVersion}`,
      `Screen Viewport: ${diagInfo.screenLogical} | Physical: ${diagInfo.screenPhysical} (DPR: ${diagInfo.pixelRatio})`,
      `LiveActivityPlugin Available: ${diagInfo.liveActivityAvailable}`,
      `Audio Context State: ${diagInfo.audioState} (${diagInfo.sampleRate}Hz)`,
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

  const handleTestLiveActivity = async () => {
    addAppLog('info', '[Test] Bắt đầu kích hoạt thử nghiệm Live Activity (10s)...');
    try {
      const res = await liveActivityService.startLiveActivity({
        routineName: 'Kiểm Thử Dynamic Island',
        totalReps: 10,
        actionState: 'squeezing',
        timeRemaining: 10,
        currentRep: 1,
        stageLabel: 'Đang Siết (Kiểm thử 10s)',
        volume: 0.9,
        hapticsEnabled: true,
        sfxEnabled: true
      });
      addAppLog('success', `[Test] Kết quả kích hoạt: ${JSON.stringify(res)}`);
    } catch (e) {
      addAppLog('error', `[Test] Lỗi kích hoạt: ${e.message || String(e)}`);
    }
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

      {/* Modal Console Logs Toàn Màn Hình */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex flex-col p-4 text-xs font-mono select-text">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">Chẩn Đoán Hệ Thống & Native Bridge</h3>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                    {APP_VERSION}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400">iOS 16.6+ • Dynamic Island & Live Activities</p>
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
                <span className="text-zinc-400 flex items-center gap-1"><Activity className="w-3 h-3 text-emerald-400" /> LiveActivity:</span>
                <span className={`font-bold ${diagInfo.liveActivityAvailable ? 'text-emerald-400' : 'text-red-400'}`}>
                  {diagInfo.liveActivityAvailable ? 'SẴN SÀNG' : 'CHƯA ĐĂNG KÝ'}
                </span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-black/40">
                <span className="text-zinc-400 flex items-center gap-1"><Volume2 className="w-3 h-3 text-amber-400" /> Âm lượng:</span>
                <span className="font-bold text-amber-300">{diagInfo.volumeSetting} (Rung: {diagInfo.hapticsSetting})</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-black/40">
                <span className="text-zinc-400 flex items-center gap-1"><Tag className="w-3 h-3 text-purple-400" /> Phiên bản:</span>
                <span className="font-bold text-purple-300">{APP_VERSION}</span>
              </div>
            </div>

            {/* Test Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleTestLiveActivity}
                className="flex-1 py-1.5 px-2 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold hover:bg-emerald-500/30 flex items-center justify-center gap-1 text-[11px]"
              >
                <Play className="w-3 h-3" /> Test Live Activity (10s)
              </button>
              <button
                onClick={refreshDiagnostics}
                className="py-1.5 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center gap-1"
                title="Làm mới"
              >
                <RefreshCw className="w-3 h-3" /> Làm mới
              </button>
            </div>
          </div>

          {/* Logs List Area */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 select-text">
            {logs.length === 0 ? (
              <div className="text-center py-10 text-zinc-600">Chưa có nhật ký ghi nhận nào.</div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2 rounded border text-[11px] leading-relaxed break-all ${
                    log.type === 'error'
                      ? 'bg-red-500/10 border-red-500/30 text-red-300'
                      : log.type === 'warn'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : log.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
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
