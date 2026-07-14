/**
 * PC Flex - Pubococcygeus Muscle Trainer
 * JavaScript Core Logic & Audio Synthesizer
 */

// --- STATE MANAGEMENT ---
const state = {
    currentTab: 'practice',
    currentLibSubtab: 'overview',
    workoutState: 'idle', // idle, squeezing, relaxing, completed
    selectedLevel: 'goodMorning',
    selectedLevelTab: 1, // Active level tab (1-5)
    timerInterval: null,
    timeRemaining: 0,
    currentRep: 0,
    totalReps: 25,
    squeezeDuration: 1,
    relaxDuration: 2,
    isMutedSFX: false,
    isMutedBGM: true,
    history: [],
    streak: 0,
    totalSessions: 0,
    totalRepsCompleted: 0,
    gender: 'male', // male, female
    birthYear: null,
    geminiApiKey: null,
    
    // Custom workout builder state
    customWorkouts: [],
    tempStages: [],
    editingWorkoutId: null,
    workoutSteps: [],
    workoutPhases: [],
    currentStepIndex: 0
};

// --- CLINICAL WORKOUT CONFIGURATIONS (LEVELS 1-5) ---
const clinicalLevels = {
    1: {
        name: 'Nhập Môn & Đánh Thức',
        male: {
            goodMorning: {
                name: 'Chào Buổi Sáng',
                meta: '20 lượt siết 1s - thả 2s | 5 lượt Kegel ngược giãn chậu',
                color: '#f59e0b',
                bg: 'rgba(245, 158, 11, 0.15)',
                border: 'rgba(245, 158, 11, 0.35)',
                icon: '🌅',
                stages: [
                    { type: 'normal', squeeze: 1, relax: 2, reps: 20 },
                    { type: 'reverse', squeeze: 5, relax: 5, reps: 5 }
                ]
            },
            powerCombo: {
                name: 'Combo Sức Mạnh',
                meta: 'Siết nhanh 20 lượt 1s | Giữ 24 lượt 3s | Giữ 10 lượt 5s + Cooldown',
                color: 'var(--color-primary)',
                bg: 'rgba(0, 245, 212, 0.1)',
                border: 'rgba(0, 245, 212, 0.25)',
                icon: '★',
                stages: [
                    { type: 'normal', squeeze: 1, relax: 1, reps: 20 },
                    { type: 'normal', squeeze: 3, relax: 3, reps: 12 },
                    { type: 'normal', squeeze: 3, relax: 3, reps: 12 },
                    { type: 'normal', squeeze: 5, relax: 5, reps: 10 },
                    { type: 'reverse', squeeze: 5, relax: 5, reps: 5 }
                ]
            },
            nightRecovery: {
                name: 'Phục Hồi Ban Đêm',
                meta: '15 lượt siết nhanh | 10 lượt Kegel ngược | 5 lượt hít thở sâu',
                color: '#a78bfa',
                bg: 'rgba(139, 92, 246, 0.15)',
                border: 'rgba(139, 92, 246, 0.35)',
                icon: '🌙',
                stages: [
                    { type: 'normal', squeeze: 1, relax: 1, reps: 15 },
                    { type: 'reverse', squeeze: 5, relax: 5, reps: 10 },
                    { type: 'breathing', squeeze: 5, relax: 10, reps: 5 }
                ]
            }
        },
        female: {
            goodMorning: {
                name: 'Bình Minh Tươi Trẻ',
                meta: '20 lượt siết 1s - thả 2s | 5 lượt Kegel ngược giãn chậu',
                color: '#ec4899',
                bg: 'rgba(236, 72, 153, 0.15)',
                border: 'rgba(236, 72, 153, 0.35)',
                icon: '🌅',
                stages: [
                    { type: 'normal', squeeze: 1, relax: 2, reps: 20 },
                    { type: 'reverse', squeeze: 5, relax: 5, reps: 5 }
                ]
            },
            powerCombo: {
                name: 'Combo Sức Bền',
                meta: '15 lượt siết nhanh 1s | 15 lượt siết giữ 3s | 10 lượt Kegel ngược',
                color: '#a855f7',
                bg: 'rgba(168, 85, 247, 0.15)',
                border: 'rgba(168, 85, 247, 0.35)',
                icon: '★',
                stages: [
                    { type: 'normal', squeeze: 1, relax: 1, reps: 15 },
                    { type: 'normal', squeeze: 3, relax: 3, reps: 15 },
                    { type: 'reverse', squeeze: 5, relax: 5, reps: 10 }
                ]
            },
            nightRecovery: {
                name: 'Phục Hồi Nhẹ Nhàng',
                meta: '15 lượt Kegel ngược giãn sàn chậu | 10 lượt thở bụng phục hồi sâu',
                color: '#8b5cf6',
                bg: 'rgba(139, 92, 246, 0.15)',
                border: 'rgba(139, 92, 246, 0.35)',
                icon: '🌙',
                stages: [
                    { type: 'reverse', squeeze: 5, relax: 5, reps: 15 },
                    { type: 'breathing', squeeze: 5, relax: 10, reps: 10 }
                ]
            }
        }
    },
    2: {
        name: 'Tăng Cường Trương Lực',
        male: {
            goodMorning: {
                name: 'Kích Hoạt Thần Kinh',
                meta: '30 lượt co thắt phản xạ nhanh 2s - thả 2s kích thích tuần hoàn',
                color: '#f59e0b',
                bg: 'rgba(245, 158, 11, 0.15)',
                border: 'rgba(245, 158, 11, 0.35)',
                icon: '🌅',
                stages: [
                    { type: 'normal', squeeze: 2, relax: 2, reps: 30 }
                ]
            },
            powerCombo: {
                name: 'Kiểm Soát Cương Cứng',
                meta: 'Siết 6s - thả 6s 15 lượt | Giữ 8s 5 lượt tăng áp lực thể hang | 5 lượt Kegel ngược',
                color: 'var(--color-primary)',
                bg: 'rgba(0, 245, 212, 0.1)',
                border: 'rgba(0, 245, 212, 0.25)',
                icon: '★',
                stages: [
                    { type: 'normal', squeeze: 6, relax: 6, reps: 15 },
                    { type: 'normal', squeeze: 8, relax: 8, reps: 5 },
                    { type: 'reverse', squeeze: 5, relax: 5, reps: 5 }
                ]
            },
            nightRecovery: {
                name: 'Thư Giãn Tuyến Tiền Liệt',
                meta: '15 lượt Kegel ngược sâu giữ 6s giảm áp lực chậu | 5 lượt thở bụng',
                color: '#a78bfa',
                bg: 'rgba(139, 92, 246, 0.15)',
                border: 'rgba(139, 92, 246, 0.35)',
                icon: '🌙',
                stages: [
                    { type: 'reverse', squeeze: 6, relax: 4, reps: 15 },
                    { type: 'breathing', squeeze: 5, relax: 10, reps: 5 }
                ]
            }
        },
        female: {
            goodMorning: {
                name: 'Độ Đàn Hồi Âm Đạo',
                meta: '35 lượt co thắt nhịp nhàng 2s - thả 2s duy trì độ đàn hồi âm đạo',
                color: '#ec4899',
                bg: 'rgba(236, 72, 153, 0.15)',
                border: 'rgba(236, 72, 153, 0.35)',
                icon: '🌅',
                stages: [
                    { type: 'normal', squeeze: 2, relax: 2, reps: 35 }
                ]
            },
            powerCombo: {
                name: 'Combo Sức Bền Tăng Cường',
                meta: 'Siết 5s - thả 5s 18 lượt | Giữ 7s 6 lượt | 8 lượt Kegel ngược thư giãn cơ chậu',
                color: '#a855f7',
                bg: 'rgba(168, 85, 247, 0.15)',
                border: 'rgba(168, 85, 247, 0.35)',
                icon: '★',
                stages: [
                    { type: 'normal', squeeze: 5, relax: 5, reps: 18 },
                    { type: 'normal', squeeze: 7, relax: 7, reps: 6 },
                    { type: 'reverse', squeeze: 5, relax: 5, reps: 8 }
                ]
            },
            nightRecovery: {
                name: 'Giảm Khô Hạn & Phục Hồi',
                meta: '12 lượt Kegel ngược giãn cơ chậu tăng tiết dịch | 8 lượt thở bụng sâu',
                color: '#8b5cf6',
                bg: 'rgba(139, 92, 246, 0.15)',
                border: 'rgba(139, 92, 246, 0.35)',
                icon: '🌙',
                stages: [
                    { type: 'reverse', squeeze: 6, relax: 5, reps: 12 },
                    { type: 'breathing', squeeze: 5, relax: 10, reps: 8 }
                ]
            }
        }
    },
    3: {
        name: 'Sức Bền & Kiểm Soát Phản Xạ',
        male: {
            goodMorning: {
                name: 'Phản Xạ Cơ Hành Hang',
                meta: '40 lượt co thắt phản xạ nhanh 1s - thả 1s kiểm soát cơ gốc dương vật',
                color: '#f59e0b',
                bg: 'rgba(245, 158, 11, 0.15)',
                border: 'rgba(245, 158, 11, 0.35)',
                icon: '🌅',
                stages: [
                    { type: 'normal', squeeze: 1, relax: 1, reps: 40 }
                ]
            },
            powerCombo: {
                name: 'Làm Chủ Hưng Phấn',
                meta: 'Siết bền 8s 12 lượt kiểm soát kích thích | 8 lượt Kegel ngược hạ nhiệt phản xạ',
                color: 'var(--color-primary)',
                bg: 'rgba(0, 245, 212, 0.1)',
                border: 'rgba(0, 245, 212, 0.25)',
                icon: '★',
                stages: [
                    { type: 'normal', squeeze: 8, relax: 8, reps: 12 },
                    { type: 'reverse', squeeze: 3, relax: 3, reps: 8 }
                ]
            },
            nightRecovery: {
                name: 'Điều Hòa Cơ Nâng Hậu Môn',
                meta: '15 lượt Kegel ngược sâu 7s - thả 5s giảm căng thẳng cơ chậu sâu',
                color: '#a78bfa',
                bg: 'rgba(139, 92, 246, 0.15)',
                border: 'rgba(139, 92, 246, 0.35)',
                icon: '🌙',
                stages: [
                    { type: 'reverse', squeeze: 7, relax: 5, reps: 15 },
                    { type: 'breathing', squeeze: 5, relax: 10, reps: 5 }
                ]
            }
        },
        female: {
            goodMorning: {
                name: 'Co Thắt Đàn Hồi',
                meta: '30 lượt co thắt sâu 3s - thả 3s tăng cường nhạy cảm và săn chắc',
                color: '#ec4899',
                bg: 'rgba(236, 72, 153, 0.15)',
                border: 'rgba(236, 72, 153, 0.35)',
                icon: '🌅',
                stages: [
                    { type: 'normal', squeeze: 3, relax: 3, reps: 30 }
                ]
            },
            powerCombo: {
                name: 'Săn Chắc Sàn Chậu',
                meta: 'Siết giữ 8s 15 lượt tăng cơ nâng đỡ | 5 lượt Kegel ngược xả cơ tránh căng cứng',
                color: '#a855f7',
                bg: 'rgba(168, 85, 247, 0.15)',
                border: 'rgba(168, 85, 247, 0.35)',
                icon: '★',
                stages: [
                    { type: 'normal', squeeze: 8, relax: 8, reps: 15 },
                    { type: 'reverse', squeeze: 5, relax: 5, reps: 5 }
                ]
            },
            nightRecovery: {
                name: 'Phục Hồi Cơ Vòng',
                meta: '15 lượt Kegel ngược 6s - thả 4s phục hồi độ giãn sàn chậu | 8 lượt thở sâu',
                color: '#8b5cf6',
                bg: 'rgba(139, 92, 246, 0.15)',
                border: 'rgba(139, 92, 246, 0.35)',
                icon: '🌙',
                stages: [
                    { type: 'reverse', squeeze: 6, relax: 4, reps: 15 },
                    { type: 'breathing', squeeze: 5, relax: 10, reps: 8 }
                ]
            }
        }
    },
    4: {
        name: 'Tối Đa Hóa Sức Mạnh Lâm Sàng',
        male: {
            goodMorning: {
                name: 'Khởi Động Năng Lượng',
                meta: '35 lượt co thắt phản xạ kích hoạt 3s siết - 2s thả kích thích cơ PC',
                color: '#f59e0b',
                bg: 'rgba(245, 158, 11, 0.15)',
                border: 'rgba(245, 158, 11, 0.35)',
                icon: '🌅',
                stages: [
                    { type: 'normal', squeeze: 3, relax: 2, reps: 35 }
                ]
            },
            powerCombo: {
                name: 'Kiểm Soát Xuất Tinh Chuyên Sâu',
                meta: 'Siết cô lập cơ mu cụt 10s 10 lượt | 8 lượt Kegel ngược 4s | 5 lượt siết nhanh 1s',
                color: 'var(--color-primary)',
                bg: 'rgba(0, 245, 212, 0.1)',
                border: 'rgba(0, 245, 212, 0.25)',
                icon: '★',
                stages: [
                    { type: 'normal', squeeze: 10, relax: 10, reps: 10 },
                    { type: 'reverse', squeeze: 4, relax: 4, reps: 8 },
                    { type: 'normal', squeeze: 1, relax: 1, reps: 5 }
                ]
            },
            nightRecovery: {
                name: 'Tái Tạo Sức Bền Đêm',
                meta: '12 lượt Kegel ngược giữ lâu 10s điều hòa hệ thần kinh chậu | 5 lượt thở sâu',
                color: '#a78bfa',
                bg: 'rgba(139, 92, 246, 0.15)',
                border: 'rgba(139, 92, 246, 0.35)',
                icon: '🌙',
                stages: [
                    { type: 'reverse', squeeze: 10, relax: 6, reps: 12 },
                    { type: 'breathing', squeeze: 5, relax: 10, reps: 5 }
                ]
            }
        },
        female: {
            goodMorning: {
                name: 'Kích Hoạt Trục Core - Chậu',
                meta: '25 lượt co thắt giữ 4s - thả 4s phối hợp cơ hoành chậu và cơ bụng',
                color: '#ec4899',
                bg: 'rgba(236, 72, 153, 0.15)',
                border: 'rgba(236, 72, 153, 0.35)',
                icon: '🌅',
                stages: [
                    { type: 'normal', squeeze: 4, relax: 4, reps: 25 }
                ]
            },
            powerCombo: {
                name: 'Khít & Săn Cơ Sâu (Elevator)',
                meta: '10 lượt siết giữ sâu 10s phục hồi âm đạo sau sinh | 5 lượt Kegel ngược | 8 lượt thở bụng',
                color: '#a855f7',
                bg: 'rgba(168, 85, 247, 0.15)',
                border: 'rgba(168, 85, 247, 0.35)',
                icon: '★',
                stages: [
                    { type: 'normal', squeeze: 10, relax: 8, reps: 10 },
                    { type: 'reverse', squeeze: 6, relax: 6, reps: 5 },
                    { type: 'breathing', squeeze: 5, relax: 10, reps: 8 }
                ]
            },
            nightRecovery: {
                name: 'Nuôi Dưỡng Trẻ Hóa',
                meta: '12 lượt Kegel ngược 8s - thả 6s tăng tuần hoàn trẻ hóa âm đạo | 10 lượt thở phục hồi',
                color: '#8b5cf6',
                bg: 'rgba(139, 92, 246, 0.15)',
                border: 'rgba(139, 92, 246, 0.35)',
                icon: '🌙',
                stages: [
                    { type: 'reverse', squeeze: 8, relax: 6, reps: 12 },
                    { type: 'breathing', squeeze: 5, relax: 10, reps: 10 }
                ]
            }
        }
    },
    5: {
        name: 'Bậc Thầy Sàn Chậu & Vượt Giới Hạn',
        male: {
            goodMorning: {
                name: 'Phản Xạ Xuất Tinh Bậc Thầy',
                meta: '50 lượt co thắt phản xạ siêu nhanh 1s siết - 1s thả cực hạn cơ mu cụt',
                color: '#f59e0b',
                bg: 'rgba(245, 158, 11, 0.15)',
                border: 'rgba(245, 158, 11, 0.35)',
                icon: '🌅',
                stages: [
                    { type: 'normal', squeeze: 1, relax: 1, reps: 50 }
                ]
            },
            powerCombo: {
                name: 'Thử Thách Vượt Giới Hạn (PC Master)',
                meta: 'Siết siêu sâu 15s 8 lượt (tải lực tối đa) | 10 lượt Kegel ngược xả căng thẳng 5s',
                color: 'var(--color-primary)',
                bg: 'rgba(0, 245, 212, 0.1)',
                border: 'rgba(0, 245, 212, 0.25)',
                icon: '★',
                stages: [
                    { type: 'normal', squeeze: 15, relax: 12, reps: 8 },
                    { type: 'reverse', squeeze: 5, relax: 5, reps: 10 }
                ]
            },
            nightRecovery: {
                name: 'Giải Tỏa Hệ Thần Kinh Sàn Chậu',
                meta: '15 lượt Kegel ngược giữ cực đại 12s điều hòa toàn diện cơ đáy chậu | 5 lượt thở sâu',
                color: '#a78bfa',
                bg: 'rgba(139, 92, 246, 0.15)',
                border: 'rgba(139, 92, 246, 0.35)',
                icon: '🌙',
                stages: [
                    { type: 'reverse', squeeze: 12, relax: 8, reps: 15 },
                    { type: 'breathing', squeeze: 5, relax: 10, reps: 5 }
                ]
            }
        },
        female: {
            goodMorning: {
                name: 'Đàn Hồi Tối Đa',
                meta: '50 lượt nhấp phản xạ siêu nhanh 1s siết - 1s thả rèn độ săn chắc đàn hồi chậu',
                color: '#ec4899',
                bg: 'rgba(236, 72, 153, 0.15)',
                border: 'rgba(236, 72, 153, 0.35)',
                icon: '🌅',
                stages: [
                    { type: 'normal', squeeze: 1, relax: 1, reps: 50 }
                ]
            },
            powerCombo: {
                name: 'Bậc Thầy Co Thắt & Thư Giãn',
                meta: 'Siết giữ cực hạn 12s 8 lượt | 10 lượt Kegel ngược sâu 8s | 5 lượt thở phục hồi',
                color: '#a855f7',
                bg: 'rgba(168, 85, 247, 0.15)',
                border: 'rgba(168, 85, 247, 0.35)',
                icon: '★',
                stages: [
                    { type: 'normal', squeeze: 12, relax: 12, reps: 8 },
                    { type: 'reverse', squeeze: 8, relax: 6, reps: 10 },
                    { type: 'breathing', squeeze: 5, relax: 10, reps: 5 }
                ]
            },
            nightRecovery: {
                name: 'Trẻ Hóa Hệ Sinh Dục Toàn Diện',
                meta: '15 lượt Kegel ngược cực đại 12s giải tỏa căng thẳng tử cung chậu | 8 lượt thở sâu',
                color: '#8b5cf6',
                bg: 'rgba(139, 92, 246, 0.15)',
                border: 'rgba(139, 92, 246, 0.35)',
                icon: '🌙',
                stages: [
                    { type: 'reverse', squeeze: 12, relax: 8, reps: 15 },
                    { type: 'breathing', squeeze: 5, relax: 10, reps: 8 }
                ]
            }
        }
    }
};

