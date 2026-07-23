import Foundation

// MARK: - Enums
public enum Gender: String, Codable, CaseIterable {
    case male = "male"
    case female = "female"
    
    public var displayName: String {
        switch self {
        case .male: return "Nam giới"
        case .female: return "Nữ giới"
        }
    }
}

public enum StageType: String, Codable {
    case normal = "normal"
    case reverse = "reverse"
    case breathing = "breathing"
}

public enum SFXType: String, Codable {
    case squeeze
    case reverse
    case transition
    case relax
}

public enum StepType: String, Codable {
    case squeezing
    case relaxing
}

public enum EngineState: String, Codable {
    case idle
    case squeezing
    case relaxing
    case paused
    case completed
}

// MARK: - Models
public struct WorkoutStage: Codable, Identifiable, Hashable {
    public var id: UUID = UUID()
    public var type: StageType
    public var squeeze: Int
    public var relax: Int
    public var reps: Int
    public var transitionRest: Int?
    
    public init(id: UUID = UUID(), type: StageType = .normal, squeeze: Int, relax: Int, reps: Int, transitionRest: Int? = nil) {
        self.id = id
        self.type = type
        self.squeeze = squeeze
        self.relax = relax
        self.reps = reps
        self.transitionRest = transitionRest
    }
    
    private enum CodingKeys: String, CodingKey {
        case type, squeeze, relax, reps, transitionRest
    }
}

public struct WorkoutConfig: Codable, Identifiable {
    public var id: String
    public var name: String
    public var meta: String
    public var colorHex: String
    public var icon: String
    public var stages: [WorkoutStage]
    
    public init(id: String, name: String, meta: String, colorHex: String, icon: String, stages: [WorkoutStage]) {
        self.id = id
        self.name = name
        self.meta = meta
        self.colorHex = colorHex
        self.icon = icon
        self.stages = stages
    }
}

public struct WorkoutStep: Identifiable, Codable {
    public var id: UUID = UUID()
    public var type: StepType
    public var duration: Int
    public var action: String
    public var subtext: String
    public var sfx: SFXType
    public var orbClass: String
    public var repIndex: Int
    
    public init(id: UUID = UUID(), type: StepType, duration: Int, action: String, subtext: String, sfx: SFXType, orbClass: String, repIndex: Int) {
        self.id = id
        self.type = type
        self.duration = duration
        self.action = action
        self.subtext = subtext
        self.sfx = sfx
        self.orbClass = orbClass
        self.repIndex = repIndex
    }
}

public struct WorkoutPhase: Identifiable, Codable {
    public var id: UUID = UUID()
    public var name: String
    public var startIndex: Int
    public var stepCount: Int
    public var isCompleted: Bool = false
    
    public init(id: UUID = UUID(), name: String, startIndex: Int, stepCount: Int, isCompleted: Bool = false) {
        self.id = id
        self.name = name
        self.startIndex = startIndex
        self.stepCount = stepCount
        self.isCompleted = isCompleted
    }
}

public struct WorkoutHistoryLog: Codable, Identifiable {
    public var id: String
    public var timestamp: String
    public var dateFormatted: String
    public var levelName: String
    public var levelKey: String
    public var levelTab: Int
    public var repsCompleted: Int
    public var gender: Gender
    
    public init(id: String = UUID().uuidString, timestamp: String = ISO8601DateFormatter().string(from: Date()), dateFormatted: String, levelName: String, levelKey: String, levelTab: Int, repsCompleted: Int, gender: Gender) {
        self.id = id
        self.timestamp = timestamp
        self.dateFormatted = dateFormatted
        self.levelName = levelName
        self.levelKey = levelKey
        self.levelTab = levelTab
        self.repsCompleted = repsCompleted
        self.gender = gender
    }
}

public struct CustomWorkout: Codable, Identifiable {
    public var id: String
    public var name: String
    public var stages: [WorkoutStage]
    public var createdAt: String
    
    public init(id: String = UUID().uuidString, name: String, stages: [WorkoutStage], createdAt: String = ISO8601DateFormatter().string(from: Date())) {
        self.id = id
        self.name = name
        self.stages = stages
        self.createdAt = createdAt
    }
}

public struct UserProfile: Codable {
    public var gender: Gender
    public var birthYear: String?
    public var geminiApiKey: String?
    
    public init(gender: Gender = .male, birthYear: String? = nil, geminiApiKey: String? = nil) {
        self.gender = gender
        self.birthYear = birthYear
        self.geminiApiKey = geminiApiKey
    }
}

public struct BackupDataPayload: Codable {
    public var pc_flex_history: [WorkoutHistoryLog]
    public var pc_flex_streak: Int
    public var pc_flex_total_sessions: Int
    public var pc_flex_total_reps: Int
    public var pc_flex_custom_workouts: [CustomWorkout]
    public var pc_flex_gender: String
    public var pc_flex_birth_year: String
    public var pc_flex_gemini_key: String
}

public struct BackupContainer: Codable {
    public var version: String
    public var app: String
    public var exportedAt: String
    public var data: BackupDataPayload
}
