import SwiftUI

/**
 * PC Flex Native iOS App (Swift & SwiftUI)
 * Version 1.2.24 - TrollStore Compatible (Fix Synthesizer Engine & Sound Studio Tab Placement)
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
