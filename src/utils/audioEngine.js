/**
 * PC Flex - High Performance Web Audio API Sound Synthesizer
 * Tích hợp 50 Sound Presets, BGM sóng biển thư giãn và âm thanh đếm nhịp
 */

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
    }
  }

  resumeContext() {
    this.init();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Helper Methods for Tone Synthesis
  playSineChord(freqs, vol = 0.5, dur = 1.2) {
    this.resumeContext();
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const masterGain = this.audioCtx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(vol / freqs.length, now + 0.04);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    masterGain.connect(this.audioCtx.destination);

    freqs.forEach(freq => {
      const osc = this.audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(masterGain);
      osc.start(now);
      osc.stop(now + dur);
    });
  }

  playArpeggio(freqs, delayStep = 0.06, vol = 0.4, dur = 1.0) {
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
      gain.connect(this.audioCtx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + dur);
    });
  }

  playGlide(freqs, rampTime = 0.2, vol = 0.4, dur = 1.0) {
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
    gain.connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + dur);
  }

  playNoiseSwell(vol = 0.3, dur = 1.0) {
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
    gain.connect(this.audioCtx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + dur);
  }

  playModulatedTone(freq = 440, modFreq = 10, vol = 0.4, dur = 1.2) {
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
    masterGain.connect(this.audioCtx.destination);

    modulator.start(now);
    carrier.start(now);
    modulator.stop(now + dur);
    carrier.stop(now + dur);
  }

  playBeep(freq = 600, dur = 0.1, vol = 0.3) {
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
    gain.connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + dur);
  }

  // 50 Sound Presets Dispatcher
  playSoundPreset(presetId) {
    this.resumeContext();
    if (!this.audioCtx) return;

    const num = parseInt((presetId || 'preset_1').replace('preset_', '')) || 1;

    if (num === 1) this.playSineChord([216.00, 432.00], 0.5, 1.8);
    else if (num === 2) this.playSineChord([144.00, 288.00], 0.6, 2.0);
    else if (num === 3) this.playSineChord([864.00, 1296.00], 0.35, 1.2);
    else if (num === 4) this.playSineChord([108.00, 324.00], 0.65, 2.2);
    else if (num === 5) this.playSineChord([432.00], 0.5, 1.5);
    else if (num === 6) this.playSineChord([300.00, 600.00, 900.00], 0.4, 1.6);
    else if (num === 7) this.playSineChord([520.00, 780.00], 0.45, 1.4);
    else if (num === 8) this.playSineChord([96.00, 192.00], 0.7, 2.4);
    else if (num === 9) this.playSineChord([698.46, 880.00, 1046.50], 0.45, 1.4);
    else if (num === 10) this.playSineChord([136.10, 272.20], 0.55, 2.0);
    else if (num === 11) this.playArpeggio([261.63, 329.63, 392.00, 523.25], 0.07, 0.35, 0.9);
    else if (num === 12) this.playSineChord([392.00, 493.88], 0.6, 0.6);
    else if (num === 13) this.playArpeggio([587.33, 739.99, 880.00], 0.05, 0.45, 0.8);
    else if (num === 14) this.playSineChord([261.63, 392.00, 659.25], 0.35, 1.5);
    else if (num === 15) this.playGlide([659.25, 783.99], 0.3, 0.4, 1.2);
    else if (num === 16) this.playSineChord([220.00, 277.18, 329.63], 0.5, 1.3);
    else if (num === 17) this.playArpeggio([1046.50, 1318.51, 1567.98], 0.04, 0.3, 1.0);
    else if (num === 18) this.playSineChord([293.66, 440.00], 0.4, 1.6);
    else if (num === 19) this.playArpeggio([293.66, 369.99, 440.00], 0.06, 0.4, 0.9);
    else if (num === 20) this.playArpeggio([261.63, 329.63, 392.00, 523.25, 659.25], 0.06, 0.4, 1.2);
    else if (num === 21) this.playGlide([180, 320, 180], 0.6, 0.4, 1.4);
    else if (num === 22) this.playGlide([587.33, 880.00], 0.12, 0.5, 0.7);
    else if (num === 23) this.playArpeggio([783.99, 1046.50, 880.00], 0.08, 0.35, 0.8);
    else if (num === 24) this.playNoiseSwell(0.3, 1.2);
    else if (num === 25) this.playSineChord([400, 800], 0.6, 0.3);
    else if (num === 26) this.playNoiseSwell(0.25, 1.5);
    else if (num === 27) this.playArpeggio([60, 80], 0.15, 0.6, 0.5);
    else if (num === 28) this.playGlide([880, 1046, 1318], 0.1, 0.35, 0.6);
    else if (num === 29) this.playNoiseSwell(0.35, 1.8);
    else if (num === 30) this.playNoiseSwell(0.2, 0.8);
    else if (num === 31) this.playSineChord([528.00, 264.00], 0.45, 1.6);
    else if (num === 32) this.playSineChord([639.00, 319.50], 0.45, 1.6);
    else if (num === 33) this.playSineChord([741.00, 370.50], 0.45, 1.6);
    else if (num === 34) this.playSineChord([880.00], 0.5, 0.3);
    else if (num === 35) this.playArpeggio([880.00, 1046.50], 0.08, 0.5, 0.5);
    else if (num === 36) this.playSineChord([523.25], 0.5, 0.4);
    else if (num === 37) this.playModulatedTone(440, 10, 0.4, 1.4);
    else if (num === 38) this.playModulatedTone(220, 6, 0.45, 1.6);
    else if (num === 39) this.playSineChord([880.00, 1318.51], 0.4, 0.8);
    else if (num === 40) this.playArpeggio([70, 90], 0.12, 0.6, 0.6);
    else if (num === 41) this.playGlide([400, 150], 0.08, 0.6, 0.3);
    else if (num === 42) this.playGlide([200, 800], 0.4, 0.4, 0.8);
    else if (num === 43) this.playSineChord([80.00, 160.00], 0.7, 0.5);
    else if (num === 44) this.playSineChord([250.00, 500.00], 0.6, 0.35);
    else if (num === 45) this.playArpeggio([523.25, 659.25, 783.99, 1046.50], 0.05, 0.45, 1.0);
    else if (num === 46) this.playNoiseSwell(0.4, 0.4);
    else if (num === 47) this.playSineChord([1200.00, 2400.00], 0.35, 0.7);
    else if (num === 48) this.playSineChord([150.00], 0.3, 0.15);
    else if (num === 49) this.playModulatedTone(600, 30, 0.4, 0.8);
    else if (num === 50) this.playSineChord([261.63, 329.63, 392.00, 493.88, 523.25], 0.4, 2.0);
    else this.playSineChord([261.63, 392.00, 659.25], 0.35, 1.5);
  }

  // Ocean wave meditation BGM soundscape
  startBGM(vol = 0.15) {
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
      this.bgmGainNode.connect(this.audioCtx.destination);

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
}

