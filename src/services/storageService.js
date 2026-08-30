/**
 * PC Flex - Storage Service, Clinical Levels & Badge Achievement System
 */

const STORAGE_KEYS = {
  SETTINGS: 'pcflex_settings_v3',
  HISTORY: 'pcflex_history_v3',
  ACTIVE_ROUTINE: 'pcflex_active_routine_v3',
  CUSTOM_PLANS: 'pcflex_custom_plans_v3',
  USER_PROFILE: 'pcflex_user_profile_v3',
  UNLOCKED_BADGES: 'pcflex_unlocked_badges_v3'
};

// ==================== 1. CLINICAL WORKOUT LEVELS (1 - 5) ====================
export const CLINICAL_LEVELS = {
  1: {
    levelNumber: 1,
    name: 'Nhập Môn & Đánh Thức',
    description: 'Làm quen cảm giác co thắt cơ mu cụt (PC) và mở rộng sàn chậu',
    male: {
      goodMorning: {
        id: 'male_l1_gm',
        name: 'Chào Buổi Sáng',
        meta: '20 lượt siết 1s - thả 2s | 5 lượt Kegel ngược giãn chậu',
        icon: '🌅',
        stages: [
          { type: 'normal', squeeze: 1, relax: 2, reps: 20, label: 'Siết Phản Xạ 1s' },
          { type: 'reverse', squeeze: 5, relax: 5, reps: 5, label: 'Kegel Ngược Thư Giãn' }
        ]
      },
      powerCombo: {
        id: 'male_l1_pc',
        name: 'Combo Sức Mạnh',
        meta: 'Siết nhanh 20 lượt 1s | Giữ 24 lượt 3s | Giữ 10 lượt 5s + Cooldown',
        icon: '⚡',
        stages: [
          { type: 'normal', squeeze: 1, relax: 1, reps: 20, label: 'Siết Nhanh 1s' },
          { type: 'transition', squeeze: 0, relax: 10, reps: 1, label: 'Nghỉ Chuyển Bài 10s' },
          { type: 'normal', squeeze: 3, relax: 3, reps: 12, label: 'Siết Giữ 3s (Chặng 1)' },
          { type: 'transition', squeeze: 0, relax: 15, reps: 1, label: 'Nghỉ Chuyển Bài 15s' },
          { type: 'normal', squeeze: 3, relax: 3, reps: 12, label: 'Siết Giữ 3s (Chặng 2)' },
          { type: 'transition', squeeze: 0, relax: 20, reps: 1, label: 'Nghỉ Chuyển Bài 20s' },
          { type: 'normal', squeeze: 5, relax: 5, reps: 10, label: 'Siết Sâu 5s' },
          { type: 'reverse', squeeze: 5, relax: 5, reps: 5, label: 'Kegel Ngược Giãn Cơ' }
        ]
      },
      nightRecovery: {
        id: 'male_l1_nr',
        name: 'Phục Hồi Ban Đêm',
        meta: '15 lượt siết nhanh | 10 lượt Kegel ngược | 5 lượt hít thở sâu',
        icon: '🌙',
        stages: [
          { type: 'normal', squeeze: 1, relax: 1, reps: 15, label: 'Siết Nhẹ 1s' },
          { type: 'reverse', squeeze: 5, relax: 5, reps: 10, label: 'Kegel Ngược Thư Giãn' },
          { type: 'breathing', squeeze: 5, relax: 10, reps: 5, label: 'Thở Bụng Phục Hồi' }
        ]
      }
    },
    female: {
      goodMorning: {
        id: 'female_l1_gm',
        name: 'Bình Minh Tươi Trẻ',
        meta: '20 lượt siết 1s - thả 2s | 5 lượt Kegel ngược giãn chậu',
        icon: '🌅',
        stages: [
          { type: 'normal', squeeze: 1, relax: 2, reps: 20, label: 'Siết Nhẹ 1s' },
          { type: 'reverse', squeeze: 5, relax: 5, reps: 5, label: 'Kegel Ngược' }
        ]
      },
      powerCombo: {
        id: 'female_l1_pc',
        name: 'Combo Sức Bền',
        meta: '15 lượt siết nhanh 1s | 15 lượt siết giữ 3s | 10 lượt Kegel ngược',
        icon: '⚡',
        stages: [
          { type: 'normal', squeeze: 1, relax: 1, reps: 15, label: 'Siết 1s' },
          { type: 'transition', squeeze: 0, relax: 10, reps: 1, label: 'Nghỉ 10s' },
          { type: 'normal', squeeze: 3, relax: 3, reps: 15, label: 'Siết 3s' },
          { type: 'reverse', squeeze: 5, relax: 5, reps: 10, label: 'Kegel Ngược' }
        ]
      },
      nightRecovery: {
        id: 'female_l1_nr',
        name: 'Phục Hồi Nhẹ Nhàng',
        meta: '15 lượt Kegel ngược giãn sàn chậu | 10 lượt thở bụng phục hồi sâu',
        icon: '🌙',
        stages: [
          { type: 'reverse', squeeze: 5, relax: 5, reps: 15, label: 'Kegel Ngược' },
          { type: 'breathing', squeeze: 5, relax: 10, reps: 10, label: 'Thở Bụng Sâu' }
        ]
      }
    }
  },
  2: {
    levelNumber: 2,
    name: 'Tăng Cường Trương Lực',
    description: 'Xây dựng độ dẻo dai và tăng áp lực kiểm soát thể hang',
    male: {
      goodMorning: {
        id: 'male_l2_gm',
        name: 'Kích Hoạt Thần Kinh',
        meta: '30 lượt co thắt phản xạ nhanh 2s - thả 2s kích thích tuần hoàn',
        icon: '🌅',
        stages: [
          { type: 'normal', squeeze: 2, relax: 2, reps: 30, label: 'Siết 2s Phản Xạ' }
        ]
      },
      powerCombo: {
        id: 'male_l2_pc',
        name: 'Kiểm Soát Cương Cứng',
        meta: 'Siết 6s 15 lượt | Giữ 8s 5 lượt tăng áp lực | 5 lượt Kegel ngược',
        icon: '⚡',
        stages: [
          { type: 'normal', squeeze: 6, relax: 6, reps: 15, label: 'Siết Sâu 6s' },
          { type: 'transition', squeeze: 0, relax: 30, reps: 1, label: 'Nghỉ Giữa Chặng 30s' },
          { type: 'normal', squeeze: 8, relax: 8, reps: 5, label: 'Siết Bứt Phá 8s' },
          { type: 'reverse', squeeze: 5, relax: 5, reps: 5, label: 'Kegel Ngược' }
        ]
      },
      nightRecovery: {
        id: 'male_l2_nr',
        name: 'Thư Giãn Tuyến Tiền Liệt',
        meta: '15 lượt Kegel ngược sâu 6s giảm áp lực chậu | 5 lượt thở bụng',
        icon: '🌙',
        stages: [
          { type: 'reverse', squeeze: 6, relax: 4, reps: 15, label: 'Kegel Ngược 6s' },
          { type: 'breathing', squeeze: 5, relax: 10, reps: 5, label: 'Thở Bụng Sâu' }
        ]
      }
    },
    female: {
      goodMorning: {
        id: 'female_l2_gm',
        name: 'Độ Đàn Hồi Âm Đạo',
        meta: '35 lượt co thắt nhịp nhàng 2s - thả 2s duy trì độ đàn hồi',
        icon: '🌅',
        stages: [
          { type: 'normal', squeeze: 2, relax: 2, reps: 35, label: 'Siết Nhịp Nhàng 2s' }
        ]
      },
      powerCombo: {
        id: 'female_l2_pc',
        name: 'Combo Sức Bền Tăng Cường',
        meta: 'Siết 5s 18 lượt | Giữ 7s 6 lượt | 8 lượt Kegel ngược thư giãn',
        icon: '⚡',
        stages: [
          { type: 'normal', squeeze: 5, relax: 5, reps: 18, label: 'Siết 5s' },
          { type: 'normal', squeeze: 7, relax: 7, reps: 6, label: 'Siết 7s' },
          { type: 'reverse', squeeze: 5, relax: 5, reps: 8, label: 'Kegel Ngược' }
        ]
      },
      nightRecovery: {
        id: 'female_l2_nr',
        name: 'Giảm Khô Hạn & Phục Hồi',
        meta: '12 lượt Kegel ngược giãn cơ chậu tăng tiết dịch | 8 lượt thở bụng',
        icon: '🌙',
        stages: [
          { type: 'reverse', squeeze: 6, relax: 5, reps: 12, label: 'Kegel Ngược 6s' },
          { type: 'breathing', squeeze: 5, relax: 10, reps: 8, label: 'Thở Bụng' }
        ]
      }
    }
  },
  3: {
    levelNumber: 3,
    name: 'Sức Bền & Kiểm Soát Phản Xạ',
    description: 'Làm chủ hưng phấn, kiểm soát cơ hành hang và chống xuất tinh sớm',
    male: {
      goodMorning: {
        id: 'male_l3_gm',
        name: 'Phản Xạ Cơ Hành Hang',
        meta: '40 lượt co thắt phản xạ nhanh 1s - thả 1s kiểm soát cơ gốc',
        icon: '🌅',
        stages: [
          { type: 'normal', squeeze: 1, relax: 1, reps: 40, label: 'Siết Nhanh 1s' }
        ]
      },
      powerCombo: {
        id: 'male_l3_pc',
        name: 'Làm Chủ Hưng Phấn',
        meta: 'Siết bền 8s 12 lượt | 8 lượt Kegel ngược hạ nhiệt phản xạ',
        icon: '⚡',
        stages: [
          { type: 'normal', squeeze: 8, relax: 8, reps: 12, label: 'Siết Bền 8s' },
          { type: 'reverse', squeeze: 3, relax: 3, reps: 8, label: 'Kegel Ngược 3s' }
        ]
      },
      nightRecovery: {
        id: 'male_l3_nr',
        name: 'Điều Hòa Cơ Nâng Hậu Môn',
        meta: '15 lượt Kegel ngược sâu 7s - thả 5s giảm căng thẳng cơ chậu',
        icon: '🌙',
        stages: [
          { type: 'reverse', squeeze: 7, relax: 5, reps: 15, label: 'Kegel Ngược 7s' },
          { type: 'breathing', squeeze: 5, relax: 10, reps: 5, label: 'Thở Bụng' }
        ]
      }
    },
    female: {
      goodMorning: {
        id: 'female_l3_gm',
        name: 'Co Thắt Đàn Hồi',
        meta: '30 lượt co thắt sâu 3s - thả 3s tăng cường nhạy cảm và săn chắc',
        icon: '🌅',
        stages: [
          { type: 'normal', squeeze: 3, relax: 3, reps: 30, label: 'Siết Sâu 3s' }
        ]
      },
      powerCombo: {
        id: 'female_l3_pc',
        name: 'Săn Chắc Sàn Chậu',
        meta: 'Siết giữ 8s 15 lượt tăng cơ nâng đỡ | 5 lượt Kegel ngược xả cơ',
        icon: '⚡',
        stages: [
          { type: 'normal', squeeze: 8, relax: 8, reps: 15, label: 'Siết Giữ 8s' },
          { type: 'reverse', squeeze: 5, relax: 5, reps: 5, label: 'Kegel Ngược' }
        ]
      },
      nightRecovery: {
        id: 'female_l3_nr',
        name: 'Phục Hồi Cơ Vòng',
        meta: '15 lượt Kegel ngược 6s | 8 lượt thở sâu phục hồi độ giãn',
        icon: '🌙',
        stages: [
          { type: 'reverse', squeeze: 6, relax: 4, reps: 15, label: 'Kegel Ngược 6s' },
          { type: 'breathing', squeeze: 5, relax: 10, reps: 8, label: 'Thở Sâu' }
        ]
      }
    }
  },
  4: {
    levelNumber: 4,
    name: 'Tối Đa Hóa Sức Mạnh Lâm Sàng',
    description: 'Cô lập tối đa cơ PC và kéo dài thời gian co thắt đỉnh cao',
    male: {
      goodMorning: {
        id: 'male_l4_gm',
        name: 'Khởi Động Năng Lượng',
        meta: '35 lượt co thắt phản xạ 3s siết - 2s thả kích thích cơ PC',
        icon: '🌅',
        stages: [
          { type: 'normal', squeeze: 3, relax: 2, reps: 35, label: 'Siết 3s' }
        ]
      },
      powerCombo: {
        id: 'male_l4_pc',
        name: 'Kiểm Soát Xuất Tinh Chuyên Sâu',
        meta: 'Siết cô lập 10s 10 lượt | 8 lượt Kegel ngược 4s | 5 lượt siết nhanh 1s',
        icon: '⚡',
        stages: [
          { type: 'normal', squeeze: 10, relax: 10, reps: 10, label: 'Siết Cô Lập 10s' },
          { type: 'reverse', squeeze: 4, relax: 4, reps: 8, label: 'Kegel Ngược 4s' },
          { type: 'normal', squeeze: 1, relax: 1, reps: 5, label: 'Siết Nhanh 1s' }
        ]
      },
      nightRecovery: {
        id: 'male_l4_nr',
        name: 'Tái Tạo Sức Bền Đêm',
        meta: '12 lượt Kegel ngược 10s điều hòa hệ thần kinh chậu | 5 lượt thở sâu',
        icon: '🌙',
        stages: [
          { type: 'reverse', squeeze: 10, relax: 6, reps: 12, label: 'Kegel Ngược 10s' },
          { type: 'breathing', squeeze: 5, relax: 10, reps: 5, label: 'Thở Sâu' }
        ]
      }
    },
    female: {
      goodMorning: {
        id: 'female_l4_gm',
        name: 'Kích Hoạt Trục Core - Chậu',
        meta: '25 lượt co thắt giữ 4s - thả 4s phối hợp cơ hoành và cơ bụng',
        icon: '🌅',
        stages: [
          { type: 'normal', squeeze: 4, relax: 4, reps: 25, label: 'Siết Trục 4s' }
        ]
      },
      powerCombo: {
        id: 'female_l4_pc',
        name: 'Khít & Săn Cơ Sâu (Elevator)',
        meta: '10 lượt siết giữ sâu 10s sau sinh | 5 lượt Kegel ngược | 8 lượt thở bụng',
        icon: '⚡',
        stages: [
          { type: 'normal', squeeze: 10, relax: 8, reps: 10, label: 'Siết Thang Máy 10s' },
          { type: 'reverse', squeeze: 6, relax: 6, reps: 5, label: 'Kegel Ngược' },
          { type: 'breathing', squeeze: 5, relax: 10, reps: 8, label: 'Thở Bụng' }
        ]
      },
      nightRecovery: {
        id: 'female_l4_nr',
        name: 'Nuôi Dưỡng Trẻ Hóa',
        meta: '12 lượt Kegel ngược 8s - thả 6s tăng tuần hoàn trẻ hóa âm đạo',
        icon: '🌙',
        stages: [
          { type: 'reverse', squeeze: 8, relax: 6, reps: 12, label: 'Kegel Ngược 8s' },
          { type: 'breathing', squeeze: 5, relax: 10, reps: 10, label: 'Thở Bụng' }
        ]
      }
    }
  },
  5: {
    levelNumber: 5,
    name: 'Bậc Thầy Sàn Chậu & Vượt Giới Hạn',
    description: 'Chinh phục ngưỡng cực hạn 15s và điều hòa toàn diện cơ đáy chậu',
    male: {
      goodMorning: {
        id: 'male_l5_gm',
        name: 'Phản Xạ Xuất Tinh Bậc Thầy',
        meta: '50 lượt co thắt phản xạ siêu nhanh 1s siết - 1s thả cực hạn cơ mu cụt',
        icon: '🌅',
        stages: [
          { type: 'normal', squeeze: 1, relax: 1, reps: 50, label: 'Siết Phản Xạ 1s (50 lượt)' }
        ]
      },
      powerCombo: {
        id: 'male_l5_pc',
        name: 'Thử Thách Vượt Giới Hạn (PC Master)',
        meta: 'Siết siêu sâu 15s 8 lượt (tải lực tối đa) | 10 lượt Kegel ngược 5s',
        icon: '⚡',
        stages: [
          { type: 'normal', squeeze: 15, relax: 12, reps: 8, label: 'Siết Cực Hạn 15s' },
          { type: 'reverse', squeeze: 5, relax: 5, reps: 10, label: 'Kegel Ngược 5s' }
        ]
      },
      nightRecovery: {
        id: 'male_l5_nr',
        name: 'Giải Tỏa Thần Kinh Sàn Chậu',
        meta: '15 lượt Kegel ngược cực đại 12s điều hòa toàn diện | 5 lượt thở sâu',
        icon: '🌙',
        stages: [
          { type: 'reverse', squeeze: 12, relax: 8, reps: 15, label: 'Kegel Ngược 12s' },
          { type: 'breathing', squeeze: 5, relax: 10, reps: 5, label: 'Thở Sâu' }
        ]
      }
    },
    female: {
      goodMorning: {
        id: 'female_l5_gm',
        name: 'Đàn Hồi Tối Đa',
        meta: '50 lượt nhấp phản xạ siêu nhanh 1s siết - 1s thả rèn độ đàn hồi',
        icon: '🌅',
        stages: [
          { type: 'normal', squeeze: 1, relax: 1, reps: 50, label: 'Siết Phản Xạ 1s' }
        ]
      },
      powerCombo: {
        id: 'female_l5_pc',
        name: 'Bậc Thầy Co Thắt & Thư Giãn',
        meta: 'Siết giữ cực hạn 12s 8 lượt | 10 lượt Kegel ngược 8s | 5 lượt thở',
        icon: '⚡',
        stages: [
          { type: 'normal', squeeze: 12, relax: 12, reps: 8, label: 'Siết Cực Hạn 12s' },
          { type: 'reverse', squeeze: 8, relax: 6, reps: 10, label: 'Kegel Ngược 8s' },
          { type: 'breathing', squeeze: 5, relax: 10, reps: 5, label: 'Thở Phục Hồi' }
        ]
      },
      nightRecovery: {
        id: 'female_l5_nr',
        name: 'Trẻ Hóa Hệ Sinh Dục Toàn Diện',
        meta: '15 lượt Kegel ngược cực đại 12s giải tỏa căng thẳng | 8 lượt thở sâu',
        icon: '🌙',
        stages: [
          { type: 'reverse', squeeze: 12, relax: 8, reps: 15, label: 'Kegel Ngược 12s' },
          { type: 'breathing', squeeze: 5, relax: 10, reps: 8, label: 'Thở Sâu' }
        ]
      }
    }
  }
};

