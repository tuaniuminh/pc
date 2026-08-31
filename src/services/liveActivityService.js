import { registerPlugin, Capacitor } from '@capacitor/core';
import { addAppLog } from '../components/UI/DebugLogger';

/**
 * Service quản lý Live Activities & Dynamic Island trên iOS (ActivityKit)
 * Cho phép hiển thị nhịp tập Kegel theo thời gian thực trên Màn hình khóa và Dynamic Island
 */

// Đăng ký Plugin chính thức với Capacitor Bridge
const LiveActivityPlugin = registerPlugin('LiveActivityPlugin');

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
    addAppLog('info', `[LiveActivity] Yêu cầu khởi động: ${routineName} (${actionState} ${timeRemaining}s, Rep ${currentRep}/${totalReps})`);

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
          stageLabel
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
    } catch (error) {
      // Bỏ qua lỗi cập nhật nhẹ để tránh flood log
    }
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
