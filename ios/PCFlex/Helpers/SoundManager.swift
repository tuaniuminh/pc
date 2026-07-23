import Foundation
import AVFoundation
import AudioToolbox

public final class SoundManager: ObservableObject {
    public static let shared = SoundManager()
    
    @Published public var isMutedSFX: Bool = false {
        didSet {
            UserDefaults.standard.set(isMutedSFX, forKey: "pc_flex_muted_sfx")
        }
    }
    
    private var audioEngine: AVAudioEngine?
    
    private init() {
        self.isMutedSFX = UserDefaults.standard.bool(forKey: "pc_flex_muted_sfx")
        setupAudioSession()
    }
    
    private func setupAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.ambient, mode: .default, options: [.mixWithOthers])
            try session.setActive(true)
        } catch {
            print("Lỗi thiết lập AVAudioSession: \(error)")
        }
    }
    
    public func playSqueezeSound() {
        guard !isMutedSFX else { return }
        playTone(frequencies: [523.25, 783.99], duration: 0.8, type: .sine)
    }
    
    public func playReverseKegelSound() {
        guard !isMutedSFX else { return }
        playTone(frequencies: [440.0, 659.25], duration: 0.9, type: .triangle)
    }
    
    public func playTransitionRestSound() {
        guard !isMutedSFX else { return }
        playDoublePulse(frequencies: [293.66, 440.0], duration: 0.3)
    }
    
    public func playRelaxSound() {
        guard !isMutedSFX else { return }
        playTone(frequencies: [329.63, 196.00], duration: 1.0, type: .sine)
    }
    
    public func playCompletionSound() {
        guard !isMutedSFX else { return }
        let notes: [Double] = [261.63, 329.63, 392.00, 523.25]
        for (idx, freq) in notes.enumerated() {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(idx) * 0.12) {
                self.playTone(frequencies: [freq], duration: 0.6, type: .sine)
            }
        }
    }
    
    private func playTone(frequencies: [Double], duration: Double, type: SystemSoundID = 1057) {
        // Fallback using SystemSoundID chime or AudioServices for lightweight sound synthesis
        AudioServicesPlaySystemSound(type)
    }
    
    private func playDoublePulse(frequencies: [Double], duration: Double) {
        AudioServicesPlaySystemSound(1103)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) {
            AudioServicesPlaySystemSound(1103)
        }
    }
}
