import { registerPlugin, Capacitor } from '@capacitor/core';
import { addAppLog } from '../components/UI/DebugLogger';

/**
 * Service quản lý Native Bridge trên iOS
 * Chức năng Dynamic Island đã được tắt hoàn toàn để ứng dụng nhẹ, ổn định 100%
 */

const LiveActivityPlugin = registerPlugin('LiveActivityPlugin');

class LiveActivityService {
  constructor() {
    this.isActive = false;
    this.currentActivityId = null;
    this.tickListeners = [];
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
    return () => {};
  }

  async startLiveActivity() {
    // Dynamic Island đã tắt
    return null;
  }

  async updateLiveActivity() {
    // Dynamic Island đã tắt
    return null;
  }

  async stopLiveActivity() {
    // Dynamic Island đã tắt
    return null;
  }
}

export const liveActivityService = new LiveActivityService();
