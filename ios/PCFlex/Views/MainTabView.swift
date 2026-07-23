import SwiftUI

public struct MainTabView: View {
    @StateObject private var engine = WorkoutEngine()
    
    public init() {
        UITabBar.appearance().barTintColor = UIColor(red: 0.06, green: 0.09, blue: 0.16, alpha: 1.0)
        UITabBar.appearance().backgroundColor = UIColor(red: 0.06, green: 0.09, blue: 0.16, alpha: 1.0)
    }
    
    public var body: some View {
        TabView {
            PracticeView(engine: engine)
                .tabItem {
                    Image(systemName: "flame.fill")
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
        .accentColor(Color(red: 0, green: 0.96, blue: 0.83))
    }
}