/**
 * Tự động chọn bài tập mặc định theo khung giờ sinh học
 */
export const getDefaultRoutineByTime = (level = 1, gender = 'male') => {
  const currentHour = new Date().getHours();
  const lvlConfig = CLINICAL_LEVELS[level]?.[gender] || CLINICAL_LEVELS[1].male;

  if (currentHour >= 5 && currentHour < 10) {
    return { level, type: 'goodMorning', routine: lvlConfig.goodMorning };
  } else if (currentHour >= 10 && currentHour < 19) {
    return { level, type: 'powerCombo', routine: lvlConfig.powerCombo };
  } else {
    return { level, type: 'nightRecovery', routine: lvlConfig.nightRecovery };
  }
};

// ==================== 2. SCREEN WAKE LOCK API ====================
let wakeLockInstance = null;

export const requestWakeLock = async () => {
  if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
    try {
      wakeLockInstance = await navigator.wakeLock.request('screen');
    } catch (err) {
      console.warn('Wake Lock error:', err);
    }
  }
};

export const releaseWakeLock = async () => {
  if (wakeLockInstance) {
    try {
      await wakeLockInstance.release();
      wakeLockInstance = null;
    } catch (err) {
      console.warn('Wake Lock release error:', err);
    }
  }
};

// ==================== 3. HỆ THỐNG HUY HIỆU & DANH HIỆU ====================
export const BADGES_LIST = [
  // --- A. Số Lượng Buổi Tập & Bước Khởi Đầu ---
  {
    id: 'first_kegel',
    name: 'Tân Binh PC',
    desc: 'Hoàn thành buổi tập cơ sàn chậu đầu tiên',
    icon: '🌱',
    rarity: 'Cơ bản',
    color: 'emerald',
    check: (stats, history) => history.length >= 1
  },
  {
    id: 'workouts_5',
    name: 'Kiên Trì 5 Buổi',
    desc: 'Hoàn thành 5 buổi tập sàn chậu',
    icon: '🥉',
    rarity: 'Hiếm',
    color: 'cyan',
    check: (stats, history) => history.length >= 5
  },
  {
    id: 'workouts_20',
    name: 'Chiến Binh 20 Buổi',
    desc: 'Chinh phục cột mốc 20 buổi tập',
    icon: '🥈',
    rarity: 'Sử thi',
    color: 'amber',
    check: (stats, history) => history.length >= 20
  },
  {
    id: 'workouts_50',
    name: 'Đại Sư 50 Buổi',
    desc: 'Hoàn thành xuất sắc 50 buổi rèn luyện',
    icon: '🏆',
    rarity: 'Huyền thoại',
    color: 'purple',
    check: (stats, history) => history.length >= 50
  },

  // --- B. Kỷ Lục Lượt Siết Tích Lũy ---
  {
    id: 'reps_100',
    name: 'Co Thắt 100 Lượt',
    desc: 'Tích lũy 100 lượt siết cơ sàn chậu',
    icon: '⚡',
    rarity: 'Cơ bản',
    color: 'emerald',
    check: (stats) => stats.totalSqueezes >= 100
  },
  {
    id: 'reps_500',
    name: 'Cơ PC Thép 500 Lượt',
    desc: 'Tích lũy 500 lượt co thắt cơ sàn chậu',
    icon: '🔥',
    rarity: 'Hiếm',
    color: 'cyan',
    check: (stats) => stats.totalSqueezes >= 500
  },
  {
    id: 'reps_1000',
    name: 'Đỉnh Cao 1000 Lượt',
    desc: 'Cột mốc 1000 lượt co thắt sàn chậu dũng mãnh',
    icon: '💎',
    rarity: 'Sử thi',
    color: 'amber',
    check: (stats) => stats.totalSqueezes >= 1000
  },
  {
    id: 'reps_3000',
    name: 'Huyền Thoại 3000 Lượt',
    desc: 'Chinh phục 3000 lượt siết cơ không đối thủ',
    icon: '👑',
    rarity: 'Tối thượng',
    color: 'red',
    check: (stats) => stats.totalSqueezes >= 3000
  },

  // --- C. Kỹ Năng Kegel Ngược (Reverse Kegel) ---
  {
    id: 'reverse_10',
    name: 'Giải Áp Chậu',
    desc: 'Thực hiện 10 lượt Kegel ngược thư giãn cơ mu cụt',
    icon: '🌊',
    rarity: 'Cơ bản',
    color: 'cyan',
    check: (stats) => stats.totalReverseKegels >= 10
  },
  {
    id: 'reverse_50',
    name: 'Làm Chủ Độ Giãn',
    desc: 'Tích lũy 50 lượt Kegel ngược điều hòa thần kinh',
    icon: '🧘',
    rarity: 'Hiếm',
    color: 'amber',
    check: (stats) => stats.totalReverseKegels >= 50
  },
  {
    id: 'reverse_200',
    name: 'Bậc Thầy Thư Giãn',
    desc: 'Hoàn thành 200 lượt Kegel ngược bảo vệ tiền liệt tuyến/tử cung',
    icon: '✨',
    rarity: 'Sử thi',
    color: 'purple',
    check: (stats) => stats.totalReverseKegels >= 200
  },

  // --- D. Chuỗi Ngày Tập Liên Tiếp (Streak) ---
  {
    id: 'streak_3',
    name: 'Tia Lửa 3 Ngày',
    desc: 'Tập luyện liên tục 3 ngày không gián đoạn',
    icon: '🔥',
    rarity: 'Cơ bản',
    color: 'emerald',
    check: (stats) => stats.streak >= 3
  },
  {
    id: 'streak_7',
    name: 'Ngọn Lửa 7 Ngày',
    desc: 'Duy trì chuỗi tập luyện 7 ngày liên tiếp',
    icon: '⚡',
    rarity: 'Hiếm',
    color: 'cyan',
    check: (stats) => stats.streak >= 7
  },
  {
    id: 'streak_14',
    name: 'Bất Bại 14 Ngày',
    desc: 'Duy trì chuỗi 14 ngày bền bỉ',
    icon: '🌟',
    rarity: 'Sử thi',
    color: 'amber',
    check: (stats) => stats.streak >= 14
  },
  {
    id: 'streak_30',
    name: 'Chiến Thần 30 Ngày',
    desc: 'Chuỗi 1 tháng rèn luyện liên tục',
    icon: '👑',
    rarity: 'Tối thượng',
    color: 'red',
    check: (stats) => stats.streak >= 30
  },

  // --- E. Cấp Độ Lâm Sàng Cao Cấp ---
  {
    id: 'master_level_5',
    name: 'Bậc Thầy Cấp 5',
    desc: 'Hoàn thành bài tập ở Cấp Độ 5 (PC Master)',
    icon: '🛡️',
    rarity: 'Huyền thoại',
    color: 'purple',
    check: (stats, history) => history.some(h => h.level === 5)
  }
];

