import Foundation
import ActivityKit

#if canImport(ActivityKit)
public struct PCFlexActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var actionState: String    // "squeezing", "relaxing", "reverse", "transition", "breathing"
        public var timeRemaining: Int
        public var currentRep: Int
        public var totalReps: Int
        public var stageLabel: String
        public var startDate: Date
        public var endDate: Date
        
        public init(
            actionState: String, 
            timeRemaining: Int, 
            currentRep: Int, 
            totalReps: Int, 
            stageLabel: String, 
            startDate: Date = Date(), 
            endDate: Date = Date().addingTimeInterval(3)
        ) {
            self.actionState = actionState
            self.timeRemaining = timeRemaining
            self.currentRep = currentRep
            self.totalReps = totalReps
            self.stageLabel = stageLabel
            self.startDate = startDate
            self.endDate = endDate
        }
    }

    public var routineName: String
    public var totalRoutineReps: Int
    
    public init(routineName: String, totalRoutineReps: Int) {
        self.routineName = routineName
        self.totalRoutineReps = totalRoutineReps
    }
}
#endif
