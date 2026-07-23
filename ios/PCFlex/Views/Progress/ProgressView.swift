import SwiftUI
import UniformTypeIdentifiers

public struct ProgressView: View {
    @ObservedObject var engine: WorkoutEngine
    
    @State private var showingBackupShare: Bool = false
    @State private var backupURL: URL? = nil
    @State private var showingFileImporter: Bool = false
    @State private var alertMessage: String? = nil
    @State private var showAlert: Bool = false
    
    public var body: some View {
        NavigationView {
            ZStack {
                Color(red: 0.06, green: 0.09, blue: 0.16)
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        // Header
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Tiến Độ Tập Luyện")
                                .font(.system(size: 24, weight: .bold))
                                .foregroundColor(.white)
                            Text("Theo dõi hành trình kiên trì rèn luyện sức mạnh sàn chậu.")
                                .font(.system(size: 13))
                                .foregroundColor(.gray)
                        }
                        .padding(.horizontal)
                        
                        // Stats Grid (3 Cards)
                        HStack(spacing: 12) {
                            VStack(spacing: 6) {
                                Text("🔥")
                                    .font(.system(size: 24))
                                Text("\(engine.streak) ngày")
                                    .font(.system(size: 18, weight: .bold))
                                    .foregroundColor(.orange)
                                Text("Chuỗi ngày tập")
                                    .font(.system(size: 10))
                                    .foregroundColor(.gray)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.white.opacity(0.04))
                            .cornerRadius(14)
                            
                            VStack(spacing: 6) {
                                Text("🏆")
                                    .font(.system(size: 24))
                                Text("\(engine.totalSessions) hiệp")
                                    .font(.system(size: 18, weight: .bold))
                                    .foregroundColor(Color(red: 0, green: 0.96, blue: 0.83))
                                Text("Tổng hiệp tập")
                                    .font(.system(size: 10))
                                    .foregroundColor(.gray)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.white.opacity(0.04))
                            .cornerRadius(14)
                            
                            VStack(spacing: 6) {
                                Text("⚡")
                                    .font(.system(size: 24))
                                Text("\(engine.totalRepsCompleted) lượt")
                                    .font(.system(size: 18, weight: .bold))
                                    .foregroundColor(Color(red: 0.58, green: 0.36, blue: 0.96))
                                Text("Tổng lượt siết")
                                    .font(.system(size: 10))
                                    .foregroundColor(.gray)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.white.opacity(0.04))
                            .cornerRadius(14)
                        }
                        .padding(.horizontal)
                        
                        // User Profile Card
                        VStack(alignment: .leading, spacing: 14) {
                            Text("👤 Hồ Sơ Tập Luyện")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.white)
                            
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Năm sinh:")
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(.gray)
                                TextField("Ví dụ: 1995", text: $engine.birthYear)
                                    .textFieldStyle(PlainTextFieldStyle())
                                    .padding(10)
                                    .background(Color.white.opacity(0.08))
                                    .cornerRadius(8)
                                    .foregroundColor(.white)
                                    .keyboardType(.numberPad)
                            }
                            
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Gemini API Key:")
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(.gray)
                                SecureField("Nhập khóa API (AIzaSy...)", text: $engine.geminiApiKey)
                                    .textFieldStyle(PlainTextFieldStyle())
                                    .padding(10)
                                    .background(Color.white.opacity(0.08))
                                    .cornerRadius(8)
                                    .foregroundColor(.white)
                            }
                        }
                        .padding()
                        .background(Color.white.opacity(0.04))
                        .cornerRadius(16)
                        .padding(.horizontal)
                        
                        // Data Management Card (Backup & Restore JSON)
                        VStack(alignment: .leading, spacing: 14) {
                            Text("💾 Quản Lý Dữ Liệu")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.white)
                            Text("Sao lưu lịch sử tập luyện và hồ sơ cá nhân ra tệp JSON hoặc khôi phục dữ liệu từ tệp tin đã lưu.")
                                .font(.system(size: 12))
                                .foregroundColor(.gray)
                            
                            HStack(spacing: 12) {
                                Button(action: {
                                    exportBackupJSON()
                                }) {
                                    HStack {
                                        Image(systemName: "square.and.arrow.up")
                                        Text("Sao lưu JSON")
                                            .font(.system(size: 13, weight: .bold))
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(Color.blue.opacity(0.2))
                                    .foregroundColor(Color(red: 0.58, green: 0.77, blue: 1.0))
                                    .cornerRadius(10)
                                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.blue.opacity(0.4), lineWidth: 1))
                                }
                                
                                Button(action: {
                                    showingFileImporter = true
                                }) {
                                    HStack {
                                        Image(systemName: "square.and.arrow.down")
                                        Text("Khôi phục JSON")
                                            .font(.system(size: 13, weight: .bold))
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(Color.green.opacity(0.2))
                                    .foregroundColor(Color(red: 0.43, green: 0.91, blue: 0.72))
                                    .cornerRadius(10)
                                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.green.opacity(0.4), lineWidth: 1))
                                }
                            }
                        }
                        .padding()
                        .background(Color.white.opacity(0.04))
                        .cornerRadius(16)
                        .padding(.horizontal)
                        
                        // History Log Section
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text("Lịch Sử Tập Luyện")
                                    .font(.system(size: 18, weight: .bold))
                                    .foregroundColor(.white)
                                Spacer()
                                Button(action: {
                                    engine.clearAllData()
                                }) {
                                    Text("Xóa dữ liệu")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundColor(.red)
                                }
                            }
                            
                            if engine.history.isEmpty {
                                Text("Chưa có lịch sử tập luyện nào.")
                                    .font(.system(size: 13))
                                    .foregroundColor(.gray)
                                    .padding(.vertical, 12)
                            } else {
                                ForEach(engine.history) { log in
                                    HStack {
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(log.levelName)
                                                .font(.system(size: 14, weight: .bold))
                                                .foregroundColor(.white)
                                            Text(log.dateFormatted)
                                                .font(.system(size: 11))
                                                .foregroundColor(.gray)
                                        }
                                        Spacer()
                                        Text("\(log.repsCompleted) lượt")
                                            .font(.system(size: 13, weight: .semibold))
                                            .foregroundColor(Color(red: 0, green: 0.96, blue: 0.83))
                                    }
                                    .padding()
                                    .background(Color.white.opacity(0.03))
                                    .cornerRadius(10)
                                }
                            }
                        }
                        .padding(.horizontal)
                        .padding(.bottom, 30)
                    }
                }
            }
            .navigationBarHidden(true)
            .fileImporter(isPresented: $showingFileImporter, allowedContentTypes: [.json]) { result in
                switch result {
                case .success(let url):
                    importBackupJSON(from: url)
                case .failure(let err):
                    alertMessage = "Lỗi chọn tệp: \(err.localizedDescription)"
                    showAlert = true
                }
            }
            .alert(isPresented: $showAlert) {
                Alert(title: Text("Thông báo"), message: Text(alertMessage ?? ""), dismissButton: .default(Text("Đồng ý")))
            }
        }
    }
    
    private func exportBackupJSON() {
        let payload = BackupDataPayload(
            pc_flex_history: engine.history,
            pc_flex_streak: engine.streak,
            pc_flex_total_sessions: engine.totalSessions,
            pc_flex_total_reps: engine.totalRepsCompleted,
            pc_flex_custom_workouts: engine.customWorkouts,
            pc_flex_gender: engine.gender.rawValue,
            pc_flex_birth_year: engine.birthYear,
            pc_flex_gemini_key: engine.geminiApiKey
        )
        
        let container = BackupContainer(
            version: "1.0",
            app: "PC Flex",
            exportedAt: ISO8601DateFormatter().string(from: Date()),
            data: payload
        )
        
        let encoder = JSONEncoder()
        encoder.outputFormatting = .prettyPrinted
        if let jsonData = try? encoder.encode(container) {
            let tempDir = FileManager.default.temporaryDirectory
            let df = DateFormatter()
            df.dateFormat = "yyyy-MM-dd"
            let fileURL = tempDir.appendingPathComponent("pc-flex-backup-\(df.string(from: Date())).json")
            try? jsonData.write(to: fileURL)
            
            let av = UIActivityViewController(activityItems: [fileURL], applicationActivities: nil)
            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
               let rootVC = windowScene.windows.first?.rootViewController {
                rootVC.present(av, animated: true)
            }
        }
    }
    
    private func importBackupJSON(from url: URL) {
        guard url.startAccessingSecurityScopedResource() else { return }
        defer { url.stopAccessingSecurityScopedResource() }
        
        if let data = try? Data(contentsOf: url),
           let container = try? JSONDecoder().decode(BackupContainer.self, from: data) {
            if container.app == "PC Flex" {
                let d = container.data
                engine.history = d.pc_flex_history
                engine.streak = d.pc_flex_streak
                engine.totalSessions = d.pc_flex_total_sessions
                engine.totalRepsCompleted = d.pc_flex_total_reps
                engine.customWorkouts = d.pc_flex_custom_workouts
                if let g = Gender(rawValue: d.pc_flex_gender) {
                    engine.gender = g
                }
                engine.birthYear = d.pc_flex_birth_year
                engine.geminiApiKey = d.pc_flex_gemini_key
                engine.saveData()
                
                alertMessage = "Khôi phục dữ liệu sao lưu thành công!"
                showAlert = true
            } else {
                alertMessage = "Tệp tin không đúng định dạng của PC Flex."
                showAlert = true
            }
        } else {
            alertMessage = "Lỗi đọc tệp tin JSON."
            showAlert = true
        }
    }
}
