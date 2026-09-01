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
    private var silentAudioKeeper: AVAudioPlayer?
    private var nativeWorkoutTimer: Timer?

    // Native Autonomous State (Động cơ độc lập tầng Swift)
    private var isWorkoutRunning: Bool = false
    private var currentRoutineName: String = "PC Flex"
    private var currentActionState: String = "squeezing"
    private var currentTimeRemaining: Int = 3
    private var currentRepNum: Int = 1
    private var totalRepsNum: Int = 35
    private var currentSqueezeDuration: Int = 3
    private var currentRelaxDuration: Int = 2
    private var currentStageLabel: String = "Siết cơ PC"
    private var totalTicksExecuted: Int = 0
    private var phaseStartTime: Date = Date()

    private var lastInterruptionEvent: String = "None"
    private var lastRouteChangeEvent: String = "Default"
    private var lastActivityState: String = "Idle"

    #if canImport(ActivityKit)
    @available(iOS 16.1, *)
    private var currentActivity: Activity<PCFlexActivityAttributes>? {
        get { return _currentActivity as? Activity<PCFlexActivityAttributes> }
        set { _currentActivity = newValue }
    }
    #endif

    public override func load() {
        super.load()
        configureAudioSession()
        setupAudioNotifications()
    }

    private func configureAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers, .duckOthers])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {}
    }

    private func setupAudioNotifications() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAudioInterruption),
            name: AVAudioSession.interruptionNotification,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAudioRouteChange),
            name: AVAudioSession.routeChangeNotification,
            object: nil
        )
    }

    @objc private func handleAudioInterruption(notification: Notification) {
        guard let info = notification.userInfo,
              let typeValue = info[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue) else { return }

        if type == .began {
            lastInterruptionEvent = "Began (\(Date().description))"
            notifyListeners("audioInterruption", data: ["event": "began"])
        } else if type == .ended {
            lastInterruptionEvent = "Ended (\(Date().description))"
            configureAudioSession()
            if silentAudioKeeper != nil && !(silentAudioKeeper?.isPlaying ?? false) {
                silentAudioKeeper?.play()
            }
            notifyListeners("audioInterruption", data: ["event": "ended"])
        }
    }

    @objc private func handleAudioRouteChange(notification: Notification) {
        let currentRoute = AVAudioSession.sharedInstance().currentRoute
        let outputs = currentRoute.outputs.map { $0.portName }.joined(separator: ", ")
        lastRouteChangeEvent = outputs.isEmpty ? "Default Speaker" : outputs
        notifyListeners("audioRouteChange", data: ["route": lastRouteChangeEvent])
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
        stopNativeEngine()
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

    // MARK: - Native Swift Autonomous Workout Engine (Tiết kiệm ngân sách ActivityKit, không bao giờ bị iOS chặn)
    private func startNativeEngine() {
        stopNativeEngine()
        isWorkoutRunning = true
        totalTicksExecuted = 0
        phaseStartTime = Date()
        startNativeAudioKeeper()

        DispatchQueue.main.async {
            self.nativeWorkoutTimer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { [weak self] _ in
                self?.handleNativeEngineTick()
            }
            RunLoop.current.add(self.nativeWorkoutTimer!, forMode: .common)
        }
    }

    private func stopNativeEngine() {
        isWorkoutRunning = false
        DispatchQueue.main.async {
            self.nativeWorkoutTimer?.invalidate()
            self.nativeWorkoutTimer = nil
        }
        stopNativeAudioKeeper()
    }

    private func handleNativeEngineTick() {
        guard isWorkoutRunning else { return }
        totalTicksExecuted += 1

        let now = Date()
        let elapsedInPhase = Int(now.timeIntervalSince(phaseStartTime))
        let targetDuration = (currentActionState == "squeezing" || currentActionState == "reverse") ? currentSqueezeDuration : currentRelaxDuration

        if elapsedInPhase >= targetDuration {
            // Hết nhịp -> Chuyển đổi trạng thái Siết <-> Thả lỏng & Gửi 1 bản cập nhật duy nhất tới Dynamic Island
            phaseStartTime = now
            if currentActionState == "squeezing" || currentActionState == "reverse" {
                currentActionState = "relaxing"
                currentTimeRemaining = currentRelaxDuration
                currentStageLabel = "Thả lỏng"
                updateActivityKitContent()
            } else if currentActionState == "relaxing" {
                if currentRepNum < totalRepsNum {
                    currentRepNum += 1
                    currentActionState = "squeezing"
                    currentTimeRemaining = currentSqueezeDuration
                    currentStageLabel = "Siết cơ PC"
                    updateActivityKitContent()
                } else {
                    currentActionState = "complete"
                    currentTimeRemaining = 0
                    currentStageLabel = "Hoàn thành 🎉"
                    updateActivityKitContent()
                    stopNativeEngine()
                }
            }
        } else {
            currentTimeRemaining = max(1, targetDuration - elapsedInPhase)
        }

        // Phát tín hiệu về JavaScript để đồng bộ giao diện trong app
        notifyListeners("nativeWorkoutTick", data: [
            "actionState": currentActionState,
            "timeRemaining": currentTimeRemaining,
            "currentRep": currentRepNum,
            "totalTicks": totalTicksExecuted
        ])
    }

    private func updateActivityKitContent() {
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

    // MARK: - Native Audio Session Keeper
    private func startNativeAudioKeeper() {
        configureAudioSession()
        DispatchQueue.global(qos: .userInteractive).async {
            let sampleRate: Float = 44100.0
            let numSamples = Int(sampleRate * 1.0)
            let dataSize = UInt32(numSamples * 2)
            let totalSize = dataSize + 36

            var wavHeader = [UInt8]()
            wavHeader.append(contentsOf: "RIFF".utf8)
            wavHeader.append(contentsOf: withUnsafeBytes(of: totalSize.littleEndian) { Array($0) })
            wavHeader.append(contentsOf: "WAVEfmt ".utf8)
            wavHeader.append(contentsOf: withUnsafeBytes(of: UInt32(16).littleEndian) { Array($0) })
            wavHeader.append(contentsOf: withUnsafeBytes(of: UInt16(1).littleEndian) { Array($0) })
            wavHeader.append(contentsOf: withUnsafeBytes(of: UInt16(1).littleEndian) { Array($0) })
            wavHeader.append(contentsOf: withUnsafeBytes(of: UInt32(44100).littleEndian) { Array($0) })
            wavHeader.append(contentsOf: withUnsafeBytes(of: UInt32(88200).littleEndian) { Array($0) })
            wavHeader.append(contentsOf: withUnsafeBytes(of: UInt16(2).littleEndian) { Array($0) })
            wavHeader.append(contentsOf: withUnsafeBytes(of: UInt16(16).littleEndian) { Array($0) })
            wavHeader.append(contentsOf: "data".utf8)
            wavHeader.append(contentsOf: withUnsafeBytes(of: dataSize.littleEndian) { Array($0) })

            let pcmData = [Int16](repeating: 0, count: numSamples)
            var completeWav = Data(wavHeader)
            pcmData.withUnsafeBufferPointer { buffer in
                completeWav.append(Data(buffer: buffer))
            }

            DispatchQueue.main.async {
                do {
                    self.silentAudioKeeper = try AVAudioPlayer(data: completeWav)
                    self.silentAudioKeeper?.numberOfLoops = -1
                    self.silentAudioKeeper?.volume = 0.01
                    self.silentAudioKeeper?.prepareToPlay()
                    self.silentAudioKeeper?.play()
                } catch {}
            }
        }
    }

    private func stopNativeAudioKeeper() {
        DispatchQueue.main.async {
            self.silentAudioKeeper?.stop()
            self.silentAudioKeeper = nil
        }
    }

    @objc public func getDiagnosticInfo(_ call: CAPPluginCall) {
        var diagnostic: [String: Any] = [:]
        diagnostic["bundleId"] = Bundle.main.bundleIdentifier ?? "unknown"
        diagnostic["appVersion"] = Bundle.main.infoDictionary?["CFBundleShortVersionString"] ?? "unknown"
        diagnostic["bundlePath"] = Bundle.main.bundlePath
        diagnostic["nativeAudioKeeperRunning"] = silentAudioKeeper?.isPlaying ?? false
        diagnostic["isNativeWorkoutRunning"] = isWorkoutRunning
        diagnostic["nativeTicksExecuted"] = totalTicksExecuted
        diagnostic["currentActionState"] = currentActionState
        diagnostic["currentTimeRemaining"] = currentTimeRemaining
        diagnostic["currentRepNum"] = currentRepNum
        diagnostic["lastInterruption"] = lastInterruptionEvent
        diagnostic["currentAudioRoute"] = lastRouteChangeEvent

        let session = AVAudioSession.sharedInstance()
        diagnostic["audioSessionCategory"] = session.category.rawValue
        diagnostic["audioSessionMode"] = session.mode.rawValue

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
                    "currentRep": act.contentState.currentRep,
                    "targetDateIso": ISO8601DateFormatter().string(from: act.contentState.targetDate)
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
        currentTimeRemaining = call.getInt("timeRemaining") ?? 3
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
            self.lastActivityState = "Active"

            // Bắt đầu động cơ vòng lặp Native Swift không bao giờ dừng
            startNativeEngine()

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
        if let squeeze = call.getInt("squeezeTime") { currentSqueezeDuration = squeeze }
        if let relax = call.getInt("relaxTime") { currentRelaxDuration = relax }

        phaseStartTime = Date()
        updateActivityKitContent()
        call.resolve()
    }

    @objc public func stopActivity(_ call: CAPPluginCall) {
        stopNativeEngine()
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
            self.lastActivityState = "Ended"
            call.resolve()
        }
        #else
        call.resolve()
        #endif
    }
}
