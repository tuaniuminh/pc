import Foundation
import UIKit
import Combine

public final class WorkoutEngine: ObservableObject {
    // MARK: - Published State
    @Published public var state: EngineState = .idle
    @Published public var selectedLevelTab: Int = 1
    @Published public var selectedWorkoutId: String = "goodMorning"
    @Published public var currentStepIndex: Int = 0
    @Published public var timeRemaining: Int = 0
    @Published public var currentRep: Int = 0
    @Published public var totalRepsInWorkout: Int = 0
    
    @Published public var workoutSteps: [WorkoutStep] = []
    @Published public var workoutPhases: [WorkoutPhase] = []
    @Published public var currentPhaseName: String = ""
    
    // Stats & History
    @Published public var history: [WorkoutHistoryLog] = []
    @Published public var streak: Int = 0
    @Published public var totalSessions: Int = 0
    @Published public var totalRepsCompleted: Int = 0
    @Published public var customWorkouts: [CustomWorkout] = []
    
    // User Info
    @Published public var gender: Gender = .male {
        didSet {
            UserDefaults.standard.set(gender.rawValue, forKey: "pc_flex_gender")
            reloadCurrentWorkoutConfig()
        }
    }
    @Published public var birthYear: String = "" {
        didSet { UserDefaults.standard.set(birthYear, forKey: "pc_flex_birth_year") }
    }
    @Published public var geminiApiKey: String = "" {
        didSet { UserDefaults.standard.set(geminiApiKey, forKey: "pc_flex_gemini_key") }
    }

    private var timer: Timer?
    
    public init() {
        loadSavedData()
        autoSelectLevelByTime()
        reloadCurrentWorkoutConfig()
    }
    
    // MARK: - Workout Config & Steps Generation
    public func reloadCurrentWorkoutConfig() {
        guard state == .idle else { return }
        
        let config: WorkoutConfig?
        if selectedWorkoutId.hasPrefix("custom_") {
            let customId = selectedWorkoutId.replacingOccurrences(of: "custom_", with: "")
            if let custom = customWorkouts.first(where: { $0.id == customId }) {
                config = WorkoutConfig(
                    id: selectedWorkoutId,
                    name: custom.name,
                    meta: "Bài tập tự thiết kế",
                    colorHex: "#00f5d4",
                    icon: "🛠️",
                    stages: custom.stages
                )
            } else {
                config = nil
            }
        } else {
            let levelData = ClinicalLevelsData.levels[selectedLevelTab]
            let dict = (gender == .male) ? levelData?.maleWorkouts : levelData?.femaleWorkouts
            config = dict?[selectedWorkoutId]
        }
        
        guard let validConfig = config else { return }
        buildEngineSteps(from: validConfig)
    }
    
    public func selectLevelTab(_ tab: Int) {
        guard state == .idle else { return }
        selectedLevelTab = tab
        if selectedWorkoutId.hasPrefix("custom_") {
            selectedWorkoutId = "goodMorning"
        }
        reloadCurrentWorkoutConfig()
    }
    
    public func selectWorkout(id: String) {
        guard state == .idle else { return }
        selectedWorkoutId = id
        reloadCurrentWorkoutConfig()
    }
    
    private func getTransitionRestDuration(currentStage: WorkoutStage, nextStage: WorkoutStage, workoutName: String) -> Int {
        let nameLower = workoutName.lowercased()
        
        // 1. Chuyển từ bài siết sang kegel ngược nghỉ 10s
        if currentStage.type == .normal && nextStage.type == .reverse {
            return 10
        }
        // 2. Chuyển từ siết 1s sang siết 3s nghỉ 10s (bài combo sức mạnh)
        if currentStage.type == .normal && nextStage.type == .normal && currentStage.squeeze == 1 && nextStage.squeeze == 3 {
            return 10
        }
        // 3. Chuyển từ siết 3s sang siết 3s nghỉ 30s
        if currentStage.type == .normal && nextStage.type == .normal && currentStage.squeeze == 3 && nextStage.squeeze == 3 {
            return 30
        }
        // 4. Chuyển từ siết 3s sang siết 5s nghỉ 60s
        if currentStage.type == .normal && nextStage.type == .normal && currentStage.squeeze == 3 && nextStage.squeeze == 5 {
            return 60
        }
        // 5. Bài kiểm soát cương cứng 6s -> 8s nghỉ 60s
        if currentStage.type == .normal && nextStage.type == .normal && currentStage.squeeze == 6 && nextStage.squeeze == 8 && (nameLower.contains("cương cứng")) {
            return 60
        }
        if let customRest = currentStage.transitionRest, customRest > 0 {
            return customRest
        }
        return 0
    }
    
