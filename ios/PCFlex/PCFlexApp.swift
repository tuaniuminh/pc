import SwiftUI

/**
 * PC Flex Native iOS App (Swift & SwiftUI)
 * Version 1.2.12 - TrollStore Compatible (Swift Native Audio Bridge & Background Audio)
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
