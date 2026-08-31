import Foundation
import Capacitor
import ActivityKit
import AudioToolbox
import AVFoundation

@objc(LiveActivityPlugin)
public class LiveActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LiveActivityPlugin"
    public let jsName = "LiveActivityPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopActivity", returnType: CAPPluginReturnPromise)
    ]

    private var _currentActivity: Any?

    #if canImport(ActivityKit)
    @available(iOS 16.1, *)
    private var currentActivity: Activity<PCFlexActivityAttributes>? {
        get { return _currentActivity as? Activity<PCFlexActivityAttributes> }
        set { _currentActivity = newValue }
    }
    #endif

    public override func load() {
        super.load()
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers, .duckOthers])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {}
    }

    deinit {
        #if canImport(ActivityKit)
        if #available(iOS 16.1, *) {
            for act in Activity<PCFlexActivityAttributes>.activities {
                Task {
                    await act.end(dismissalPolicy: .immediate)
                }
            }
        }
        #endif
    }

    @objc public func startActivity(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        guard #available(iOS 16.1, *) else {
            call.reject("Live Activities yêu cầu iOS 16.1 trở lên")
            return
        }

        let routineName = call.getString("routineName") ?? "PC Flex"
        let totalReps = call.getInt("totalReps") ?? 25
        let actionState = call.getString("actionState") ?? "squeezing"
        let timeRemaining = call.getInt("timeRemaining") ?? 5
        let currentRep = call.getInt("currentRep") ?? 1
        let stageLabel = call.getString("stageLabel") ?? "Siết cơ PC"
        let targetDate = Date().addingTimeInterval(Double(max(1, timeRemaining)))

        let attributes = PCFlexActivityAttributes(
            routineName: routineName,
            totalRoutineReps: totalReps
        )

        let initialContentState = PCFlexActivityAttributes.ContentState(
            actionState: actionState,
            timeRemaining: timeRemaining,
            currentRep: currentRep,
            totalReps: totalReps,
            stageLabel: stageLabel,
            targetDate: targetDate
        )

        do {
            // Dọn dẹp activity cũ
            for oldAct in Activity<PCFlexActivityAttributes>.activities {
                Task {
                    await oldAct.end(dismissalPolicy: .immediate)
                }
            }

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

    @objc public func updateActivity(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        guard #available(iOS 16.1, *) else {
            call.resolve()
            return
        }

        let activity = self.currentActivity ?? Activity<PCFlexActivityAttributes>.activities.first
        guard let liveAct = activity else {
            call.resolve()
            return
        }

        let actionState = call.getString("actionState") ?? "squeezing"
        let timeRemaining = call.getInt("timeRemaining") ?? 5
        let currentRep = call.getInt("currentRep") ?? 1
        let totalReps = call.getInt("totalReps") ?? 25
        let stageLabel = call.getString("stageLabel") ?? "Siết cơ PC"
        let targetDate = Date().addingTimeInterval(Double(max(1, timeRemaining)))

        let contentState = PCFlexActivityAttributes.ContentState(
            actionState: actionState,
            timeRemaining: timeRemaining,
            currentRep: currentRep,
            totalReps: totalReps,
            stageLabel: stageLabel,
            targetDate: targetDate
        )

        Task {
            await liveAct.update(using: contentState)
            call.resolve()
        }
        #else
        call.resolve()
        #endif
    }

    @objc public func stopActivity(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        guard #available(iOS 16.1, *) else {
            call.resolve()
            return
        }

        Task {
            for act in Activity<PCFlexActivityAttributes>.activities {
                await act.end(dismissalPolicy: .immediate)
            }
            self.currentActivity = nil
            call.resolve()
        }
        #else
        call.resolve()
        #endif
    }
}
