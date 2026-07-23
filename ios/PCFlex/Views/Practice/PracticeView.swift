import SwiftUI

public struct PracticeView: View {
    @ObservedObject var engine: WorkoutEngine
    
    public var body: some View {
        NavigationView {
            ZStack {
                Color(red: 0.06, green: 0.09, blue: 0.16)
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 20) {
                        // Header Stats & Gender Selector
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Rèn Luyện Mỗi Ngày")
                                    .font(.system(size: 24, weight: .bold))
                                    .foregroundColor(.white)
                                Text("Chọn cấp độ phù hợp và theo dõi nhịp sinh học.")
                                    .font(.system(size: 13))
                                    .foregroundColor(.gray)
                            }
                            Spacer()
                        }
                        .padding(.horizontal)
                        
                        // Indicators Badges
                        HStack(spacing: 12) {
                            HStack(spacing: 6) {
                                Text("⚡")
                                Text("Đã siết: \(engine.totalRepsCompleted) lượt")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundColor(Color(red: 0.0, green: 0.96, blue: 0.83))
                            }
                            .padding(.vertical, 8)
                            .padding(.horizontal, 12)
                            .background(Color(red: 0.0, green: 0.96, blue: 0.83).opacity(0.1))
                            .cornerRadius(10)
                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color(red: 0.0, green: 0.96, blue: 0.83).opacity(0.3), lineWidth: 1))
                            
                            HStack(spacing: 6) {
                                Text("🔥")
                                Text("Streak: \(engine.streak) ngày")
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundColor(.orange)
                            }
                            .padding(.vertical, 8)
                            .padding(.horizontal, 12)
                            .background(Color.orange.opacity(0.1))
                            .cornerRadius(10)
                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.orange.opacity(0.3), lineWidth: 1))
                            
                            Spacer()
                        }
                        .padding(.horizontal)
                        
                        // Level Tabs (1 - 5)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 10) {
                                ForEach(1...5, id: \.self) { levelTab in
                                    Button(action: {
                                        engine.selectLevelTab(levelTab)
                                    }) {
                                        Text("Cấp độ \(levelTab)")
                                            .font(.system(size: 13, weight: .bold))
                                            .padding(.vertical, 8)
                                            .padding(.horizontal, 16)
                                            .background(engine.selectedLevelTab == levelTab ? Color(red: 0.0, green: 0.96, blue: 0.83) : Color.white.opacity(0.08))
                                            .foregroundColor(engine.selectedLevelTab == levelTab ? .black : .white)
                                            .cornerRadius(12)
                                    }
                                    .disabled(engine.state != .idle)
                                }
                            }
                            .padding(.horizontal)
                        }
                        
                        // Workout Selector List
                        VStack(spacing: 12) {
                            if let levelData = ClinicalLevelsData.levels[engine.selectedLevelTab] {
                                let dict = (engine.gender == .male) ? levelData.maleWorkouts : levelData.femaleWorkouts
                                ForEach(Array(dict.keys), id: \.self) { key in
                                    if let config = dict[key] {
                                        Button(action: {
                                            engine.selectWorkout(id: key)
                                        }) {
                                            HStack(spacing: 12) {
                                                Text(config.icon)
                                                    .font(.system(size: 24))
                                                VStack(alignment: .leading, spacing: 4) {
                                                    Text(config.name)
                                                        .font(.system(size: 16, weight: .bold))
                                                        .foregroundColor(.white)
                                                    Text(config.meta)
                                                        .font(.system(size: 12))
                                                        .foregroundColor(.gray)
                                                        .lineLimit(1)
                                                }
                                                Spacer()
                                                if engine.selectedWorkoutId == key {
                                                    Image(systemName: "checkmark.circle.fill")
                                                        .foregroundColor(Color(red: 0.0, green: 0.96, blue: 0.83))
                                                }
                                            }
                                            .padding()
                                            .background(engine.selectedWorkoutId == key ? Color.white.opacity(0.12) : Color.white.opacity(0.04))
                                            .cornerRadius(14)
                                            .overlay(
                                                RoundedRectangle(cornerRadius: 14)
                                                    .stroke(engine.selectedWorkoutId == key ? Color(red: 0.0, green: 0.96, blue: 0.83).opacity(0.5) : Color.white.opacity(0.1), lineWidth: 1)
                                            )
                                        }
                                        .disabled(engine.state != .idle)
                                    }
                                }
                            }
                        }
                        .padding(.horizontal)
                        
                        // Visualizer Orb View
                        VisualizerOrbView(engine: engine)
                        
                        // Controls Section
                        HStack(spacing: 16) {
                            if engine.state == .idle || engine.state == .completed {
                                Button(action: {
                                    engine.startWorkout()
                                }) {
                                    HStack {
                                        Image(systemName: "play.fill")
                                        Text("Bắt đầu bài tập")
                                            .font(.system(size: 16, weight: .bold))
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(LinearGradient(gradient: Gradient(colors: [Color(red: 0.0, green: 0.96, blue: 0.83), Color(red: 0.0, green: 0.8, blue: 0.9)]), startPoint: .leading, endPoint: .trailing))
                                    .foregroundColor(.black)
                                    .cornerRadius(14)
                                }
                            } else if engine.state == .squeezing || engine.state == .relaxing {
                                Button(action: {
                                    engine.pauseWorkout()
                                }) {
                                    HStack {
                                        Image(systemName: "pause.fill")
                                        Text("Tạm dừng")
                                            .font(.system(size: 16, weight: .bold))
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color.orange)
                                    .foregroundColor(.white)
                                    .cornerRadius(14)
                                }
                            } else if engine.state == .paused {
                                Button(action: {
                                    engine.resumeWorkout()
                                }) {
                                    HStack {
                                        Image(systemName: "play.fill")
                                        Text("Tiếp tục")
                                            .font(.system(size: 16, weight: .bold))
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color.green)
                                    .foregroundColor(.white)
                                    .cornerRadius(14)
                                }
                            }
                            
                            if engine.state != .idle {
                                Button(action: {
                                    engine.resetWorkout()
                                }) {
                                    Image(systemName: "arrow.counterclockwise")
                                        .font(.system(size: 18, weight: .bold))
                                        .padding()
                                        .background(Color.white.opacity(0.1))
                                        .foregroundColor(.white)
                                        .cornerRadius(14)
                                }
                            }
                        }
                        .padding(.horizontal)
                        .padding(.bottom, 30)
                    }
                }
            }
            .navigationBarHidden(true)
        }
    }
}
