import React, { useState, useEffect } from 'react';
import { Bug, X, Copy, Trash2, CheckCircle2, AlertTriangle, Info, Play } from 'lucide-react';
import { liveActivityService } from '../../services/liveActivityService';
import { Capacitor } from '@capacitor/core';

// Bộ đệm lưu trữ logs trong bộ nhớ
const logStore = [];
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
  if (logStore.length > 80) logStore.pop();
  listeners.forEach(fn => fn([...logStore]));
};

// Ghi đè console để tự động bắt log
if (typeof window !== 'undefined') {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = (...args) => {
    originalLog(...args);
    const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    if (msg.includes('[LiveActivity]') || msg.includes('[Audio]') || msg.includes('[Workout]')) {
      addAppLog('info', msg);
    }
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
}

const DebugLogger = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([...logStore]);
  const [copied, setCopied] = useState(false);
  const [deviceDetails, setDeviceDetails] = useState({});

  useEffect(() => {
    const listener = (newLogs) => setLogs(newLogs);
    listeners.push(listener);

    // Thu thập thông tin thiết bị và ActivityKit
    setDeviceDetails({
      platform: Capacitor.getPlatform(),
      isNative: Capacitor.isNativePlatform(),
      userAgent: navigator.userAgent,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      liveActivityPluginAvailable: !!(Capacitor.Plugins?.LiveActivityPlugin)
    });

    addAppLog('info', 'Khởi tạo Debug Logger cho iOS 16.6+');

    return () => {
      listeners = listeners.filter(fn => fn !== listener);
    };
  }, []);

  const handleCopy = () => {
    const text = logs.map(l => `[${l.time}] [${l.type.toUpperCase()}] ${l.message} ${l.data ? ' -> ' + l.data : ''}`).join('\n');
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    logStore.length = 0;
    setLogs([]);
  };

  const handleTestLiveActivity = async () => {
    addAppLog('info', 'Đang gửi yêu cầu test Live Activity...');
    try {
      await liveActivityService.startLiveActivity({
        routineName: 'Test Live Activity',
        totalReps: 10,
        actionState: 'squeezing',
        timeRemaining: 15,
        currentRep: 1,
        stageLabel: 'Test Đảo Thích Ứng'
      });
      addAppLog('success', 'Đã gọi LiveActivityService.start thành công!');
    } catch (e) {
      addAppLog('error', 'Lỗi gọi Live Activity:', e);
    }
  };

  return (
    <>
      {/* Nút Bọ Log Nổi Trên Màn Hình (Góc Dưới Phải) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-4 z-50 w-10 h-10 rounded-full bg-slate-900/90 dark:bg-white/15 text-emerald-400 border border-emerald-500/40 shadow-xl flex items-center justify-center backdrop-blur-md active:scale-95 transition-all"
        title="Xem Nhật Ký Lỗi & Live Activities"
      >
        <Bug size={18} />
      </button>

      {/* Modal Nhật Ký Chẩn Đoán Lỗi */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-md h-[80vh] rounded-3xl p-5 border border-emerald-500/40 flex flex-col space-y-3 shadow-2xl bg-slate-950 text-white font-mono text-xs">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Bug size={18} className="text-emerald-400" />
                <span className="font-bold text-sm text-emerald-400">Chẩn Đoán iOS & Live Activity</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-white/10 text-gray-400">
                <X size={18} />
              </button>
            </div>

            {/* Thông Tin Thiết Bị */}
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 space-y-1 text-[10px] text-gray-300">
              <div><strong>Nền tảng:</strong> {deviceDetails.platform} ({deviceDetails.isNative ? 'Native iOS IPA' : 'Web Browser'})</div>
              <div><strong>LiveActivity Plugin:</strong> {deviceDetails.liveActivityPluginAvailable ? '✅ Đã tìm thấy' : '⚠️ Chưa nhận diện'}</div>
              <div><strong>Kích thước màn hình:</strong> {deviceDetails.screenWidth} x {deviceDetails.screenHeight}</div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleTestLiveActivity}
                className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 text-black font-bold flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
              >
                <Play size={12} fill="currentColor" />
                <span>Test Live Activity</span>
              </button>

              <button
                onClick={handleCopy}
                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 font-bold flex items-center space-x-1 active:scale-95 transition-all"
              >
                {copied ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? 'Đã sao chép' : 'Copy'}</span>
              </button>

              <button
                onClick={handleClear}
                className="py-2 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold flex items-center space-x-1 active:scale-95 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Log Stream Body */}
            <div className="flex-1 overflow-y-auto space-y-1.5 p-2 bg-black/50 rounded-xl border border-white/5 font-mono text-[11px]">
              {logs.length === 0 ? (
                <div className="text-gray-500 text-center py-8">Chưa có nhật ký nào. Hãy bấm "Test Live Activity" hoặc bắt đầu tập để ghi log.</div>
              ) : (
                logs.map((l) => (
                  <div 
                    key={l.id} 
                    className={`p-1.5 rounded border leading-tight ${
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
                    <div className="mt-0.5 break-words">{l.message}</div>
                    {l.data && <div className="text-[10px] text-gray-400 mt-0.5 break-all">{l.data}</div>}
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
