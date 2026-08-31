import { Capacitor } from '@capacitor/core';

/**
 * Service quản lý Live Activities & Dynamic Island trên iOS (ActivityKit)
 * Cho phép hiển thị nhịp tập Kegel theo thời gian thực trên Màn hình khóa và Dynamic Island
 */

class LiveActivityService {
  constructor() {
    this.isActive = false;
    this.currentActivityId = null;
  }

  isSupported() {
    return Capacitor.getPlatform() === 'ios';
  }

  async startLiveActivity({
    routineName = 'Phục Hồi Ban Đêm',
    totalReps = 25,
    actionState = 'squeezing',
    timeRemaining = 5,
    currentRep = 1,
    stageLabel = 'Siết cơ PC'
  }) {
    if (!this.isSupported()) return;

    try {
      const { LiveActivityPlugin } = Capacitor.Plugins;
      if (LiveActivityPlugin && LiveActivityPlugin.startActivity) {
        const result = await LiveActivityPlugin.startActivity({
          routineName,
          totalReps,
          actionState,
          timeRemaining,
          currentRep,
          stageLabel
        });
        this.isActive = true;
        this.currentActivityId = result?.activityId || 'active';
      }
    } catch (error) {
      console.warn('[LiveActivity] Không thể khởi chạy Live Activity:', error);
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
      const { LiveActivityPlugin } = Capacitor.Plugins;
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
    } catch (error) {
      // Bỏ qua lỗi cập nhật nhẹ
    }
  }

  async stopLiveActivity() {
    if (!this.isSupported() || !this.isActive) return;

    try {
      const { LiveActivityPlugin } = Capacitor.Plugins;
      if (LiveActivityPlugin && LiveActivityPlugin.stopActivity) {
        await LiveActivityPlugin.stopActivity({
          activityId: this.currentActivityId
        });
      }
    } catch (error) {
      console.warn('[LiveActivity] Lỗi kết thúc Live Activity:', error);
    } finally {
      this.isActive = false;
      this.currentActivityId = null;
    }
  }
}

export const liveActivityService = new LiveActivityService();
