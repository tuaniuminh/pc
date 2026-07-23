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
        playSystemSound(id: 1057) // Crystal High Chime
    }
    
    public func playReverseKegelSound() {
        guard !isMutedSFX else { return }
        playSystemSound(id: 1054) // Triangle Harmonic Chime
    }
    
    public func playTransitionRestSound() {
        guard !isMutedSFX else { return }
        playDoublePulse() // Soft Double Pulse
    }
    
    public func playRelaxSound() {
        guard !isMutedSFX else { return }
        playSystemSound(id: 1052) // Soft Low Chime
    }
    
    public func playCompletionSound() {
        guard !isMutedSFX else { return }
        let notes: [Double] = [261.63, 329.63, 392.00, 523.25]
        for (idx, _) in notes.enumerated() {
            let delay = Double(idx) * 0.12
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                self.playSystemSound(id: 1057)
            }
        }
    }
    
    private func playSystemSound(id: SystemSoundID) {
        AudioServicesPlaySystemSound(id)
    }
    
    private func playDoublePulse() {
        AudioServicesPlaySystemSound(1103)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) {
            AudioServicesPlaySystemSound(1103)
        }
    }
}