    private func buildEngineSteps(from config: WorkoutConfig) {
        var steps: [WorkoutStep] = []
        var phases: [WorkoutPhase] = []
        var repIndex = 1
        
        for (sIdx, stage) in config.stages.enumerated() {
            let repsCount = stage.reps
            let start = repIndex
            let stepStart = steps.count
            
            var phaseName = ""
            switch stage.type {
            case .normal: phaseName = "Siết \(stage.squeeze)s"
            case .reverse: phaseName = "Kegel ngược \(stage.squeeze)s"
            case .breathing: phaseName = "Thở bụng"
            }
            
            for r in 1...repsCount {
                let currentRep = start + r - 1
                let nextStage = sIdx < config.stages.count - 1 ? config.stages[sIdx + 1] : nil
                let tRest = (r == repsCount && nextStage != nil) ? getTransitionRestDuration(currentStage: stage, nextStage: nextStage!, workoutName: config.name) : 0
                
                switch stage.type {
                case .normal:
                    steps.append(WorkoutStep(type: .squeezing, duration: max(1, stage.squeeze), action: "SIẾT CƠ", subtext: "Siết chặt cơ sàn chậu - Lượt \(r)/\(repsCount) (\(phaseName))", sfx: .squeeze, orbClass: "squeezing", repIndex: currentRep))
                    if tRest > 0 {
                        steps.append(WorkoutStep(type: .relaxing, duration: tRest, action: "NGHỈ CHUYỂN", subtext: "Nghỉ chuyển bài \(tRest)s - Chuẩn bị giai đoạn tiếp theo", sfx: .transition, orbClass: "resting", repIndex: currentRep))
                    } else {
                        steps.append(WorkoutStep(type: .relaxing, duration: max(1, stage.relax), action: "THẢ LỎNG", subtext: "Thả lỏng cơ sàn chậu - Lượt \(r)/\(repsCount)", sfx: .relax, orbClass: "relaxing", repIndex: currentRep))
                    }
                case .reverse:
                    steps.append(WorkoutStep(type: .squeezing, duration: max(1, stage.squeeze), action: "KEGEL NGƯỢC", subtext: "Hít vào, đẩy nhẹ cơ PC ra ngoài - Lượt \(r)/\(repsCount) (\(phaseName))", sfx: .reverse, orbClass: "resting", repIndex: currentRep))
                    if tRest > 0 {
                        steps.append(WorkoutStep(type: .relaxing, duration: tRest, action: "NGHỈ CHUYỂN", subtext: "Nghỉ chuyển bài \(tRest)s - Chuẩn bị giai đoạn tiếp theo", sfx: .transition, orbClass: "resting", repIndex: currentRep))
                    } else {
                        steps.append(WorkoutStep(type: .relaxing, duration: max(1, stage.relax), action: "NGHỈ", subtext: "Thở ra, thả lỏng cơ sàn chậu tự nhiên - Lượt \(r)/\(repsCount)", sfx: .relax, orbClass: "relaxing", repIndex: currentRep))
                    }
                case .breathing:
                    steps.append(WorkoutStep(type: .squeezing, duration: max(1, stage.squeeze), action: "HÍT VÀO", subtext: "Hít sâu chậm bằng bụng - Lượt \(r)/\(repsCount) (\(phaseName))", sfx: .squeeze, orbClass: "relaxing", repIndex: currentRep))
                    if tRest > 0 {
                        steps.append(WorkoutStep(type: .relaxing, duration: tRest, action: "NGHỈ CHUYỂN", subtext: "Nghỉ chuyển bài \(tRest)s - Chuẩn bị giai đoạn tiếp theo", sfx: .transition, orbClass: "resting", repIndex: currentRep))
                    } else {
                        steps.append(WorkoutStep(type: .relaxing, duration: max(1, stage.relax), action: "THỞ RA", subtext: "Thở ra chậm rãi, xẹp bụng - Lượt \(r)/\(repsCount)", sfx: .relax, orbClass: "relaxing", repIndex: currentRep))
                    }
                }
            }
            
            repIndex += repsCount
            phases.append(WorkoutPhase(name: phaseName, startIndex: stepStart, stepCount: steps.count - stepStart))
        }
        
        self.workoutSteps = steps
        self.workoutPhases = phases
        self.totalRepsInWorkout = steps.last?.repIndex ?? 0
        self.currentStepIndex = 0
    }
    