function calculateSqueezes(level, reps) {
    if (level && level.startsWith('custom_')) {
        const workout = state.customWorkouts.find(w => w.id === level);
        if (workout && workout.stages) {
            return workout.stages.reduce((sum, stage) => {
                if (stage.type === 'normal' || stage.type === 'reverse') {
                    return sum + parseInt(stage.reps || 0);
                }
                return sum;
            }, 0);
        }
        return reps;
    }
    
    const genderKey = state.gender === 'female' ? 'female' : 'male';
    const levelConfig = clinicalLevels[state.selectedLevelTab]?.[genderKey]?.[level];
    if (levelConfig && levelConfig.stages) {
        return levelConfig.stages.reduce((sum, stage) => {
            if (stage.type === 'normal' || stage.type === 'reverse') {
                return sum + parseInt(stage.reps || 0);
            }
            return sum;
        }, 0);
    }
    
    return reps;
}

// --- AUDIO CONTROLLER (Web Audio API Synthesizer) ---
class AudioController {
    constructor() {
        this.audioCtx = null;
        this.bgmSourceNode = null;
        this.bgmLfo = null;
        this.bgmGain = null;
    }

    init() {
        if (this.audioCtx) return;
        
        // Lazy-init AudioContext to satisfy browser autoplay policies
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            this.audioCtx = new AudioContextClass();
        }
    }

    resumeContext() {
        this.init();
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    // Play Squeeze Sound (High-pitched pure chime - C5 + G5)
    playSqueezeSFX() {
        if (state.isMutedSFX) return;
        this.resumeContext();
        if (!this.audioCtx) return;

        const now = this.audioCtx.currentTime;
        
        // Additive synthesizers for a crystal-clear bell chime
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(783.99, now); // G5 (harmonic purity)

        gainNode.gain.setValueAtTime(0, now);
        // Fast attack
        gainNode.gain.linearRampToValueAtTime(0.55, now + 0.03);
        // Smooth decaying release
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        
        osc1.stop(now + 1.2);
        osc2.stop(now + 1.2);
    }

    // Play Relax Sound (Warmer, soft low chime - G3 + E4)
    playRelaxSFX() {
        if (state.isMutedSFX) return;
        this.resumeContext();
        if (!this.audioCtx) return;

        const now = this.audioCtx.currentTime;
        
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(329.63, now); // E4

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(196.00, now); // G3 (Deep, relaxing base)

        gainNode.gain.setValueAtTime(0, now);
        // Softer, slower attack
        gainNode.gain.linearRampToValueAtTime(0.60, now + 0.15);
        // Long decay
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        
        osc1.stop(now + 1.5);
        osc2.stop(now + 1.5);
    }

    // Play Completion Sound (A beautiful C major arpeggio)
    playCompletionSFX() {
        if (state.isMutedSFX) return;
        this.resumeContext();
        if (!this.audioCtx) return;

        const now = this.audioCtx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        
        notes.forEach((freq, index) => {
            const osc = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + index * 0.12);
            
            gainNode.gain.setValueAtTime(0, now + index * 0.12);
            gainNode.gain.linearRampToValueAtTime(0.45, now + index * 0.12 + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.12 + 1.0);
            
            osc.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            
            osc.start(now + index * 0.12);
            osc.stop(now + index * 0.12 + 1.0);
        });
    }

    // Synthesize Soothing Ocean/Wind Wave Soundscape for meditation
    startBGM() {
        this.resumeContext();
        if (!this.audioCtx) return;

        if (this.bgmSourceNode) return; // Already running

        const now = this.audioCtx.currentTime;

        // 1. Generate White Noise Buffer
        const sampleRate = this.audioCtx.sampleRate;
        const bufferSize = 2 * sampleRate; // 2 seconds buffer
        const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        // 2. Setup Noise Source Loop
        this.bgmSourceNode = this.audioCtx.createBufferSource();
        this.bgmSourceNode.buffer = noiseBuffer;
        this.bgmSourceNode.loop = true;

        // 3. Low Pass Filter to make white noise sound like soft wind/ocean wave
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now); // Base frequency (deep wind)
        filter.Q.setValueAtTime(1.0, now);

        // 4. LFO (Low-Frequency Oscillator) to modulate filter frequency (breathing effect)
        this.bgmLfo = this.audioCtx.createOscillator();
        this.bgmLfo.type = 'sine';
        this.bgmLfo.frequency.setValueAtTime(0.12, now); // ~8 seconds per cycle

        // LFO Gain controls how wide the filter frequency sweep is
        const lfoGain = this.audioCtx.createGain();
        lfoGain.gain.setValueAtTime(250, now); // Sweep +/- 250Hz around 400Hz

        // 5. Volume Control Node
        this.bgmGain = this.audioCtx.createGain();
        this.bgmGain.gain.setValueAtTime(0, now);
        // Fade in smoothly
        this.bgmGain.gain.linearRampToValueAtTime(0.16, now + 2.0); 

        // 6. Connect the Synthesizer Nodes
        this.bgmLfo.connect(lfoGain);
        lfoGain.connect(filter.frequency); // Modulates the cutoff frequency dynamically
        
        this.bgmSourceNode.connect(filter);
        filter.connect(this.bgmGain);
        this.bgmGain.connect(this.audioCtx.destination);

        // Start synthesizers
        this.bgmSourceNode.start(now);
        this.bgmLfo.start(now);
    }

    stopBGM() {
        if (!this.audioCtx) return;
        const now = this.audioCtx.currentTime;

        if (this.bgmSourceNode && this.bgmGain) {
            // Fade out smoothly before stopping to avoid audio click/pop
            this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, now);
            this.bgmGain.gain.linearRampToValueAtTime(0, now + 1.0);
            
            const source = this.bgmSourceNode;
            const lfo = this.bgmLfo;
            
            setTimeout(() => {
                try {
                    source.stop();
                    lfo.stop();
                } catch(e) {}
            }, 1050);

            this.bgmSourceNode = null;
            this.bgmLfo = null;
            this.bgmGain = null;
        }
    }
}

const audioController = new AudioController();

// --- DOM ELEMENTS ---
const elements = {
    // Navigation Tabs
    navItems: document.querySelectorAll('.nav-item'),
    sections: document.querySelectorAll('.content-section'),
    
    // Library Tabs
    libTabBtns: document.querySelectorAll('.lib-tab-btn'),
    libPanes: document.querySelectorAll('.lib-content-pane'),

    // Workout Elements
    orb: document.getElementById('visualizer-orb'),
    orbAction: document.getElementById('orb-action'),
    orbTimer: document.getElementById('orb-timer'),
    orbSubText: document.getElementById('orb-sub-text'),
    repDisplay: document.getElementById('current-rep-display'),
    progressBar: document.getElementById('session-progress-bar'),
    phaseLabelsContainer: document.getElementById('phase-labels'),
    btnStart: document.getElementById('btn-start'),
    btnReset: document.getElementById('btn-reset'),
    textStart: document.getElementById('text-start'),
    iconStart: document.getElementById('icon-start'),
    
    // Level Configs
    levelItems: document.querySelectorAll('.level-item'),
    customPanel: document.getElementById('custom-controls-panel'),
    customWorkoutsSection: document.getElementById('custom-workouts-section'),
    customWorkoutsList: document.getElementById('custom-workouts-list'),
    customWorkoutNameInput: document.getElementById('custom-workout-name'),
    customStagesContainer: document.getElementById('custom-stages-container'),
    btnAddCustomStage: document.getElementById('btn-add-custom-stage'),
    btnSaveCustomWorkout: document.getElementById('btn-save-custom-workout'),
    btnCancelCustomEdit: document.getElementById('btn-cancel-custom-edit'),
    customPanelTitle: document.getElementById('custom-panel-title'),

    // Sound Controls
    btnToggleSFX: document.getElementById('btn-toggle-sfx'),
    btnToggleBGM: document.getElementById('btn-toggle-bgm'),
    iconSFX: document.getElementById('icon-sfx'),
    iconBGM: document.getElementById('icon-bgm'),

    // Stats Elements
    sidebarStreak: document.getElementById('sidebar-streak'),
    sidebarTotalSessions: document.getElementById('sidebar-total-sessions'),
    statsStreak: document.getElementById('stats-streak'),
    statsTotalSessions: document.getElementById('stats-total-sessions'),
    statsTotalReps: document.getElementById('stats-total-reps'),
    historyLogBody: document.getElementById('history-log-body'),
    btnClearData: document.getElementById('btn-clear-data'),
    
    // Supabase DOM Elements
    btnCloudSync: document.getElementById('btn-cloud-sync'),
    authModal: document.getElementById('auth-modal'),
    btnCloseAuthModal: document.getElementById('btn-close-auth-modal'),
    btnSubmitAuth: document.getElementById('btn-submit-auth'),
    btnAuthLogout: document.getElementById('btn-auth-logout'),
    linkToggleAuthMode: document.getElementById('link-toggle-auth-mode')
};

// --- INITIALIZE THE APP ---

