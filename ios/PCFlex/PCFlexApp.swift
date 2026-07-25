import SwiftUI

/**
 * PC Flex Native iOS App (Swift & SwiftUI)
 * Version 1.2.28 - Add PSI and PDF Exporter to Stable Branch
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
