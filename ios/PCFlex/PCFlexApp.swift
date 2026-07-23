import SwiftUI

/**
 * PC Flex Native iOS App (Swift & SwiftUI)
 * Version 1.2.15 - TrollStore Compatible (Native WakeLock & Hidden Scrollbars)
 */
@main
struct PCFlexApp: App {
    var body: some Scene {
        WindowGroup {
            MainTabView()
                .preferredColorScheme(.dark)
        }
    }
}