    // MARK: - Engine Controls
    public func startWorkout() {
        guard !workoutSteps.isEmpty else { return }
        UIApplication.shared.isIdleTimerDisabled = true
        HapticManager.shared.prepare()
        
        currentStepIndex = 0
        executeStep(at: 0)
        startTimerLoop()
    }
    
    public func pauseWorkout() {
        timer?.invalidate()
        timer = nil
        state = .paused
        UIApplication.shared.isIdleTimerDisabled = false
    }
    
    public func resumeWorkout() {
        UIApplication.shared.isIdleTimerDisabled = true
        startTimerLoop()
    }
    
    public func resetWorkout() {
        timer?.invalidate()
        timer = nil
        state = .idle
        currentStepIndex = 0
        timeRemaining = 0
        currentRep = 0
        UIApplication.shared.isIdleTimerDisabled = false
        reloadCurrentWorkoutConfig()
    }
    
    private func startTimerLoop() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            self.tick()
        }
    }
    
    private func tick() {
        if timeRemaining > 1 {
            timeRemaining -= 1
        } else {
            // Next step
            if currentStepIndex + 1 < workoutSteps.count {
                currentStepIndex += 1
                executeStep(at: currentStepIndex)
            } else {
                finishWorkout()
            }
        }
    }
    
    private func executeStep(at index: Int) {
        guard index >= 0 && index < workoutSteps.count else { return }
        let step = workoutSteps[index]
        
        timeRemaining = step.duration
        state = (step.type == .squeezing) ? .squeezing : .relaxing
        currentRep = step.repIndex
        
        // Trigger Sound & Haptic
        switch step.sfx {
        case .squeeze:
            SoundManager.shared.playSqueezeSound()
            HapticManager.shared.playSqueezeHaptic()
        case .reverse:
            SoundManager.shared.playReverseKegelSound()
            HapticManager.shared.playReverseHaptic()
        case .transition:
            SoundManager.shared.playTransitionRestSound()
            HapticManager.shared.playTransitionHaptic()
        case .relax:
            SoundManager.shared.playRelaxSound()
            HapticManager.shared.playRelaxHaptic()
        }
        
        // Update Phase status
        for i in 0..<workoutPhases.count {
            let p = workoutPhases[i]
            if index >= p.startIndex && index < p.startIndex + p.stepCount {
                currentPhaseName = p.name
            }
            if index >= p.startIndex + p.stepCount {
                workoutPhases[i].isCompleted = true
            }
        }
    }
    
    private func finishWorkout() {
        timer?.invalidate()
        timer = nil
        state = .completed
        UIApplication.shared.isIdleTimerDisabled = false
        
        SoundManager.shared.playCompletionSound()
        HapticManager.shared.playCompletionHaptic()
        
        // Save log
        let df = DateFormatter()
        df.dateFormat = "HH:mm - dd/MM/yyyy"
        let dateStr = df.string(from: Date())
        
        let configName = workoutSteps.first?.subtext ?? "Bài Tập"
        let log = WorkoutHistoryLog(
            dateFormatted: dateStr,
            levelName: configName,
            levelKey: selectedWorkoutId,
            levelTab: selectedLevelTab,
            repsCompleted: totalRepsInWorkout,
            gender: gender
        )
        
        history.insert(log, at: 0)
        totalSessions += 1
        totalRepsCompleted += totalRepsInWorkout
        calculateStreak()
        saveData()
    }
    
    private func calculateStreak() {
        guard !history.isEmpty else { streak = 0; return }
        
        let calendar = Calendar.current
        var dates: [Date] = []
        let isoFormatter = ISO8601DateFormatter()
        
        for item in history {
            if let date = isoFormatter.date(from: item.timestamp) {
                let components = calendar.dateComponents([.year, .month, .day], from: date)
                if let cleanDate = calendar.date(from: components), !dates.contains(cleanDate) {
                    dates.append(cleanDate)
                }
            }
        }
        
        dates.sort(by: >)
        guard let mostRecent = dates.first else { streak = 0; return }
        
        let today = calendar.startOfDay(for: Date())
        let diff = calendar.dateComponents([.day], from: mostRecent, to: today).day ?? 0
        
        if diff > 1 {
            streak = 0
            return
        }
        
        var currentStreak = 1
        for i in 0..<(dates.count - 1) {
            let dayDiff = calendar.dateComponents([.day], from: dates[i+1], to: dates[i]).day ?? 0
            if dayDiff == 1 {
                currentStreak += 1
            } else {
                break
            }
        }
        streak = currentStreak
    }
    
    private func autoSelectLevelByTime() {
        let hour = Calendar.current.component(.hour, from: Date())
        if hour >= 5 && hour < 10 {
            selectedWorkoutId = "goodMorning"
        } else if hour >= 10 && hour < 19 {
            selectedWorkoutId = "powerCombo"
        } else {
            selectedWorkoutId = "nightRecovery"
        }
    }
    
    // MARK: - Persistence
    public func saveData() {
        let encoder = JSONEncoder()
        if let historyData = try? encoder.encode(history) {
            UserDefaults.standard.set(historyData, forKey: "pc_flex_history")
        }
        if let customData = try? encoder.encode(customWorkouts) {
            UserDefaults.standard.set(customData, forKey: "pc_flex_custom_workouts")
        }
        UserDefaults.standard.set(streak, forKey: "pc_flex_streak")
        UserDefaults.standard.set(totalSessions, forKey: "pc_flex_total_sessions")
        UserDefaults.standard.set(totalRepsCompleted, forKey: "pc_flex_total_reps")
    }
    
    public func loadSavedData() {
        let decoder = JSONDecoder()
        if let historyData = UserDefaults.standard.data(forKey: "pc_flex_history"),
           let loadedHistory = try? decoder.decode([WorkoutHistoryLog].self, from: historyData) {
            self.history = loadedHistory
        }
        if let customData = UserDefaults.standard.data(forKey: "pc_flex_custom_workouts"),
           let loadedCustom = try? decoder.decode([CustomWorkout].self, from: customData) {
            self.customWorkouts = loadedCustom
        }
        
        self.streak = UserDefaults.standard.integer(forKey: "pc_flex_streak")
        self.totalSessions = UserDefaults.standard.integer(forKey: "pc_flex_total_sessions")
        self.totalRepsCompleted = UserDefaults.standard.integer(forKey: "pc_flex_total_reps")
        
        if let gStr = UserDefaults.standard.string(forKey: "pc_flex_gender"),
           let g = Gender(rawValue: gStr) {
            self.gender = g
        }
        self.birthYear = UserDefaults.standard.string(forKey: "pc_flex_birth_year") ?? ""
        self.geminiApiKey = UserDefaults.standard.string(forKey: "pc_flex_gemini_key") ?? ""
        
        calculateStreak()
    }
    
    public func clearAllData() {
        history.removeAll()
        streak = 0
        totalSessions = 0
        totalRepsCompleted = 0
        customWorkouts.removeAll()
        saveData()
    }
}
