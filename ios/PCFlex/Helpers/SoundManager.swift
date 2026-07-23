import Foundation
import AVFoundation

public final class SoundManager: ObservableObject {
    public static let shared = SoundManager()
    
    @Published public var isMutedSFX: Bool = false {
        didSet {
            UserDefaults.standard.set(isMutedSFX, forKey: "pc_flex_muted_sfx")
        }
    }
    
    private let audioEngine = AVAudioEngine()
    private let playerNode = AVAudioPlayerNode()
    
    private init() {
        self.isMutedSFX = UserDefaults.standard.bool(forKey: "pc_flex_muted_sfx")
        setupEngine()
    }
    
    private func setupEngine() {
        audioEngine.attach(playerNode)
        let format = AVAudioFormat(standardFormatWithSampleRate: 44100.0, channels: 1)!
        audioEngine.connect(playerNode, to: audioEngine.mainMixerNode, format: format)
        try? audioEngine.start()
    }
    
    public func playSqueezeSound() {
        guard !isMutedSFX else { return }
        // Sine wave dual-tone 523.25Hz (C5) + 783.99Hz (G5) matching Web Audio API
        playSynthTone(frequencies: [523.25, 783.99], waveType: .sine, duration: 0.8, fadeOut: true)
    }
    
    public func playReverseKegelSound() {
        guard !isMutedSFX else { return }
        // Crystal Celestial Major Triad F5 (698.46Hz) + A5 (880.00Hz) + C6 (1046.50Hz)
        playSynthTone(frequencies: [698.46, 880.00, 1046.50], waveType: .sine, duration: 1.2, fadeOut: true)
    }
    
    public func playTransitionRestSound() {
        guard !isMutedSFX else { return }
        // Soft double pulse 293.66Hz (D4) -> 440Hz (A4) matching Web Audio API
        playSynthTone(frequencies: [293.66, 440.0], waveType: .sine, duration: 0.12, fadeOut: true)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) {
            self.playSynthTone(frequencies: [293.66, 440.0], waveType: .sine, duration: 0.12, fadeOut: true)
        }
    }
    
    public func playRelaxSound() {
        guard !isMutedSFX else { return }
        // Sine wave E4 (329.63Hz) + G3 (196.00Hz) matching Web Audio API
        playSynthTone(frequencies: [329.63, 196.00], waveType: .sine, duration: 1.0, fadeOut: true)
    }
    
    public func playCompletionSound() {
        guard !isMutedSFX else { return }
        let notes: [Double] = [261.63, 329.63, 392.00, 523.25]
        for (idx, freq) in notes.enumerated() {
            let delay = Double(idx) * 0.12
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                self.playSynthTone(frequencies: [freq], waveType: .sine, duration: 0.5, fadeOut: true)
            }
        }
    }
    
    private enum WaveType { case sine, triangle }
    
    private func playSynthTone(frequencies: [Double], waveType: WaveType, duration: Double, fadeOut: Bool) {
        let sampleRate: Double = 44100.0
        let frameCount = AVAudioFrameCount(sampleRate * duration)
        guard let format = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 1),
              let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else { return }
        
        buffer.frameLength = frameCount
        let channels = buffer.floatChannelData![0]
        
        for i in 0..<Int(frameCount) {
            let t = Double(i) / sampleRate
            var sample: Float = 0.0
            
            for freq in frequencies {
                let phase = t * freq * 2.0 * .pi
                if waveType == .sine {
                    sample += Float(sin(phase))
                } else {
                    let normPhase = (t * freq).truncatingRemainder(dividingBy: 1.0)
                    let tri = Float(abs(normPhase - 0.5) * 4.0 - 1.0)
                    sample += tri
                }
            }
            
            sample = sample / Float(frequencies.count)
            let env = fadeOut ? Float(1.0 - (Double(i) / Double(frameCount))) : 1.0
            channels[i] = sample * env * 0.25
        }
        
        if !audioEngine.isRunning {
            try? audioEngine.start()
        }
        
        playerNode.play()
        playerNode.scheduleBuffer(buffer, at: nil, options: [], completionHandler: nil)
    }
}