// --- GENDER SELECTION LOGIC ---
function selectGender(gender) {
    state.gender = gender;
    saveData();
    
    // Cập nhật class trên body
    document.body.classList.remove('gender-male', 'gender-female');
    document.body.classList.add('gender-' + gender);
    
    // Cập nhật trạng thái active cho tất cả các nút giới tính trên trang
    const btnMales = document.querySelectorAll('.btn-gender-male, #btn-gender-male');
    const btnFemales = document.querySelectorAll('.btn-gender-female, #btn-gender-female');
    
    btnMales.forEach(btn => {
        if (gender === 'male') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    btnFemales.forEach(btn => {
        if (gender === 'female') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Cập nhật tên và mô tả bài tập trên giao diện
    renderLevelsList();
    
    // Tự động chọn lại bài tập mặc định theo khung giờ & giới tính
    autoSelectLevelByTime();
    
    // Cập nhật UI cấu hình
    updateUIConfigs();
}

function renderLevelsList() {
    const container = document.getElementById('levels-list');
    if (!container) return;
    
    const genderKey = state.gender === 'female' ? 'female' : 'male';
    const activeLevelConfig = clinicalLevels[state.selectedLevelTab]?.[genderKey] || {};
    
    container.innerHTML = '';
    
    // Render 3 daily clinical workouts
    const workoutKeys = ['goodMorning', 'powerCombo', 'nightRecovery'];
    workoutKeys.forEach(key => {
        const config = activeLevelConfig[key];
        if (!config) return;
        
        const item = document.createElement('div');
        const isActive = state.selectedLevel === key;
        item.className = `level-item${isActive ? ' active' : ''}`;
        item.setAttribute('data-level', key);
        
        const borderStyle = config.border ? `border: 1px solid ${config.border};` : '';
        const bgStyle = config.bg ? `background: ${config.bg};` : '';
        const colorStyle = config.color ? `color: ${config.color};` : '';
        
        item.innerHTML = `
            <div class="level-icon level-pow" style="${bgStyle} ${colorStyle} ${borderStyle}">${config.icon || '★'}</div>
            <div class="level-info">
                <span class="level-name" style="${colorStyle} font-weight: 700;">${config.name}</span>
                <span class="level-meta">${config.meta}</span>
            </div>
        `;
        
        container.appendChild(item);
    });
}

function selectWorkoutLevel(item) {
    const activeStates = ['squeezing', 'relaxing'];
    const isMidWorkout = activeStates.includes(state.workoutState) || state.workoutState.startsWith('paused_');
    if (isMidWorkout) return; // Prevent change mid-workout
    
    const targetLevel = item.getAttribute('data-level');
    
    // If clicking the ALREADY selected workout level, toggle it off!
    if (state.selectedLevel === targetLevel) {
        if (targetLevel === 'custom') {
            cancelCustomWorkoutEdit();
            autoSelectLevelByTime();
            updateUIConfigs();
            return;
        }
    }
    
    if (state.workoutState !== 'idle') {
        resetWorkout();
    }
    
    // Clear active class from all level items
    document.querySelectorAll('.level-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    state.selectedLevel = targetLevel;
    
    updateUIConfigs();
}

function initApp() {
    loadData();
    
    // Khởi tạo class giới tính cho body
    document.body.classList.add('gender-' + state.gender);
    renderLevelsList();
    
    renderCustomWorkoutsList();
    autoSelectLevelByTime();
    setupEventHandlers();
    updateUIConfigs();
    renderStats();
    initSupabaseConnection();
    
    // Đảm bảo tất cả các nút giới tính hiển thị đúng active state ban đầu
    const btnMales = document.querySelectorAll('.btn-gender-male, #btn-gender-male');
    const btnFemales = document.querySelectorAll('.btn-gender-female, #btn-gender-female');
    
    btnMales.forEach(btn => {
        if (state.gender === 'male') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    btnFemales.forEach(btn => {
        if (state.gender === 'female') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    initProfileAndAI();
}

// Automatically select default workout level based on the time of day
function autoSelectLevelByTime() {
    const hour = new Date().getHours();
    let defaultLevel = 'goodMorning';
    
    if (hour >= 5 && hour < 10) {
        defaultLevel = 'goodMorning';
    } else if (hour >= 10 && hour < 19) {
        defaultLevel = 'powerCombo';
    } else {
        defaultLevel = 'nightRecovery';
    }
    
    state.selectedLevel = defaultLevel;
    
    // Update active class in level items list
    const levelItems = document.querySelectorAll('.level-item');
    if (levelItems && levelItems.length > 0) {
        levelItems.forEach(item => {
            if (item.getAttribute('data-level') === defaultLevel) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
}

// --- SETUP EVENT HANDLERS ---
function setupEventHandlers() {
    // 1. Sidebar tab switching
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    // 2. Library subtab switching
    elements.libTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSubtab = btn.getAttribute('data-subtab');
            switchLibrarySubtab(targetSubtab);
        });
    });

    // 3. Level Selector Tabs (1-5)
    const levelTabBtns = document.querySelectorAll('.level-tab-btn');
    levelTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const activeStates = ['squeezing', 'relaxing'];
            const isMidWorkout = activeStates.includes(state.workoutState) || state.workoutState.startsWith('paused_');
            if (isMidWorkout) return; // Prevent level switch mid-workout
            
            if (state.workoutState !== 'idle') {
                resetWorkout();
            }
            
            levelTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            state.selectedLevelTab = parseInt(btn.getAttribute('data-level-tab'));
            
            // Re-render the levels list
            renderLevelsList();
            
            // Automatically select the first workout of the new level
            const firstItem = document.querySelector('#levels-list .level-item');
            if (firstItem) {
                selectWorkoutLevel(firstItem);
            }
        });
    });

    // 3.1 Workout level selection (using event delegation on #levels-list)
    const levelsContainer = document.getElementById('levels-list');
    if (levelsContainer) {
        levelsContainer.addEventListener('click', (e) => {
            const item = e.target.closest('.level-item');
            if (!item) return;
            selectWorkoutLevel(item);
        });
    }

    // 3.2 Custom Design Level item click listener (static, outside levels-list)
    const customLevelItem = document.querySelector('.level-item[data-level="custom"]');
    if (customLevelItem) {
        customLevelItem.addEventListener('click', () => {
            selectWorkoutLevel(customLevelItem);
        });
    }

    // Custom workout builder events binding
    if (elements.btnAddCustomStage) {
        elements.btnAddCustomStage.addEventListener('click', addCustomStage);
    }
    if (elements.btnSaveCustomWorkout) {
        elements.btnSaveCustomWorkout.addEventListener('click', saveCustomWorkout);
    }
    if (elements.btnCancelCustomEdit) {
        elements.btnCancelCustomEdit.addEventListener('click', cancelCustomWorkoutEdit);
    }

    // 4. Sound toggles
    elements.btnToggleSFX.addEventListener('click', () => {
        state.isMutedSFX = !state.isMutedSFX;
        audioController.resumeContext();
        updateSoundButtons();
    });

    elements.btnToggleBGM.addEventListener('click', () => {
        state.isMutedBGM = !state.isMutedBGM;
        audioController.resumeContext();
        
        if (state.isMutedBGM) {
            audioController.stopBGM();
        } else {
            audioController.startBGM();
        }
        updateSoundButtons();
    });

    // 5. Workout controls
    elements.btnStart.addEventListener('click', () => {
        // Resume Audio context on first click interaction
        audioController.resumeContext();
        
        if (state.workoutState === 'idle') {
            startWorkout();
        } else if (state.workoutState === 'squeezing' || state.workoutState === 'relaxing') {
            pauseWorkout();
        } else if (state.workoutState.startsWith('paused_')) {
            resumeWorkout();
        }
    });

    elements.btnReset.addEventListener('click', () => {
        resetWorkout();
    });

    // 6. Stats clearing
    elements.btnClearData.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử luyện tập và chuỗi ngày tập?')) {
            clearAllData();
        }
    });

    // 7. Điều khiển gập/mở Accordion cho Lộ trình dọc (Roadmap)
    const roadmapItems = document.querySelectorAll('.roadmap-item');
    
    roadmapItems.forEach(item => {
        const header = item.querySelector('.roadmap-header');
        if (header) {
            header.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Đóng tất cả các giai đoạn khác
                roadmapItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                });
                
                // Mở giai đoạn được nhấp nếu trước đó nó chưa mở
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        }
    });

    // 8. "Bắt đầu bài tập này" click handlers
    const selectWorkoutBtns = document.querySelectorAll('.btn-select-workout');
    selectWorkoutBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetLevel = btn.getAttribute('data-target-level');
            
            // Set level
            state.selectedLevel = targetLevel;
            
            // Update config cards UI active class
            document.querySelectorAll('.level-item').forEach(item => {
                if (item.getAttribute('data-level') === targetLevel) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
            
            // Update UI Configurations
            updateUIConfigs();
            
            // Switch back to Practice tab
            switchTab('practice');
            
            // Smooth scroll to orb container
            setTimeout(() => {
                const orb = document.getElementById('visualizer-orb');
                if (orb) {
                    orb.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        });
    });

    // 9. Event delegation cho tất cả sự kiện tương tác trong Auth Modal và Cloud Sync
    document.addEventListener('click', (e) => {
        // Mở Auth Modal
        const cloudSyncBtn = e.target.closest('#btn-cloud-sync');
        if (cloudSyncBtn) {
            openAuthModal();
            return;
        }

        // Đóng Auth Modal
        const closeAuthBtn = e.target.closest('#btn-close-auth-modal');
        if (closeAuthBtn) {
            closeAuthModal();
            return;
        }



        // Chuyển đổi Đăng Nhập / Đăng Ký
        const toggleLink = e.target.closest('#link-toggle-auth-mode');
        if (toggleLink) {
            e.preventDefault();
            const submitBtn = document.getElementById('btn-submit-auth');
            const authTitle = document.getElementById('auth-title');
            const authDesc = document.getElementById('auth-desc');
            
            if (currentAuthMode === 'login') {
                currentAuthMode = 'register';
                if (authTitle) authTitle.textContent = 'Đăng Ký Tài Khoản';
                if (authDesc) authDesc.textContent = 'Tạo tài khoản mới để bắt đầu sao lưu tiến độ lên cơ sở dữ liệu Supabase của bạn.';
                toggleLink.textContent = 'Đã có tài khoản? Đăng nhập ngay';
                if (submitBtn) submitBtn.textContent = 'Đăng Ký';
            } else {
                currentAuthMode = 'login';
                if (authTitle) authTitle.textContent = 'Đăng Nhập Đồng Bộ';
                if (authDesc) authDesc.textContent = 'Đăng nhập tài khoản để đồng bộ hóa lịch sử luyện tập và Streak trực tuyến.';
                toggleLink.textContent = 'Chưa có tài khoản? Đăng ký ngay';
                if (submitBtn) submitBtn.textContent = 'Đăng Nhập';
            }
            return;
        }

        // Xác nhận gửi form Auth (Đăng nhập / Đăng ký)
        const submitAuthBtn = e.target.closest('#btn-submit-auth');
        if (submitAuthBtn) {
            handleAuthSubmit();
            return;
        }

        // Đăng xuất Cloud
        const logoutBtn = e.target.closest('#btn-auth-logout');
        if (logoutBtn) {
            handleLogout();
            return;
        }

        // 10. Lựa chọn giới tính (Nam / Nữ)
        const genderBtn = e.target.closest('.gender-btn');
        if (genderBtn) {
            const gender = genderBtn.getAttribute('data-gender');
            selectGender(gender);
            return;
        }
    });
}