export const audioEngine = new AudioSynthesizer();

export const SOUND_PRESETS_METADATA = [
  { id: 'preset_1', name: 'Âm 432Hz An Lạc', tag: 'Solfeggio' },
  { id: 'preset_5', name: 'Sóng Tần Số Gốc 432Hz', tag: 'Thiền Định' },
  { id: 'preset_11', name: 'Hợp Âm Đô Trưởng (C-Major)', tag: 'Tươi Sáng' },
  { id: 'preset_14', name: 'Chuông Pha Lê Sáng Rực', tag: 'Kích Hoạt' },
  { id: 'preset_15', name: 'Lượn Sóng Tần Số Cao', tag: 'Bứt Phá' },
  { id: 'preset_20', name: 'Chuông Ngũ Cung Hoàn Thành', tag: 'Chiến Thắng' },
  { id: 'preset_27', name: 'Âm Trầm Chuyển Bài', tag: 'Chuyển Chặng' },
  { id: 'preset_31', name: 'Tần Số 528Hz Tái Tạo Tế Bào', tag: 'Solfeggio' },
  { id: 'preset_32', name: 'Tần Số 639Hz Gắn Kết Năng Lượng', tag: 'Solfeggio' },
  { id: 'preset_33', name: 'Tần Số 741Hz Thức Tỉnh Trực Giác', tag: 'Solfeggio' },
  { id: 'preset_45', name: 'Chuỗi Hợp Âm Thư Thái', tag: 'Phục Hồi' },
  { id: 'preset_50', name: 'Đại Hợp Âm Vũ Trụ', tag: 'Đỉnh Cao' },
];
