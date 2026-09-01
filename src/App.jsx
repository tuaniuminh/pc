import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Timer from './components/Timer';
import History from './components/History';
import PlanManager from './components/PlanManager';
import Settings from './components/Settings';
import DebugLogger from './components/UI/DebugLogger';
import UpdateModal from './components/UI/UpdateModal';
import { checkForUpdate } from './services/updateService';
import { 
  getSettings, 
  saveSettings, 
  getUserProfile, 
  recalibrateAndSyncAllData 
} from './services/storageService';
import { attachGlobalButtonHaptics } from './utils/hapticsUtils';
import { 
  Activity, 
  History as HistoryIcon, 
  Sparkles, 
  Settings as SettingsIcon,
  Lock,
  AlertCircle
} from 'lucide-react';
import { StatusBar, Style } from '@capacitor/status-bar';

const APP_VERSION = 'v2.2.1';

function App() {
  const [activeTab, setActiveTab] = useState('timer'); // 'timer' | 'history' | 'plans' | 'settings'
  const [settings, setSettingsState] = useState(getSettings());
  const [userProfile, setUserProfile] = useState(getUserProfile());
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [lockToast, setLockToast] = useState(null);
  const [updateInfo, setUpdateInfo] = useState(null);

  // Tự động kiểm tra bản cập nhật mới trên GitHub khi khởi động
  useEffect(() => {
    const timer = setTimeout(() => {
      checkForUpdate(APP_VERSION).then(res => {
        if (res && res.hasUpdate) {
          setUpdateInfo(res);
        }
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Kích hoạt cân chỉnh dữ liệu, phản hồi rung và Dark Mode / Status Bar
  useEffect(() => {
    recalibrateAndSyncAllData();
    attachGlobalButtonHaptics();

    const root = document.documentElement;
    const isDark = settings.theme === 'dark';

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Đồng bộ màu thanh trạng thái (Status Bar) trên iPhone
    const syncStatusBar = async () => {
      // 1. Cập nhật thẻ meta iOS Safari / WebKit
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', isDark ? '#000000' : '#ffffff');
      }

      const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (statusBarMeta) {
        statusBarMeta.setAttribute('content', isDark ? 'black-translucent' : 'default');
      }

      // 2. Cập nhật qua Native Capacitor StatusBar API trên iOS
      try {
        if (StatusBar) {
          await StatusBar.setStyle({
            style: isDark ? Style.Dark : Style.Light
          });
        }
      } catch (e) {
        // Fallback an toàn khi chạy web
      }
    };

    syncStatusBar();
  }, [settings.theme]);

  const handleUpdateSettings = (newSettings) => {
    setSettingsState(newSettings);
    saveSettings(newSettings);
    setUserProfile(getUserProfile());
  };

  const handleToggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    handleUpdateSettings({ ...settings, theme: newTheme });
  };

  const handleToggleSound = () => {
    handleUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled });
  };

  const handleSelectAIPlan = (plan) => {
    setActiveTab('timer'); // Chuyển về tab Tập Luyện khi chọn giáo án
  };

  const handleTabClick = (tabKey) => {
    // Chặn chuyển tab nếu buổi tập đang chạy (im lặng, không hiển thị Toast popup)
    if (isWorkoutActive && tabKey !== 'timer') {
      return;
    }
    setActiveTab(tabKey);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 dark:bg-oled text-slate-900 dark:text-white overflow-hidden font-sans transition-colors duration-300">
      {/* 1. Header Cố Định Ở Trên Cùng Có Safe Area Cho iPhone */}
      <Header 
        settings={settings}
        onToggleTheme={handleToggleTheme}
        onToggleSound={handleToggleSound}
        activeRoutineName={activeTab === 'timer' ? 'Sàn Chậu & Kegel AI' : null}
      />

      {/* 2. Phần Thân Chứa 4 Tab Tính Năng (Duy trì trạng thái liên tục trong DOM, không bao giờ bị reset bài tập khi chuyển tab) */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden pb-28">
        <div className={activeTab === 'timer' ? 'block' : 'hidden'}>
          <Timer 
            settings={settings}
            userProfile={userProfile}
            onOpenAIPlan={() => setActiveTab('plans')}
            onWorkoutActiveChange={setIsWorkoutActive}
          />
        </div>

        <div className={activeTab === 'history' ? 'block' : 'hidden'}>
          <History 
            onStartWorkout={() => setActiveTab('timer')}
          />
        </div>

        <div className={activeTab === 'plans' ? 'block' : 'hidden'}>
          <PlanManager 
            apiKey={settings.apiKey}
            onSelectPlan={handleSelectAIPlan}
            onOpenSettings={() => setActiveTab('settings')}
          />
        </div>

        <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
          <Settings 
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onNavigateToAI={() => setActiveTab('plans')}
          />
        </div>
      </main>

      {/* 3. Bottom Navigation Bar Cố Định Ở Đáy (Khóa chuyển tab khi đang tập, không hiện Toast) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-oled/95 backdrop-blur-2xl border-t border-slate-200 dark:border-white/5 safe-bottom-padding px-6 pt-2 transition-colors duration-300">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* Tab 1: Tập Luyện (Xanh Lá Neon / Emerald) */}
          <button
            onClick={() => handleTabClick('timer')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300 ${
              activeTab === 'timer'
                ? 'text-emerald-600 dark:text-neon scale-105 font-black'
                : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300'
            }`}
          >
            <Activity size={24} />
            <span className="text-[10px] tracking-tight mt-1 font-bold">Tập Luyện</span>
          </button>

          {/* Tab 2: Thành Tích (Vàng Hổ Phách / Amber Gold) */}
          <button
            onClick={() => handleTabClick('history')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300 relative ${
              activeTab === 'history'
                ? 'text-amber-600 dark:text-amber-400 scale-105 font-black'
                : isWorkoutActive
                ? 'text-slate-300 dark:text-gray-700 opacity-40 cursor-not-allowed'
                : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300'
            }`}
          >
            <div className="relative">
              <HistoryIcon size={24} />
              {isWorkoutActive && (
                <Lock size={10} className="absolute -top-1 -right-1 text-amber-500" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1 font-bold">Thành Tích</span>
          </button>

          {/* Tab 3: Trợ Lý AI (Xanh Cyan / Electric Blue) */}
          <button
            onClick={() => handleTabClick('plans')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300 relative ${
              activeTab === 'plans'
                ? 'text-cyan-600 dark:text-cyan-neon scale-105 font-black'
                : isWorkoutActive
                ? 'text-slate-300 dark:text-gray-700 opacity-40 cursor-not-allowed'
                : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300'
            }`}
          >
            <div className="relative">
              <Sparkles size={24} />
              {isWorkoutActive && (
                <Lock size={10} className="absolute -top-1 -right-1 text-cyan-500" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1 font-bold">Trợ Lý AI</span>
          </button>

          {/* Tab 4: Cài Đặt (Tím Điện Tử / Electric Purple) */}
          <button
            onClick={() => handleTabClick('settings')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300 relative ${
              activeTab === 'settings'
                ? 'text-violet-600 dark:text-violet-400 scale-105 font-black'
                : isWorkoutActive
                ? 'text-slate-300 dark:text-gray-700 opacity-40 cursor-not-allowed'
                : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300'
            }`}
          >
            <div className="relative">
              <SettingsIcon size={24} />
              {isWorkoutActive && (
                <Lock size={10} className="absolute -top-1 -right-1 text-violet-500" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1 font-bold">Cài Đặt</span>
          </button>
        </div>
      </nav>

      {/* 4. Con Bọ Log Nổi Chẩn Đoán Lỗi (Floating Debug Logger - Có thể bật/tắt trong Cài đặt) */}
      {settings.debugLoggerEnabled !== false && <DebugLogger />}

      {/* 5. Modal Cập Nhật Phiên Bản Mới OTA (TrollStore 1-Click Update) */}
      <UpdateModal updateInfo={updateInfo} onClose={() => setUpdateInfo(null)} />
    </div>
  );
}

export default App;
