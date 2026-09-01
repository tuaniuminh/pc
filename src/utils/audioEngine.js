/**
 * PC Flex - High Performance Web Audio API Sound Synthesizer & 50 Sound Studio
 * Hỗ trợ 50 âm thanh phòng thu, BGM sóng biển thư giãn và gán âm thanh độc lập cho 5 loại nhịp tập
 */

export const SOUND_STUDIO_PRESETS = [
  // --- NHÓM 1: ZEN & CHUÔNG THIỀN (1 - 10) ---
  { id: 'preset_1', cat: 'zen', icon: '🧘', name: 'Chuông Xoay Zen', desc: 'Sóng âm 216Hz + 432Hz ngân trầm sâu Tây Tạng' },
  { id: 'preset_2', cat: 'zen', icon: '🔔', name: 'Chuông Tây Tạng Thẫm', desc: 'Hợp âm trầm 144Hz + 288Hz giải tỏa căng thẳng' },
  { id: 'preset_3', cat: 'zen', icon: '🎐', name: 'Chuông Gió Thạch Anh', desc: 'Sóng âm cao 864Hz + 1296Hz thanh khiết' },
  { id: 'preset_4', cat: 'zen', icon: '🏛️', name: 'Chuông Chùa Tĩnh Lặng', desc: 'Âm chuông 108Hz + 324Hz tĩnh tại tâm trí' },
  { id: 'preset_5', cat: 'zen', icon: '✨', name: 'Âm Ngân 432Hz Healing', desc: 'Tần số chữa lành sinh học 432Hz chuẩn quốc tế' },
  { id: 'preset_6', cat: 'zen', icon: '☸️', name: 'Chuông Tam Bảo', desc: 'Hợp âm ba tầng 300Hz + 600Hz + 900Hz' },
  { id: 'preset_7', cat: 'zen', icon: '📿', name: 'Chuông Ngân Thư Thái', desc: 'Dải âm 520Hz + 780Hz thư giãn cơ thể' },
  { id: 'preset_8', cat: 'zen', icon: '🥁', name: 'Gong Thiền Vô Vi', desc: 'Tiếng Gong 96Hz ngân vang tĩnh lặng' },
  { id: 'preset_9', cat: 'zen', icon: '💎', name: 'Chuông Ngọc Bích F-Major', desc: 'Hợp âm F5 + A5 + C6 tinh khiết y khoa' },
  { id: 'preset_10', cat: 'zen', icon: '🪐', name: 'Vũ Trụ OM Tone 136.1Hz', desc: 'Tần số OM 136.1Hz cân bằng năng lượng' },

  // --- NHÓM 2: NHẠC CỤ & GIAI ĐIỆU (11 - 20) ---
  { id: 'preset_11', cat: 'instrument', icon: '🎼', name: 'Đàn Hạc Vuốt Nhẹ', desc: 'Hợp âm C4-E4-G4-C5 rải nhẹ tựa đàn hạc' },
  { id: 'preset_12', cat: 'instrument', icon: '🪵', name: 'Đàn Marimba Mộc', desc: 'Tiếng gõ gỗ gụ G4 + B4 mộc mạc ấm áp' },
  { id: 'preset_13', cat: 'instrument', icon: '🪕', name: 'Đàn Kalimba Châu Phi', desc: 'Tiếng phiến kim loại Kalimba D5 + F#5 + A5' },
  { id: 'preset_14', cat: 'instrument', icon: '🎹', name: 'Đàn Organ Crystal', desc: 'Hợp âm phong cầm C4 + G4 + E5 du dương' },
  { id: 'preset_15', cat: 'instrument', icon: '🪈', name: 'Tiếng Sáo Thiên Đường', desc: 'Tiếng sáo trúc vi vút E5 -> G5 thanh thoát' },
  { id: 'preset_16', cat: 'instrument', icon: '🎻', name: 'Piano Hợp Âm Ấm', desc: 'Phím đàn Piano A3 + C#4 + E4 du dương' },
  { id: 'preset_17', cat: 'instrument', icon: '🛎️', name: 'Đàn Celesta Thần Tiên', desc: 'Chuông phím Celesta C6 + E6 + G6 mộng mơ' },
  { id: 'preset_18', cat: 'instrument', icon: '🎻', name: 'Violin Vĩ Kéo Êm', desc: 'Tiếng kéo vĩ Violin D4 + A4 mượt mà' },
  { id: 'preset_19', cat: 'instrument', icon: '🪕', name: 'Đàn Tranh Dân Gian', desc: 'Tiếng gảy đàn tranh D4 -> F#4 -> A4' },
  { id: 'preset_20', cat: 'instrument', icon: '🎉', name: 'Giai Điệu Chiến Thắng', desc: 'Hợp âm rải C-E-G-C-E hoan hỉ chúc mừng' },

  // --- NHÓM 3: TỰ NHIÊN & SOMATIC (21 - 30) ---
  { id: 'preset_21', cat: 'nature', icon: '🌊', name: 'Sóng Biển Êm Dịu', desc: 'Dải âm 180Hz -> 320Hz phập phồng sóng biển' },
  { id: 'preset_22', cat: 'nature', icon: '💧', name: 'Giọt Sương Somatic', desc: 'Tiếng giọt nước đọng D5 -> A5 trong trẻo' },
  { id: 'preset_23', cat: 'nature', icon: '🏞️', name: 'Tiếng Suối Róc Rách', desc: 'Âm thanh giọt nước suối đa tần róc rách' },
  { id: 'preset_24', cat: 'nature', icon: '🎋', name: 'Gió Thoảng Rừng Trúc', desc: 'Tiếng gió lướt nhẹ qua tán trúc xào xạc' },
  { id: 'preset_25', cat: 'nature', icon: '🎋', name: 'Cốc Gõ Gỗ Tre', desc: 'Âm thanh gõ ống tre 400Hz + 800Hz mộc mạc' },
  { id: 'preset_26', cat: 'nature', icon: '🌧️', name: 'Mưa Rào Êm Dịu', desc: 'Tiếng mưa rơi nhẹ nhàng trên lá cây' },
  { id: 'preset_27', cat: 'nature', icon: '🫀', name: 'Nhịp Tim Somatic', desc: 'Nhịp trầm 60Hz + 80Hz sâu lắng an yên' },
  { id: 'preset_28', cat: 'nature', icon: '🐦', name: 'Tiếng Chim Rừng Hót', desc: 'Âm vang tiếng chim hót A5 -> C6 vi vút' },
  { id: 'preset_29', cat: 'nature', icon: '💨', name: 'Hơi Thở Thả Lỏng Sâu', desc: 'Âm thanh sóng thở bung nén thư thái' },
  { id: 'preset_30', cat: 'nature', icon: '🔥', name: 'Lửa Trại Đêm Thiền', desc: 'Tiếng nổ tí tách ấm áp lửa trại' },

  // --- NHÓM 4: TẦN SỐ SOLFEGGIO & Y KHOA (31 - 40) ---
  { id: 'preset_31', cat: 'solfeggio', icon: '⚡', name: 'Tần Số 528Hz Solfeggio', desc: 'Tần số 528Hz phục hồi tế bào & DNA' },
  { id: 'preset_32', cat: 'solfeggio', icon: '💚', name: 'Tần Số 639Hz Gắn Kết', desc: 'Tần số 639Hz cân bằng cảm xúc & tim' },
  { id: 'preset_33', cat: 'solfeggio', icon: '💜', name: 'Tần Số 741Hz Giải Độc', desc: 'Tần số 741Hz làm sạch năng lượng' },
  { id: 'preset_34', cat: 'solfeggio', icon: '🩺', name: 'Bíp Y Khoa Chuẩn', desc: 'Âm bíp 880Hz báo nhịp y khoa sắc nét' },
  { id: 'preset_35', cat: 'solfeggio', icon: '🏥', name: 'Bíp Y Khoa Kép', desc: 'Nhịp bíp đôi 880Hz + 1046Hz báo chuyển' },
  { id: 'preset_36', cat: 'solfeggio', icon: '📈', name: 'Nhịp Mạch Sinh Lý', desc: 'Xung âm 523Hz mô phỏng nhịp sinh học' },
  { id: 'preset_37', cat: 'solfeggio', icon: '🧠', name: 'Sóng Não Alpha 10Hz', desc: 'Âm nền 440Hz điều tần 10Hz tập trung' },
  { id: 'preset_38', cat: 'solfeggio', icon: '🌙', name: 'Sóng Não Theta 6Hz', desc: 'Âm trầm 220Hz điều tần 6Hz thư giãn sâu' },
  { id: 'preset_39', cat: 'solfeggio', icon: '🔔', name: 'Chuông Cảnh Báo Nhẹ', desc: 'Nhịp chuông A5 + E6 báo hoàn thành nhịp' },
  { id: 'preset_40', cat: 'solfeggio', icon: '💓', name: 'Mạch Sinh Học 70BPM', desc: 'Nhịp đập sine 70 nhịp/phút chuẩn y khoa' },

  // --- NHÓM 5: NHỊP NHÚN & ĐỘNG LỰC (41 - 50) ---
  { id: 'preset_41', cat: 'rhythm', icon: '🎈', name: 'Tiếng Pop Động Lực', desc: 'Âm vuốt Pop 300Hz linh hoạt năng lượng' },
  { id: 'preset_42', cat: 'rhythm', icon: '🚀', name: 'Synth Riser Bứt Phá', desc: 'Âm vuốt tăng tần số 200Hz -> 800Hz' },
  { id: 'preset_43', cat: 'rhythm', icon: '💥', name: 'Bass Trầm Năng Lượng', desc: 'Nhịp Bass 80Hz dội mạnh mẽ tạo động lực' },
  { id: 'preset_44', cat: 'rhythm', icon: '🥁', name: 'Trống Gỗ Thể Thao', desc: 'Nhịp gõ trống Snare gỗ gụ thể thao' },
  { id: 'preset_45', cat: 'rhythm', icon: '⭐', name: 'Âm Thăng Cấp Level Up', desc: 'Hợp âm C5-E5-G5-C6 vinh quang' },
  { id: 'preset_46', cat: 'rhythm', icon: '👏', name: 'Tiếng Vỗ Tay Chúc Mừng', desc: 'Âm thanh tán thưởng tán dương hoàn thành' },
  { id: 'preset_47', cat: 'rhythm', icon: '🔔', name: 'Leng Keng Kim Loại', desc: 'Chuông kim loại 1200Hz vui tươi náo nhiệt' },
  { id: 'preset_48', cat: 'rhythm', icon: '📳', name: 'Haptic Click Premium', desc: 'Tiếng gõ nhẹ 150Hz mô phỏng rung xúc giác' },
  { id: 'preset_49', cat: 'rhythm', icon: '🌌', name: 'Sóng Âm Sci-Fi Chuyển', desc: 'Âm thanh viễn tưởng FM chuyển nhịp' },
  { id: 'preset_50', cat: 'rhythm', icon: '🏆', name: 'Hợp Âm Hoàn Mỹ Final', desc: 'Hợp âm C Major 7th hoành tráng kết thúc' }
];

