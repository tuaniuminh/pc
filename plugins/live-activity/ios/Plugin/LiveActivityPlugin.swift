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
        stopNativeAudioKeeper()
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

    // Bộ phát âm thanh nền Native vô hạn để ngăn iOS WebKit đóng băng (0% CPU, 100% Background Keep-Alive)
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
                    self.silentAudioKeeper?.numberOfLoops = -1 // Lặp vô hạn trong nền
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

        let routineName = call.getString("routineName") ?? "PC Flex"
        let totalReps = call.getInt("totalReps") ?? 25
        let actionState = call.getString("actionState") ?? "squeezing"
        let timeRemaining = call.getInt("timeRemaining") ?? 2
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
            self.lastActivityState = "Active"

            // Theo dõi vòng đời của ActivityKit trong nền
            Task {
                for await state in activity.activityStateUpdates {
                    self.lastActivityState = String(describing: state)
                    self.notifyListeners("activityStateChanged", data: ["state": String(describing: state)])
                }
            }

            // Bắt đầu phát luồng âm thanh giữ nhịp nền
            startNativeAudioKeeper()

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
        let timeRemaining = call.getInt("timeRemaining") ?? 2
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
        stopNativeAudioKeeper()
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
