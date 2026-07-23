import SwiftUI
import UIKit

public struct PracticeView: View {
    @ObservedObject var engine: WorkoutEngine
    
    // Exact PWA CSS Colors & Tokens from styles.css
    private let bgDark = Color(red: 0.027, green: 0.039, blue: 0.075) // #070a13
    private let bgCard = Color(red: 0.062, green: 0.09, blue: 0.164).opacity(0.65) // rgba(16, 23, 42, 0.65)
    private let borderColor = Color.white.opacity(0.06) // rgba(255, 255, 255, 0.06)
    private let cyanPrimary = Color(red: 0.0, green: 0.96, blue: 0.83) // #00f5d4
    
    public var body: some View {
        NavigationView {
            ZStack {
                // Background matching PWA body background-image & radial gradients
                bgDark
                    .ignoresSafeArea()
                
                // Radial Glow circles matching PWA CSS lines 48-50
                GeometryReader { geo in
                    Circle()
                        .fill(Color(red: 0.23, green: 0.51, blue: 0.96).opacity(0.05))
                        .frame(width: geo.size.width * 0.8, height: geo.size.width * 0.8)
                        .position(x: geo.size.width * 0.1, y: geo.size.height * 0.2)
                        .blur(radius: 40)
                    
                    Circle()
                        .fill(Color(red: 0.55, green: 0.36, blue: 0.96).opacity(0.06))
                        .frame(width: geo.size.width * 0.8, height: geo.size.width * 0.8)
                        .position(x: geo.size.width * 0.9, y: geo.size.height * 0.8)
                        .blur(radius: 40)
                }
                .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 16) {
                        // Top Brand Bar matching Image 1 PWA
                        HStack {
                            // Logo Icon (Heart/Pelvis inside rounded dark square)
                            Image(uiImage: UIImage(named: "logo.png") ?? UIImage())
                                .resizable()
                                .scaledToFit()
                                .frame(width: 36, height: 36)
                                .padding(6)
                                .background(bgCard)
                                .cornerRadius(12)
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(borderColor, lineWidth: 1))
                            
                            Spacer()
                            
                            // VER v1.2.07 PRO Button matching PWA
                            Button(action: {}) {
                                Text("VER v1.2.07 PRO")
                                    .font(.system(size: 11, weight: .bold))
                                    .padding(.vertical, 6)
                                    .padding(.horizontal, 12)
                                    .background(cyanPrimary.opacity(0.12))
                                    .foregroundColor(cyanPrimary)
                                    .cornerRadius(20)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 20)
                                            .stroke(cyanPrimary.opacity(0.4), lineWidth: 1)
                                    )
                            }
                        }
                        .padding(.horizontal)
                        .padding(.top, 6)
                        
