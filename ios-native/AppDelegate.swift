import UIKit
import Capacitor
import AVFoundation
#if canImport(ActivityKit)
import ActivityKit
#endif

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // 1. Cấu hình AVAudioSession để phát âm thanh nền liên tục khi ẩn app hoặc khóa màn hình
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers, .duckOthers])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Lỗi cấu hình AVAudioSession:", error)
        }

        // 2. Dọn dẹp tất cả các Live Activities mồ côi từ phiên trước khi khởi động app
        #if canImport(ActivityKit)
        if #available(iOS 16.1, *) {
            for activity in Activity<PCFlexActivityAttributes>.activities {
                Task {
                    await activity.end(dismissalPolicy: .immediate)
                }
            }
        }
        #endif

        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {}

    func applicationDidEnterBackground(_ application: UIApplication) {}

    func applicationWillEnterForeground(_ application: UIApplication) {}

    func applicationDidBecomeActive(_ application: UIApplication) {
        try? AVAudioSession.sharedInstance().setActive(true)
    }

    // 3. Tự động dọn dẹp và hủy hoàn toàn Dynamic Island khi người dùng vuốt thoát app trong đa nhiệm
    func applicationWillTerminate(_ application: UIApplication) {
        #if canImport(ActivityKit)
        if #available(iOS 16.1, *) {
            for activity in Activity<PCFlexActivityAttributes>.activities {
                Task {
                    await activity.end(dismissalPolicy: .immediate)
                }
            }
        }
        #endif
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}