// ==================== 4. STORAGE CRUD & STATS HELPERS ====================

export const getSettings = () => {
  const defaultSettings = {
    apiKey: '',
    theme: 'dark',
    soundEnabled: true,
    soundPreset: 'preset_14',
    reversePreset: 'preset_1',
    actionSounds: {
      squeeze: 'preset_14',
      relax: 'preset_5',
      reverse: 'preset_1',
      transition: 'preset_27',
      complete: 'preset_20'
    },
    bgmEnabled: false,
    hapticsEnabled: true,
    gender: 'male',
    birthYear: 1995
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    return {
      ...defaultSettings,
      ...parsed,
      actionSounds: {
        ...defaultSettings.actionSounds,
        ...(parsed.actionSounds || {})
      }
    };
  } catch (e) {
    return defaultSettings;
  }
};

export const saveSettings = (newSettings) => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
};

export const getUserProfile = () => {
  const settings = getSettings();
  return {
    gender: settings.gender || 'male',
    birthYear: settings.birthYear || 1995,
    apiKey: settings.apiKey || ''
  };
};

export const getHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveHistorySession = (session) => {
  const history = getHistory();
  const newEntry = {
    id: 'session_' + Date.now(),
    date: new Date().toISOString(),
    ...session
  };
  history.unshift(newEntry);
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));

  // Kiểm tra mở khóa huy hiệu mới
  const newlyUnlocked = checkAndUnlockBadges();
  return { newEntry, newlyUnlocked };
};