export const SOUND_CATEGORIES = [
  { id: 'all', name: 'Tất cả (50)' },
  { id: 'zen', name: '🧘 Chuông Thiền' },
  { id: 'instrument', name: '🎼 Nhạc Cụ' },
  { id: 'nature', name: '🌊 Tự Nhiên' },
  { id: 'solfeggio', name: '⚡ Y Khoa' },
  { id: 'rhythm', name: '🥁 Động Lực' }
];

export const ACTION_SOUND_KEYS = [
  { key: 'squeeze', name: '⚡ Siết Cơ PC', defaultPreset: 'preset_14' },
  { key: 'relax', name: '❄️ Thả Lỏng', defaultPreset: 'preset_5' },
  { key: 'reverse', name: '🔄 Kegel Ngược', defaultPreset: 'preset_1' },
  { key: 'transition', name: '⏸️ Nghỉ Chuyển', defaultPreset: 'preset_27' },
  { key: 'complete', name: '🎉 Hoàn Thành', defaultPreset: 'preset_20' }
];

class AudioSynthesizer {
  constructor() {
    this.audioCtx = null;
    this.bgmSourceNode = null;
    this.bgmGainNode = null;
    this.isBGMPlaying = false;
  }

  init() {
    if (this.audioCtx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.audioCtx = new AudioContextClass();

      // Master Dynamics Compressor chống rè và vỡ tiếng (Limiter Headroom)
      this.masterCompressor = this.audioCtx.createDynamicsCompressor();
      this.masterCompressor.threshold.setValueAtTime(-8, this.audioCtx.currentTime);
      this.masterCompressor.knee.setValueAtTime(24, this.audioCtx.currentTime);
      this.masterCompressor.ratio.setValueAtTime(8, this.audioCtx.currentTime);
      this.masterCompressor.attack.setValueAtTime(0.002, this.audioCtx.currentTime);
      this.masterCompressor.release.setValueAtTime(0.2, this.audioCtx.currentTime);

      // Tăng Master Gain lên 1.8x để âm lượng to, rõ, vang trên loa iPhone
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(1.8, this.audioCtx.currentTime);

      this.masterCompressor.connect(this.masterGain);
      this.masterGain.connect(this.audioCtx.destination);
    }
  }

