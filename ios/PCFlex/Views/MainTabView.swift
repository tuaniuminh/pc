import SwiftUI
import UIKit

public struct MainTabView: View {
    @StateObject private var engine = WorkoutEngine()
    
    public init() {
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor(red: 0.04, green: 0.06, blue: 0.1, alpha: 1.0)
        
        UITabBar.appearance().standardAppearance = appearance
        if #available(iOS 15.0, *) {
            UITabBar.appearance().scrollEdgeAppearance = appearance
        }
    }
    
    public var body: some View {
        TabView {
            PracticeView(engine: engine)
                .tabItem {
                    Image(systemName: "play.fill")
                    Text("Luyện Tập")
                }
            
            MedicalLibraryView(engine: engine)
                .tabItem {
                    Image(systemName: "book.fill")
                    Text("Giáo Trình Y Khoa")
                }
            
            ProgressView(engine: engine)
                .tabItem {
                    Image(systemName: "chart.bar.fill")
                    Text("Tiến Độ")
                }
        }
        .accentColor(Color(red: 0.0, green: 0.96, blue: 0.83))
    }
}
