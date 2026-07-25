import SwiftUI

/**
 * PC Flex Native iOS App (Swift & SwiftUI)
 * Version 1.3.0 - TrollStore Compatible (Major Features: Somatic Breathing, Rank System, Gemini 3.6 Flash & PSI PDF)
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