  getMasterDestination() {
    this.init();
    return this.masterCompressor || this.audioCtx?.destination;
  }

  resumeContext() {
    this.init();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Action Sound Playback Wrappers
  playSqueezeSFX(actionSounds = {}) {
    const preset = actionSounds.squeeze || 'preset_14';
    this.playSoundPreset(preset);
  }

  playRelaxSFX(actionSounds = {}) {
    const preset = actionSounds.relax || 'preset_5';
    this.playSoundPreset(preset);
  }

  playReverseKegelSFX(actionSounds = {}) {
    const preset = actionSounds.reverse || 'preset_1';
    this.playSoundPreset(preset);
  }

  playTransitionRestSFX(actionSounds = {}) {
    const preset = actionSounds.transition || 'preset_27';
    this.playSoundPreset(preset);
  }

  playCompletionSFX(actionSounds = {}) {
    const preset = actionSounds.complete || 'preset_20';
    this.playSoundPreset(preset);
  }

  // Tone Synthesis Engine
  playSineChord(freqs, vol = 0.85, dur = 1.2) {
    this.resumeContext();
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const masterGain = this.audioCtx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(vol / Math.sqrt(freqs.length), now + 0.04);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    masterGain.connect(this.getMasterDestination());

    freqs.forEach(freq => {
      const osc = this.audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(masterGain);
      osc.start(now);
      osc.stop(now + dur);
    });
  }

  playArpeggio(freqs, delayStep = 0.06, vol = 0.8, dur = 1.0) {
    this.resumeContext();
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    freqs.forEach((freq, idx) => {
      const delay = idx * delayStep;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(vol, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
      osc.connect(gain);
      gain.connect(this.getMasterDestination());
      osc.start(now + delay);
      osc.stop(now + delay + dur);
    });
  }

  playGlide(freqs, rampTime = 0.2, vol = 0.8, dur = 1.0) {
    this.resumeContext();
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqs[0], now);
    if (freqs.length > 1) {
      osc.frequency.exponentialRampToValueAtTime(freqs[1], now + rampTime);
    }
    if (freqs.length > 2) {
      osc.frequency.exponentialRampToValueAtTime(freqs[2], now + dur * 0.8);
    }

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain);
    gain.connect(this.getMasterDestination());
    osc.start(now);
    osc.stop(now + dur);
  }