// --- TAB SWITCHING LOGIC ---
function switchTab(tabName) {
    state.currentTab = tabName;
    
    // Update menu items active state
    elements.navItems.forEach(item => {
        if (item.getAttribute('data-tab') === tabName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update section active state
    elements.sections.forEach(sec => {
        if (sec.id === `tab-${tabName}`) {
            sec.classList.add('active');
        } else {
            sec.classList.remove('active');
        }
    });
}

function switchLibrarySubtab(subtabName) {
    state.currentLibSubtab = subtabName;

    elements.libTabBtns.forEach(btn => {
        if (btn.getAttribute('data-subtab') === subtabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    elements.libPanes.forEach(pane => {
        if (pane.id === `lib-${subtabName}`) {
            pane.classList.add('active');
        } else {
            pane.classList.remove('active');
        }
    });
}

// --- WORKOUT CONFIGURATION MANAGEMENT ---
function updateUIConfigs() {
    if (state.selectedLevel === 'custom') {
        elements.customPanel.style.display = 'block';
        if (!state.editingWorkoutId) {
            elements.customPanelTitle.textContent = 'Thiết Kế Bài Tập Đa Giai Đoạn';
            elements.customWorkoutNameInput.value = '';
            state.tempStages = [{ type: 'normal', squeeze: 5, relax: 5, reps: 10, transitionRest: 10 }];
            renderCustomStageCards();
        }
        state.squeezeDuration = 5;
        state.relaxDuration = 5;
        state.totalReps = 10;
    } else if (state.selectedLevel && state.selectedLevel.startsWith('custom_')) {
        elements.customPanel.style.display = 'none';
        const workout = state.customWorkouts.find(w => w.id === state.selectedLevel);
        if (workout) {
            state.totalReps = workout.stages.reduce((sum, stage) => {
                if (stage.type === 'normal' || stage.type === 'reverse') {
                    return sum + parseInt(stage.reps || 0);
                }
                return sum;
            }, 0);
            
            // Lấy thời lượng siết của giai đoạn đầu tiên để hiển thị ban đầu
            const firstStage = workout.stages[0];
            state.squeezeDuration = firstStage ? parseInt(firstStage.squeeze || 5) : 5;
            state.relaxDuration = firstStage ? parseInt(firstStage.relax || 5) : 5;
        } else {
            state.squeezeDuration = 5;
            state.relaxDuration = 5;
            state.totalReps = 10;
        }
    } else {
        elements.customPanel.style.display = 'none';
        const genderKey = state.gender === 'female' ? 'female' : 'male';
        const config = clinicalLevels[state.selectedLevelTab]?.[genderKey]?.[state.selectedLevel];
        if (config && config.stages) {
            state.totalReps = config.stages.reduce((sum, stage) => {
                if (stage.type === 'normal' || stage.type === 'reverse') {
                    return sum + parseInt(stage.reps || 0);
                }
                return sum;
            }, 0);
            
            const firstStage = config.stages[0];
            state.squeezeDuration = firstStage ? parseInt(firstStage.squeeze || 5) : 5;
            state.relaxDuration = firstStage ? parseInt(firstStage.relax || 5) : 5;
        }
    }

    // Reset visual display elements
    elements.btnStart.disabled = false;
    elements.repDisplay.textContent = `0 / ${state.totalReps}`;
    renderProgressSegments();
    updateProgressSegments();
    elements.orbTimer.textContent = String(state.squeezeDuration).padStart(2, '0');
    elements.orbAction.textContent = 'SẴN SÀNG';
    
    if (state.selectedLevel === 'goodMorning') {
        elements.orbSubText.textContent = state.gender === 'female' ? 'Bấm Bắt đầu để tập Bình Minh Tươi Trẻ - 25 lượt' : 'Bấm Bắt đầu để tập Chào Buổi Sáng - 25 lượt';
    } else if (state.selectedLevel === 'powerCombo') {
        elements.orbSubText.textContent = state.gender === 'female' ? 'Bấm Bắt đầu để tập Combo Sức Bền - 40 lượt' : 'Bấm Bắt đầu để tập Combo Sức Mạnh - 59 lượt';
    } else if (state.selectedLevel === 'nightRecovery') {
        elements.orbSubText.textContent = state.gender === 'female' ? 'Bấm Bắt đầu để tập Phục Hồi Nhẹ Nhàng - 25 lượt' : 'Bấm Bắt đầu để tập Phục Hồi Ban Đêm - 30 lượt';
    } else if (state.selectedLevel === 'mixed') {
        elements.orbSubText.textContent = 'Bấm Bắt đầu để tập Cấp độ Hỗn hợp Lâm Sàng (11 lượt)';
    } else if (state.selectedLevel === 'pyramidMixed') {
        elements.orbSubText.textContent = 'Bấm Bắt đầu để tập Hỗn hợp Kim Tự Tháp (10 lượt)';
    } else if (state.selectedLevel === 'reflexMixed') {
        elements.orbSubText.textContent = 'Bấm Bắt đầu để tập Hỗn hợp Phản Xạ Sinh Lý (12 lượt)';
    } else if (state.selectedLevel === 'beginner') {
        elements.orbSubText.textContent = state.gender === 'female' ? 'Tập Sơ cấp Nữ: Cố gắng thả lỏng hoàn toàn cơ mông, bụng và đùi' : 'Bấm Bắt đầu để tập Cấp độ 1: Sơ cấp (10 lượt)';
    } else if (state.selectedLevel === 'intermediate') {
        elements.orbSubText.textContent = state.gender === 'female' ? 'Tập Trung cấp Nữ: Giữ nhịp siết đều đặn và duy trì hơi thở ổn định' : 'Bấm Bắt đầu để tập Cấp độ 2: Trung cấp (12 lượt)';
    } else if (state.selectedLevel === 'advanced') {
        elements.orbSubText.textContent = state.gender === 'female' ? 'Tập Cao cấp Nữ: Giữ siết sâu và thả lỏng sâu để hồi phục trương lực' : 'Bấm Bắt đầu để tập Cấp độ 3: Cao cấp (10 lượt)';
    } else if (state.selectedLevel === 'custom') {
        elements.orbSubText.textContent = 'Đang thiết kế bài tập tùy chỉnh mới';
    } else if (state.selectedLevel && state.selectedLevel.startsWith('custom_')) {
        const workout = state.customWorkouts.find(w => w.id === state.selectedLevel);
        elements.orbSubText.textContent = `Bài tập đã chọn: ${workout ? workout.name : 'Không tên'} (${state.totalReps} lượt)`;
    } else {
        elements.orbSubText.textContent = `Bấm Bắt đầu để tập (${state.squeezeDuration}s siết - ${state.relaxDuration}s thả)`;
    }
    
    // Clear classes on orb
    elements.orb.classList.remove('squeezing', 'relaxing', 'resting', 'completed');
}

function updateSoundButtons() {
    // SFX button
    if (state.isMutedSFX) {
        elements.btnToggleSFX.classList.add('muted');
        elements.btnToggleSFX.querySelector('span').textContent = 'Tắt âm';
        elements.iconSFX.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <line x1="23" y1="9" x2="17" y2="15"/>
            <line x1="17" y1="9" x2="23" y2="15"/>
        `;
    } else {
        elements.btnToggleSFX.classList.remove('muted');
        elements.btnToggleSFX.querySelector('span').textContent = 'Âm báo';
        elements.iconSFX.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
        `;
    }

    // BGM button
    if (state.isMutedBGM) {
        elements.btnToggleBGM.classList.add('muted');
        elements.btnToggleBGM.querySelector('span').textContent = 'Tắt nhạc';
        elements.iconBGM.innerHTML = `
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
            <line x1="3" y1="3" x2="21" y2="21"/>
        `;
    } else {
        elements.btnToggleBGM.classList.remove('muted');
        elements.btnToggleBGM.querySelector('span').textContent = 'Nhạc nền';
        elements.iconBGM.innerHTML = `
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
        `;
    }
}

// --- WORKOUT GAME LOOP / WORKFLOW & CUSTOMIZATION ---

function generateWorkoutSteps(level) {
    let steps = [];
    let phases = [];
    let totalReps = 0;

    if (level && level.startsWith('custom_')) {
        const workout = state.customWorkouts.find(w => w.id === level);
        if (workout && workout.stages) {
            return buildStepsFromStages(workout.stages, workout.name || 'Tùy chỉnh');
        }
    } else if (level === 'custom') {
        return buildStepsFromStages([{ type: 'normal', squeeze: 5, relax: 5, reps: 10 }], 'Thiết kế mới');
    } else {
        const genderKey = state.gender === 'female' ? 'female' : 'male';
        const config = clinicalLevels[state.selectedLevelTab]?.[genderKey]?.[level];
        if (config && config.stages) {
            return buildStepsFromStages(config.stages, config.name);
        }
    }

    return { steps, phases, totalReps };
}

function buildStepsFromStages(stages, workoutName) {
    let steps = [];
    let phases = [];
    let repIndex = 1;

    phases = stages.map((stage, sIdx) => {
        const repsCount = parseInt(stage.reps || 1);
        const start = repIndex;
        const end = repIndex + repsCount - 1;
        repIndex = end + 1;
        
        let phaseName = stage.name || `Giai đoạn ${sIdx + 1}`;
        if (stage.type === 'reverse') {
            phaseName = `Kegel ngược ${sIdx + 1}`;
        } else if (stage.type === 'breathing') {
            phaseName = `Thở bụng phục hồi ${sIdx + 1}`;
        }
        
        for (let r = 1; r <= repsCount; r++) {
            const currentRep = start + r - 1;
            const stageType = stage.type || 'normal';
            
            if (stageType === 'normal') {
                steps.push({
                    type: 'squeezing',
                    duration: Math.max(1, parseInt(stage.squeeze || 5)),
                    action: 'SIẾT CƠ',
                    subtext: `Siết chặt cơ sàn chậu - Lượt ${r}/${repsCount} (${phaseName})`,
                    sfx: 'squeeze',
                    orbClass: 'squeezing',
                    repIndex: currentRep
                });
                
                if (r === repsCount && sIdx < stages.length - 1 && parseInt(stage.transitionRest || 0) > 0) {
                    steps.push({
                        type: 'relaxing',
                        duration: parseInt(stage.transitionRest),
                        action: 'NGHỈ CHUYỂN',
                        subtext: `Nghỉ phục hồi ${stage.transitionRest}s - Chuẩn bị giai đoạn tiếp theo`,
                        sfx: 'relax',
                        orbClass: 'resting',
                        repIndex: currentRep
                    });
                } else {
                    steps.push({
                        type: 'relaxing',
                        duration: Math.max(1, parseInt(stage.relax || 5)),
                        action: 'THẢ LỎNG',
                        subtext: `Thả lỏng cơ sàn chậu - Lượt ${r}/${repsCount}`,
                        sfx: 'relax',
                        orbClass: 'relaxing',
                        repIndex: currentRep
                    });
                }
            } else if (stageType === 'reverse') {
                steps.push({
                    type: 'squeezing',
                    duration: Math.max(1, parseInt(stage.squeeze || 5)),
                    action: 'KEGEL NGƯỢC',
                    subtext: `Hít vào, đẩy nhẹ cơ PC ra ngoài - Lượt ${r}/${repsCount} (${phaseName})`,
                    sfx: 'squeeze',
                    orbClass: 'resting',
                    repIndex: currentRep
                });
                
                if (r === repsCount && sIdx < stages.length - 1 && parseInt(stage.transitionRest || 0) > 0) {
                    steps.push({
                        type: 'relaxing',
                        duration: parseInt(stage.transitionRest),
                        action: 'NGHỈ CHUYỂN',
                        subtext: `Nghỉ phục hồi ${stage.transitionRest}s - Chuẩn bị giai đoạn tiếp theo`,
                        sfx: 'relax',
                        orbClass: 'resting',
                        repIndex: currentRep
                    });
                } else {
                    steps.push({
                        type: 'relaxing',
                        duration: Math.max(1, parseInt(stage.relax || 5)),
                        action: 'NGHỈ',
                        subtext: `Thở ra, thả lỏng cơ sàn chậu tự nhiên - Lượt ${r}/${repsCount}`,
                        sfx: 'relax',
                        orbClass: 'relaxing',
                        repIndex: currentRep
                    });
                }
            } else if (stageType === 'breathing') {
                steps.push({
                    type: 'squeezing',
                    duration: Math.max(1, parseInt(stage.squeeze || 5)),
                    action: 'HÍT VÀO',
                    subtext: `Hít sâu chậm bằng bụng - Lượt ${r}/${repsCount} (${phaseName})`,
                    sfx: 'squeeze',
                    orbClass: 'relaxing',
                    repIndex: currentRep
                });
                steps.push({
                    type: 'relaxing',
                    duration: Math.max(1, parseInt(stage.relax || 10)),
                    action: 'THỞ RA',
                    subtext: `Thở ra chậm rãi, xẹp bụng - Lượt ${r}/${repsCount}`,
                    sfx: 'relax',
                    orbClass: 'relaxing',
                    repIndex: currentRep
                });
            }
        }
        
        return { name: phaseName, start, end };
    });
    
    const totalReps = repIndex - 1;
    return { steps, phases, totalReps };
}

function executeWorkoutStep() {
    const step = state.workoutSteps[state.currentStepIndex];
    if (!step) return;
    
    state.timeRemaining = step.duration;
    state.workoutState = step.type; // 'squeezing' or 'relaxing'
    state.currentRep = step.repIndex || 0;
    
    // Cập nhật giao diện quả cầu
    elements.orb.classList.remove('squeezing', 'relaxing', 'resting', 'completed');
    if (step.orbClass) {
        elements.orb.classList.add(step.orbClass);
    }
    
    // Cập nhật text hiển thị
    elements.orbAction.textContent = step.action;
    elements.orbSubText.textContent = step.subtext;
    elements.orbTimer.textContent = String(state.timeRemaining).padStart(2, '0');
    
    // Cập nhật các thanh đếm & thanh tiến trình
    updateProgressDisplays();
    
    // Phát âm báo nhịp
    if (step.sfx === 'squeeze') {
        audioController.playSqueezeSFX();
    } else if (step.sfx === 'relax') {
        audioController.playRelaxSFX();
    }
}

function renderCustomStageCards() {
    if (!elements.customStagesContainer) return;
    elements.customStagesContainer.innerHTML = '';
    
    state.tempStages.forEach((stage, idx) => {
        const card = document.createElement('div');
        card.className = 'custom-stage-card';
        card.setAttribute('data-index', idx);
        
        const isLast = idx === state.tempStages.length - 1;
        const removeButtonHTML = state.tempStages.length > 1 ? `
            <button type="button" class="btn-remove-stage" onclick="removeCustomStage(${idx})">
                ✕ Xóa
            </button>
        ` : '';

        let squeezeLabel = 'Thời gian Siết (giây)';
        let relaxLabel = 'Thời gian Thả (giây)';
        
        if (stage.type === 'reverse') {
            squeezeLabel = 'Thời gian Giữ (giây)';
            relaxLabel = 'Thời gian Thả (giây)';
        }
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Giai đoạn ${idx + 1}</span>
                ${removeButtonHTML}
            </div>
            
            <div class="input-grid" style="grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 0.75rem;">
                <div class="input-group">
                    <label>Loại bài tập</label>
                    <select class="custom-stage-type" data-index="${idx}">
                        <option value="normal" ${stage.type === 'normal' ? 'selected' : ''}>Kegel thường (Siết)</option>
                        <option value="reverse" ${stage.type === 'reverse' ? 'selected' : ''}>Kegel ngược (Giãn)</option>
                    </select>
                </div>
                
                <div class="input-group reps-group">
                    <label>Số lượt (Reps)</label>
                    <input type="number" class="custom-stage-reps" data-index="${idx}" min="1" max="100" value="${stage.reps || 10}">
                </div>
            </div>
            
            <div class="input-grid time-inputs-grid" style="grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 0.75rem;">
                <div class="input-group squeeze-time-group">
                    <label class="squeeze-label" data-index="${idx}">${squeezeLabel}</label>
                    <input type="number" class="custom-stage-squeeze" data-index="${idx}" min="1" max="60" value="${stage.squeeze || 5}">
                </div>
                <div class="input-group relax-time-group">
                    <label class="relax-label" data-index="${idx}">${relaxLabel}</label>
                    <input type="number" class="custom-stage-relax" data-index="${idx}" min="1" max="60" value="${stage.relax || 5}">
                </div>
            </div>

            <div class="input-group transition-rest-group" style="margin-top: 0.5rem; ${isLast ? 'display: none;' : ''}">
                <label>Nghỉ chuyển giai đoạn sau (giây)</label>
                <input type="number" class="custom-stage-transition" data-index="${idx}" min="0" max="120" value="${stage.transitionRest || 10}" style="text-align: center;">
            </div>
        `;
        
        const typeSelect = card.querySelector('.custom-stage-type');
        const repsInput = card.querySelector('.custom-stage-reps');
        const squeezeInput = card.querySelector('.custom-stage-squeeze');
        const relaxInput = card.querySelector('.custom-stage-relax');
        const transitionInput = card.querySelector('.custom-stage-transition');
        
        typeSelect.addEventListener('change', (e) => {
            state.tempStages[idx].type = e.target.value;
            renderCustomStageCards();
        });
        
        repsInput.addEventListener('change', (e) => {
            state.tempStages[idx].reps = Math.max(1, parseInt(e.target.value) || 10);
        });
        
        squeezeInput.addEventListener('change', (e) => {
            state.tempStages[idx].squeeze = Math.max(1, parseInt(e.target.value) || 5);
        });
        
        relaxInput.addEventListener('change', (e) => {
            state.tempStages[idx].relax = Math.max(1, parseInt(e.target.value) || 5);
        });
        
        transitionInput.addEventListener('change', (e) => {
            state.tempStages[idx].transitionRest = Math.max(0, parseInt(e.target.value) || 0);
        });
        
        elements.customStagesContainer.appendChild(card);
    });
}

window.removeCustomStage = function(index) {
    if (state.tempStages.length > 1) {
        state.tempStages.splice(index, 1);
        renderCustomStageCards();
    }
};

function addCustomStage() {
    state.tempStages.push({
        type: 'normal',
        squeeze: 5,
        relax: 5,
        reps: 10,
        transitionRest: 10
    });
    renderCustomStageCards();
}

function renderCustomWorkoutsList() {
    if (!elements.customWorkoutsList || !elements.customWorkoutsSection) return;
    
    elements.customWorkoutsList.innerHTML = '';
    
    if (state.customWorkouts.length === 0) {
        elements.customWorkoutsSection.style.display = 'none';
        return;
    }
    
    elements.customWorkoutsSection.style.display = 'block';
    
    state.customWorkouts.forEach(workout => {
        const item = document.createElement('div');
        item.className = 'level-item';
        item.setAttribute('data-level', workout.id);
        if (state.selectedLevel === workout.id) {
            item.classList.add('active');
        }
        
        const summaryText = workout.stages.map((stage, idx) => {
            const typeText = stage.type === 'reverse' ? 'Ngược' : 'Thường';
            return `GĐ${idx + 1}(${typeText}): ${stage.squeeze}s/${stage.relax}s x ${stage.reps}`;
        }).join(' | ');
        
        item.innerHTML = `
            <div class="level-icon level-cus">C</div>
            <div class="level-info" style="flex: 1; overflow: hidden;">
                <span class="level-name">${workout.name}</span>
                <span class="level-meta" style="font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; max-width: 100%;">${summaryText}</span>
            </div>
            <div class="custom-workout-actions" style="display: flex; gap: 0.25rem; align-items: center;" onclick="event.stopPropagation();">
                <button class="btn-edit-custom" data-id="${workout.id}" style="background: none; border: none; color: #a78bfa; cursor: pointer; padding: 4px; display: flex; align-items: center;" title="Sửa bài tập">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/>
                    </svg>
                </button>
                <button class="btn-delete-custom" data-id="${workout.id}" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px; display: flex; align-items: center;" title="Xóa bài tập">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                </button>
            </div>
        `;
        
        item.addEventListener('click', () => {
            const activeStates = ['squeezing', 'relaxing'];
            const isMidWorkout = activeStates.includes(state.workoutState) || state.workoutState.startsWith('paused_');
            if (isMidWorkout) return;
            
            if (state.workoutState !== 'idle') {
                resetWorkout();
            }
            
            document.querySelectorAll('.level-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            state.selectedLevel = workout.id;
            updateUIConfigs();
        });
        
        item.querySelector('.btn-edit-custom').addEventListener('click', (e) => {
            e.stopPropagation();
            editCustomWorkout(workout.id);
        });
        
        item.querySelector('.btn-delete-custom').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCustomWorkout(workout.id);
        });
        
        elements.customWorkoutsList.appendChild(item);
    });
}

async function saveCustomWorkout() {
    const name = elements.customWorkoutNameInput.value.trim() || `Bài tập tùy chỉnh ${state.customWorkouts.length + 1}`;
    
    if (state.tempStages.length === 0) {
        alert("Vui lòng thêm ít nhất một giai đoạn.");
        return;
    }
    
    const workoutData = {
        id: state.editingWorkoutId || 'custom_' + Date.now(),
        name: name,
        stages: JSON.parse(JSON.stringify(state.tempStages)),
        updatedAt: new Date().toISOString()
    };
    
    if (state.editingWorkoutId) {
        const index = state.customWorkouts.findIndex(w => w.id === state.editingWorkoutId);
        if (index !== -1) {
            state.customWorkouts[index] = workoutData;
        }
    } else {
        state.customWorkouts.push(workoutData);
    }
    
    state.editingWorkoutId = null;
    state.tempStages = [];
    elements.customWorkoutNameInput.value = '';
    elements.btnCancelCustomEdit.style.display = 'none';
    elements.customPanelTitle.textContent = 'Thiết Kế Bài Tập Đa Giai Đoạn';
    
    saveData();
    state.selectedLevel = workoutData.id;
    
    renderCustomWorkoutsList();
    
    document.querySelectorAll('.level-item').forEach(i => {
        if (i.getAttribute('data-level') === state.selectedLevel) {
            i.classList.add('active');
        } else {
            i.classList.remove('active');
        }
    });
    
    updateUIConfigs();
    
    if (supabaseClient) {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (user) {
                updateSyncStatusUI('syncing');
                const { error } = await supabaseClient.auth.updateUser({
                    data: { custom_workouts: state.customWorkouts }
                });
                if (error) throw error;
                updateSyncStatusUI('online');
                console.log("Đã đồng bộ bài tập tùy chỉnh lên Supabase.");
            }
        } catch (err) {
            console.error("Lỗi đồng bộ lên cloud:", err);
            updateSyncStatusUI('error');
        }
    }
    
    alert("Đã lưu bài tập tùy chỉnh thành công!");
}

function cancelCustomWorkoutEdit() {
    state.editingWorkoutId = null;
    state.tempStages = [];
    elements.customWorkoutNameInput.value = '';
    elements.btnCancelCustomEdit.style.display = 'none';
    elements.customPanelTitle.textContent = 'Thiết Kế Bài Tập Đa Giai Đoạn';
    state.selectedLevel = 'goodMorning';
    
    document.querySelectorAll('.level-item').forEach(i => {
        if (i.getAttribute('data-level') === state.selectedLevel) {
            i.classList.add('active');
        } else {
            i.classList.remove('active');
        }
    });
    
    updateUIConfigs();
}

function editCustomWorkout(workoutId) {
    const workout = state.customWorkouts.find(w => w.id === workoutId);
    if (!workout) return;
    
    state.editingWorkoutId = workoutId;
    elements.customPanelTitle.textContent = 'Chỉnh Sửa Bài Tập Tùy Chỉnh';
    elements.customWorkoutNameInput.value = workout.name;
    state.tempStages = JSON.parse(JSON.stringify(workout.stages));
    
    elements.btnCancelCustomEdit.style.display = 'block';
    elements.customPanel.style.display = 'block';
    
    document.querySelectorAll('.level-item').forEach(i => {
        if (i.getAttribute('data-level') === 'custom') {
            i.classList.add('active');
        } else {
            i.classList.remove('active');
        }
    });
    
    renderCustomStageCards();
}

async function deleteCustomWorkout(workoutId) {
    if (!confirm("Bạn có chắc chắn muốn xóa bài tập tùy chỉnh này?")) {
        return;
    }
    
    state.customWorkouts = state.customWorkouts.filter(w => w.id !== workoutId);
    saveData();
    
    if (state.selectedLevel === workoutId) {
        state.selectedLevel = 'goodMorning';
        document.querySelectorAll('.level-item').forEach(i => {
            if (i.getAttribute('data-level') === state.selectedLevel) {
                i.classList.add('active');
            } else {
                i.classList.remove('active');
            }
        });
    }
    
    renderCustomWorkoutsList();
    updateUIConfigs();
    
    if (supabaseClient) {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (user) {
                updateSyncStatusUI('syncing');
                const { error } = await supabaseClient.auth.updateUser({
                    data: { custom_workouts: state.customWorkouts }
                });
                if (error) throw error;
                updateSyncStatusUI('online');
            }
        } catch (err) {
            console.error("Lỗi đồng bộ khi xóa bài tập:", err);
            updateSyncStatusUI('error');
        }
    }
}

function mergeCustomWorkouts(local, cloud) {
    const map = new Map();
    cloud.forEach(w => {
        map.set(w.id, w);
    });
    local.forEach(w => {
        if (map.has(w.id)) {
            const cloudItem = map.get(w.id);
            const localTime = new Date(w.updatedAt || 0).getTime();
            const cloudTime = new Date(cloudItem.updatedAt || 0).getTime();
            if (localTime > cloudTime) {
                map.set(w.id, w);
            }
        } else {
            map.set(w.id, w);
        }
    });
    return Array.from(map.values());
}

function startWorkout() {
    const workoutData = generateWorkoutSteps(state.selectedLevel);
    state.workoutSteps = workoutData.steps;
    state.workoutPhases = workoutData.phases;
    state.totalReps = workoutData.totalReps;
    state.currentStepIndex = 0;
    
    requestWakeLock();
    
    const bladderAlert = document.getElementById('bladder-reminder-alert');
    if (bladderAlert) {
        bladderAlert.classList.add('highlight-glow');
        setTimeout(() => {
            bladderAlert.classList.remove('highlight-glow');
        }, 2000);
    }
    
    elements.btnReset.disabled = true;
    elements.btnStart.classList.remove('btn-primary');
    elements.btnStart.classList.add('btn-secondary');
    elements.textStart.textContent = 'Tạm dừng';
    elements.iconStart.innerHTML = `
        <rect x="6" y="4" width="4" height="16"/>
        <rect x="14" y="4" width="4" height="16"/>
    `;
    
    document.querySelectorAll('.level-item').forEach(item => item.style.pointerEvents = 'none');
    
    renderProgressSegments();
    executeWorkoutStep();
    
    state.timerInterval = setInterval(tick, 1000);
}

function pauseWorkout() {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    releaseWakeLock();
    
    const oldState = state.workoutState;
    state.workoutState = 'paused_' + oldState;
    
    elements.textStart.textContent = 'Tiếp tục';
    elements.iconStart.innerHTML = `
        <polygon points="5 3 19 12 5 21 5 3"/>
    `;
    elements.orbSubText.textContent = 'Đang tạm dừng bài tập';
    elements.btnReset.disabled = false;
}

function resumeWorkout() {
    const originalState = state.workoutState.replace('paused_', '');
    state.workoutState = originalState;
    requestWakeLock();
    
    elements.textStart.textContent = 'Tạm dừng';
    elements.iconStart.innerHTML = `
        <rect x="6" y="4" width="4" height="16"/>
        <rect x="14" y="4" width="4" height="16"/>
    `;
    elements.btnReset.disabled = true;
    
    const step = state.workoutSteps[state.currentStepIndex];
    elements.orbSubText.textContent = step.subtext;
    
    state.timerInterval = setInterval(tick, 1000);
}

function resetWorkout() {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    state.workoutState = 'idle';
    releaseWakeLock();
    
    document.querySelectorAll('.level-item').forEach(item => item.style.pointerEvents = 'auto');
    
    elements.btnReset.disabled = true;
    elements.btnStart.disabled = false;
    elements.btnStart.classList.add('btn-primary');
    elements.btnStart.classList.remove('btn-secondary');
    elements.textStart.textContent = 'Bắt đầu';
    elements.iconStart.innerHTML = `
        <polygon points="5 3 19 12 5 21 5 3"/>
    `;

    updateUIConfigs();
}

function tick() {
    state.timeRemaining--;
    
    if (state.timeRemaining < 0) {
        state.currentStepIndex++;
        if (state.currentStepIndex >= state.workoutSteps.length) {
            finishWorkout();
        } else {
            executeWorkoutStep();
        }
    } else {
        elements.orbTimer.textContent = String(state.timeRemaining).padStart(2, '0');
    }
}

function buildPhasesFromStages(stages) {
    let repIndex = 1;
    return stages.map((stage, sIdx) => {
        const repsCount = parseInt(stage.reps || 1);
        const start = repIndex;
        const end = repIndex + repsCount - 1;
        repIndex = end + 1;
        
        let phaseName = stage.name;
        if (!phaseName) {
            if (stage.type === 'reverse') {
                phaseName = `Kegel ngược ${stage.squeeze}s`;
            } else if (stage.type === 'breathing') {
                phaseName = 'Thở bụng';
            } else {
                phaseName = `Siết ${stage.squeeze}s`;
            }
        }
        return { name: phaseName, start, end };
    });
}

function getWorkoutPhases(level, totalReps) {
    if (level && level.startsWith('custom_')) {
        const workout = state.customWorkouts.find(w => w.id === level);
        if (workout && workout.stages) {
            return buildPhasesFromStages(workout.stages);
        }
    } else if (level === 'custom') {
        return buildPhasesFromStages([{ type: 'normal', squeeze: 5, relax: 5, reps: 10 }]);
    } else {
        const genderKey = state.gender === 'female' ? 'female' : 'male';
        const config = clinicalLevels[state.selectedLevelTab]?.[genderKey]?.[level];
        if (config && config.stages) {
            return buildPhasesFromStages(config.stages);
        }
    }
    
    return [
        { name: 'Luyện tập', start: 1, end: totalReps }
    ];
}

function renderProgressSegments() {
    if (!elements.progressBar || !elements.phaseLabelsContainer) return;
    
    elements.progressBar.innerHTML = '';
    elements.phaseLabelsContainer.innerHTML = '';
    
    const phases = getWorkoutPhases(state.selectedLevel, state.totalReps);
    
    phases.forEach(phase => {
        const reps = phase.end - phase.start + 1;
        
        // 1. Create progress segment div
        const segment = document.createElement('div');
        segment.className = 'progress-segment';
        segment.style.flex = `${reps} 1 0%`;
        
        const fill = document.createElement('div');
        fill.className = 'progress-segment-fill';
        segment.appendChild(fill);
        
        elements.progressBar.appendChild(segment);
        
        // 2. Create phase label span
        const label = document.createElement('span');
        label.className = 'phase-label';
        label.style.flex = `${reps} 1 0%`;
        label.textContent = phase.name;
        
        elements.phaseLabelsContainer.appendChild(label);
    });
}

function updateProgressSegments() {
    const phases = getWorkoutPhases(state.selectedLevel, state.totalReps);
    const segmentFills = elements.progressBar.querySelectorAll('.progress-segment-fill');
    const labels = elements.phaseLabelsContainer.querySelectorAll('.phase-label');
    
    phases.forEach((phase, index) => {
        const fillEl = segmentFills[index];
        const labelEl = labels[index];
        if (!fillEl) return;
        
        let widthPercent = 0;
        const phaseTotalReps = phase.end - phase.start + 1;
        
        if (state.workoutState === 'completed') {
            widthPercent = 100;
            if (labelEl) {
                labelEl.classList.remove('active');
                labelEl.classList.remove('completed-slide-left');
            }
            fillEl.parentElement.classList.remove('completed-slide-left');
        } else {
            if (state.currentRep < phase.start) {
                widthPercent = 0;
                if (labelEl) {
                    labelEl.classList.remove('active');
                    labelEl.classList.remove('completed-slide-left');
                }
                fillEl.parentElement.classList.remove('completed-slide-left');
            } else if (state.currentRep > phase.end) {
                widthPercent = 100;
                if (labelEl) {
                    labelEl.classList.remove('active');
                    labelEl.classList.add('completed-slide-left');
                }
                fillEl.parentElement.classList.add('completed-slide-left');
            } else {
                // Active phase
                const repsCompleted = state.currentRep - phase.start;
                widthPercent = (repsCompleted / phaseTotalReps) * 100;
                if (labelEl) {
                    labelEl.classList.add('active');
                    labelEl.classList.remove('completed-slide-left');
                }
                fillEl.parentElement.classList.remove('completed-slide-left');
            }
        }
        
        fillEl.style.width = `${widthPercent}%`;
    });
}

function updateProgressDisplays() {
    elements.repDisplay.textContent = `${state.currentRep} / ${state.totalReps}`;
    updateProgressSegments();
}

function finishWorkout() {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    state.workoutState = 'completed';
    releaseWakeLock();
    
    // Visual indicators
    elements.orb.classList.remove('squeezing', 'relaxing');
    elements.orb.classList.add('completed');
    elements.orbAction.textContent = 'HOÀN THÀNH';
    elements.orbTimer.textContent = '✓';
    elements.orbSubText.textContent = 'Tuyệt vời! Bạn đã hoàn thành hiệp tập.';
    
    // Progress bar full
    updateProgressSegments();
    elements.repDisplay.textContent = `${state.totalReps} / ${state.totalReps}`;
    
    // Update controllers
    elements.btnStart.disabled = true;
    elements.btnReset.disabled = false;
    audioController.playCompletionSFX();

    // Save statistics & log
    saveWorkoutLog();
}

// --- DATA PERSISTENCE & STATISTICS ---
function saveWorkoutLog() {
    const logEntry = {
        id: 'session_' + Date.now(),
        timestamp: new Date().toISOString(),
        level: state.selectedLevel,
        levelTab: (state.selectedLevel === 'custom' || state.selectedLevel.startsWith('custom_')) ? null : state.selectedLevelTab,
        config: {
            squeeze: state.squeezeDuration,
            relax: state.relaxDuration,
            reps: state.totalReps
        },
        completed: true
    };
    
    state.history.unshift(logEntry); // Add to the front
    
    // Calculate Streak & Totals
    state.totalSessions += 1;
    state.totalRepsCompleted += calculateSqueezes(state.selectedLevel, state.totalReps);
    
    calculateStreak();
    saveData();
    renderStats();
    uploadNewLogOnline(logEntry);
}

function calculateStreak() {
    if (state.history.length === 0) {
        state.streak = 0;
        return;
    }

    const todayStr = new Date().toDateString();
    let currentStreak = 0;
    let checkDate = new Date();
    
    // Deduplicate history dates to daily exercises
    const exerciseDates = new Set();
    state.history.forEach(log => {
        const d = new Date(log.timestamp).toDateString();
        exerciseDates.add(d);
    });
    
    // Check if the user worked out today
    let hasTrainedToday = exerciseDates.has(todayStr);
    
    if (hasTrainedToday) {
        currentStreak = 1;
        checkDate.setDate(checkDate.getDate() - 1); // Move to yesterday
    } else {
        // Check if worked out yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (exerciseDates.has(yesterday.toDateString())) {
            currentStreak = 1;
            checkDate = yesterday;
            checkDate.setDate(checkDate.getDate() - 1); // Move day before yesterday
        } else {
            // Broken streak
            state.streak = 0;
            return;
        }
    }
    
    // Work backward
    while (true) {
        const targetDateStr = checkDate.toDateString();
        if (exerciseDates.has(targetDateStr)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    state.streak = currentStreak;
}

function saveData() {
    localStorage.setItem('pc_flex_history', JSON.stringify(state.history));
    localStorage.setItem('pc_flex_streak', state.streak);
    localStorage.setItem('pc_flex_total_sessions', state.totalSessions);
    localStorage.setItem('pc_flex_total_reps', state.totalRepsCompleted);
    localStorage.setItem('pc_flex_custom_workouts', JSON.stringify(state.customWorkouts));
    localStorage.setItem('pc_flex_gender', state.gender);
    localStorage.setItem('pc_flex_birth_year', state.birthYear || '');
    localStorage.setItem('pc_flex_gemini_key', state.geminiApiKey || '');
}

function loadData() {
    try {
        state.history = JSON.parse(localStorage.getItem('pc_flex_history')) || [];
        state.streak = parseInt(localStorage.getItem('pc_flex_streak')) || 0;
        state.totalSessions = parseInt(localStorage.getItem('pc_flex_total_sessions')) || 0;
        state.customWorkouts = JSON.parse(localStorage.getItem('pc_flex_custom_workouts')) || [];
        state.gender = localStorage.getItem('pc_flex_gender') || 'male';
        state.birthYear = localStorage.getItem('pc_flex_birth_year') || '';
        state.geminiApiKey = localStorage.getItem('pc_flex_gemini_key') || '';
        state.totalRepsCompleted = state.history.reduce((sum, log) => {
            const level = log.level;
            const reps = log.config ? (log.config.reps || 0) : (log.reps || 0);
            return sum + calculateSqueezes(level, reps);
        }, 0);
        
        // Recalculate streak on load to ensure it resets if a day was missed
        calculateStreak();
    } catch(e) {
        console.error("Lỗi khi tải dữ liệu từ localStorage", e);
    }
}

// --- HELPER FUNCTIONS FOR STATS TAB ---
function updateBadges() {
    const badges = {
        'badge-first-workout': state.totalSessions >= 1,
        'badge-streak-3': state.streak >= 3,
        'badge-streak-7': state.streak >= 7,
        'badge-sessions-10': state.totalSessions >= 10,
        'badge-sessions-30': state.totalSessions >= 30,
        'badge-level-5': state.history.some(log => log.levelTab === 5 || log.level === 'reflexMixed'),
        'badge-custom': state.history.some(log => log.level && (log.level === 'custom' || log.level.startsWith('custom_')))
    };
    
    for (const [badgeId, isUnlocked] of Object.entries(badges)) {
        const el = document.getElementById(badgeId);
        if (el) {
            if (isUnlocked) {
                el.classList.remove('locked');
            } else {
                el.classList.add('locked');
            }
        }
    }
}

function renderWeeklyCalendar() {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = CN, 1 = T2, ..., 6 = T7
    
    const dayCards = document.querySelectorAll('.calendar-day');
    dayCards.forEach(card => {
        const dayVal = parseInt(card.getAttribute('data-day'));
        
        // Đánh dấu ngày hôm nay bằng viền/hiệu ứng pulse
        if (dayVal === currentDayOfWeek) {
            card.classList.add('today');
        } else {
            card.classList.remove('today');
        }
        
        // Reset trạng thái hoàn thành
        card.classList.remove('completed');
        const statusEl = card.querySelector('.day-status');
        if (statusEl) {
            statusEl.textContent = '';
        }
    });
    
    // Tìm ngày Thứ 2 đầu tuần và Chủ Nhật cuối tuần hiện tại
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1); // Trừ lùi về thứ 2
    
    const monday = new Date(now.setDate(diffToMonday));
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    // Tìm các thứ trong tuần hiện tại có lịch sử tập
    const completedDays = new Set();
    state.history.forEach(log => {
        const logDate = new Date(log.timestamp);
        if (logDate >= monday && logDate <= sunday) {
            completedDays.add(logDate.getDay());
        }
    });
    
    // Cập nhật giao diện dấu tích ✓ cho các thứ đã tập
    dayCards.forEach(card => {
        const dayVal = parseInt(card.getAttribute('data-day'));
        if (completedDays.has(dayVal)) {
            card.classList.add('completed');
            const statusEl = card.querySelector('.day-status');
            if (statusEl) {
                statusEl.textContent = '✓';
            }
        }
    });
}

function renderStats() {
    // 1. Sidebar Stats
    elements.sidebarStreak.innerHTML = `<span class="emoji">🔥</span> ${state.streak} ngày`;
    elements.sidebarTotalSessions.textContent = `${state.totalSessions} hiệp`;

    // 2. Stats Dashboard Tab
    if (elements.statsStreak) {
        elements.statsStreak.textContent = `${state.streak} ngày`;
        elements.statsTotalSessions.textContent = `${state.totalSessions} hiệp`;
        elements.statsTotalReps.textContent = `${state.totalRepsCompleted} lượt`;
    }

    // 3. Home Page Stats Badge
    const homeRepsCount = document.getElementById('home-total-reps-count');
    if (homeRepsCount) {
        homeRepsCount.textContent = state.totalRepsCompleted;
    }

    // Cập nhật Lịch hoạt động và Huy hiệu
    renderWeeklyCalendar();
    updateBadges();

    // 3. Render History Table Log
    if (elements.historyLogBody) {
        if (state.history.length === 0) {
            elements.historyLogBody.innerHTML = `
                <tr>
                    <td colspan="4" class="no-data">
                        <div class="empty-history-visual" style="padding: 2.5rem 1rem; text-align: center;">
                            <div class="empty-icon" style="font-size: 2.8rem; margin-bottom: 0.75rem;">📊</div>
                            <h4 style="color: var(--color-text-primary); margin-bottom: 0.5rem; font-size: 1.15rem; font-weight: 700; letter-spacing: -0.2px;">Chưa Có Nhật Ký Luyện Tập</h4>
                            <p style="color: var(--color-text-secondary); max-width: 440px; margin: 0 auto 1.5rem auto; font-size: 0.85rem; line-height: 1.6; font-family: var(--font-secondary);">
                                Trang "Tiến độ" này tự động ghi nhận chuỗi ngày tập liên tục (Streak), tổng số hiệp đã tập hoàn chỉnh và lịch hoạt động tuần. Hãy chọn một cấp độ ở tab <strong>Luyện tập</strong> và thực hiện trọn vẹn đến khi kết thúc hiệp, dữ liệu của bạn sẽ ngay lập tức được lưu trữ và hiển thị tại đây.
                            </p>
                            <button class="btn btn-primary btn-sm btn-go-practice" style="max-width: 200px; margin: 0 auto; box-shadow: 0 4px 15px rgba(0, 245, 212, 0.25);">Bắt đầu hiệp tập ngay</button>
                        </div>
                    </td>
                </tr>
            `;
            setTimeout(() => {
                const btn = document.querySelector('.btn-go-practice');
                if (btn) {
                    btn.addEventListener('click', () => {
                        switchTab('practice');
                    });
                }
            }, 50);
            return;
        }

        elements.historyLogBody.innerHTML = state.history.slice(0, 10).map(log => {
            const date = new Date(log.timestamp);
            const timeStr = `${date.toLocaleDateString('vi-VN')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            
            let levelLabel = '';
            switch(log.level) {
                case 'beginner': levelLabel = 'Sơ cấp (C1)'; break;
                case 'intermediate': levelLabel = 'Trung cấp (C2)'; break;
                case 'advanced': levelLabel = 'Nâng cao (C3)'; break;
                case 'fastFlicks': levelLabel = 'Nhấp nhanh (C4)'; break;
                case 'ladder': levelLabel = 'Nấc thang (C5)'; break;
                case 'mixed': levelLabel = 'Hỗn hợp (C6)'; break;
                case 'pyramidMixed': levelLabel = 'Hỗn hợp (C7)'; break;
                case 'reflexMixed': levelLabel = 'Hỗn hợp (C8)'; break;
                default: levelLabel = 'Tự do';
            }

            return `
                <tr>
                    <td>${timeStr}</td>
                    <td><span class="badge badge-level">${levelLabel}</span></td>
                    <td>Siết: ${log.config.squeeze}s | Thả: ${log.config.relax}s | Lượt: ${log.config.reps}</td>
                    <td><span class="badge badge-success">Hoàn thành</span></td>
                </tr>
            `;
        }).join('');
    }
}

function clearAllData() {
    localStorage.clear();
    state.history = [];
    state.streak = 0;
    state.totalSessions = 0;
    state.totalRepsCompleted = 0;
    
    renderStats();
    updateUIConfigs();
}

// --- SUPABASE CLOUD MANAGEMENT ---
let supabaseClient = null;
let currentAuthMode = 'login';

function initSupabaseConnection() {
    // Tích hợp sẵn thông tin kết nối mặc định của bạn
    const defaultUrl = 'https://rwmhivfwjusezxedjtgw.supabase.co';
    const defaultKey = 'sb_publishable_sOm6SWd3dIIerce97LHXNw_OVCroPTr';
    
    let url = localStorage.getItem('supabase_url');
    let key = localStorage.getItem('supabase_key');
    
    // Nếu chưa có cấu hình trong LocalStorage, tự động thiết lập cấu hình mặc định
    if (!url || !key) {
        url = defaultUrl;
        key = defaultKey;
        localStorage.setItem('supabase_url', url);
        localStorage.setItem('supabase_key', key);
    }
    
    const warningEl = document.getElementById('auth-connection-warning');
    const emailInput = document.getElementById('input-auth-email');
    const passwordInput = document.getElementById('input-auth-password');
    const submitBtn = document.getElementById('btn-submit-auth');
    const toggleLink = document.getElementById('link-toggle-auth-mode');
    
    if (url && key) {
        try {
            if (window.supabase) {
                // Đảm bảo URL kết nối được làm sạch (bỏ đuôi /rest/v1/ nếu có)
                const cleanUrl = url.replace(/\/rest\/v1\/?$/, '');
                supabaseClient = window.supabase.createClient(cleanUrl, key);
                
                // Mở khóa form đăng nhập
                if (warningEl) warningEl.style.display = 'none';
                if (emailInput) emailInput.disabled = false;
                if (passwordInput) passwordInput.disabled = false;
                if (submitBtn) submitBtn.disabled = false;
                if (toggleLink) {
                    toggleLink.style.cursor = 'pointer';
                    toggleLink.style.opacity = '1';
                }
                
                // Gán giá trị vào input config để hiển thị
                const configUrl = document.getElementById('input-supabase-url');
                const configKey = document.getElementById('input-supabase-key');
                if (configUrl) configUrl.value = url;
                if (configKey) configKey.value = key;
                
                checkUserSession();
                return true;
            }
        } catch (e) {
            console.error("Lỗi khởi tạo Supabase:", e);
        }
    }
    
    // Nếu chưa cấu hình, khóa form Auth
    supabaseClient = null;
    if (warningEl) warningEl.style.display = 'block';
    if (emailInput) emailInput.disabled = true;
    if (passwordInput) passwordInput.disabled = true;
    if (submitBtn) submitBtn.disabled = true;
    if (toggleLink) {
        toggleLink.style.cursor = 'not-allowed';
        toggleLink.style.opacity = '0.5';
    }
    return false;
}

async function checkUserSession() {
    if (!supabaseClient) return;
    
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        
        updateAuthUI(session ? session.user : null);
        if (session) {
            syncDataOnline();
        }
    } catch (e) {
        console.error("Lỗi kiểm tra session:", e);
    }
}

function updateAuthUI(user) {
    const fieldsDiv = document.getElementById('auth-form-fields');
    const profileDiv = document.getElementById('user-profile-section');
    const profileEmail = document.getElementById('user-profile-email');
    
    if (user) {
        if (fieldsDiv) fieldsDiv.style.display = 'none';
        if (profileDiv) profileDiv.style.display = 'block';
        if (profileEmail) profileEmail.textContent = user.email;
        updateSyncStatusUI('online');
    } else {
        if (fieldsDiv) fieldsDiv.style.display = 'block';
        if (profileDiv) profileDiv.style.display = 'none';
        updateSyncStatusUI('offline');
    }
}

function updateSyncStatusUI(status) {
    const cloudBtn = document.getElementById('btn-cloud-sync');
    const cloudBtnText = document.getElementById('cloud-sync-status-text');
    const homeSyncDot = document.getElementById('home-sync-dot');
    const homeSyncText = document.getElementById('home-sync-text');
    const homeSyncStatus = document.getElementById('home-sync-status');
    
    if (homeSyncDot) {
        homeSyncDot.style.animation = 'none';
    }
    
    if (status === 'offline') {
        if (cloudBtnText) cloudBtnText.textContent = 'Đồng bộ Cloud';
        if (cloudBtn) {
            cloudBtn.classList.remove('online', 'syncing');
        }
        if (homeSyncDot) homeSyncDot.style.backgroundColor = '#9ca3af';
        if (homeSyncText) homeSyncText.textContent = 'Chưa kết nối Cloud';
        if (homeSyncStatus) {
            homeSyncStatus.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            homeSyncStatus.style.background = 'rgba(255, 255, 255, 0.03)';
        }
    } else if (status === 'syncing') {
        if (cloudBtnText) cloudBtnText.textContent = 'Đang đồng bộ...';
        if (cloudBtn) {
            cloudBtn.classList.remove('online');
            cloudBtn.classList.add('syncing');
        }
        if (homeSyncDot) {
            homeSyncDot.style.backgroundColor = '#f59e0b';
            homeSyncDot.style.animation = 'pulse-dot 1.2s infinite alternate';
        }
        if (homeSyncText) homeSyncText.textContent = 'Đang đồng bộ...';
        if (homeSyncStatus) {
            homeSyncStatus.style.borderColor = 'rgba(245, 158, 11, 0.2)';
            homeSyncStatus.style.background = 'rgba(245, 158, 11, 0.04)';
        }
    } else if (status === 'online') {
        if (cloudBtnText) cloudBtnText.textContent = 'Đã đồng bộ';
        if (cloudBtn) {
            cloudBtn.classList.remove('syncing');
            cloudBtn.classList.add('online');
        }
        if (homeSyncDot) homeSyncDot.style.backgroundColor = '#10b981';
        if (homeSyncText) homeSyncText.textContent = 'Đã đồng bộ Cloud';
        if (homeSyncStatus) {
            homeSyncStatus.style.borderColor = 'rgba(16, 185, 129, 0.2)';
            homeSyncStatus.style.background = 'rgba(16, 185, 129, 0.04)';
        }
    } else if (status === 'error') {
        if (cloudBtnText) cloudBtnText.textContent = 'Lỗi đồng bộ';
        if (cloudBtn) {
            cloudBtn.classList.remove('syncing');
        }
        if (homeSyncDot) homeSyncDot.style.backgroundColor = '#ef4444';
        if (homeSyncText) homeSyncText.textContent = 'Lỗi đồng bộ';
        if (homeSyncStatus) {
            homeSyncStatus.style.borderColor = 'rgba(239, 68, 68, 0.2)';
            homeSyncStatus.style.background = 'rgba(239, 68, 68, 0.04)';
        }
    }
}

async function handleAuthSubmit() {
    if (!supabaseClient) return;
    
    const email = document.getElementById('input-auth-email').value.trim();
    const password = document.getElementById('input-auth-password').value;
    const submitBtn = document.getElementById('btn-submit-auth');
    
    if (!email || !password) {
        alert("Vui lòng điền đầy đủ Email và Mật khẩu.");
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = currentAuthMode === 'login' ? 'Đang đăng nhập...' : 'Đang đăng ký...';
    
    try {
        if (currentAuthMode === 'login') {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });
            if (error) throw error;
            updateAuthUI(data.user);
            await syncDataOnline();
            alert("Đăng nhập và đồng bộ dữ liệu đám mây thành công!");
            closeAuthModal();
        } else {
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password
            });
            if (error) throw error;
            
            if (data.user && data.session) {
                updateAuthUI(data.user);
                await syncDataOnline();
                alert("Đăng ký tài khoản và tự động đồng bộ đám mây thành công!");
                closeAuthModal();
            } else {
                alert("Đăng ký thành công! Vui lòng kiểm tra Email của bạn để nhấp vào link kích hoạt tài khoản.");
                closeAuthModal();
            }
        }
    } catch (e) {
        alert("Lỗi xác thực: " + e.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = currentAuthMode === 'login' ? 'Đăng Nhập' : 'Đăng Ký';
    }
}

async function handleLogout() {
    if (!supabaseClient) return;
    
    if (confirm("Bạn có chắc chắn muốn đăng xuất khỏi tài khoản đám mây? Lịch sử trên máy vẫn sẽ được bảo lưu.")) {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
            
            updateAuthUI(null);
            alert("Đã đăng xuất tài khoản đám mây thành công!");
        } catch (e) {
            alert("Lỗi đăng xuất: " + e.message);
        }
    }
}

async function syncDataOnline() {
    if (!supabaseClient) return;
    
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;
        
        updateSyncStatusUI('syncing');
        
        // 1. Tải log online từ Supabase
        const { data: onlineLogs, error } = await supabaseClient
            .from('pc_flex_logs')
            .select('*')
            .order('timestamp', { ascending: false });
            
        if (error) throw error;
        
        // 2. Lấy dữ liệu local offline hiện tại
        const localHistory = JSON.parse(localStorage.getItem('pc_flex_history')) || [];
        
        const timestamps = new Set();
        const merged = [];
        
        const getNormTime = (t) => new Date(t).getTime();
        
        // Đưa dữ liệu online vào merged
        onlineLogs.forEach(log => {
            const time = getNormTime(log.timestamp);
            const roundTime = Math.round(time / 1000) * 1000; // Làm tròn giây
            timestamps.add(roundTime);
            
            merged.push({
                id: log.id,
                timestamp: log.timestamp,
                level: log.level,
                config: {
                    squeeze: log.squeeze,
                    relax: log.relax,
                    reps: log.reps
                },
                completed: log.completed
            });
        });
        
        // Tìm các bản ghi offline chưa được upload lên online
        const toUpload = [];
        localHistory.forEach(log => {
            const time = getNormTime(log.timestamp);
            const roundTime = Math.round(time / 1000) * 1000;
            
            if (!timestamps.has(roundTime)) {
                timestamps.add(roundTime);
                merged.push(log);
                
                toUpload.push({
                    user_id: user.id,
                    timestamp: log.timestamp,
                    level: log.level,
                    squeeze: log.config.squeeze,
                    relax: log.config.relax,
                    reps: log.config.reps,
                    completed: log.completed
                });
            }
        });
        
        // 3. Tải lên dữ liệu offline mới
        if (toUpload.length > 0) {
            const { error: uploadError } = await supabaseClient
                .from('pc_flex_logs')
                .insert(toUpload);
                
            if (uploadError) throw uploadError;
            console.log(`Đã tải lên ${toUpload.length} bản ghi offline lên Supabase.`);
        }
        
        // Sắp xếp giảm dần theo thời gian
        merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // 4. Lưu lại local
        state.history = merged;
        state.totalSessions = state.history.length;
        state.totalRepsCompleted = state.history.reduce((sum, log) => {
            const lvl = log.level;
            const rps = log.config ? (log.config.reps || 0) : (log.reps || 0);
            return sum + calculateSqueezes(lvl, rps);
        }, 0);
        calculateStreak();
        
        // 5. Đồng bộ bài tập tùy chỉnh qua user_metadata của Supabase
        let cloudWorkouts = user.user_metadata ? (user.user_metadata.custom_workouts || []) : [];
        let mergedWorkouts = mergeCustomWorkouts(state.customWorkouts, cloudWorkouts);
        state.customWorkouts = mergedWorkouts;
        localStorage.setItem('pc_flex_custom_workouts', JSON.stringify(state.customWorkouts));
        
        saveData();
        renderStats();
        renderCustomWorkoutsList();
        
        // Cập nhật lại cloud nếu local mới hơn
        const isDifferent = JSON.stringify(cloudWorkouts) !== JSON.stringify(mergedWorkouts);
        if (isDifferent) {
            await supabaseClient.auth.updateUser({
                data: { custom_workouts: mergedWorkouts }
            });
        }
        
        updateSyncStatusUI('online');
    } catch (e) {
        console.error("Lỗi đồng bộ online:", e);
        updateSyncStatusUI('error');
    }
}

async function uploadNewLogOnline(logEntry) {
    if (!supabaseClient) return;
    
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;
        
        updateSyncStatusUI('syncing');
        
        const { error } = await supabaseClient
            .from('pc_flex_logs')
            .insert({
                user_id: user.id,
                timestamp: logEntry.timestamp,
                level: logEntry.level,
                squeeze: logEntry.config.squeeze,
                relax: logEntry.config.relax,
                reps: logEntry.config.reps,
                completed: logEntry.completed
            });
            
        if (error) throw error;
        console.log("Tự động lưu bài tập mới lên Supabase Cloud thành công.");
        
        updateSyncStatusUI('online');
        
        // Cập nhật lại giao diện lịch tuần
        renderWeeklyCalendar();
    } catch (e) {
        console.error("Lỗi lưu trực tuyến:", e);
        updateSyncStatusUI('error');
    }
}

function openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'flex';
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'none';
}

// --- SCREEN WAKE LOCK API & DUAL LOCK FALLBACK ---
let wakeLock = null;
let fallbackVideo = null;

async function requestWakeLock() {
    // 1. Cố gắng sử dụng Wake Lock API tiêu chuẩn trước
    if ('wakeLock' in navigator) {
        try {
            if (!wakeLock) {
                wakeLock = await navigator.wakeLock.request('screen');
                console.log('Screen Wake Lock activated.');
                
                wakeLock.addEventListener('release', () => {
                    console.log('Screen Wake Lock was released.');
                    wakeLock = null;
                    // Tự động yêu cầu lại nếu bài tập vẫn đang chạy và trang đang hiển thị
                    const activeStates = ['squeezing', 'relaxing'];
                    if (activeStates.includes(state.workoutState) && document.visibilityState === 'visible') {
                        setTimeout(requestWakeLock, 1000);
                    }
                });
            }
        } catch (err) {
            console.warn(`Failed to request Screen Wake Lock: ${err.message}`);
        }
    }
    
    // 2. Phát video MP4 trống base64 siêu nhỏ chạy lặp ẩn làm phương án dự phòng (fallback) để giữ màn hình
    try {
        if (!fallbackVideo) {
            fallbackVideo = document.createElement('video');
            fallbackVideo.setAttribute('playsinline', '');
            fallbackVideo.setAttribute('loop', '');
            fallbackVideo.setAttribute('muted', '');
            fallbackVideo.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAr9tZGF0AAACoAYF//+///AAAAMmF2Y0MBZAAK/+EAGWdkAAqs2V+WXAWyAAADAAIAAAMAYB4kSywBAAZo6+PLIsAAAAAYc3R0cwAAAAAAAAABAAAAAQAAAgAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAACtwAAAAEAAAAUc3RjbwAAAAAAAAABAAAAMAAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTQuNjMuMTA0';
            fallbackVideo.style.position = 'absolute';
            fallbackVideo.style.width = '1px';
            fallbackVideo.style.height = '1px';
            fallbackVideo.style.opacity = '0.01';
            fallbackVideo.style.pointerEvents = 'none';
            fallbackVideo.style.top = '0';
            fallbackVideo.style.left = '0';
            document.body.appendChild(fallbackVideo);
        }
        
        if (fallbackVideo.paused) {
            await fallbackVideo.play();
            console.log('Screen Wake Lock Fallback Video playing.');
        }
    } catch (err) {
        console.warn(`Failed to play Wake Lock Fallback Video: ${err.message}`);
    }
}

