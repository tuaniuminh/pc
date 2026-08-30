import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Timer from './components/Timer';
import History from './components/History';
import PlanManager from './components/PlanManager';
import Settings from './components/Settings';
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
  Settings as SettingsIcon 
} from 'lucide-react';
import { StatusBar, Style } from '@capacitor/status-bar';

function App() {
  const [activeTab, setActiveTab] = useState('timer'); // 'timer' | 'history' | 'plans' | 'settings'
  const [settings, setSettingsState] = useState(getSettings());
  const [userProfile, setUserProfile] = useState(getUserProfile());

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

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 dark:bg-oled text-slate-900 dark:text-white overflow-hidden font-sans transition-colors duration-300">
      {/* 1. Header Cố Định Ở Trên Cùng Có Safe Area Cho iPhone */}
      <Header 
        settings={settings}
        onToggleTheme={handleToggleTheme}
        onToggleSound={handleToggleSound}
        activeRoutineName={activeTab === 'timer' ? 'Sàn Chậu & Kegel AI' : null}
      />

      {/* 2. Phần Thân Chứa 4 Tab Tính Năng (Cho phép cuộn trang mượt mà trên mọi tab) */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden pb-28">
        {activeTab === 'timer' && (
          <Timer 
            settings={settings}
            userProfile={userProfile}
            onOpenAIPlan={() => setActiveTab('plans')}
          />
        )}

        {activeTab === 'history' && (
          <History 
            onStartWorkout={() => setActiveTab('timer')}
          />
        )}

        {activeTab === 'plans' && (
          <PlanManager 
            apiKey={settings.apiKey}
            onSelectPlan={handleSelectAIPlan}
            onOpenSettings={() => setActiveTab('settings')}
          />
        )}

        {activeTab === 'settings' && (
          <Settings 
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onNavigateToAI={() => setActiveTab('plans')}
          />
        )}
      </main>

      {/* 3. Bottom Navigation Bar Cố Định Ở Đáy */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-oled/95 backdrop-blur-2xl border-t border-slate-200 dark:border-white/5 safe-bottom-padding px-6 pt-2 transition-colors duration-300">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* Tab 1: Tập Luyện (Xanh Lá Neon / Emerald) */}
          <button
            onClick={() => setActiveTab('timer')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300 ${
              activeTab === 'timer'
                ? 'text-emerald-500 dark:text-neon scale-105 font-black'
                : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300'
            }`}
          >
            <Activity size={24} />
            <span className="text-[10px] tracking-tight mt-1 font-bold">Tập Luyện</span>
          </button>

          {/* Tab 2: Thành Tích (Vàng Hổ Phách / Amber Gold) */}
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300 ${
              activeTab === 'history'
                ? 'text-amber-500 dark:text-amber-400 scale-105 font-black'
                : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300'
            }`}
          >
            <HistoryIcon size={24} />
            <span className="text-[10px] tracking-tight mt-1 font-bold">Thành Tích</span>
          </button>

          {/* Tab 3: Trợ Lý AI (Xanh Cyan / Electric Blue) */}
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300 ${
              activeTab === 'plans'
                ? 'text-cyan-500 dark:text-cyan-neon scale-105 font-black'
                : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300'
            }`}
          >
            <Sparkles size={24} />
            <span className="text-[10px] tracking-tight mt-1 font-bold">Trợ Lý AI</span>
          </button>

          {/* Tab 4: Cài Đặt (Tím Điện Tử / Electric Purple) */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300 ${
              activeTab === 'settings'
                ? 'text-violet-600 dark:text-violet-400 scale-105 font-black'
                : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300'
            }`}
          >
            <SettingsIcon size={24} />
            <span className="text-[10px] tracking-tight mt-1 font-bold">Cài Đặt</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;