  playNoiseSwell(vol = 0.6, dur = 1.0) {
    this.resumeContext();
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const bufferSize = Math.floor(this.audioCtx.sampleRate * dur);
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.audioCtx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + dur * 0.5);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + dur * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.getMasterDestination());

    whiteNoise.start(now);
    whiteNoise.stop(now + dur);
  }

  playModulatedTone(freq = 440, modFreq = 10, vol = 0.75, dur = 1.2) {
    this.resumeContext();
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const carrier = this.audioCtx.createOscillator();
    const modulator = this.audioCtx.createOscillator();
    const modGain = this.audioCtx.createGain();
    const masterGain = this.audioCtx.createGain();

    carrier.frequency.value = freq;
    modulator.frequency.value = modFreq;
    modGain.gain.value = 50;

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(vol, now + 0.05);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    carrier.connect(masterGain);
    masterGain.connect(this.getMasterDestination());

    modulator.start(now);
    carrier.start(now);
    modulator.stop(now + dur);
    carrier.stop(now + dur);
  }

  playBeep(freq = 600, dur = 0.1, vol = 0.7) {
    this.resumeContext();
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain);
    gain.connect(this.getMasterDestination());
    osc.start(now);
    osc.stop(now + dur);
  }

  // 50 Sound Presets Dispatcher
  playSoundPreset(presetId) {
    this.resumeContext();
    if (!this.audioCtx) return;

    const num = parseInt((presetId || 'preset_1').replace('preset_', '')) || 1;

    if (num === 1) this.playSineChord([216.00, 432.00], 0.85, 1.8);
    else if (num === 2) this.playSineChord([144.00, 288.00], 0.9, 2.0);
    else if (num === 3) this.playSineChord([864.00, 1296.00], 0.65, 1.2);
    else if (num === 4) this.playSineChord([108.00, 324.00], 0.95, 2.2);
    else if (num === 5) this.playSineChord([432.00], 0.85, 1.5);
    else if (num === 6) this.playSineChord([300.00, 600.00, 900.00], 0.75, 1.6);
    else if (num === 7) this.playSineChord([520.00, 780.00], 0.8, 1.4);
    else if (num === 8) this.playSineChord([96.00, 192.00], 1.0, 2.4);
    else if (num === 9) this.playSineChord([698.46, 880.00, 1046.50], 0.75, 1.4);
    else if (num === 10) this.playSineChord([136.10, 272.20], 0.9, 2.0);
    else if (num === 11) this.playArpeggio([261.63, 329.63, 392.00, 523.25], 0.07, 0.7, 0.9);
    else if (num === 12) this.playSineChord([392.00, 493.88], 0.9, 0.6);
    else if (num === 13) this.playArpeggio([587.33, 739.99, 880.00], 0.05, 0.8, 0.8);
    else if (num === 14) this.playSineChord([261.63, 392.00, 659.25], 0.75, 1.5);
    else if (num === 15) this.playGlide([659.25, 783.99], 0.3, 0.75, 1.2);
    else if (num === 16) this.playSineChord([220.00, 277.18, 329.63], 0.85, 1.3);
    else if (num === 17) this.playArpeggio([1046.50, 1318.51, 1567.98], 0.04, 0.65, 1.0);
    else if (num === 18) this.playSineChord([293.66, 440.00], 0.75, 1.6);
    else if (num === 19) this.playArpeggio([293.66, 369.99, 440.00], 0.06, 0.75, 0.9);
    else if (num === 20) this.playArpeggio([261.63, 329.63, 392.00, 523.25, 659.25], 0.06, 0.75, 1.2);
    else if (num === 21) this.playGlide([180, 320, 180], 0.6, 0.75, 1.4);
    else if (num === 22) this.playGlide([587.33, 880.00], 0.12, 0.85, 0.7);
    else if (num === 23) this.playArpeggio([783.99, 1046.50, 880.00], 0.08, 0.7, 0.8);
    else if (num === 24) this.playNoiseSwell(0.6, 1.2);
    else if (num === 25) this.playSineChord([400, 800], 0.9, 0.3);
    else if (num === 26) this.playNoiseSwell(0.5, 1.5);
    else if (num === 27) this.playArpeggio([60, 80], 0.15, 0.95, 0.5);
    else if (num === 28) this.playGlide([880, 1046, 1318], 0.1, 0.7, 0.6);
    else if (num === 29) this.playNoiseSwell(0.65, 1.8);
    else if (num === 30) this.playNoiseSwell(0.45, 0.8);
    else if (num === 31) this.playSineChord([528.00, 264.00], 0.8, 1.6);
    else if (num === 32) this.playSineChord([639.00, 319.50], 0.8, 1.6);
    else if (num === 33) this.playSineChord([741.00, 370.50], 0.8, 1.6);
    else if (num === 34) this.playSineChord([880.00], 0.85, 0.3);
    else if (num === 35) this.playArpeggio([880.00, 1046.50], 0.08, 0.85, 0.5);
    else if (num === 36) this.playSineChord([523.25], 0.85, 0.4);
    else if (num === 37) this.playModulatedTone(440, 10, 0.75, 1.4);
    else if (num === 38) this.playModulatedTone(220, 6, 0.8, 1.6);
    else if (num === 39) this.playSineChord([880.00, 1318.51], 0.75, 0.8);
    else if (num === 40) this.playArpeggio([70, 90], 0.12, 0.95, 0.6);
    else if (num === 41) this.playGlide([400, 150], 0.08, 0.9, 0.3);
    else if (num === 42) this.playGlide([200, 800], 0.4, 0.75, 0.8);
    else if (num === 43) this.playSineChord([80.00, 160.00], 1.0, 0.5);
    else if (num === 44) this.playSineChord([250.00, 500.00], 0.9, 0.35);
    else if (num === 45) this.playArpeggio([523.25, 659.25, 783.99, 1046.50], 0.05, 0.85, 1.0);
    else if (num === 46) this.playNoiseSwell(0.75, 0.4);
    else if (num === 47) this.playSineChord([1200.00, 2400.00], 0.65, 0.7);
    else if (num === 48) this.playSineChord([150.00], 0.6, 0.15);
    else if (num === 49) this.playModulatedTone(600, 30, 0.75, 0.8);
    else if (num === 50) this.playSineChord([261.63, 329.63, 392.00, 493.88, 523.25], 0.75, 2.0);
    else this.playSineChord([261.63, 392.00, 659.25], 0.75, 1.5);
  }

  startBGM(vol = 0.25) {
    this.resumeContext();
    if (!this.audioCtx || this.isBGMPlaying) return;

    try {
      const bufferSize = 2 * this.audioCtx.sampleRate;
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.bgmSourceNode = this.audioCtx.createBufferSource();
      this.bgmSourceNode.buffer = noiseBuffer;
      this.bgmSourceNode.loop = true;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, this.audioCtx.currentTime);

      const lfo = this.audioCtx.createOscillator();
      lfo.frequency.setValueAtTime(0.1, this.audioCtx.currentTime); // 10s wave cycle
      const lfoGain = this.audioCtx.createGain();
      lfoGain.gain.setValueAtTime(200, this.audioCtx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      this.bgmGainNode = this.audioCtx.createGain();
      this.bgmGainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
      this.bgmGainNode.gain.linearRampToValueAtTime(vol, this.audioCtx.currentTime + 2);

      this.bgmSourceNode.connect(filter);
      filter.connect(this.bgmGainNode);
      this.bgmGainNode.connect(this.getMasterDestination());

      lfo.start();
      this.bgmSourceNode.start();
      this.isBGMPlaying = true;
    } catch (e) {
      console.warn('BGM start error:', e);
    }
  }

  stopBGM() {
    if (this.bgmGainNode && this.audioCtx) {
      try {
        this.bgmGainNode.gain.linearRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1);
        setTimeout(() => {
          if (this.bgmSourceNode) {
            try { this.bgmSourceNode.stop(); } catch (e) {}
            this.bgmSourceNode.disconnect();
            this.bgmSourceNode = null;
          }
          this.isBGMPlaying = false;
        }, 1000);
      } catch (e) {
        this.isBGMPlaying = false;
      }
    } else {
      this.isBGMPlaying = false;
    }
  }

  startBackgroundAudioKeeper() {
    if (typeof window === 'undefined') return;
    try {
      this.resumeContext();

      // 1. Tạo audio HTML5 vô thanh lặp vô tận để iOS coi trang là trình phát media hợp lệ
      if (!this.silentAudioElement) {
        this.silentAudioElement = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
        this.silentAudioElement.loop = true;
        this.silentAudioElement.volume = 0.01;
      }
      this.silentAudioElement.play().catch(() => {});

      // 2. Tạo một bộ dao động siêu âm vô thanh (inaudible carrier)
      if (!this.bgOscillator && this.audioCtx) {
        this.bgOscillator = this.audioCtx.createOscillator();
        this.bgGainNodeKeeper = this.audioCtx.createGain();
        this.bgOscillator.frequency.setValueAtTime(20, this.audioCtx.currentTime);
        this.bgGainNodeKeeper.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
        this.bgOscillator.connect(this.bgGainNodeKeeper);
        this.bgGainNodeKeeper.connect(this.audioCtx.destination);
        this.bgOscillator.start();
      }
    } catch (e) {
      console.warn('Silent audio keeper error:', e);
    }
  }

  stopBackgroundAudioKeeper() {
    if (this.silentAudioElement) {
      try {
        this.silentAudioElement.pause();
        this.silentAudioElement.currentTime = 0;
      } catch (e) {}
    }
    if (this.bgOscillator) {
      try {
        this.bgOscillator.stop();
        this.bgOscillator.disconnect();
        this.bgOscillator = null;
      } catch (e) {}
    }
  }
}

export const audioEngine = new AudioSynthesizer();
