# 📘 ĐÚC KẾT KINH NGHIỆM: DYNAMIC ISLAND, ACTIVITYKIT & TROLLSTORE SIDELOAD TRÊN IOS

Tài liệu này tổng hợp toàn bộ các phát hiện kỹ thuật chuyên sâu, nguyên nhân gốc rễ và giải pháp thực tế thu được trong quá trình nghiên cứu và phát triển tính năng Dynamic Island (Live Activities) trên môi trường iOS Sideload (TrollStore / SideStore) và Capacitor Hybrid App.

---

## 🏛️ 1. Bản Chất Kiến Trúc Của Dynamic Island & ActivityKit Trên iOS

### 1.1 Cơ chế hoạt động của Live Activities (Apple Standard)
- Dynamic Island và Live Activity **KHÔNG PHẢI** chạy bên trong ứng dụng chính (`Main App`).
- Nó là một tiến trình độc lập thuộc hệ thống **WidgetKit Extension (`com.apple.widgetkit-extension`)** do dịch vụ `SpringBoard` và `launchd` của iOS quản lý và trực tiếp vẽ (render) trên màn hình.
- App chính chỉ đóng vai trò gửi yêu cầu tạo (`Activity.request`) và đẩy trạng thái (`Activity.update`) qua IPC (Inter-Process Communication).

---

## ⚠️ 2. Tại Sao Dynamic Island Gặp Nhiều Thách Thức Trên TrollStore / Sideload?

### 2.1 Rào cản Chữ Ký Mã (Code Signing & Provisioning Profiles)
1. **Thiếu Entitlement Thật từ Apple Developer Team**:
   - Trên App Store: Ứng dụng có `com.apple.developer.live-activities` có chữ ký chứng thực từ Apple Server và có thể nhận APNs Push-To-Start Token.
   - Trên TrollStore: Cài qua Ad-Hoc / Fake Sign (`get-task-allow = false`), SpringBoard không nhận diện được Apple Push Token hợp lệ, buộc phải khởi tạo cục bộ (`pushType: nil`).
2. **Lỗi Phá Hỏng Con Dấu Chữ Ký Do Dùng `codesign --deep`**:
   - Khi App chứa `PlugIns/Widget.appex`, việc dùng lệnh `codesign --deep` trên App chính sẽ ký đè và làm hỏng con dấu của Extension.
   - **Quy tắc vàng**: Phải ký theo thứ tự từ trong ra ngoài (**Inside-Out Nested Signing**):
     `Frameworks` $\rightarrow$ `PlugIns/*.appex` $\rightarrow$ `Main App` (KHÔNG DÙNG `--deep`).
3. **Lỗi Lệch Phiên Bản (`Mismatched CFBundleShortVersionString`)**:
   - Nếu `Info.plist` của App Extension có số phiên bản khác với App chính (ví dụ App là `2.0.5` còn Extension là `1.6.4`), SpringBoard sẽ từ chối tải Extension ngay khi kiểm tra Bundle.

---

## ⏱️ 3. Các Lỗi Thường Gặp Trong SwiftUI Render Của Dynamic Island

### 3.1 Lỗi Fatal Crash SwiftUI `ClosedRange<Date>`
- **Hiện tượng**: Dynamic Island bị đóng băng (freeze) sau vài giây hoặc tự biến mất.
- **Nguyên nhân**: Khi dùng `Text(timerInterval: Date()...targetDate, countsDown: true)`:
  - Nếu `Date()` được hệ thống đánh giá trễ hơn `targetDate` dù chỉ 1 mili-giây, `lowerBound > upperBound` $\rightarrow$ SwiftUI văng Exception ngầm làm chết luồng vẽ của Widget.
- **Khắc phục**: Luôn truyền cặp mốc thời gian bất biến `startDate` và `endDate` cố định trong `ContentState`:
  ```swift
  Text(context.state.endDate, style: .timer)
  ```

### 3.2 Lỗi Tràn Khung Nhìn (Compact Trailing Width Overflow)
- **Hiện tượng**: Khi thu nhỏ ra màn hình chính, Dynamic Island không hiển thị số giây đếm lùi bên phải.
- **Nguyên nhân**: Cột `compactTrailing` chỉ có chiều rộng tối đa khoảng **40-44 point**. Định dạng `00:06` kèm padding bị tràn khung $\rightarrow$ iOS tự động ẩn toàn bộ view bên phải.
- **Khắc phục**: Dùng `style: .timer` (chỉ 4 ký tự `0:06`) kèm `.frame(maxWidth: 44, alignment: .trailing)`.

### 3.3 Hạn Mức Ngân Sách Cập Nhật (Update Throttling)
- Apple giới hạn số lần `activity.update()` khi app chạy nền để tiết kiệm pin. Nếu gọi update liên tục mỗi giây từ JavaScript qua Native Bridge, iOS sẽ đưa Activity vào danh sách hạn chế và đóng băng giao diện.

---

## 🎧 4. Giải Pháp Chạy Nền (Background Execution) Tối Ưu Cho Web / Hybrid App

Nếu không dùng Dynamic Island, phương pháp chạy nền ổn định nhất cho các ứng dụng Hybrid (Capacitor/React) là:

1. **Native Audio Keep-Alive (`AVAudioSession + Silent Player`)**:
   - Cấu hình `AVAudioSession`:
     ```swift
     try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers, .duckOthers])
     try AVAudioSession.sharedInstance().setActive(true)
     ```
   - Tạo luồng phát sóng âm thanh tĩnh (silent PCM WAV) âm lượng cực nhỏ (`0.01`). Giúp WebKit Audio Context và JavaScript Timer sống sót 100% không bị iOS đình chỉ (suspend).
2. **Thuật Toán Wall-Clock Delta Precision Trong JavaScript**:
   - Không đếm lùi bằng `seconds - 1` trong `setInterval`.
   - Tính toán theo thời gian thực hệ thống: `elapsed = (Date.now() - startTime) / 1000`. Khi mở lại app, giao diện tự động bắt kịp thời gian chính xác mà không bao giờ bị đứng bài tập.

---

## 📥 5. Quy Trình Cập Nhật OTA 1 Chạm Tốt Nhất Cho TrollStore

1. **Tải File IPA Trực Tiếp Trong App (`URLSessionDownloadTask`)**:
   - Tải file nhị phân vào thư mục tạm `FileManager.default.temporaryDirectory`.
   - Tính toán tốc độ tải `MB/s` bằng chênh lệch bytes / thời gian delta.
2. **Mở Menu "Open in..." Ưu Tiên TrollStore (`UIDocumentInteractionController`)**:
   - Gán `uti = "com.apple.itunes.ipa"`.
   - Gọi `presentOpenInMenu(from:in:animated:)`.
   - iOS tự động hiển thị TrollStore ở vị trí lựa chọn số 1 để người dùng cài đặt tức thì.
