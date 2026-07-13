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
    
    // Custom workout builder state
    customWorkouts: [],
    tempStages: [],
    editingWorkoutId: null,
    workoutSteps: [],
    workoutPhases: [],
    currentStepIndex: 0
};

// --- WORKOUT CONFIGURATIONS ---
const levelConfigs = {
    goodMorning: { squeeze: 1, relax: 2, reps: 25 },
    powerCombo: { squeeze: 1, relax: 1, reps: 59 },
    nightRecovery: { squeeze: 0, relax: 5, reps: 30 },
    beginner: { squeeze: 3, relax: 3, reps: 10 },
    intermediate: { squeeze: 5, relax: 5, reps: 12 },
    advanced: { squeeze: 10, relax: 10, reps: 10 },
    fastFlicks: { squeeze: 1, relax: 1, reps: 20 },
    ladder: { squeeze: 9, relax: 8, reps: 8 },
    mixed: { squeeze: 8, relax: 8, reps: 11 },
    pyramidMixed: { squeeze: 3, relax: 3, reps: 10 },
    reflexMixed: { squeeze: 10, relax: 5, reps: 12 }
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
    const isFemale = state.gender === 'female';
    if (level === 'goodMorning') {
        return 20; // Nam: 20 siết nhanh. Nữ: 20 siết nhanh
    }
    if (level === 'powerCombo') {
        return isFemale ? 30 : 54; // Nam: 54 siết cơ. Nữ: 30 siết cơ (15 siết nhanh + 15 siết 3s)
    }
    if (level === 'nightRecovery') {
        return isFemale ? 0 : 15; // Nam: 15 siết nhanh. Nữ: 0 siết cơ
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
    btnSaveSupabaseConfig: document.getElementById('btn-save-supabase-config'),
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
    
    // Cập nhật trạng thái active cho nút giới tính
    const btnMale = document.getElementById('btn-gender-male');
    const btnFemale = document.getElementById('btn-gender-female');
    if (btnMale && btnFemale) {
        if (gender === 'male') {
            btnMale.classList.add('active');
            btnFemale.classList.remove('active');
        } else {
            btnMale.classList.remove('active');
            btnFemale.classList.add('active');
        }
    }
    
    // Cập nhật tên và mô tả bài tập trên giao diện
    updateWorkoutLevelsUI();
    
    // Tự động chọn lại bài tập mặc định theo khung giờ & giới tính
    autoSelectLevelByTime();
    
    // Cập nhật UI cấu hình
    updateUIConfigs();
}

function updateWorkoutLevelsUI() {
    const isFemale = state.gender === 'female';
    
    // 1. Chào Buổi Sáng / Bình Minh Tươi Trẻ
    const morningItem = document.querySelector('.level-item[data-level="goodMorning"]');
    if (morningItem) {
        const nameEl = morningItem.querySelector('.level-name');
        const metaEl = morningItem.querySelector('.level-meta');
        const iconEl = morningItem.querySelector('.level-icon');
        if (nameEl && metaEl) {
            if (isFemale) {
                nameEl.textContent = "Bình Minh Tươi Trẻ";
                nameEl.style.color = "#ec4899";
                metaEl.textContent = "20 lượt siết nhanh 1s - thả 2s | 5 lượt Kegel ngược giãn chậu";
                if (iconEl) {
                    iconEl.style.background = "rgba(236, 72, 153, 0.15)";
                    iconEl.style.color = "#ec4899";
                    iconEl.style.borderColor = "rgba(236, 72, 153, 0.35)";
                }
            } else {
                nameEl.textContent = "Chào Buổi Sáng";
                nameEl.style.color = "#f59e0b";
                metaEl.textContent = "20 lượt siết 1s - thả 2s | 5 lượt Kegel ngược giãn chậu";
                if (iconEl) {
                    iconEl.style.background = "rgba(245, 158, 11, 0.15)";
                    iconEl.style.color = "#f59e0b";
                    iconEl.style.borderColor = "rgba(245, 158, 11, 0.35)";
                }
            }
        }
    }
    
    // 2. Combo Sức Mạnh / Combo Sức Bền
    const powerItem = document.querySelector('.level-item[data-level="powerCombo"]');
    if (powerItem) {
        const nameEl = powerItem.querySelector('.level-name');
        const metaEl = powerItem.querySelector('.level-meta');
        const iconEl = powerItem.querySelector('.level-icon');
        if (nameEl && metaEl) {
            if (isFemale) {
                nameEl.textContent = "Combo Sức Bền";
                nameEl.style.color = "#a855f7"; // Tím hồng
                metaEl.textContent = "15 lượt siết nhanh 1s | 15 lượt siết giữ 3s | 10 lượt Kegel ngược";
                if (iconEl) {
                    iconEl.style.background = "rgba(168, 85, 247, 0.15)";
                    iconEl.style.color = "#a855f7";
                    iconEl.style.borderColor = "rgba(168, 85, 247, 0.35)";
                }
            } else {
                nameEl.textContent = "Combo Sức Mạnh";
                nameEl.style.color = "var(--color-primary)";
                metaEl.textContent = "Siết nhanh 20 lượt 1s | Giữ 24 lượt 3s | Giữ 10 lượt 5s + Nghỉ phục hồi & Cooldown Kegel ngược";
                if (iconEl) {
                    iconEl.style.background = "";
                    iconEl.style.color = "";
                    iconEl.style.borderColor = "";
                }
            }
        }
    }
    
    // 3. Phục Hồi Ban Đêm / Phục Hồi Nhẹ Nhàng
    const nightItem = document.querySelector('.level-item[data-level="nightRecovery"]');
    if (nightItem) {
        const nameEl = nightItem.querySelector('.level-name');
        const metaEl = nightItem.querySelector('.level-meta');
        if (nameEl && metaEl) {
            if (isFemale) {
                nameEl.textContent = "Phục Hồi Nhẹ Nhàng";
                metaEl.textContent = "15 lượt Kegel ngược giãn sàn chậu | 10 lượt thở bụng phục hồi sâu";
            } else {
                nameEl.textContent = "Phục Hồi Ban Đêm";
                metaEl.textContent = "15 lượt siết nhanh + nghỉ 5s | 10 lượt Kegel ngược | 5 lượt hít thở phục hồi";
            }
        }
    }
    
    // 4. Cấp độ 1: Sơ cấp (Nhận diện cơ)
    const beginnerItem = document.querySelector('.level-item[data-level="beginner"]');
    if (beginnerItem) {
        const nameEl = beginnerItem.querySelector('.level-name');
        const metaEl = beginnerItem.querySelector('.level-meta');
        if (nameEl && metaEl) {
            if (isFemale) {
                nameEl.textContent = "Cấp độ 1: Nhận Diện Cơ (Sơ Cấp)";
                metaEl.textContent = "Siết nhẹ 3s | Thả lỏng 4s | 10 lượt (Xác định & cô lập cơ sàn chậu)";
            } else {
                nameEl.textContent = "Cấp độ 1: Nhận Diện Lực (Sơ cấp)";
                metaEl.textContent = "Siết: 3s | Thả: 3s | 10 Lượt (Tổng: 1 phút)";
            }
        }
    }

    // 5. Cấp độ 2: Trung cấp (Phối hợp & Sức bền)
    const intermediateItem = document.querySelector('.level-item[data-level="intermediate"]');
    if (intermediateItem) {
        const nameEl = intermediateItem.querySelector('.level-name');
        const metaEl = intermediateItem.querySelector('.level-meta');
        if (nameEl && metaEl) {
            if (isFemale) {
                nameEl.textContent = "Cấp độ 2: Phối Hợp Lực (Trung Cấp)";
                metaEl.textContent = "Siết giữ 5s | Thả lỏng 6s | 12 lượt (Duy trì lực giữ ổn định)";
            } else {
                nameEl.textContent = "Cấp độ 2: Phối Hợp Lực Bền (Trung cấp)";
                metaEl.textContent = "Siết: 5s | Thả: 5s | 12 Lượt (Tổng: 2 phút)";
            }
        }
    }

    // 6. Cấp độ 3: Cao cấp (Sức bền tối đa)
    const advancedItem = document.querySelector('.level-item[data-level="advanced"]');
    if (advancedItem) {
        const nameEl = advancedItem.querySelector('.level-name');
        const metaEl = advancedItem.querySelector('.level-meta');
        if (nameEl && metaEl) {
            if (isFemale) {
                nameEl.textContent = "Cấp độ 3: Sức Bền Tối Đa (Cao Cấp)";
                metaEl.textContent = "Siết sâu 10s | Thả lỏng 10s | 10 lượt (Nâng cao trương lực sàn chậu)";
            } else {
                nameEl.textContent = "Cấp độ 3: Sức Mạnh (Nâng cao)";
                metaEl.textContent = "Siết: 10s | Thả: 10s | 10 Lượt (Tổng: 3 phút 20 giây)";
            }
        }
    }
}

function initApp() {
    loadData();
    
    // Khởi tạo class giới tính cho body
    document.body.classList.add('gender-' + state.gender);
    updateWorkoutLevelsUI();
    
    renderCustomWorkoutsList();
    autoSelectLevelByTime();
    setupEventHandlers();
    updateUIConfigs();
    renderStats();
    initSupabaseConnection();
    
    // Đảm bảo nút giới tính hiển thị đúng active state ban đầu
    const btnMale = document.getElementById('btn-gender-male');
    const btnFemale = document.getElementById('btn-gender-female');
    if (btnMale && btnFemale) {
        if (state.gender === 'male') {
            btnMale.classList.add('active');
            btnFemale.classList.remove('active');
        } else {
            btnMale.classList.remove('active');
            btnFemale.classList.add('active');
        }
    }
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

    // 3. Level selection
    elements.levelItems.forEach(item => {
        item.addEventListener('click', () => {
            const activeStates = ['squeezing', 'relaxing'];
            const isMidWorkout = activeStates.includes(state.workoutState) || state.workoutState.startsWith('paused_');
            if (isMidWorkout) return; // Prevent change mid-workout
            
            if (state.workoutState !== 'idle') {
                resetWorkout();
            }
            
            elements.levelItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            state.selectedLevel = item.getAttribute('data-level');
            
            updateUIConfigs();
        });
    });

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
            elements.levelItems.forEach(item => {
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

        // Chuyển đổi tab cấu hình/đăng nhập trong modal
        const authTabBtn = e.target.closest('.auth-tab-btn');
        if (authTabBtn) {
            const targetTab = authTabBtn.getAttribute('data-auth-tab');
            const siblingTabBtns = document.querySelectorAll('.auth-tab-btn');
            siblingTabBtns.forEach(b => b.classList.remove('active'));
            authTabBtn.classList.add('active');
            
            document.querySelectorAll('.auth-tab-content').forEach(content => {
                if (content.id === `auth-tab-${targetTab}`) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
            return;
        }

        // Lưu cấu hình Supabase
        const saveConfigBtn = e.target.closest('#btn-save-supabase-config');
        if (saveConfigBtn) {
            const url = document.getElementById('input-supabase-url').value.trim();
            const key = document.getElementById('input-supabase-key').value.trim();
            
            if (!url || !key) {
                alert("Vui lòng điền đầy đủ cả URL và Anon API Key.");
                return;
            }
            
            localStorage.setItem('supabase_url', url);
            localStorage.setItem('supabase_key', key);
            
            if (initSupabaseConnection()) {
                alert("Cấu hình Supabase thành công! Giờ bạn có thể đăng nhập hoặc đăng ký tài khoản.");
                const loginTabBtn = document.querySelector('.auth-tab-btn[data-auth-tab="login"]');
                if (loginTabBtn) loginTabBtn.click();
            } else {
                alert("Lưu thất bại. Vui lòng kiểm tra lại tính chính xác của URL và Key.");
            }
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
        const config = levelConfigs[state.selectedLevel];
        if (config) {
            const isFemale = state.gender === 'female';
            if (isFemale && state.selectedLevel === 'beginner') {
                state.squeezeDuration = 3;
                state.relaxDuration = 4; // 4s relax for females
                state.totalReps = 10;
            } else if (isFemale && state.selectedLevel === 'intermediate') {
                state.squeezeDuration = 5;
                state.relaxDuration = 6; // 6s relax for females
                state.totalReps = 12;
            } else {
                state.squeezeDuration = config.squeeze;
                state.relaxDuration = config.relax;
                state.totalReps = config.reps;
            }
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
        elements.orbSubText.textContent = state.gender === 'female' ? 'Bấm Bắt đầu để tập Combo Sức Bền - 40 lượt' : 'Bấm Bắt đầu để tập Combo Sức Mạng - 59 lượt';
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
            let repIndex = 1;
            phases = workout.stages.map((stage, sIdx) => {
                const repsCount = parseInt(stage.reps || 1);
                const start = repIndex;
                const end = repIndex + repsCount - 1;
                repIndex = end + 1;
                
                let phaseName = `Giai đoạn ${sIdx + 1}`;
                if (stage.type === 'reverse') {
                    phaseName = `Kegel ngược ${sIdx + 1}`;
                }
                
                for (let r = 1; r <= repsCount; r++) {
                    const currentRep = start + r - 1;
                    const stageType = stage.type || 'normal';
                    
                    if (stageType === 'normal') {
                        steps.push({
                            type: 'squeezing',
                            duration: Math.max(1, parseInt(stage.squeeze || 5)),
                            action: 'SIẾT CƠ',
                            subtext: `Siết chặt cơ PC - Lượt ${r}/${repsCount} (${phaseName})`,
                            sfx: 'squeeze',
                            orbClass: 'squeezing',
                            repIndex: currentRep
                        });
                        
                        if (r === repsCount && sIdx < workout.stages.length - 1 && parseInt(stage.transitionRest || 0) > 0) {
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
                        
                        if (r === repsCount && sIdx < workout.stages.length - 1 && parseInt(stage.transitionRest || 0) > 0) {
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
                    }
                }
                
                return { name: phaseName, start, end };
            });
            
            totalReps = repIndex - 1;
            return { steps, phases, totalReps };
        }
    }

    // Mặc định cho các cấp độ sẵn có
    if (level === 'goodMorning') {
        totalReps = 25;
        phases = [
            { name: 'Siết 1s', start: 1, end: 20 },
            { name: 'Kegel ngược', start: 21, end: 25 }
        ];
        
        for (let r = 1; r <= 20; r++) {
            steps.push({
                type: 'squeezing',
                duration: 1,
                action: 'SIẾT CƠ',
                subtext: `Co thắt cơ PC chặt nhất có thể - Lượt ${r}/20`,
                sfx: 'squeeze',
                orbClass: 'squeezing',
                repIndex: r
            });
            if (r === 20) {
                steps.push({
                    type: 'relaxing',
                    duration: 10,
                    action: 'CHUẨN BỊ',
                    subtext: 'Nghỉ phục hồi 10s - Chuẩn bị tập Kegel ngược',
                    sfx: 'relax',
                    orbClass: 'resting',
                    repIndex: r
                });
            } else {
                steps.push({
                    type: 'relaxing',
                    duration: 2,
                    action: 'THẢ LỎNG',
                    subtext: `Thả lỏng 2 giây - Lượt ${r}/19`,
                    sfx: 'relax',
                    orbClass: 'relaxing',
                    repIndex: r
                });
            }
        }
        for (let r = 21; r <= 25; r++) {
            steps.push({
                type: 'squeezing',
                duration: 5,
                action: 'KEGEL NGƯỢC',
                subtext: `Hít vào - Đẩy nhẹ cơ PC ra ngoài - Lượt ${r - 20}/5`,
                sfx: 'squeeze',
                orbClass: 'resting',
                repIndex: r
            });
            steps.push({
                type: 'relaxing',
                duration: 5,
                action: 'NGHỈ',
                subtext: `Thở ra - Thả lỏng cơ PC tự nhiên - Lượt ${r - 20}/5`,
                sfx: 'relax',
                orbClass: 'relaxing',
                repIndex: r
            });
        }
    } else if (level === 'powerCombo') {
        totalReps = 59;
        phases = [
            { name: 'Siết 1s', start: 1, end: 20 },
            { name: 'Siết 3s', start: 21, end: 32 },
            { name: 'Siết 3s', start: 33, end: 44 },
            { name: 'Siết 5s', start: 45, end: 54 },
            { name: 'Kegel ngược', start: 55, end: 59 }
        ];
        for (let r = 1; r <= 20; r++) {
            steps.push({
                type: 'squeezing',
                duration: 1,
                action: 'SIẾT CƠ',
                subtext: `Siết cơ PC chặt nhất có thể - Lượt ${r}/20`,
                sfx: 'squeeze',
                orbClass: 'squeezing',
                repIndex: r
            });
            if (r === 20) {
                steps.push({
                    type: 'relaxing',
                    duration: 30,
                    action: 'NGHỈ NGƠI',
                    subtext: 'Nghỉ phục hồi 30s - Chuẩn bị Pha 2',
                    sfx: 'relax',
                    orbClass: 'resting',
                    repIndex: r
                });
            } else {
                steps.push({
                    type: 'relaxing',
                    duration: 1,
                    action: 'THẢ LỎNG',
                    subtext: `Thả lỏng cơ PC hoàn toàn - Lượt ${r}/19`,
                    sfx: 'relax',
                    orbClass: 'relaxing',
                    repIndex: r
                });
            }
        }
        for (let r = 21; r <= 32; r++) {
            steps.push({
                type: 'squeezing',
                duration: 3,
                action: 'SIẾT CƠ',
                subtext: `Pha 2: Siết giữ 3 giây - Lượt ${r - 20}/12`,
                sfx: 'squeeze',
                orbClass: 'squeezing',
                repIndex: r
            });
            if (r === 32) {
                steps.push({
                    type: 'relaxing',
                    duration: 30,
                    action: 'NGHỈ NGƠI',
                    subtext: 'Nghỉ phục hồi 30s - Chuẩn bị Pha 3',
                    sfx: 'relax',
                    orbClass: 'resting',
                    repIndex: r
                });
            } else {
                steps.push({
                    type: 'relaxing',
                    duration: 3,
                    action: 'THẢ LỎNG',
                    subtext: `Thả lỏng 3 giây - Lượt ${r - 20}/11`,
                    sfx: 'relax',
                    orbClass: 'relaxing',
                    repIndex: r
                });
            }
        }
        for (let r = 33; r <= 44; r++) {
            steps.push({
                type: 'squeezing',
                duration: 3,
                action: 'SIẾT CƠ',
                subtext: `Pha 3: Siết giữ 3 giây - Lượt ${r - 32}/12`,
                sfx: 'squeeze',
                orbClass: 'squeezing',
                repIndex: r
            });
            if (r === 44) {
                steps.push({
                    type: 'relaxing',
                    duration: 60,
                    action: 'NGHỈ NGƠI',
                    subtext: 'Nghỉ phục hồi 1 phút - Chuẩn bị Pha 4',
                    sfx: 'relax',
                    orbClass: 'resting',
                    repIndex: r
                });
            } else {
                steps.push({
                    type: 'relaxing',
                    duration: 3,
                    action: 'THẢ LỎNG',
                    subtext: `Thả lỏng 3 giây - Lượt ${r - 32}/11`,
                    sfx: 'relax',
                    orbClass: 'relaxing',
                    repIndex: r
                });
            }
        }
        for (let r = 45; r <= 54; r++) {
            steps.push({
                type: 'squeezing',
                duration: 5,
                action: 'SIẾT CƠ',
                subtext: `Pha 4: Cực hạn - Siết giữ 5 giây - Lượt ${r - 44}/10`,
                sfx: 'squeeze',
                orbClass: 'squeezing',
                repIndex: r
            });
            if (r === 54) {
                steps.push({
                    type: 'relaxing',
                    duration: 10,
                    action: 'CHUẨN BỊ',
                    subtext: 'Nghỉ phục hồi 10s - Chuẩn bị tập Kegel ngược',
                    sfx: 'relax',
                    orbClass: 'resting',
                    repIndex: r
                });
            } else {
                steps.push({
                    type: 'relaxing',
                    duration: 5,
                    action: 'THẢ LỎNG',
                    subtext: `Thả lỏng hoàn toàn 5 giây - Lượt ${r - 44}/9`,
                    sfx: 'relax',
                    orbClass: 'relaxing',
                    repIndex: r
                });
            }
        }
        for (let r = 55; r <= 59; r++) {
            steps.push({
                type: 'squeezing',
                duration: 5,
                action: 'KEGEL NGƯỢC',
                subtext: `Hít vào - Đẩy nhẹ cơ PC ra ngoài - Lượt ${r - 54}/5`,
                sfx: 'squeeze',
                orbClass: 'resting',
                repIndex: r
            });
            steps.push({
                type: 'relaxing',
                duration: 5,
                action: 'NGHỈ',
                subtext: `Thở ra - Thả lỏng cơ PC tự nhiên - Lượt ${r - 54}/5`,
                sfx: 'relax',
                orbClass: 'relaxing',
                repIndex: r
            });
        }
    } else if (level === 'nightRecovery') {
        totalReps = 30;
        phases = [
            { name: 'Siết 1s', start: 1, end: 15 },
            { name: 'Kegel ngược', start: 16, end: 25 },
            { name: 'Thở bụng', start: 26, end: 30 }
        ];
        for (let r = 1; r <= 15; r++) {
            steps.push({
                type: 'squeezing',
                duration: 1,
                action: 'SIẾT CƠ',
                subtext: `Pha 1: Siết nhanh - Hít thở tự nhiên - Lượt ${r}/15`,
                sfx: 'squeeze',
                orbClass: 'squeezing',
                repIndex: r
            });
            if (r === 15) {
                steps.push({
                    type: 'relaxing',
                    duration: 5,
                    action: 'CHUẨN BỊ',
                    subtext: 'Nghỉ phục hồi 5s - Chuẩn bị tập Kegel ngược',
                    sfx: 'relax',
                    orbClass: 'resting',
                    repIndex: r
                });
            } else {
                steps.push({
                    type: 'relaxing',
                    duration: 1,
                    action: 'THẢ LỎNG',
                    subtext: `Thả lỏng cơ sàn chậu hoàn toàn - Lượt ${r}/14`,
                    sfx: 'relax',
                    orbClass: 'relaxing',
                    repIndex: r
                });
            }
        }
        for (let r = 16; r <= 25; r++) {
            steps.push({
                type: 'squeezing',
                duration: 5,
                action: 'KEGEL NGƯỢC',
                subtext: `Hít vào - Đẩy nhẹ cơ PC ra ngoài - Lượt ${r - 15}/10`,
                sfx: 'squeeze',
                orbClass: 'resting',
                repIndex: r
            });
            steps.push({
                type: 'relaxing',
                duration: 5,
                action: 'NGHỈ',
                subtext: `Thở ra - Thả lỏng cơ PC tự nhiên - Lượt ${r - 15}/10`,
                sfx: 'relax',
                orbClass: 'relaxing',
                repIndex: r
            });
        }
        for (let r = 26; r <= 30; r++) {
            steps.push({
                type: 'squeezing',
                duration: 5,
                action: 'HÍT VÀO',
                subtext: `Pha 3: Hít sâu chậm rãi bằng bụng - Lượt ${r - 25}/5`,
                sfx: 'squeeze',
                orbClass: 'relaxing',
                repIndex: r
            });
            steps.push({
                type: 'relaxing',
                duration: 10,
                action: 'THỞ RA',
                subtext: `Thở ra chậm rãi, xẹp bụng - Lượt ${r - 25}/5`,
                sfx: 'relax',
                orbClass: 'relaxing',
                repIndex: r
            });
        }
    } else {
        const config = levelConfigs[level] || { squeeze: 5, relax: 5, reps: 10 };
        totalReps = config.reps;
        phases = [
            { name: 'Luyện tập', start: 1, end: totalReps }
        ];
        
        for (let r = 1; r <= totalReps; r++) {
            let squeezeText = 'Co thắt cơ PC chặt nhất có thể';
            let relaxText = 'Thả lỏng cơ sàn chậu hoàn toàn';
            let squeezeDur = config.squeeze;
            let relaxDur = config.relax;
            
            if (level === 'ladder') {
                squeezeText = 'Siết nhẹ 30% lực';
            } else if (level === 'mixed') {
                if ((r >= 1 && r <= 3) || (r >= 9 && r <= 11)) {
                    squeezeDur = 8;
                    relaxDur = 8;
                    squeezeText = 'Nhịp chậm: Siết sâu & giữ';
                } else {
                    squeezeDur = 1;
                    relaxDur = 1;
                    squeezeText = 'Nhịp nhanh: Nhấp nhanh cơ PC';
                    relaxText = 'Thả nhanh';
                }
            } else if (level === 'pyramidMixed') {
                const squeezeMap = { 1: 3, 2: 1, 3: 6, 4: 1, 5: 9, 6: 1, 7: 12, 8: 1, 9: 6, 10: 3 };
                const relaxMap = { 1: 3, 2: 1, 3: 6, 4: 1, 5: 9, 6: 1, 7: 10, 8: 1, 9: 6, 10: 3 };
                squeezeDur = squeezeMap[r] || 3;
                relaxDur = relaxMap[r] || 3;
                
                if (squeezeDur === 12) {
                    squeezeText = 'Đỉnh tháp: Siết tối đa 12 giây!';
                } else if (squeezeDur === 1) {
                    squeezeText = 'Nhịp nhanh: Co thắt nhanh 1s';
                    relaxText = 'Thả nhanh';
                } else {
                    squeezeText = `Kim tự tháp: Siết sâu ${squeezeDur}s`;
                }
            } else if (level === 'reflexMixed') {
                if (r <= 4) {
                    squeezeDur = 10;
                    relaxDur = 5;
                    squeezeText = 'Sức bền: Giữ co thắt 10 giây';
                } else if (r <= 8) {
                    squeezeDur = 1;
                    relaxDur = 1;
                    squeezeText = 'Phản xạ: Nhấp nhanh liên tục 1s';
                    relaxText = 'Thả nhanh';
                } else {
                    squeezeDur = 5;
                    relaxDur = 3;
                    squeezeText = 'Phục hồi: Giữ trung bình 5 giây';
                }
            }

            steps.push({
                type: 'squeezing',
                duration: squeezeDur,
                action: 'SIẾT CƠ',
                subtext: `${squeezeText} - Lượt ${r}/${totalReps}`,
                sfx: 'squeeze',
                orbClass: 'squeezing',
                repIndex: r
            });
            steps.push({
                type: 'relaxing',
                duration: relaxDur,
                action: 'THẢ LỎNG',
                subtext: `${relaxText} - Lượt ${r}/${totalReps}`,
                sfx: 'relax',
                orbClass: 'relaxing',
                repIndex: r
            });
        }
    }

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
    
    elements.levelItems.forEach(item => item.style.pointerEvents = 'none');
    
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
    
    elements.levelItems.forEach(item => item.style.pointerEvents = 'auto');
    
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

function getWorkoutPhases(level, totalReps) {
    const isFemale = state.gender === 'female';
    if (level === 'goodMorning') {
        return isFemale ? [
            { name: 'Siết nhanh 1s', start: 1, end: 20 },
            { name: 'Kegel ngược', start: 21, end: 25 }
        ] : [
            { name: 'Siết 1s', start: 1, end: 20 },
            { name: 'Kegel ngược', start: 21, end: 25 }
        ];
    }
    if (level === 'powerCombo') {
        return isFemale ? [
            { name: 'Siết nhanh 1s', start: 1, end: 15 },
            { name: 'Sức bền 3s', start: 16, end: 30 },
            { name: 'Kegel ngược', start: 31, end: 40 }
        ] : [
            { name: 'Siết 1s', start: 1, end: 20 },
            { name: 'Siết 3s', start: 21, end: 32 },
            { name: 'Siết 3s', start: 33, end: 44 },
            { name: 'Siết 5s', start: 45, end: 54 },
            { name: 'Kegel ngược', start: 55, end: 59 }
        ];
    }
    if (level === 'nightRecovery') {
        return isFemale ? [
            { name: 'Kegel ngược 4s', start: 1, end: 15 },
            { name: 'Thở bụng sâu', start: 16, end: 25 }
        ] : [
            { name: 'Siết 1s', start: 1, end: 15 },
            { name: 'Kegel ngược', start: 16, end: 25 },
            { name: 'Thở bụng', start: 26, end: 30 }
        ];
    }
    // For other levels, return a single phase representing the whole workout
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
}

function loadData() {
    try {
        state.history = JSON.parse(localStorage.getItem('pc_flex_history')) || [];
        state.streak = parseInt(localStorage.getItem('pc_flex_streak')) || 0;
        state.totalSessions = parseInt(localStorage.getItem('pc_flex_total_sessions')) || 0;
        state.customWorkouts = JSON.parse(localStorage.getItem('pc_flex_custom_workouts')) || [];
        state.gender = localStorage.getItem('pc_flex_gender') || 'male';
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
        'badge-level-8': state.history.some(log => log.level === 'reflexMixed')
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

function bindPWAUpdateChecker() {
    const btnCheck = document.getElementById('btn-check-update');
    if (!btnCheck) return;
    
    btnCheck.addEventListener('click', () => {
        if (btnCheck.classList.contains('checking')) return;
        
        btnCheck.classList.add('checking');
        const originalContent = btnCheck.innerHTML;
        
        // Cập nhật giao diện nút đang kiểm tra
        btnCheck.innerHTML = `
            <svg class="icon-refresh" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px; animation: spin 1s linear infinite;">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>Đang kiểm tra...
        `;
        
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
                // Đăng ký một biến theo dõi xem có phát hiện updatefound không
                let updateFound = false;
                
                const onUpdateFound = () => {
                    updateFound = true;
                };
                
                reg.addEventListener('updatefound', onUpdateFound);
                
                // Thực hiện kiểm tra cập nhật từ server
                reg.update().then(() => {
                    setTimeout(() => {
                        reg.removeEventListener('updatefound', onUpdateFound);
                        btnCheck.classList.remove('checking');
                        
                        if (updateFound || reg.waiting || reg.installing) {
                            btnCheck.innerHTML = `
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                    <polyline points="22 4 12 14.01 9 11.01"/>
                                </svg>Có bản mới!
                            `;
                            // Show update toast if it didn't trigger automatically
                            if (reg.waiting) showPWAUpdateToast(reg.waiting);
                            if (reg.installing) {
                                reg.installing.addEventListener('statechange', () => {
                                    if (reg.installing.state === 'installed') {
                                        showPWAUpdateToast(reg.installing);
                                    }
                                });
                            }
                        } else {
                            btnCheck.innerHTML = `
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                    <polyline points="22 4 12 14.01 9 11.01"/>
                                </svg>Bản mới nhất
                            `;
                        }
                        
                        // Khôi phục nút sau 2.5 giây
                        setTimeout(() => {
                            btnCheck.innerHTML = originalContent;
                        }, 2500);
                        
                    }, 1200); // Tạo độ trễ mượt mà để hiển thị hiệu ứng xoay icon
                }).catch(err => {
                    console.warn('Lỗi kiểm tra cập nhật:', err);
                    btnCheck.classList.remove('checking');
                    btnCheck.innerHTML = originalContent;
                });
            }).catch(err => {
                console.warn('Service worker không sẵn sàng:', err);
                btnCheck.classList.remove('checking');
                btnCheck.innerHTML = originalContent;
            });
        } else {
            setTimeout(() => {
                btnCheck.classList.remove('checking');
                btnCheck.innerHTML = `Không hỗ trợ PWA`;
                setTimeout(() => { btnCheck.innerHTML = originalContent; }, 2500);
            }, 1000);
        }
    });
}
