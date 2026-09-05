import React, { useState } from 'react';
import { 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  Activity, 
  Sparkles, 
  Check, 
  Loader2 
} from 'lucide-react';
import packageJson from '../../package.json';
import { checkForUpdate } from '../services/updateService';
import { triggerHapticLight, triggerHapticMedium } from '../utils/hapticsUtils';

const Header = ({ 
  settings, 
  onToggleTheme, 
  onToggleSound, 
  activeRoutineName,
  appVersion = packageJson.version,
  availableUpdate,
  onOpenUpdateModal,
  onUpdateDetected
}) => {
  const isDark = settings.theme === 'dark';
  const [checkStatus, setCheckStatus] = useState('idle'); // 'idle' | 'checking' | 'latest'

  const handleVersionClick = async () => {
    // 1. Nếu đã phát hiện có bản mới -> Mở ngay bảng cập nhật
    if (availableUpdate && availableUpdate.hasUpdate) {
      triggerHapticMedium();
      if (onOpenUpdateModal) {
        onOpenUpdateModal(availableUpdate);
      }
      return;
    }

    // 2. Chặn thao tác trùng lặp khi đang trong tiến trình kiểm tra
    if (checkStatus === 'checking') return;

    // 3. Kích hoạt hiệu ứng kiểm tra phiên bản mới
    setCheckStatus('checking');
    triggerHapticLight();

    try {
      const [res] = await Promise.all([
        checkForUpdate(appVersion),
        new Promise(r => setTimeout(r, 400)) // Phản hồi kiểm tra nhanh chóng
      ]);

      if (res && res.hasUpdate) {
        if (onUpdateDetected) onUpdateDetected(res);
        if (onOpenUpdateModal) onOpenUpdateModal(res);
        setCheckStatus('idle');
        triggerHapticMedium();
      } else {
        // Đã là phiên bản mới nhất -> Hiển thị hiệu ứng trong 1 giây theo yêu cầu
        setCheckStatus('latest');
        triggerHapticLight();
        setTimeout(() => {
          setCheckStatus('idle');
        }, 1000);
      }
    } catch (e) {
      setCheckStatus('idle');
    }
  };

  const cleanVersion = (appVersion || packageJson.version || '2.2.27').replace(/^v/i, '');

  return (
    <header className="w-full safe-top-padding px-5 pb-3 pt-2 bg-white/95 dark:bg-oled/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 z-30 transition-colors duration-300">
      <div className="flex items-center justify-between">
        {/* Logo & Tiêu đề ứng dụng */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 via-neon to-cyan-500 p-0.5 shadow-sm dark:shadow-neon">
            <div className="w-full h-full bg-white dark:bg-oled rounded-[14px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-600 dark:text-neon animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                PC FLEX
              </h1>

              {/* Nút số phiên bản kiêm kiểm tra & biểu tượng thông báo cập nhật */}
              <button
                type="button"
                disabled={checkStatus === 'checking'}
                onClick={handleVersionClick}
                className={`relative text-[10px] font-bold px-2 py-0.5 rounded-full transition-all duration-300 flex items-center space-x-1 border shadow-xs active:scale-95 ${
                  availableUpdate?.hasUpdate
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white border-amber-300/60 shadow-md shadow-amber-500/25 animate-pulse cursor-pointer'
                    : checkStatus === 'checking'
                    ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-400/40 animate-pulse cursor-wait'
                    : checkStatus === 'latest'
                    ? 'bg-emerald-500 text-white dark:bg-emerald-500/30 dark:text-emerald-300 border-emerald-400/80 shadow-sm scale-105'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-neon/10 dark:text-neon border-emerald-300/40 dark:border-neon/20 hover:border-emerald-400 dark:hover:border-neon/50 hover:bg-emerald-200/60 dark:hover:bg-neon/20 cursor-pointer'
                }`}
                title={
                  availableUpdate?.hasUpdate
                    ? `Đã có bản cập nhật mới ${availableUpdate.tagName || ''}! Bấm để cập nhật`
                    : checkStatus === 'checking'
                    ? 'Đang kiểm tra phiên bản mới trên GitHub...'
                    : checkStatus === 'latest'
                    ? 'Bạn đang sử dụng phiên bản mới nhất!'
                    : 'Bấm để kiểm tra bản cập nhật mới'
                }
              >
                {availableUpdate?.hasUpdate ? (
                  <>
                    <Sparkles size={11} className="text-white animate-spin" style={{ animationDuration: '3s' }} />
                    <span className="font-extrabold tracking-tight">v{cleanVersion} • Bản mới</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping ml-0.5" />
                  </>
                ) : checkStatus === 'checking' ? (
                  <>
                    <Loader2 size={10} className="animate-spin text-cyan-600 dark:text-cyan-400" />
                    <span className="font-mono">Kiểm tra...</span>
                  </>
                ) : checkStatus === 'latest' ? (
                  <>
                    <Check size={11} className="stroke-[3] text-white dark:text-emerald-300" />
                    <span className="font-bold">Mới nhất</span>
                  </>
                ) : (
                  <>
                    <span className="font-mono">v{cleanVersion}</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-neon animate-ping" />
              <span className="line-clamp-1">{activeRoutineName ? `${activeRoutineName.slice(0, 22)}` : 'Sàn Chậu & Kegel AI'}</span>
            </div>
          </div>
        </div>

        {/* Nút thao tác nhanh (Bật/Tắt âm báo + Đổi giao diện Sáng/Tối) */}
        <div className="flex items-center space-x-2">
          {/* Quick Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-95 ${
              settings.soundEnabled 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400 shadow-sm' 
                : 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-white/5 dark:border-white/10 dark:text-gray-400'
            }`}
            title={settings.soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
          >
            {settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Quick Dark / Light Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 transition-all active:scale-95 hover:bg-slate-200 dark:hover:bg-white/10"
            title="Đổi giao diện Sáng / Tối OLED"
          >
            {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
