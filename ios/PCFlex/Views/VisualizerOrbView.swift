import SwiftUI

public struct VisualizerOrbView: View {
    @ObservedObject var engine: WorkoutEngine
    @State private var isPulsing: Bool = false
    
    private var currentStep: WorkoutStep? {
        guard engine.currentStepIndex >= 0 && engine.currentStepIndex < engine.workoutSteps.count else { return nil }
        return engine.workoutSteps[engine.currentStepIndex]
    }
    
    private var orbGlowColors: [Color] {
        guard let step = currentStep else {
            return [Color(red: 0.0, green: 0.96, blue: 0.83), Color(red: 0.0, green: 0.7, blue: 0.9)]
        }
        
        switch step.orbClass {
        case "squeezing":
            return [Color(red: 0.0, green: 0.96, blue: 0.83), Color(red: 0.0, green: 0.7, blue: 0.9)]
        case "relaxing":
            return [Color(red: 0.23, green: 0.51, blue: 0.96), Color(red: 0.58, green: 0.36, blue: 0.96)]
        case "resting":
            return [Color(red: 0.96, green: 0.62, blue: 0.04), Color(red: 0.93, green: 0.28, blue: 0.6)]
        default:
            return [Color(red: 0.0, green: 0.96, blue: 0.83), Color(red: 0.0, green: 0.7, blue: 0.9)]
        }
    }
    
    public var body: some View {
        VStack(spacing: 16) {
            ZStack {
                // Outer Glow Rings
                Circle()
                    .fill(LinearGradient(gradient: Gradient(colors: orbGlowColors.map { $0.opacity(0.2) }), startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 260, height: 260)
                    .scaleEffect(engine.state == .squeezing ? (isPulsing ? 1.15 : 0.95) : 1.0)
                    .animation(engine.state == .squeezing ? Animation.easeInOut(duration: 1.0).repeatForever(autoreverses: true) : .default, value: isPulsing)
                
                Circle()
                    .fill(LinearGradient(gradient: Gradient(colors: orbGlowColors), startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 210, height: 210)
                    .shadow(color: orbGlowColors.first?.opacity(0.6) ?? .clear, radius: 20, x: 0, y: 0)
                
                // Inner Glass Container
                VStack(spacing: 6) {
                    Text(currentStep?.action ?? "SẴN SÀNG")
                        .font(.system(size: 20, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                        .shadow(radius: 2)
                    
                    Text(String(format: "%02d", engine.timeRemaining))
                        .font(.system(size: 48, weight: .heavy, design: .monospaced))
                        .foregroundColor(.white)
                    
                    if let step = currentStep {
                        Text(step.subtext)
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.white.opacity(0.9))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 16)
                            .lineLimit(2)
                    }
                }
                .frame(width: 190, height: 190)
            }
            .padding(.top, 10)
            .onAppear {
                isPulsing = true
            }
        }
    }
}
