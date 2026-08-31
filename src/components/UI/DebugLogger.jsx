import React, { useState, useEffect } from 'react';
import { Bug, X, Copy, Trash2, CheckCircle2, Play, RefreshCw, Cpu, Activity } from 'lucide-react';
import { liveActivityService } from '../../services/liveActivityService';
import { Capacitor } from '@capacitor/core';

const LOG_STORAGE_KEY = 'pcflex_debug_logs_v1';

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
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs.slice(0, 150)));
  } catch (e) {}
};

let logStore = getStoredLogs();
let listeners = [];

export const addAppLog = (type, message, data = null) => {
  const entry = {
    id: Date.now() + Math.random(),
    time: new Date().toLocaleTimeString(),
    type, // 'info' | 'success' | 'warn' | 'error'
    message,
    data: data ? (typeof data === 'object' ? JSON.stringify(data) : String(data)) : null
  };
  logStore.unshift(entry);
  if (logStore.length > 150) logStore.pop();
  saveLogs(logStore);
  listeners.forEach(fn => fn([...logStore]));
};

// Tự động bắt tất cả console log
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

  document.addEventListener('visibilitychange', () => {
    addAppLog('info', `[AppState] Visibility change: document.hidden = ${document.hidden}`);
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
    
    setDiagInfo({
      platform: Capacitor.getPlatform(),
      isNative: Capacitor.isNativePlatform(),
      pluginsCount: plugins.length,
      registeredPlugins: plugins.join(', ') || 'None',
      liveActivityAvailable: isLiveActivityAvail,
      screen: `${window.innerWidth}x${window.innerHeight}`,
      userAgent: navigator.userAgent
    });
  };

  useEffect(() => {
    const listener = (newLogs) => setLogs(newLogs);
    listeners.push(listener);

    refreshDiagnostics();
    addAppLog('info', `[AppInit] Khởi tạo chẩn đoán hệ thống cho iOS 16.6+`);

    return () => {
      listeners = listeners.filter(fn => fn !== listener);
    };
  }, []);

  const handleCopy = () => {
    const header = `=== PC FLEX DIAGNOSTIC REPORT ===\nPlatform: ${diagInfo.platform} (Native: ${diagInfo.isNative})\nScreen: ${diagInfo.screen}\nLiveActivityPlugin Available: ${diagInfo.liveActivityAvailable}\nRegistered Plugins (${diagInfo.pluginsCount}): ${diagInfo.registeredPlugins}\nUserAgent: ${diagInfo.userAgent}\n=================================\n\n`;
    const text = header + logs.map(l => `[${l.time}] [${l.type.toUpperCase()}] ${l.message} ${l.data ? ' -> ' + l.data : ''}`).join('\n');
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    logStore = [];
    saveLogs([]);
    setLogs([]);
  };

  const handleTestLiveActivity = async () => {
    refreshDiagnostics();
    addAppLog('info', '--- BẮT ĐẦU TEST LIVE ACTIVITY ---');
    addAppLog('info', `Plugins đã nạp: [${diagInfo.registeredPlugins}]`);
    addAppLog('info', `Kiểm tra isPluginAvailable('LiveActivityPlugin'): ${Capacitor.isPluginAvailable('LiveActivityPlugin')}`);

    try {
      await liveActivityService.startLiveActivity({
        routineName: 'Test Đảo Thích Ứng',
        totalReps: 20,
        actionState: 'squeezing',
        timeRemaining: 10,
        currentRep: 1,
        stageLabel: 'Siết cơ PC 10s'
      });
      addAppLog('success', 'Đã hoàn thành yêu cầu startLiveActivity');
    } catch (e) {
      addAppLog('error', `Ngoại lệ khi gọi LiveActivity: ${e?.message || e}`, e?.stack);
    }
  };

  return (
    <>
      {/* Nút Bọ Log Nổi Trên Màn Hình (Góc Dưới Phải) */}
      <button
        onClick={() => {
          refreshDiagnostics();
          setIsOpen(!isOpen);
        }}
        className="fixed bottom-24 right-4 z-50 w-11 h-11 rounded-full bg-slate-950/90 text-emerald-400 border border-emerald-500/50 shadow-2xl flex items-center justify-center backdrop-blur-xl active:scale-95 transition-all"
        title="Chẩn Đoán Native Bridge & Live Activities"
      >
        <Bug size={20} />
      </button>

      {/* Modal Nhật Ký Chẩn Đoán Lỗi */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in">
          <div className="glass-panel w-full max-w-md h-[86vh] rounded-3xl p-4 border border-emerald-500/40 flex flex-col space-y-2.5 shadow-2xl bg-slate-950 text-white font-mono text-xs">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center space-x-2">
                <Bug size={18} className="text-emerald-400" />
                <span className="font-bold text-sm text-emerald-400">Chẩn Đoán Chi Tiết iOS</span>
              </div>
              <div className="flex items-center space-x-1">
                <button onClick={refreshDiagnostics} className="p-1 rounded-lg hover:bg-white/10 text-cyan-400" title="Làm mới thông số">
                  <RefreshCw size={15} />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-white/10 text-gray-400">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Thông Tin Native Bridge */}
            <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10 space-y-1 text-[10px] text-gray-300 leading-tight">
              <div className="flex justify-between items-center">
                <span>Nền tảng: <strong className="text-white">{diagInfo.platform}</strong> ({diagInfo.isNative ? 'Native IPA' : 'Browser'})</span>
                <span className={`px-1.5 py-0.5 rounded font-bold ${diagInfo.liveActivityAvailable ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                  {diagInfo.liveActivityAvailable ? 'LiveActivity: SẴN SÀNG' : 'LiveActivity: CHƯA ĐĂNG KÝ'}
                </span>
              </div>
              <div className="line-clamp-2 text-gray-400">
                <strong>Plugins ({diagInfo.pluginsCount}):</strong> {diagInfo.registeredPlugins}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleTestLiveActivity}
                className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black flex items-center justify-center space-x-1.5 active:scale-95 transition-all text-xs"
              >
                <Play size={13} fill="currentColor" />
                <span>Test Live Activity</span>
              </button>

              <button
                onClick={handleCopy}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-400 font-bold flex items-center space-x-1.5 active:scale-95 transition-all text-xs"
              >
                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Đã copy' : 'Copy'}</span>
              </button>

              <button
                onClick={handleClear}
                className="py-2.5 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold flex items-center space-x-1 active:scale-95 transition-all"
                title="Xóa logs"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Log Stream Body */}
            <div className="flex-1 overflow-y-auto space-y-1.5 p-2 bg-black/70 rounded-2xl border border-white/5 font-mono text-[10.5px]">
              {logs.length === 0 ? (
                <div className="text-gray-500 text-center py-8">Chưa có log. Bấm "Test Live Activity" phía trên để kiểm tra.</div>
              ) : (
                logs.map((l) => (
                  <div 
                    key={l.id} 
                    className={`p-1.5 rounded-xl border leading-tight ${
                      l.type === 'error' ? 'bg-red-950/40 border-red-500/40 text-red-300' :
                      l.type === 'warn' ? 'bg-amber-950/40 border-amber-500/40 text-amber-300' :
                      l.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' :
                      'bg-white/5 border-white/10 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-1 opacity-70 text-[9px]">
                      <span>{l.time}</span>
                      <span>•</span>
                      <span className="uppercase font-bold">{l.type}</span>
                    </div>
                    <div className="mt-0.5 break-words font-semibold">{l.message}</div>
                    {l.data && <div className="text-[9.5px] text-gray-400 mt-0.5 break-all font-mono opacity-85">{l.data}</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DebugLogger;
