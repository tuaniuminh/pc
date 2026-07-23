import SwiftUI

public struct PracticeView: View {
    @ObservedObject var engine: WorkoutEngine
    
    // Fixed ordered workout keys to prevent dynamic dictionary sorting during timer ticks
    private let defaultWorkoutKeys = ["goodMorning", "powerCombo", "nightRest"]
    
    public var body: some View {
        NavigationView {
            ZStack {
                // Background Gradient matching PWA CSS
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color(red: 0.04, green: 0.05, blue: 0.09),
                        Color(red: 0.06, green: 0.09, blue: 0.16)
                    ]),
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 18) {
                        // Top Brand Bar matching PWA Sidebar/Header
                        HStack {
                            HStack(spacing: 10) {
                                Image(uiImage: UIImage(named: "logo.png") ?? UIImage())
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 32, height: 32)
                                
                                Text("PC FLEX")
                                    .font(.system(size: 20, weight: .black, design: .rounded))
                                    .foregroundColor(.white)
                            }
                            
                            Spacer()
                            
                            Text("VER v1.2.03 PRO")
                                .font(.system(size: 10, weight: .bold))
                                .padding(.vertical, 4)
                                .padding(.horizontal, 10)
                                .background(Color(red: 0.0, green: 0.96, blue: 0.83).opacity(0.15))
                                .foregroundColor(Color(red: 0.0, green: 0.96, blue: 0.83))
                                .cornerRadius(20)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 20)
                                        .stroke(Color(red: 0.0, green: 0.96, blue: 0.83).opacity(0.4), lineWidth: 1)
                                )
                        }
                        .padding(.horizontal)
                        .padding(.top, 10)
                        
                        // Header Title & Gender Pill Toggle
                        VStack(spacing: 12) {
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Rèn Luyện Mỗi Ngày")
                                        .font(.system(size: 22, weight: .bold))
                                        .foregroundColor(.white)
                                    Text("Chọn cấp độ phù hợp và theo dõi nhịp sinh học.")
                                        .font(.system(size: 12))
                                        .foregroundColor(.gray)
                                }
                                Spacer()
                            }
                            
                            // Gender Pill Selector (Matching PWA)
                            HStack(spacing: 8) {
                                Button(action: {
                                    engine.gender = .male
                                }) {
                                    Text("Nam giới")
                                        .font(.system(size: 13, weight: .bold))
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 8)
                                        .background(engine.gender == .male ? Color(red: 0.0, green: 0.96, blue: 0.83) : Color.white.opacity(0.06))
                                        .foregroundColor(engine.gender == .male ? .black : .white)
                                        .cornerRadius(10)
                                }
                                .disabled(engine.state != .idle)
                                
                                Button(action: {
                                    engine.gender = .female
                                }) {
                                    Text("Nữ giới")
                                        .font(.system(size: 13, weight: .bold))
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 8)
                                        .background(engine.gender == .female ? Color(red: 0.93, green: 0.28, blue: 0.6) : Color.white.opacity(0.06))
                                        .foregroundColor(engine.gender == .female ? .white : .white)
                                        .cornerRadius(10)
                                }
                                .disabled(engine.state != .idle)
                            }
                        }
                        .padding(.horizontal)
                        
                        // Stat Badges & Sound Mute Toggle Row
                        HStack(spacing: 10) {
                            HStack(spacing: 6) {
                                Text("⚡")
                                Text("Đã siết: \(engine.totalRepsCompleted) lượt")
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(Color(red: 0.0, green: 0.96, blue: 0.83))
                            }
                            .padding(.vertical, 6)
                            .padding(.horizontal, 10)
                            .background(Color(red: 0.0, green: 0.96, blue: 0.83).opacity(0.1))
                            .cornerRadius(10)
                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color(red: 0.0, green: 0.96, blue: 0.83).opacity(0.3), lineWidth: 1))
                            
                            HStack(spacing: 6) {
                                Text("🔥")
                                Text("Streak: \(engine.streak) ngày")
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(.orange)
                            }
                            .padding(.vertical, 6)
                            .padding(.horizontal, 10)
                            .background(Color.orange.opacity(0.1))
                            .cornerRadius(10)
                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.orange.opacity(0.3), lineWidth: 1))
                            
                            Spacer()
                            
                            // Sound Mute Toggle Button
                            Button(action: {
                                SoundManager.shared.isMutedSFX.toggle()
                            }) {
                                Image(systemName: SoundManager.shared.isMutedSFX ? "speaker.slash.fill" : "speaker.wave.2.fill")
                                    .font(.system(size: 14))
                                    .foregroundColor(SoundManager.shared.isMutedSFX ? .gray : Color(red: 0.0, green: 0.96, blue: 0.83))
                                    .padding(8)
                                    .background(Color.white.opacity(0.08))
                                    .cornerRadius(10)
                            }
                        }
                        .padding(.horizontal)
                        
                        // Level Tabs (1 - 5) matching PWA
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(1...5, id: \.self) { levelTab in
                                    Button(action: {
                                        engine.selectLevelTab(levelTab)
                                    }) {
                                        Text("Cấp độ \(levelTab)")
                                            .font(.system(size: 12, weight: .bold))
                                            .padding(.vertical, 8)
                                            .padding(.horizontal, 14)
                                            .background(engine.selectedLevelTab == levelTab ? Color(red: 0.0, green: 0.96, blue: 0.83) : Color.white.opacity(0.06))
                                            .foregroundColor(engine.selectedLevelTab == levelTab ? .black : .white)
                                            .cornerRadius(10)
                                    }
                                    .disabled(engine.state != .idle)
                                }
                            }
                            .padding(.horizontal)
                        }
                        
                        // Workout Selector List (Optimized for 0 Scroll Lag)
                        VStack(spacing: 10) {
                            if let levelData = ClinicalLevelsData.levels[engine.selectedLevelTab] {
                                let dict = (engine.gender == .male) ? levelData.maleWorkouts : levelData.femaleWorkouts
                                ForEach(defaultWorkoutKeys, id: \.self) { key in
                                    if let config = dict[key] {
                                        Button(action: {
                                            engine.selectWorkout(id: key)
                                        }) {
                                            HStack(spacing: 12) {
                                                Text(config.icon)
                                                    .font(.system(size: 22))
                                                VStack(alignment: .leading, spacing: 3) {
                                                    Text(config.name)
                                                        .font(.system(size: 15, weight: .bold))
                                                        .foregroundColor(.white)
                                                    Text(config.meta)
                                                        .font(.system(size: 11))
                                                        .foregroundColor(.gray)
                                                        .lineLimit(1)
                                                }
                                                Spacer()
                                                if engine.selectedWorkoutId == key {
                                                    Image(systemName: "checkmark.circle.fill")
                                                        .foregroundColor(Color(red: 0.0, green: 0.96, blue: 0.83))
                                                }
                                            }
                                            .padding(12)
                                            .background(engine.selectedWorkoutId == key ? Color.white.opacity(0.1) : Color.white.opacity(0.04))
                                            .cornerRadius(12)
                                            .overlay(
                                                RoundedRectangle(cornerRadius: 12)
                                                    .stroke(engine.selectedWorkoutId == key ? Color(red: 0.0, green: 0.96, blue: 0.83).opacity(0.5) : Color.white.opacity(0.08), lineWidth: 1)
                                            )
                                        }
                                        .disabled(engine.state != .idle)
                                    }
                                }
                            }
                        }
                        .padding(.horizontal)
                        
                        // Visualizer Orb View (Isolated Subview)
                        VisualizerOrbView(engine: engine)
                        
                        // Controls Section matching PWA buttons
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
                                    .background(LinearGradient(gradient: Gradient(colors: [Color(red: 0.0, green: 0.96, blue: 0.83), Color(red: 0.0, green: 0.8, blue: 0.9)]), startPoint: .leading, endPoint: .trailing))
                                    .foregroundColor(.black)
                                    .cornerRadius(12)
                                    .shadow(color: Color(red: 0.0, green: 0.96, blue: 0.83).opacity(0.3), radius: 8, x: 0, y: 4)
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
                        .padding(.bottom, 24)
                    }
                }
            }
            .navigationBarHidden(true)
        }
    }
}
