import { registerPlugin, Capacitor } from '@capacitor/core';
import { addAppLog } from '../components/UI/DebugLogger';

/**
 * Service quản lý Live Activities & Dynamic Island trên iOS (ActivityKit)
 * Tích hợp Native Workout Engine chạy độc lập ở tầng Swift của iOS
 */

const LiveActivityPlugin = registerPlugin('LiveActivityPlugin');

class LiveActivityService {
  constructor() {
    this.isActive = false;
    this.currentActivityId = null;
    this.tickListeners = [];

    if (this.isSupported() && LiveActivityPlugin) {
      LiveActivityPlugin.addListener?.('workoutTick', (data) => {
        this.tickListeners.forEach(fn => fn(data));
      });
      LiveActivityPlugin.addListener?.('workoutCompleted', () => {
        this.isActive = false;
        this.currentActivityId = null;
      });
    }
  }

  isSupported() {
    return Capacitor.getPlatform() === 'ios';
  }

  async getNativeDiagnostics() {
    if (!this.isSupported()) return { isSupported: false, platform: Capacitor.getPlatform() };
    try {
      if (LiveActivityPlugin && LiveActivityPlugin.getDiagnosticInfo) {
        return await LiveActivityPlugin.getDiagnosticInfo();
      }
    } catch (e) {
      return { error: e.message || String(e) };
    }
    return { status: 'Plugin method not available' };
  }

  onWorkoutTick(callback) {
    this.tickListeners.push(callback);
    return () => {
      this.tickListeners = this.tickListeners.filter(fn => fn !== callback);
    };
  }

  async startLiveActivity({
    routineName = 'Phục Hồi Ban Đêm',
    totalReps = 25,
    actionState = 'squeezing',
    timeRemaining = 5,
    currentRep = 1,
    stageLabel = 'Siết cơ PC',
    squeezeTime = 1,
    relaxTime = 2,
    hapticsEnabled = true,
    sfxEnabled = true,
    volume = 0.8
  }) {
    addAppLog('info', `[LiveActivity] Yêu cầu khởi động: ${routineName} (${actionState} ${timeRemaining}s, Rep ${currentRep}/${totalReps}, Rung: ${hapticsEnabled}, Âm lượng: ${Math.round(volume * 100)}%)`);

    if (!this.isSupported()) {
      addAppLog('warn', `[LiveActivity] Bỏ qua vì nền tảng hiện tại là: ${Capacitor.getPlatform()} (Cần chạy trên iOS native)`);
      return;
    }

    try {
      if (LiveActivityPlugin && LiveActivityPlugin.startActivity) {
        addAppLog('info', `[LiveActivity] Đang gọi Native LiveActivityPlugin.startActivity...`);
        const result = await LiveActivityPlugin.startActivity({
          routineName,
          totalReps,
          actionState,
          timeRemaining,
          currentRep,
          stageLabel,
          squeezeTime,
          relaxTime,
          hapticsEnabled,
          sfxEnabled,
          volume
        });
        this.isActive = true;
        this.currentActivityId = result?.activityId || 'active';
        addAppLog('success', `[LiveActivity] Kích hoạt thành công! Activity ID: ${this.currentActivityId}`);
      } else {
        addAppLog('error', `[LiveActivity] Không tìm thấy plugin LiveActivityPlugin trên Bridge`);
      }
    } catch (error) {
      addAppLog('error', `[LiveActivity] Lỗi khi tạo Live Activity: ${error?.message || error}`);
    }
  }

  async updateLiveActivity({
    actionState = 'squeezing',
    timeRemaining = 5,
    currentRep = 1,
    totalReps = 25,
    stageLabel = 'Siết cơ PC'
  }) {
    if (!this.isSupported() || !this.isActive) return;

    try {
      if (LiveActivityPlugin && LiveActivityPlugin.updateActivity) {
        await LiveActivityPlugin.updateActivity({
          activityId: this.currentActivityId,
          actionState,
          timeRemaining,
          currentRep,
          totalReps,
          stageLabel
        });
      }
    } catch (error) {}
  }

  async stopLiveActivity() {
    if (!this.isSupported() || !this.isActive) return;

    try {
      addAppLog('info', `[LiveActivity] Dừng Live Activity ID: ${this.currentActivityId}`);
      if (LiveActivityPlugin && LiveActivityPlugin.stopActivity) {
        await LiveActivityPlugin.stopActivity({
          activityId: this.currentActivityId
        });
      }
    } catch (error) {
      addAppLog('warn', `[LiveActivity] Lỗi khi dừng Live Activity: ${error?.message || error}`);
    } finally {
      this.isActive = false;
      this.currentActivityId = null;
    }
  }
}

export const liveActivityService = new LiveActivityService();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    liveActivityService.stopLiveActivity();
  });
  window.addEventListener('pagehide', () => {
    liveActivityService.stopLiveActivity();
  });
}