                        // Title Section matching PWA Image 1
                        VStack(spacing: 6) {
                            Text("Rèn Luyện Mỗi Ngày")
                                .font(.system(size: 26, weight: .extrabold))
                                .foregroundColor(Color(red: 0.97, green: 0.98, blue: 0.99))
                            Text("Chọn cấp độ phù hợp và làm theo chỉ dẫn của\nvòng tròn sinh học.")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.72))
                                .multilineTextAlignment(.center)
                                .lineSpacing(2)
                        }
                        .padding(.horizontal)
                        
                        // Stats Badges Row matching PWA Image 1
                        HStack(spacing: 10) {
                            HStack(spacing: 6) {
                                Text("⚡")
                                    .font(.system(size: 12))
                                Text("Đã siết: \(engine.totalRepsCompleted) lượt")
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(Color(red: 0.85, green: 0.9, blue: 1.0))
                            }
                            .padding(.vertical, 7)
                            .padding(.horizontal, 14)
                            .background(bgCard)
                            .cornerRadius(20)
                            .overlay(RoundedRectangle(cornerRadius: 20).stroke(borderColor, lineWidth: 1))
                            
                            HStack(spacing: 6) {
                                Circle()
                                    .fill(Color(red: 0.06, green: 0.72, blue: 0.5))
                                    .frame(width: 8, height: 8)
                                Text("Đã đồng bộ Cloud")
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(Color(red: 0.85, green: 0.9, blue: 1.0))
                            }
                            .padding(.vertical, 7)
                            .padding(.horizontal, 14)
                            .background(bgCard)
                            .cornerRadius(20)
                            .overlay(RoundedRectangle(cornerRadius: 20).stroke(borderColor, lineWidth: 1))
                        }
                        .padding(.horizontal)
                        
                        // Main Glassmorphic Workout Card Container matching PWA Image 1
                        VStack(spacing: 16) {
                            // Audio Controls Row matching PWA Image 1
                            HStack(spacing: 12) {
                                Button(action: {
                                    SoundManager.shared.isMutedSFX.toggle()
                                }) {
                                    HStack(spacing: 6) {
                                        Image(systemName: SoundManager.shared.isMutedSFX ? "speaker.slash.fill" : "speaker.wave.2.fill")
                                            .font(.system(size: 13))
                                        Text("Âm báo")
                                            .font(.system(size: 12, weight: .semibold))
                                    }
                                    .padding(.vertical, 8)
                                    .padding(.horizontal, 16)
                                    .background(Color.white.opacity(0.06))
                                    .foregroundColor(SoundManager.shared.isMutedSFX ? .gray : .white)
                                    .cornerRadius(20)
                                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(borderColor, lineWidth: 1))
                                }
                                
                                Button(action: {}) {
                                    HStack(spacing: 6) {
                                        Image(systemName: "music.note")
                                            .font(.system(size: 13))
                                        Text("Nhạc nền")
                                            .font(.system(size: 12, weight: .semibold))
                                    }
                                    .padding(.vertical, 8)
                                    .padding(.horizontal, 16)
                                    .background(Color.white.opacity(0.06))
                                    .foregroundColor(.white)
                                    .cornerRadius(20)
                                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(borderColor, lineWidth: 1))
                                }
                            }
                            .padding(.top, 10)
                            
                            // Visualizer Orb View matching PWA Image 1
                            VisualizerOrbView(engine: engine)
                            
                            // Reps Counter & Phase Progress Segments matching PWA Image 1
                            VStack(spacing: 8) {
                                HStack {
                                    Text("Lượt tập:")
                                        .font(.system(size: 14, weight: .bold))
                                        .foregroundColor(.white)
                                    Spacer()
                                    let displayTotal = engine.totalRepsInWorkout > 0 ? engine.totalRepsInWorkout : 59
                                    Text("\(engine.currentRep) / \(displayTotal)")
                                        .font(.system(size: 14, weight: .bold))
                                        .foregroundColor(.white)
                                }
                                .padding(.horizontal, 4)
                                
                                // Phase Progress Segmented Bar matching PWA Image 1
                                GeometryReader { geo in
                                    let totalPhases = max(1, engine.workoutPhases.count)
                                    let segWidth = (geo.size.width - CGFloat(totalPhases - 1) * 4) / CGFloat(totalPhases)
                                    
                                    HStack(spacing: 4) {
                                        ForEach(0..<totalPhases, id: \.self) { idx in
                                            let phase = engine.workoutPhases[idx]
                                            let isCompleted = phase.isCompleted
                                            
                                            RoundedRectangle(cornerRadius: 3)
                                                .fill(isCompleted ? cyanPrimary : Color.white.opacity(0.12))
                                                .frame(width: segWidth, height: 6)
                                        }
                                    }
                                }
                                .frame(height: 6)
                                
                                // Phase Labels Row below progress bar matching PWA Image 1
                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack(spacing: 12) {
                                        ForEach(engine.workoutPhases, id: \.id) { phase in
                                            Text(phase.name)
                                                .font(.system(size: 10, weight: .medium))
                                                .foregroundColor(phase.isCompleted ? cyanPrimary : Color(red: 0.58, green: 0.64, blue: 0.72))
                                        }
                                    }
                                    .padding(.top, 4)
                                }
                            }
                            .padding(.horizontal)
                            .padding(.top, 4)
                            
                            // Control Action Buttons Row matching PWA Image 1
                            HStack(spacing: 14) {
                                if engine.state == .idle || engine.state == .completed {
                                    Button(action: {
                                        engine.startWorkout()
                                    }) {
                                        HStack {
                                            Image(systemName: "play.fill")
                                            Text("Bắt đầu bài tập")
                                                .font(.system(size: 15, weight: .bold))
                                        }
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 14)
                                        .background(LinearGradient(gradient: Gradient(colors: [cyanPrimary, Color(red: 0.0, green: 0.8, blue: 0.9)]), startPoint: .leading, endPoint: .trailing))
                                        .foregroundColor(.black)
                                        .cornerRadius(12)
                                        .shadow(color: cyanPrimary.opacity(0.3), radius: 8, x: 0, y: 4)
                                    }
                                } else if engine.state == .squeezing || engine.state == .relaxing {
                                    Button(action: {
                                        engine.pauseWorkout()
                                    }) {
                                        HStack {
                                            Image(systemName: "pause.fill")
                                            Text("Tạm dừng")
                                                .font(.system(size: 15, weight: .bold))
                                        }
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 14)
                                        .background(Color.orange)
                                        .foregroundColor(.white)
                                        .cornerRadius(12)
                                    }
                                } else if engine.state == .paused {
                                    Button(action: {
                                        engine.resumeWorkout()
                                    }) {
                                        HStack {
                                            Image(systemName: "play.fill")
                                            Text("Tiếp tục")
                                                .font(.system(size: 15, weight: .bold))
                                        }
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 14)
                                        .background(Color.green)
                                        .foregroundColor(.white)
                                        .cornerRadius(12)
                                    }
                                }
                                
                                if engine.state != .idle {
                                    Button(action: {
                                        engine.resetWorkout()
                                    }) {
                                        Image(systemName: "arrow.counterclockwise")
                                            .font(.system(size: 16, weight: .bold))
                                            .padding(.vertical, 14)
                                            .padding(.horizontal, 18)
                                            .background(Color.white.opacity(0.1))
                                            .foregroundColor(.white)
                                            .cornerRadius(12)
                                    }
                                }
                            }
                            .padding(.horizontal)
                            .padding(.bottom, 16)
                        }
                        .padding(12)
                        .background(bgCard)
                        .cornerRadius(20)
                        .overlay(RoundedRectangle(cornerRadius: 20).stroke(borderColor, lineWidth: 1))
                        .padding(.horizontal)
                        .padding(.bottom, 24)
                    }
                }
            }
            .navigationBarHidden(true)
        }
    }
}