function releaseWakeLock() {
    if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
        console.log('Screen Wake Lock released manually.');
    }
    
    if (fallbackVideo) {
        try {
            fallbackVideo.pause();
            console.log('Screen Wake Lock Fallback Video paused.');
        } catch (err) {
            console.warn(`Failed to pause Fallback Video: ${err.message}`);
        }
    }
}

// Handle page visibility change to re-request Wake Lock if still training
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
        const activeStates = ['squeezing', 'relaxing', 'resting'];
        if (activeStates.includes(state.workoutState)) {
            await requestWakeLock();
        }
    }
});

// --- MOBILE GESTURE & TOUCH ZOOM PREVENTION ---
// Prevent pinch-to-zoom (multi-touch zoom)
document.addEventListener('touchstart', function (event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

// Prevent iOS gesture-based scaling
document.addEventListener('gesturestart', function (event) {
    event.preventDefault();
});

// --- START APP ON DOCUMENT LOAD ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    registerServiceWorker();
    bindPWAUpdateChecker();
});

// --- PWA SERVICE WORKER REGISTRATION & UPDATE HANDLER ---
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('Service Worker registered with scope:', reg.scope);
            
            // If there's already a worker waiting, show the update toast
            if (reg.waiting) {
                showPWAUpdateToast(reg.waiting);
            }
            
            // Listen for any new service worker installation
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showPWAUpdateToast(newWorker);
                        }
                    });
                }
            });
        }).catch(err => {
            console.warn('Service Worker registration failed:', err);
        });
        
        // Listen for controller changes to reload the page once skipWaiting completes
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                window.location.reload();
            }
        });
    }
}

