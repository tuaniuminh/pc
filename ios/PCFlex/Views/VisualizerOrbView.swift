import SwiftUI

public struct VisualizerOrbView: View {
    @ObservedObject var engine: WorkoutEngine
    @State private var isPulsing: Bool = false
    
    private var currentStep: WorkoutStep? {
        guard engine.currentStepIndex >= 0 && engine.currentStepIndex < engine.workoutSteps.count else { return nil }
        return engine.workoutSteps[engine.currentStepIndex]
    }
    
    private var actionTitle: String {
        if engine.state == .idle {
            return "SẴN SÀNG"
        }
        return currentStep?.action ?? "SẴN SÀNG"
    }
    
    private var timerText: String {
        if engine.state == .idle {
            return "01"
        }
        return String(format: "%02d", engine.timeRemaining)
    }
    
    private var subtextDescription: String {
        if engine.state == .idle {
            let activeConfig = ClinicalLevelsData.levels[engine.selectedLevelTab]?.maleWorkouts[engine.selectedWorkoutId]
            let name = activeConfig?.name ?? "Combo Sức Mạnh"
            let reps = engine.totalRepsInWorkout > 0 ? engine.totalRepsInWorkout : 59
            return "Bấm Bắt đầu để tập\n\(name) - \(reps) lượt"
        }
        return currentStep?.subtext ?? ""
    }
    
    private var orbGlowColors: [Color] {
        guard let step = currentStep, engine.state != .idle else {
            return [Color(red: 0.1, green: 0.15, blue: 0.28), Color(red: 0.05, green: 0.08, blue: 0.16)]
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
        ZStack {
            // Outer Ring Border matching Image 1
            Circle()
                .stroke(Color.white.opacity(0.12), lineWidth: 2)
                .frame(width: 230, height: 230)
                .scaleEffect(engine.state == .squeezing ? (isPulsing ? 1.06 : 0.96) : 1.0)
                .animation(engine.state == .squeezing ? Animation.easeInOut(duration: 1.0).repeatForever(autoreverses: true) : .default, value: isPulsing)
            
            // Inner Orb Fill
            Circle()
                .fill(
                    RadialGradient(
                        gradient: Gradient(colors: engine.state == .idle ?
                            [Color(red: 0.12, green: 0.16, blue: 0.26), Color(red: 0.06, green: 0.08, blue: 0.14)] :
                            orbGlowColors.map { $0.opacity(0.85) }
                        ),
                        center: .center,
                        startRadius: 20,
                        endRadius: 110
                    )
                )
                .frame(width: 216, height: 216)
                .shadow(color: engine.state == .idle ? Color.black.opacity(0.4) : (orbGlowColors.first?.opacity(0.5) ?? .clear), radius: 16, x: 0, y: 0)
            
            // Text Content matching Image 1
            VStack(spacing: 6) {
                Text(actionTitle)
                    .font(.system(size: 16, weight: .black, design: .rounded))
                    .foregroundColor(Color.white.opacity(0.9))
                    .tracking(2)
                
                Text(timerText)
                    .font(.system(size: 54, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                
                Text(subtextDescription)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(Color.white.opacity(0.7))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 16)
                    .lineLimit(3)
            }
            .frame(width: 190, height: 190)
        }
        .padding(.vertical, 10)
        .onAppear {
            isPulsing = true
        }
    }
}
