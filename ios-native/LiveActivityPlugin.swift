import Foundation
import Capacitor
import ActivityKit

@objc(LiveActivityPlugin)
public class LiveActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LiveActivityPlugin"
    public let jsName = "LiveActivityPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startActivity", returnType: CAPPluginMethodReturnPromise),
        CAPPluginMethod(name: "updateActivity", returnType: CAPPluginMethodReturnPromise),
        CAPPluginMethod(name: "stopActivity", returnType: CAPPluginMethodReturnPromise)
    ]

    #if canImport(ActivityKit)
    private var currentActivity: Activity<PCFlexActivityAttributes>?
    #endif

    @objc func startActivity(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        guard #available(iOS 16.1, *) else {
            call.reject("Live Activities yêu cầu iOS 16.1 trở lên")
            return
        }

        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            call.reject("Live Activities chưa được cấp quyền trong Cài đặt iOS")
            return
        }

        let routineName = call.getString("routineName") ?? "PC Flex"
        let totalRoutineReps = call.getInt("totalReps") ?? 25
        let actionState = call.getString("actionState") ?? "squeezing"
        let timeRemaining = call.getInt("timeRemaining") ?? 5
        let currentRep = call.getInt("currentRep") ?? 1
        let stageLabel = call.getString("stageLabel") ?? "Siết cơ PC"

        let attributes = PCFlexActivityAttributes(
            routineName: routineName,
            totalRoutineReps: totalRoutineReps
        )

        let initialContentState = PCFlexActivityAttributes.ContentState(
            actionState: actionState,
            timeRemaining: timeRemaining,
            currentRep: currentRep,
            totalReps: totalRoutineReps,
            stageLabel: stageLabel
        )

        do {
            let activity = try Activity<PCFlexActivityAttributes>.request(
                attributes: attributes,
                contentState: initialContentState,
                pushType: nil
            )
            self.currentActivity = activity
            call.resolve([
                "activityId": activity.id
            ])
        } catch {
            call.reject("Lỗi tạo Live Activity: \(error.localizedDescription)")
        }
        #else
        call.reject("ActivityKit không được hỗ trợ trên thiết bị này")
        #endif
    }

    @objc func updateActivity(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        guard #available(iOS 16.1, *), let activity = self.currentActivity else {
            call.resolve()
            return
        }

        let actionState = call.getString("actionState") ?? "squeezing"
        let timeRemaining = call.getInt("timeRemaining") ?? 5
        let currentRep = call.getInt("currentRep") ?? 1
        let totalReps = call.getInt("totalReps") ?? 25
        let stageLabel = call.getString("stageLabel") ?? "Siết cơ PC"

        let updatedContentState = PCFlexActivityAttributes.ContentState(
            actionState: actionState,
            timeRemaining: timeRemaining,
            currentRep: currentRep,
            totalReps: totalReps,
            stageLabel: stageLabel
        )

        Task {
            await activity.update(using: updatedContentState)
            call.resolve()
        }
        #else
        call.resolve()
        #endif
    }

    @objc func stopActivity(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        guard #available(iOS 16.1, *), let activity = self.currentActivity else {
            call.resolve()
            return
        }

        Task {
            await activity.end(dismissalPolicy: .immediate)
            self.currentActivity = nil
            call.resolve()
        }
        #else
        call.resolve()
        #endif
    }
}
