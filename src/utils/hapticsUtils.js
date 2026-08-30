import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Taptic Engine Haptic Feedback Helper for iOS TrollStore & Web
 * Tự động kiểm tra cài đặt bật/tắt rung của người dùng (hapticsEnabled)
 */

export const isHapticsEnabled = () => {
  try {
    const raw = localStorage.getItem('pc_flex_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.hapticsEnabled === false) return false;
    }
  } catch (e) {}
  return true;
};

export const isHapticsSupported = () => {
  return typeof window !== 'undefined' && ('vibrate' in navigator || !!Haptics);
};

export const triggerHapticHeavy = async () => {
  if (!isHapticsEnabled()) return;
  try {
    if (Haptics) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(60);
    }
  } catch (e) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(60);
    }
  }
};

export const triggerHapticMedium = async () => {
  if (!isHapticsEnabled()) return;
  try {
    if (Haptics) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(35);
    }
  } catch (e) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(35);
    }
  }
};

export const triggerHapticLight = async () => {
  if (!isHapticsEnabled()) return;
  try {
    if (Haptics) {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  } catch (e) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  }
};

export const triggerHapticSuccess = async () => {
  if (!isHapticsEnabled()) return;
  try {
    if (Haptics) {
      await Haptics.notification({ type: NotificationType.Success });
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 60, 80]);
    }
  } catch (e) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 60, 80]);
    }
  }
};

export const triggerHapticSelection = async () => {
  if (!isHapticsEnabled()) return;
  try {
    if (Haptics) {
      await Haptics.selectionChanged();
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  } catch (e) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }
};

export const triggerHapticHeartbeat = async () => {
  if (!isHapticsEnabled()) return;
  try {
    if (Haptics) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      setTimeout(async () => {
        try {
          if (!isHapticsEnabled()) return;
          await Haptics.impact({ style: ImpactStyle.Medium });
        } catch (e) {}
      }, 120);
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50, 70, 30]);
    }
  } catch (e) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50, 70, 30]);
    }
  }
};

/**
 * Gắn haptic feedback nhẹ cho tất cả nút bấm khi người dùng tương tác
 */
export const attachGlobalButtonHaptics = () => {
  if (typeof window === 'undefined') return;

  const handleGlobalClick = (e) => {
    if (!isHapticsEnabled()) return;
    const btn = e.target.closest('button, [role="button"], a, input[type="checkbox"], input[type="radio"]');
    if (btn) {
      triggerHapticLight();
    }
  };

  document.removeEventListener('click', handleGlobalClick);
  document.addEventListener('click', handleGlobalClick, { passive: true });
};
