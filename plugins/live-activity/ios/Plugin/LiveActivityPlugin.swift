import Foundation
import Capacitor
import ActivityKit
import AVFoundation

@objc(LiveActivityPlugin)
public class LiveActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LiveActivityPlugin"
    public let jsName = "LiveActivityPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getDiagnosticInfo", returnType: CAPPluginReturnPromise)
    ]

    private var _currentActivity: Any?
    private var nativeTimer: Timer?

    // Real-time workout tracking in Swift
    private var currentRoutineName: String = "PC Flex"
    private var currentActionState: String = "squeezing"
    private var currentTimeRemaining: Int = 2
    private var currentRepNum: Int = 1
    private var totalRepsNum: Int = 30
    private var currentStageLabel: String = "Siết cơ PC"
    private var currentSqueezeDuration: Int = 2
    private var currentRelaxDuration: Int = 2

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
        stopNativeTimer()
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

    private func stopNativeTimer() {
        DispatchQueue.main.async {
            self.nativeTimer?.invalidate()
            self.nativeTimer = nil
        }
    }

    private func startNativeWorkoutLoop() {
        stopNativeTimer()
        DispatchQueue.main.async {
            self.nativeTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
                self?.handleNativeTimerTick()
            }
            RunLoop.current.add(self.nativeTimer!, forMode: .common)
        }
    }

    private func handleNativeTimerTick() {
        if currentTimeRemaining > 1 {
            currentTimeRemaining -= 1
            updateActivityState()
        } else {
            // Hết giây của phase hiện tại -> Tự động chuyển đổi nhịp Siết <-> Thả lỏng
            if currentActionState == "squeezing" || currentActionState == "reverse" {
                currentActionState = "relaxing"
                currentTimeRemaining = currentRelaxDuration
                currentStageLabel = "Thả lỏng cơ"
                updateActivityState()
            } else if currentActionState == "relaxing" {
                if currentRepNum < totalRepsNum {
                    currentRepNum += 1
                    currentActionState = "squeezing"
                    currentTimeRemaining = currentSqueezeDuration
                    currentStageLabel = "Siết cơ PC"
                    updateActivityState()
                } else {
                    currentActionState = "complete"
                    currentTimeRemaining = 0
                    currentStageLabel = "Hoàn thành bài tập 🎉"
                    stopNativeTimer()
                    updateActivityState()
                }
            }
        }

        // Gửi tín hiệu về JavaScript để đồng bộ giao diện
        notifyListeners("workoutTick", data: [
            "actionState": currentActionState,
            "timeRemaining": currentTimeRemaining,
            "currentRep": currentRepNum
        ])
    }

    private func updateActivityState() {
        #if canImport(ActivityKit)
        guard #available(iOS 16.1, *) else { return }
        guard let activity = self.currentActivity ?? Activity<PCFlexActivityAttributes>.activities.first else { return }

        let targetDate = Date().addingTimeInterval(Double(max(1, currentTimeRemaining)))
        let contentState = PCFlexActivityAttributes.ContentState(
            actionState: currentActionState,
            timeRemaining: currentTimeRemaining,
            currentRep: currentRepNum,
            totalReps: totalRepsNum,
            stageLabel: currentStageLabel,
            targetDate: targetDate
        )

        Task {
            await activity.update(using: contentState)
        }
        #endif
    }

    @objc public func getDiagnosticInfo(_ call: CAPPluginCall) {
        var diagnostic: [String: Any] = [:]
        diagnostic["bundleId"] = Bundle.main.bundleIdentifier ?? "unknown"
        diagnostic["appVersion"] = Bundle.main.infoDictionary?["CFBundleShortVersionString"] ?? "unknown"
        diagnostic["bundlePath"] = Bundle.main.bundlePath

        let pluginsPath = Bundle.main.bundlePath + "/PlugIns"
        let fileManager = FileManager.default
        let hasPlugIns = fileManager.fileExists(atPath: pluginsPath)
        diagnostic["hasPlugInsFolder"] = hasPlugIns

        if hasPlugIns {
            let plugIns = (try? fileManager.contentsOfDirectory(atPath: pluginsPath)) ?? []
            diagnostic["plugInsList"] = plugIns
            diagnostic["hasWidgetExtension"] = plugIns.contains(where: { $0.contains("Widget") || $0.contains("appex") })
        } else {
            diagnostic["plugInsList"] = []
            diagnostic["hasWidgetExtension"] = false
        }

        #if canImport(ActivityKit)
        if #available(iOS 16.1, *) {
            let authInfo = ActivityAuthorizationInfo()
            diagnostic["areActivitiesEnabled"] = authInfo.areActivitiesEnabled
            
            let allActivities = Activity<PCFlexActivityAttributes>.activities
            diagnostic["activeActivitiesCount"] = allActivities.count
            diagnostic["activeActivities"] = allActivities.map { act in
                return [
                    "id": act.id,
                    "state": String(describing: act.activityState),
                    "actionState": act.contentState.actionState,
                    "timeRemaining": act.contentState.timeRemaining,
                    "currentRep": act.contentState.currentRep
                ]
            }
        } else {
            diagnostic["areActivitiesEnabled"] = false
            diagnostic["activityKitSupported"] = false
        }
        #else
        diagnostic["areActivitiesEnabled"] = false
        diagnostic["activityKitSupported"] = false
        #endif

        call.resolve(diagnostic)
    }

    @objc public func startActivity(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        guard #available(iOS 16.1, *) else {
            call.reject("Live Activities yêu cầu iOS 16.1 trở lên")
            return
        }

        let authInfo = ActivityAuthorizationInfo()
        if !authInfo.areActivitiesEnabled {
            call.reject("Live Activities chưa được bật trong Cài đặt iOS của máy (Settings -> PC Flex -> Live Activities)")
            return
        }

        currentRoutineName = call.getString("routineName") ?? "PC Flex"
        totalRepsNum = call.getInt("totalReps") ?? 25
        currentActionState = call.getString("actionState") ?? "squeezing"
        currentTimeRemaining = call.getInt("timeRemaining") ?? 2
        currentRepNum = call.getInt("currentRep") ?? 1
        currentStageLabel = call.getString("stageLabel") ?? "Siết cơ PC"
        currentSqueezeDuration = call.getInt("squeezeTime") ?? max(1, currentTimeRemaining)
        currentRelaxDuration = call.getInt("relaxTime") ?? 2

        let targetDate = Date().addingTimeInterval(Double(max(1, currentTimeRemaining)))

        let attributes = PCFlexActivityAttributes(
            routineName: currentRoutineName,
            totalRoutineReps: totalRepsNum
        )

        let initialContentState = PCFlexActivityAttributes.ContentState(
            actionState: currentActionState,
            timeRemaining: currentTimeRemaining,
            currentRep: currentRepNum,
            totalReps: totalRepsNum,
            stageLabel: currentStageLabel,
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

            // Bắt đầu vòng lặp Native trong Swift để đảm bảo đếm giờ liên tục 100% trong nền
            startNativeWorkoutLoop()

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
        if let state = call.getString("actionState") { currentActionState = state }
        if let time = call.getInt("timeRemaining") { currentTimeRemaining = time }
        if let rep = call.getInt("currentRep") { currentRepNum = rep }
        if let total = call.getInt("totalReps") { totalRepsNum = total }
        if let label = call.getString("stageLabel") { currentStageLabel = label }

        updateActivityState()
        call.resolve()
    }

    @objc public func stopActivity(_ call: CAPPluginCall) {
        stopNativeTimer()
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
