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
        CAPPluginMethod(name: "stopActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getDiagnosticInfo", returnType: CAPPluginReturnPromise)
    ]

    private var _currentActivity: Any?
    private var nativeTimer: Timer?
    private var audioPlayer: AVAudioPlayer?

    // Workout State Tracking
    private var currentRoutineName: String = "PC Flex"
    private var currentActionState: String = "squeezing"
    private var currentTimeRemaining: Int = 1
    private var currentRepNum: Int = 1
    private var totalRepsNum: Int = 25
    private var currentStageLabel: String = "Siết cơ PC"
    private var currentSqueezeDuration: Int = 1
    private var currentRelaxDuration: Int = 2
    private var currentVolume: Float = 0.8
    private var isHapticsEnabled: Bool = false
    private var isSfxEnabled: Bool = true

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

    // Bộ phát âm thanh Native AVAudioPlayer chuẩn âm lượng 10% - 100%
    private func playNativeSound(frequency: Float, duration: Float, volume: Float) {
        guard isSfxEnabled && volume > 0 else { return }
        DispatchQueue.global(qos: .userInteractive).async {
            let sampleRate: Float = 44100.0
            let numSamples = Int(sampleRate * duration)
            var pcmData = [Int16](repeating: 0, count: numSamples)

            for i in 0..<numSamples {
                let time = Float(i) / sampleRate
                // Tạo sóng Sine với Envelope làm mịn đầu và cuối
                let angle = 2.0 * Float.pi * frequency * time
                var envelope: Float = 1.0
                if i < 200 { envelope = Float(i) / 200.0 }
                else if i > numSamples - 600 { envelope = Float(numSamples - i) / 600.0 }
                
                let sampleValue = sin(angle) * envelope * 30000.0
                pcmData[i] = Int16(clamping: Int(sampleValue))
            }

            var wavHeader = [UInt8]()
            let dataSize = UInt32(numSamples * 2)
            let totalSize = dataSize + 36

            // RIFF Header
            wavHeader.append(contentsOf: "RIFF".utf8)
            wavHeader.append(contentsOf: withUnsafeBytes(of: totalSize.littleEndian) { Array($0) })
            wavHeader.append(contentsOf: "WAVE".utf8)
            // fmt Subchunk
            wavHeader.append(contentsOf: "fmt ".utf8)
            wavHeader.append(contentsOf: withUnsafeBytes(of: UInt32(16).littleEndian) { Array($0) })
            wavHeader.append(contentsOf: withUnsafeBytes(of: UInt16(1).littleEndian) { Array($0) })
            wavHeader.append(contentsOf: withUnsafeBytes(of: UInt16(1).littleEndian) { Array($0) })
            wavHeader.append(contentsOf: withUnsafeBytes(of: UInt32(44100).littleEndian) { Array($0) })
            wavHeader.append(contentsOf: withUnsafeBytes(of: UInt32(88200).littleEndian) { Array($0) })
            wavHeader.append(contentsOf: withUnsafeBytes(of: UInt16(2).littleEndian) { Array($0) })
            wavHeader.append(contentsOf: withUnsafeBytes(of: UInt16(16).littleEndian) { Array($0) })
            // data Subchunk
            wavHeader.append(contentsOf: "data".utf8)
            wavHeader.append(contentsOf: withUnsafeBytes(of: dataSize.littleEndian) { Array($0) })

            var completeWav = Data(wavHeader)
            pcmData.withUnsafeBufferPointer { buffer in
                completeWav.append(Data(buffer: buffer))
            }

            DispatchQueue.main.async {
                do {
                    try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers, .duckOthers])
                    try AVAudioSession.sharedInstance().setActive(true)
                    self.audioPlayer = try AVAudioPlayer(data: completeWav)
                    self.audioPlayer?.volume = max(0.05, min(1.0, volume))
                    self.audioPlayer?.prepareToPlay()
                    self.audioPlayer?.play()
                } catch {}
            }
        }
    }

    private func triggerNativeHaptic(style: UIImpactFeedbackGenerator.FeedbackStyle) {
        guard isHapticsEnabled else { return }
        DispatchQueue.main.async {
            let generator = UIImpactFeedbackGenerator(style: style)
            generator.prepare()
            generator.impactOccurred()
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
            // Hết giây của hiệp hiện tại -> Chuyển đổi trạng thái
            if currentActionState == "squeezing" || currentActionState == "reverse" {
                // Chuyển sang Thả lỏng
                currentActionState = "relaxing"
                currentTimeRemaining = currentRelaxDuration
                currentStageLabel = "Thả lỏng cơ"
                playNativeSound(frequency: 440.0, duration: 0.25, volume: currentVolume)
                triggerNativeHaptic(style: .light)
                updateActivityState()
            } else if currentActionState == "relaxing" {
                // Chuyển sang Hiệp siết tiếp theo
                if currentRepNum < totalRepsNum {
                    currentRepNum += 1
                    currentActionState = "squeezing"
                    currentTimeRemaining = currentSqueezeDuration
                    currentStageLabel = "Siết cơ PC"
                    playNativeSound(frequency: 880.0, duration: 0.35, volume: currentVolume)
                    triggerNativeHaptic(style: .medium)
                    updateActivityState()
                } else {
                    // Hoàn thành toàn bộ bài tập
                    currentActionState = "complete"
                    currentTimeRemaining = 0
                    currentStageLabel = "Hoàn thành bài tập 🎉"
                    playNativeSound(frequency: 1046.5, duration: 0.6, volume: currentVolume)
                    triggerNativeHaptic(style: .heavy)
                    stopNativeTimer()
                    updateActivityState()
                }
            }
        }

        // Báo về cho JavaScript
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
        currentTimeRemaining = call.getInt("timeRemaining") ?? 5
        currentRepNum = call.getInt("currentRep") ?? 1
        currentStageLabel = call.getString("stageLabel") ?? "Siết cơ PC"
        currentSqueezeDuration = call.getInt("squeezeTime") ?? max(1, currentTimeRemaining)
        currentRelaxDuration = call.getInt("relaxTime") ?? 2
        isHapticsEnabled = call.getBool("hapticsEnabled") ?? false
        isSfxEnabled = call.getBool("sfxEnabled") ?? true
        currentVolume = Float(call.getDouble("volume") ?? 0.8)

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

            // Kích hoạt Native Workout Loop để đếm giờ và phát âm thanh liên tục trong nền
            playNativeSound(frequency: 880.0, duration: 0.35, volume: currentVolume)
            triggerNativeHaptic(style: .medium)
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
