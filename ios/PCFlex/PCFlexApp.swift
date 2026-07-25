import SwiftUI

/**
 * PC Flex Native iOS App (Swift & SwiftUI)
 * Version 1.2.31 - Top Navbar and Diagnostic Bug Logger
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