function showPWAUpdateToast(worker) {
    const toast = document.getElementById('pwa-update-toast');
    const updateBtn = document.getElementById('btn-pwa-update');
    
    if (toast && updateBtn) {
        toast.classList.add('show');
        updateBtn.onclick = () => {
            worker.postMessage('SKIP_WAITING');
            toast.classList.remove('show');
        };
    }
}

function initProfileAndAI() {
    const birthYearInput = document.getElementById('profile-birth-year');
    const geminiKeyInput = document.getElementById('profile-gemini-key');
    
    if (birthYearInput) {
        birthYearInput.value = state.birthYear || '';
    }
    if (geminiKeyInput) {
        geminiKeyInput.value = state.geminiApiKey || '';
    }

    const btnSaveProfile = document.getElementById('btn-save-profile');
    if (btnSaveProfile) {
        btnSaveProfile.addEventListener('click', () => {
            // Save birth year
            const yearVal = birthYearInput ? birthYearInput.value.trim() : '';
            if (yearVal) {
                const yearInt = parseInt(yearVal);
                const currentYear = new Date().getFullYear();
                if (isNaN(yearInt) || yearInt < 1920 || yearInt > currentYear) {
                    alert('Vui lòng nhập năm sinh hợp lệ (ví dụ: 1995)!');
                    return;
                }
                state.birthYear = yearVal;
            } else {
                state.birthYear = null;
            }

            // Save Gemini API Key
            const keyVal = geminiKeyInput ? geminiKeyInput.value.trim() : '';
            state.geminiApiKey = keyVal || null;

            saveData();
            alert('Hồ sơ tập luyện đã được lưu trữ thành công!');
        });
    }

    // AI Analysis Event Listeners
    const btnAIAnalyze = document.getElementById('btn-ai-analyze');
    if (btnAIAnalyze) {
        btnAIAnalyze.addEventListener('click', () => {
            triggerAIAnalysis();
        });
    }

    const closeButtons = [
        document.getElementById('btn-close-ai-modal'),
        document.getElementById('btn-close-ai-modal-footer')
    ];
    closeButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                const modal = document.getElementById('ai-modal');
                if (modal) modal.style.display = 'none';
            });
        }
    });
}

