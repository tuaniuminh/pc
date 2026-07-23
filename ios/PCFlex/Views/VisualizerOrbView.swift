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
        VStack(spacing: 14) {
            ZStack {
                // Outer Glow Rings matching PWA CSS glow
                Circle()
                    .fill(LinearGradient(gradient: Gradient(colors: orbGlowColors.map { $0.opacity(0.18) }), startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 250, height: 250)
                    .scaleEffect(engine.state == .squeezing ? (isPulsing ? 1.12 : 0.96) : 1.0)
                    .animation(engine.state == .squeezing ? Animation.easeInOut(duration: 1.0).repeatForever(autoreverses: true) : .default, value: isPulsing)
                
                Circle()
                    .fill(LinearGradient(gradient: Gradient(colors: orbGlowColors), startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 200, height: 200)
                    .shadow(color: orbGlowColors.first?.opacity(0.6) ?? .clear, radius: 24, x: 0, y: 0)
                
                // Inner Glass Container matching PWA Orb
                VStack(spacing: 4) {
                    Text(currentStep?.action ?? "SẴN SÀNG")
                        .font(.system(size: 19, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                        .shadow(radius: 3)
                    
                    Text(String(format: "%02d", engine.timeRemaining))
                        .font(.system(size: 46, weight: .heavy, design: .monospaced))
                        .foregroundColor(.white)
                    
                    if let step = currentStep {
                        Text(step.subtext)
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(.white.opacity(0.92))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 14)
                            .lineLimit(2)
                    }
                }
                .frame(width: 180, height: 180)
            }
            .padding(.top, 6)
            .onAppear {
                isPulsing = true
            }
            
            // Phase Progress Segments Label matching PWA
            if !engine.currentPhaseName.isEmpty {
                Text(engine.currentPhaseName)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(Color(red: 0.0, green: 0.96, blue: 0.83))
                    .padding(.vertical, 4)
                    .padding(.horizontal, 12)
                    .background(Color(red: 0.0, green: 0.96, blue: 0.83).opacity(0.12))
                    .cornerRadius(12)
            }
        }
    }
}
