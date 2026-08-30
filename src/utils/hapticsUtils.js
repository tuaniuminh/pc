import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Taptic Engine Haptic Feedback Helper for iOS TrollStore & Web
 */

export const isHapticsSupported = () => {
  return typeof window !== 'undefined' && ('vibrate' in navigator || !!Haptics);
};

export const triggerHapticHeavy = async () => {
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
  try {
    if (Haptics) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      setTimeout(async () => {
        try {
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
    const btn = e.target.closest('button, [role="button"], a, input[type="checkbox"], input[type="radio"]');
    if (btn) {
      triggerHapticLight();
    }
  };

  document.removeEventListener('click', handleGlobalClick);
  document.addEventListener('click', handleGlobalClick, { passive: true });
};
