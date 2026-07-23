import UIKit

public final class HapticManager {
    public static let shared = HapticManager()
    
    private let lightImpact = UIImpactFeedbackGenerator(style: .light)
    private let mediumImpact = UIImpactFeedbackGenerator(style: .medium)
    private let heavyImpact = UIImpactFeedbackGenerator(style: .heavy)
    private let notificationFeedback = UINotificationFeedbackGenerator()
    
    private init() {}
    
    public func prepare() {
        lightImpact.prepare()
        mediumImpact.prepare()
        heavyImpact.prepare()
        notificationFeedback.prepare()
    }
    
    public func playSqueezeHaptic() {
        heavyImpact.impactOccurred()
    }
    
    public func playReverseHaptic() {
        mediumImpact.impactOccurred()
    }
    
    public func playTransitionHaptic() {
        lightImpact.impactOccurred()
    }
    
    public func playRelaxHaptic() {
        lightImpact.impactOccurred(intensity: 0.5)
    }
    
    public func playCompletionHaptic() {
        notificationFeedback.notificationOccurred(.success)
    }
}