let isQueryingAI = false;
async function triggerAIAnalysis() {
    if (isQueryingAI) return;
    
    const modal = document.getElementById('ai-modal');
    const contentContainer = document.getElementById('ai-analysis-content');
    
    if (!modal || !contentContainer) return;
    
    // Open Modal
    modal.style.display = 'flex';
    
    // Show Loading
    contentContainer.innerHTML = `
        <div class="ai-loading-container">
            <div class="ai-pulse-orb">🤖</div>
            <div style="color: var(--text-light); font-weight: 500; font-size: 0.95rem;">Đang kết nối với Trợ lý A.I...</div>
            <p style="color: var(--text-muted); font-size: 0.8rem; max-width: 340px; margin: 0; line-height: 1.5;">
                Trí tuệ nhân tạo đang tổng hợp chuỗi chặng co thắt cơ sàn chậu và phân tích sinh lý học lâm sàng của bạn.
            </p>
        </div>
    `;
    
    isQueryingAI = true;
    
    try {
        const apiKey = state.geminiApiKey;
        if (!apiKey) {
            contentContainer.innerHTML = `
                <div style="padding: 1.5rem; text-align: center; color: #ef4444;">
                    <div style="font-size: 2.5rem; margin-bottom: 1rem;">🔑</div>
                    <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.5rem; color: #f87171;">Chưa Có Gemini API Key</h4>
                    <p style="font-size: 0.825rem; color: var(--text-muted); line-height: 1.55;">Vui lòng điền mã khóa Gemini API Key của bạn ở khung "Hồ Sơ Tập Luyện" ở trên và nhấn "Lưu hồ sơ" trước khi chạy phân tích.</p>
                </div>
            `;
            isQueryingAI = false;
            return;
        }
        
        // Prepare variables for prompt
        const ageStr = state.birthYear ? `${new Date().getFullYear() - parseInt(state.birthYear)} tuổi` : "Không rõ";
        const genderStr = state.gender === 'female' ? 'Nữ giới' : 'Nam giới';
        
        // Format history summary
        let historyText = "";
        if (!state.history || state.history.length === 0) {
            historyText = "Không có lịch sử luyện tập nào được ghi nhận. Người dùng chưa tập luyện buổi nào.";
        } else {
            historyText = state.history.slice(-30).map(log => {
                const date = log.timestamp ? log.timestamp.split('T')[0] : 'Không rõ';
                
                let levelName = log.level;
                if (log.level === 'goodMorning') {
                    levelName = state.gender === 'female' ? 'Bình Minh Tươi Trẻ' : 'Chào Buổi Sáng';
                } else if (log.level === 'powerCombo') {
                    levelName = state.gender === 'female' ? 'Combo Sức Bền' : 'Combo Sức Mạnh';
                } else if (log.level === 'nightRecovery') {
                    levelName = state.gender === 'female' ? 'Phục Hồi Nhẹ Nhàng' : 'Phục Hồi Ban Đêm';
                } else if (log.level && log.level.startsWith('custom_')) {
                    levelName = 'Bài tập tự thiết kế';
                } else if (log.level === 'custom') {
                    levelName = 'Bài tập tùy chỉnh';
                }
                
                const config = log.config ? `(Siết: ${log.config.squeeze}s, Thả: ${log.config.relax}s, Lượt: ${log.config.reps})` : '';
                return `- Ngày ${date}: Tập bài "${levelName}" ${config}`;
            }).join('\n');
        }

        const systemPrompt = `Bạn là một Bác sĩ chuyên khoa đầu ngành về Nam khoa và Phụ khoa, đồng thời là chuyên gia vật lý trị liệu phục hồi chức năng cơ sàn chậu (cơ mu cụt - PC).
Nhiệm vụ của bạn là phân tích dữ liệu luyện tập của người dùng, đưa ra những nhận xét lâm sàng chuyên nghiệp, chính xác, mang tính động viên và hướng dẫn chuyên khoa hữu ích.

Thông tin người dùng:
- Giới tính sinh học: ${genderStr}
- Độ tuổi: ${ageStr}

Nhật ký 30 buổi tập gần nhất:
${historyText}

Hãy viết một báo cáo nhận định chi tiết bằng tiếng Việt, định dạng Markdown chuẩn với các phần cụ thể sau:
1. **📊 Phân tích Tiến Trình**: Nhận xét về tần suất, mức độ kiên trì và khối lượng bài tập tích lũy. Đánh giá xem cường độ tập đã hợp lý với nhóm tuổi và giới tính sinh học chưa.
2. **🩺 Nhận Định Sinh Lý Lâm Sàng**: Giải thích cơ chế sinh học: Việc tập luyện như hiện tại mang lại lợi ích cụ thể gì cho nhóm cơ sàn chậu của họ (Nam: Kiểm soát phản xạ xuất tinh, tăng áp lực thể hang cải thiện độ cứng, ngừa phì đại tuyến tiền liệt; Nữ: Củng cố cơ chậu nâng đỡ bàng quang, tử cung ngăn sa tạng, tăng đàn hồi âm đạo, kiểm soát són tiểu stress).
3. **💡 Khuyên Nghị Chuyên Khoa**: Đề xuất hướng đi tiếp theo (có nên nâng cấp cấp độ tập không, nên tăng thời gian siết hay tăng thời gian nghỉ chuyển, các lưu ý về tư thế và kết hợp nhịp thở cơ hoành khi luyện tập).

Hãy giữ giọng điệu bác sĩ ân cần, nghiêm túc, khoa học và giàu chuyên môn. Sử dụng các icon emoji thích hợp để văn bản trực quan.`;

        // Direct fetch call to Gemini 3.5 Flash API
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: systemPrompt
                            }
                        ]
                    }
                ]
            })
        });
        
        if (!response.ok) {
            throw new Error(`Gemini API returned status code: ${response.status}`);
        }
        
        const data = await response.json();
        const markdown = data.candidates?.[0]?.content?.parts?.[0]?.text || "Không thể phản hồi từ Gemini 3.5 Flash. Vui lòng kiểm tra API Key.";
        
        // Render Markdown to HTML and inject
        contentContainer.innerHTML = renderMarkdownToHTML(markdown);
        
    } catch(err) {
        console.error('Error calling Gemini direct API:', err);
        contentContainer.innerHTML = `
            <div style="padding: 1.5rem; text-align: center; color: #ef4444;">
                <div style="font-size: 2.5rem; margin-bottom: 1rem;">❌</div>
                <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.5rem; color: #f87171;">Lỗi Kết Nối Phân Tích</h4>
                <p style="font-size: 0.825rem; color: var(--text-muted); line-height: 1.55;">
                    Có lỗi xảy ra khi truyền tải dữ liệu hoặc gọi Gemini 3.5 Flash: ${err.message}.<br>
                    Vui lòng đảm bảo thiết bị đã kết nối Internet và API Key của bạn hợp lệ.
                </p>
            </div>
        `;
    } finally {
        isQueryingAI = false;
    }
}

function renderMarkdownToHTML(markdown) {
    if (!markdown) return '';
    let html = markdown;
    
    // Replace Headers ###
    html = html.replace(/^### (.*?)$/gm, '<h4 style="color: var(--color-primary); font-size: 1rem; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.5rem;">$1</h4>');
    // Replace Headers ##
    html = html.replace(/^## (.*?)$/gm, '<h3 style="color: var(--color-primary); font-size: 1.1rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 4px;">$1</h3>');
    // Replace Bold Text **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--text-light); font-weight: 700;">$1</strong>');
    // Replace Bullets (- or *)
    html = html.replace(/^\- (.*?)$/gm, '<li style="margin-left: 1.25rem; margin-bottom: 0.4rem; list-style-type: disc;">$1</li>');
    html = html.replace(/^\* (.*?)$/gm, '<li style="margin-left: 1.25rem; margin-bottom: 0.4rem; list-style-type: disc;">$1</li>');
    
    // Wrap lists <li> in <ul>
    const lines = html.split('\n');
    let inList = false;
    const processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('<li')) {
            if (!inList) {
                processedLines.push('<ul style="margin-bottom: 0.85rem; margin-top: 0.25rem;">');
                inList = true;
            }
            processedLines.push(lines[i]);
        } else {
            if (inList) {
                processedLines.push('</ul>');
                inList = false;
            }
            if (line && !line.startsWith('<h')) {
                processedLines.push(`<p style="margin-bottom: 0.85rem;">${lines[i]}</p>`);
            } else {
                processedLines.push(lines[i]);
            }
        }
    }
    if (inList) {
        processedLines.push('</ul>');
    }
    
    return processedLines.join('\n');
}



function bindPWAUpdateChecker() {
    const btnChecks = document.querySelectorAll('.version-update-container');
    btnChecks.forEach(btnCheck => {
        btnCheck.addEventListener('click', () => {
            if (btnCheck.classList.contains('checking')) return;
            
            btnChecks.forEach(b => {
                b.classList.add('checking');
                b.innerHTML = `
                    <svg class="icon-refresh" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px; animation: spin 1s linear infinite;">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                    </svg>Đang kiểm tra...
                `;
            });
            
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(reg => {
                    let updateFound = false;
                    const onUpdateFound = () => { updateFound = true; };
                    reg.addEventListener('updatefound', onUpdateFound);
                    
                    reg.update().then(() => {
                        setTimeout(() => {
                            reg.removeEventListener('updatefound', onUpdateFound);
                            btnChecks.forEach(b => b.classList.remove('checking'));
                            
                            if (updateFound || reg.waiting || reg.installing) {
                                btnChecks.forEach(b => {
                                    b.innerHTML = `
                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                            <polyline points="22 4 12 14.01 9 11.01"/>
                                        </svg>Có bản mới!
                                    `;
                                });
                                if (reg.waiting) showPWAUpdateToast(reg.waiting);
                            } else {
                                btnChecks.forEach(b => {
                                    b.innerHTML = `
                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                            <polyline points="22 4 12 14.01 9 11.01"/>
                                        </svg>Bản mới nhất
                                    `;
                                });
                            }
                            
                            setTimeout(() => {
                                btnChecks.forEach(b => {
                                    b.innerHTML = `VER v1.1.48 PRO`;
                                });
                            }, 2500);
                        }, 1200);
                    }).catch(err => {
                        console.warn('Lỗi kiểm tra cập nhật:', err);
                        btnChecks.forEach(b => {
                            b.classList.remove('checking');
                            b.innerHTML = `VER v1.1.48 PRO`;
                        });
                    });
                }).catch(err => {
                    console.warn('Service worker không sẵn sàng:', err);
                    btnChecks.forEach(b => {
                        b.classList.remove('checking');
                        b.innerHTML = `VER v1.1.48 PRO`;
                    });
                });
            } else {
                setTimeout(() => {
                    btnChecks.forEach(b => {
                        b.classList.remove('checking');
                        b.innerHTML = `Không hỗ trợ PWA`;
                        setTimeout(() => { b.innerHTML = `VER v1.1.48 PRO`; }, 2500);
                    });
                }, 1000);
            }
        });
    });
}
