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
    private var nativeTimer: Timer?
    private var backgroundTaskId: UIBackgroundTaskIdentifier = .invalid

    private var currentRoutineName: String = "PC Flex"
    private var totalReps: Int = 25
    private var currentRep: Int = 1
    private var actionState: String = "squeezing"
    private var timeRemaining: Int = 5
    private var stageDuration: Int = 5
    private var stageLabel: String = "Siết cơ PC"
    private var squeezeTime: Int = 1
    private var relaxTime: Int = 2
    private var hapticsEnabled: Bool = true
    private var sfxEnabled: Bool = true

    #if canImport(ActivityKit)
    @available(iOS 16.1, *)
    private var currentActivity: Activity<PCFlexActivityAttributes>? {
        get { return _currentActivity as? Activity<PCFlexActivityAttributes> }
        set { _currentActivity = newValue }
    }
    #endif

    public override func load() {
        super.load()
        NotificationCenter.default.addObserver(self, selector: #selector(handleAppDidEnterBackground), name: UIApplication.didEnterBackgroundNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(handleAppWillEnterForeground), name: UIApplication.willEnterForegroundNotification, object: nil)
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
        stopNativeEngine()
    }

    @objc private func handleAppDidEnterBackground() {
        if nativeTimer != nil {
            if backgroundTaskId != .invalid {
                UIApplication.shared.endBackgroundTask(backgroundTaskId)
            }
            backgroundTaskId = UIApplication.shared.beginBackgroundTask(withName: "PCFlexWorkoutEngineBackground") { [weak self] in
                self?.stopNativeEngine()
            }
        }
    }

    @objc private func handleAppWillEnterForeground() {
        if backgroundTaskId != .invalid {
            UIApplication.shared.endBackgroundTask(backgroundTaskId)
            backgroundTaskId = .invalid
        }
    }

    private func startNativeEngine() {
        stopNativeEngine()

        backgroundTaskId = UIApplication.shared.beginBackgroundTask(withName: "PCFlexWorkoutEngine") { [weak self] in
            self?.stopNativeEngine()
        }

        DispatchQueue.main.async {
            self.nativeTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
                self?.handleNativeTick()
            }
            if let timer = self.nativeTimer {
                RunLoop.main.add(timer, forMode: .common)
            }
        }
    }

    private func stopNativeEngine() {
        nativeTimer?.invalidate()
        nativeTimer = nil

        if backgroundTaskId != .invalid {
            UIApplication.shared.endBackgroundTask(backgroundTaskId)
            backgroundTaskId = .invalid
        }

        #if canImport(ActivityKit)
        if #available(iOS 16.1, *) {
            for act in Activity<PCFlexActivityAttributes>.activities {
                Task {
                    await act.end(dismissalPolicy: .immediate)
                }
            }
            self.currentActivity = nil
        }
        #endif
    }

    private func handleNativeTick() {
        if timeRemaining > 1 {
            timeRemaining -= 1
            if timeRemaining <= 3 && stageDuration >= 5 {
                if sfxEnabled {
                    AudioServicesPlaySystemSound(1057)
                }
            }
        } else {
            // Chuyển pha
            if actionState == "squeezing" || actionState == "reverse" {
                actionState = "relaxing"
                timeRemaining = max(1, relaxTime)
                stageDuration = timeRemaining
                stageLabel = "Thả lỏng"
                
                // TUYỆT ĐỐI KHÔNG RUNG KHI THẢ LỎNG (Chỉ phát âm thanh nếu sfxEnabled)
                if sfxEnabled {
                    AudioServicesPlaySystemSound(1103) // Tink sound thuần âm thanh
                }
            } else {
                if currentRep < totalReps {
                    currentRep += 1
                    actionState = "squeezing"
                    timeRemaining = max(1, squeezeTime)
                    stageDuration = timeRemaining
                    stageLabel = "Siết cơ PC"

                    // Phát âm thanh nếu sfxEnabled
                    if sfxEnabled {
                        AudioServicesPlaySystemSound(1057)
                    }

                    // Chỉ rung phản hồi khi người dùng BẬT rung trong cài đặt
                    if hapticsEnabled {
                        DispatchQueue.main.async {
                            let generator = UIImpactFeedbackGenerator(style: .medium)
                            generator.prepare()
                            generator.impactOccurred()
                        }
                    }
                } else {
                    // Hoàn thành toàn bộ bài tập
                    if sfxEnabled {
                        AudioServicesPlaySystemSound(1025)
                    }
                    if hapticsEnabled {
                        DispatchQueue.main.async {
                            let generator = UINotificationFeedbackGenerator()
                            generator.prepare()
                            generator.notificationOccurred(.success)
                        }
                    }
                    stopNativeEngine()
                    notifyListeners("workoutCompleted", data: ["success": true])
                    return
                }
            }
        }

        // Cập nhật Live Activity trên Dynamic Island & Màn hình khóa
        updateLiveActivityNative()

        // Bắn sự kiện đồng bộ ngược về Javascript UI
        notifyListeners("workoutTick", data: [
            "actionState": actionState,
            "timeRemaining": timeRemaining,
            "currentRep": currentRep,
            "totalReps": totalReps,
            "stageLabel": stageLabel
        ])
    }

    private func updateLiveActivityNative() {
        #if canImport(ActivityKit)
        guard #available(iOS 16.1, *) else { return }

        let activity = self.currentActivity ?? Activity<PCFlexActivityAttributes>.activities.first
        guard let liveAct = activity else { return }

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
        }
        #endif
    }

    @objc public func startActivity(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        guard #available(iOS 16.1, *) else {
            call.reject("Live Activities yêu cầu iOS 16.1 trở lên")
            return
        }

        currentRoutineName = call.getString("routineName") ?? "PC Flex"
        totalReps = call.getInt("totalReps") ?? 25
        actionState = call.getString("actionState") ?? "squeezing"
        timeRemaining = call.getInt("timeRemaining") ?? 5
        stageDuration = timeRemaining
        currentRep = call.getInt("currentRep") ?? 1
        stageLabel = call.getString("stageLabel") ?? "Siết cơ PC"
        squeezeTime = call.getInt("squeezeTime") ?? max(1, timeRemaining)
        relaxTime = call.getInt("relaxTime") ?? 2
        hapticsEnabled = call.getBool("hapticsEnabled") ?? true
        sfxEnabled = call.getBool("sfxEnabled") ?? true

        let targetDate = Date().addingTimeInterval(Double(max(1, timeRemaining)))

        let attributes = PCFlexActivityAttributes(
            routineName: currentRoutineName,
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

            // Bắt đầu Native Workout Engine độc lập
            startNativeEngine()

            // Âm thanh mở đầu
            if sfxEnabled {
                AudioServicesPlaySystemSound(1057)
            }
            if hapticsEnabled {
                DispatchQueue.main.async {
                    let generator = UIImpactFeedbackGenerator(style: .medium)
                    generator.prepare()
                    generator.impactOccurred()
                }
            }

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
        if let newAction = call.getString("actionState") { actionState = newAction }
        if let newTime = call.getInt("timeRemaining") { timeRemaining = newTime }
        if let newRep = call.getInt("currentRep") { currentRep = newRep }
        if let newLabel = call.getString("stageLabel") { stageLabel = newLabel }
        if let newHaptics = call.getBool("hapticsEnabled") { hapticsEnabled = newHaptics }
        if let newSfx = call.getBool("sfxEnabled") { sfxEnabled = newSfx }
        updateLiveActivityNative()
        call.resolve()
    }

    @objc public func stopActivity(_ call: CAPPluginCall) {
        stopNativeEngine()
        call.resolve()
    }
}
