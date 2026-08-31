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
    private var nativeAudioPlayer: AVAudioPlayer?

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
    private var soundVolume: Float = 0.8

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

        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers, .duckOthers])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {}
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

    private func playNativeTone(freq: Double, duration: Double, vol: Float) {
        guard sfxEnabled else { return }
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }
            let sampleRate: Double = 44100.0
            let numSamples = Int(sampleRate * duration)
            var pcmData = Data()

            // Build 16-bit mono PCM
            for i in 0..<numSamples {
                let t = Double(i) / sampleRate
                let attack = min(1.0, Double(i) / (sampleRate * 0.01))
                let decay = min(1.0, Double(numSamples - i) / (sampleRate * 0.04))
                let val = sin(2.0 * .pi * freq * t) * attack * decay
                let intVal = Int16(max(-32767, min(32767, val * 32767.0)))
                var littleEndian = intVal.littleEndian
                pcmData.append(UnsafeBufferPointer(start: &littleEndian, count: 1))
            }

            // WAV Header
            var header = Data()
            header.append("RIFF".data(using: .ascii)!)
            var fileSize = UInt32(36 + pcmData.count).littleEndian
            header.append(UnsafeBufferPointer(start: &fileSize, count: 1))
            header.append("WAVEfmt ".data(using: .ascii)!)
            var subchunk1Size = UInt32(16).littleEndian
            header.append(UnsafeBufferPointer(start: &subchunk1Size, count: 1))
            var audioFormat = UInt16(1).littleEndian // PCM
            header.append(UnsafeBufferPointer(start: &audioFormat, count: 1))
            var numChannels = UInt16(1).littleEndian // Mono
            header.append(UnsafeBufferPointer(start: &numChannels, count: 1))
            var sampleRateInt = UInt32(sampleRate).littleEndian
            header.append(UnsafeBufferPointer(start: &sampleRateInt, count: 1))
            var byteRate = UInt32(sampleRate * 2.0).littleEndian
            header.append(UnsafeBufferPointer(start: &byteRate, count: 1))
            var blockAlign = UInt16(2).littleEndian
            header.append(UnsafeBufferPointer(start: &blockAlign, count: 1))
            var bitsPerSample = UInt16(16).littleEndian
            header.append(UnsafeBufferPointer(start: &bitsPerSample, count: 1))
            header.append("data".data(using: .ascii)!)
            var dataSize = UInt32(pcmData.count).littleEndian
            header.append(UnsafeBufferPointer(start: &dataSize, count: 1))

            var fullWav = Data()
            fullWav.append(header)
            fullWav.append(pcmData)

            DispatchQueue.main.async {
                do {
                    self.nativeAudioPlayer = try AVAudioPlayer(data: fullWav)
                    self.nativeAudioPlayer?.volume = max(0.05, min(1.0, vol))
                    self.nativeAudioPlayer?.play()
                } catch {
                    AudioServicesPlaySystemSound(1057)
                }
            }
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
                playNativeTone(freq: 600.0, duration: 0.1, vol: soundVolume * 0.7)
            }
        } else {
            // Chuyển pha
            if actionState == "squeezing" || actionState == "reverse" {
                actionState = "relaxing"
                timeRemaining = max(1, relaxTime)
                stageDuration = timeRemaining
                stageLabel = "Thả lỏng"

                // Phát âm thanh Thả lỏng theo âm lượng cài đặt
                playNativeTone(freq: 480.0, duration: 0.22, vol: soundVolume)

                if hapticsEnabled {
                    DispatchQueue.main.async {
                        let generator = UIImpactFeedbackGenerator(style: .light)
                        generator.prepare()
                        generator.impactOccurred()
                    }
                }
            } else {
                if currentRep < totalReps {
                    currentRep += 1
                    actionState = "squeezing"
                    timeRemaining = max(1, squeezeTime)
                    stageDuration = timeRemaining
                    stageLabel = "Siết cơ PC"

                    // Phát âm thanh Siết cơ to rõ theo âm lượng cài đặt
                    playNativeTone(freq: 880.0, duration: 0.25, vol: soundVolume)

                    if hapticsEnabled {
                        DispatchQueue.main.async {
                            let generator = UIImpactFeedbackGenerator(style: .medium)
                            generator.prepare()
                            generator.impactOccurred()
                        }
                    }
                } else {
                    // Hoàn thành toàn bộ bài tập
                    playNativeTone(freq: 1046.5, duration: 0.6, vol: soundVolume)
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

        updateLiveActivityNative()

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

        let rawVol = call.getFloat("volume") ?? 0.8
        soundVolume = max(0.1, min(1.0, rawVol))

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

            startNativeEngine()

            playNativeTone(freq: 880.0, duration: 0.25, vol: soundVolume)
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
        if let newVol = call.getFloat("volume") { soundVolume = max(0.1, min(1.0, newVol)) }
        updateLiveActivityNative()
        call.resolve()
    }

    @objc public func stopActivity(_ call: CAPPluginCall) {
        stopNativeEngine()
        call.resolve()
    }
}