export const deleteHistoryItem = (id) => {
  const history = getHistory().filter(h => h.id !== id);
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  checkAndUnlockBadges();
};

export const clearHistory = () => {
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.UNLOCKED_BADGES, JSON.stringify([]));
};

// Tính toán chuỗi Streak liên tục
export const calculateStreak = (history) => {
  if (!history || history.length === 0) return 0;

  const datesSet = new Set();
  history.forEach(item => {
    if (item.date) {
      const d = new Date(item.date);
      datesSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
  });

  const today = new Date();
  let currentStreak = 0;
  let checkDate = new Date(today);

  // Kiểm tra xem hôm nay có tập chưa, nếu chưa kiểm tra hôm qua
  const todayKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
  if (!datesSet.has(todayKey)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const key = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (datesSet.has(key)) {
      currentStreak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return currentStreak;
};

export const getHistoryStats = () => {
  const history = getHistory();
  let totalSqueezes = 0;
  let totalReverseKegels = 0;
  let totalDuration = 0;

  history.forEach(item => {
    totalSqueezes += (item.totalSqueezes || item.squeezes || 0);
    totalReverseKegels += (item.totalReverseKegels || item.reverseKegels || 0);
    totalDuration += (item.duration || 0);
  });

  const streak = calculateStreak(history);

  return {
    totalWorkouts: history.length,
    totalSqueezes,
    totalReverseKegels,
    totalDuration,
    totalMinutes: Math.round(totalDuration / 60),
    streak
  };
};

export const getUnlockedBadges = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.UNLOCKED_BADGES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const checkAndUnlockBadges = () => {
  const history = getHistory();
  const stats = getHistoryStats();
  const currentUnlocked = new Set(getUnlockedBadges());
  const newlyUnlocked = [];

  BADGES_LIST.forEach(badge => {
    if (!currentUnlocked.has(badge.id)) {
      try {
        if (badge.check(stats, history)) {
          currentUnlocked.add(badge.id);
          newlyUnlocked.push(badge);
        }
      } catch (e) {}
    }
  });

  if (newlyUnlocked.length > 0) {
    localStorage.setItem(STORAGE_KEYS.UNLOCKED_BADGES, JSON.stringify(Array.from(currentUnlocked)));
  }

  return newlyUnlocked;
};

export const recalibrateAndSyncAllData = () => {
  checkAndUnlockBadges();
};

// ==================== 5. CUSTOM PLANS CRUD ====================
export const getCustomPlans = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_PLANS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveCustomPlan = (plan) => {
  const plans = getCustomPlans();
  const existingIndex = plans.findIndex(p => p.id === plan.id);
  if (existingIndex >= 0) {
    plans[existingIndex] = plan;
  } else {
    plans.unshift({ ...plan, id: plan.id || 'custom_' + Date.now() });
  }
  localStorage.setItem(STORAGE_KEYS.CUSTOM_PLANS, JSON.stringify(plans));
  return plans;
};

export const deleteCustomPlan = (id) => {
  const plans = getCustomPlans().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.CUSTOM_PLANS, JSON.stringify(plans));
  return plans;
};

export const getActiveRoutine = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROUTINE);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return getDefaultRoutineByTime(1, 'male');
};

export const saveActiveRoutine = (routineData) => {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_ROUTINE, JSON.stringify(routineData));
};

// ==================== 6. BACKUP & RESTORE JSON ====================
export const exportBackupJSON = () => {
  const data = {
    settings: getSettings(),
    history: getHistory(),
    customPlans: getCustomPlans(),
    unlockedBadges: getUnlockedBadges(),
    exportDate: new Date().toISOString(),
    version: '1.3.0'
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pcflex_backup_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importBackupJSON = (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    if (data.settings) saveSettings(data.settings);
    if (data.history) localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
    if (data.customPlans) localStorage.setItem(STORAGE_KEYS.CUSTOM_PLANS, JSON.stringify(data.customPlans));
    if (data.unlockedBadges) localStorage.setItem(STORAGE_KEYS.UNLOCKED_BADGES, JSON.stringify(data.unlockedBadges));
    recalibrateAndSyncAllData();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
