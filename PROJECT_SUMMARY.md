# Tóm Tắt Dự Án PC Flex (Bản Quan Trọng)

Dự án **PC Flex** là ứng dụng web offline-first hỗ trợ luyện tập cơ sàn chậu (PC) dành cho nam giới, tích hợp cơ chế đồng bộ đám mây và tiêu chuẩn Progressive Web App (PWA).

---

## 📌 Các Quy Tắc Ràng Buộc Quan Trọng (Quy định cho AI)

1. **KHÔNG TỰ ĐỘNG TẢI LÊN GITHUB**: 
   * Tuyệt đối không tự động chạy lệnh `git push` lên GitHub mà chưa hỏi và nhận được sự đồng ý rõ ràng từ người dùng.
   * Chỉ thực hiện `git push` khi người dùng ra lệnh trực tiếp trong chat (ví dụ: *"hãy đẩy lên github"*) hoặc xác nhận đồng ý sau khi đề xuất.
2. **NÂNG CẤP PHIÊN BẢN CHO MỖI CẬP NHẬT**:
   * Mỗi khi có bất kỳ chỉnh sửa nào trong mã nguồn (HTML, CSS, JS), bắt buộc phải nâng số phiên bản (ví dụ từ `v1.1.20` lên `v1.1.21`).
   * Phải cập nhật đồng bộ số phiên bản này ở:
     * `index.html` (trong các liên kết CSS/JS như `styles.css?v=...` và `app.js?v=...`, và dòng text hiển thị phiên bản ở chân trang).
     * `sw.js` (trong tên bộ nhớ cache `CACHE_NAME` và các tài nguyên trong mảng `ASSETS`).
   * Mục đích: Để trình duyệt nhận diện có mã nguồn mới, xóa cache cũ và kích hoạt Toast thông báo cập nhật PWA cho người dùng.
3. **CẬP NHẬT NHẬT KÝ PHIÊN BẢN**:
   * Với mỗi phiên bản mới được nâng cấp, bắt buộc phải cập nhật thông tin phiên bản đó vào phần **Lịch Sử Phiên Bản** ở cuối tệp tóm tắt này.

---

## 🚀 Các Tính Năng Cốt Lõi Của Ứng Dụng

1. **Progressive Web App (PWA)**:
   * Chạy độc lập (`standalone`) giống ứng dụng di động gốc, có thể cài đặt từ Chrome/Safari.
   * Chế độ Offline hoạt động 100% nhờ Service Worker (`sw.js`).
   * Hộp thông báo Glassmorphic báo có phiên bản mới và nút "Cập nhật ngay" tự động tải lại trang sạch cache.
   * Nút kiểm tra cập nhật thủ công và hiển thị phiên bản ở chân trang.
2. **Đồng Bộ Đám Mây Cá Nhân (Supabase)**:
   * Đồng bộ hóa 2 chiều tự động (Offline ⇄ Online) lịch sử tập luyện và chuỗi ngày tập (Streak).
   * Cho phép cấu hình URL & Key riêng tư, lưu trữ dữ liệu an toàn thông qua tài khoản đăng ký bằng Email.
3. **Bài Tập Cá Nhân Hóa Theo Khung Giờ**:
   * Tự động chọn bài tập mặc định khi tải trang:
     * **Sáng (5:00 - 9:59)**: Bài "Chào Buổi Sáng" (siết và Kegel ngược).
     * **Trưa/Chiều (10:00 - 18:59)**: Bài "Combo Sức Mạnh" (nhiều chặng siết nhịp độ nhanh).
     * **Tối (19:00 - 4:59 sáng hôm sau)**: Bài "Phục Hồi Ban Đêm" (siết phản xạ và thở bụng).
4. **Giao Diện Hướng Dẫn Trực Quan**:
   * Quả cầu visualizer thay đổi kích thước, màu sắc và chữ chỉ dẫn động theo nhịp siết/nhả/thở.
   * Thanh tiến trình phân đoạn (Segmented Progress Bar) phân chia tỷ lệ các chặng tập và làm nổi bật nhãn chặng hiện tại.
5. **Trải Nghiệm Thiết Bị Tối Ưu**:
   * Sử dụng **Screen Wake Lock API** giữ màn hình luôn sáng khi đang tập, tự giải phóng khi tạm dừng hoặc kết thúc để tiết kiệm pin.
   * Cấm zoom màn hình (chặn cử chỉ nhấp đúp và pinch-to-zoom trên iOS Safari).
   * Hiển thị cảnh báo đi tiểu (`#bladder-reminder-alert`) kèm hiệu ứng phát sáng viền neon đỏ 2 giây khi bấm bắt đầu.

---

## 📂 Danh Sách Tệp Mã Nguồn Chính
* `index.html`: Cấu trúc HTML, liên kết manifest, thư viện CDN và chân trang.
* `styles.css`: Kiểu dáng giao diện tối (dark mode), các hiệu ứng visualizer, bóng mờ glassmorphism và thông báo PWA.
* `app.js`: Logic ứng dụng, vòng lặp bài tập, quản lý âm thanh (AudioContext), khóa màn hình và kết nối đồng bộ Supabase.
* `sw.js`: Service worker quản lý cache offline và kích hoạt bản cập nhật mới.
* `manifest.json`: Siêu dữ liệu PWA phục vụ cài đặt app.

---

## 📈 Lịch Sử Phiên Bản (Version History)

* **v1.1.20** (21/06/2026):
  * Hoàn tác (Rollback) cấu trúc cuộn màn hình khóa bounce và ẩn thanh cuộn để trả lại hành vi cuộn tự nhiên của trình duyệt.
* **v1.1.18** (21/06/2026):
  * Thêm hiệu ứng phát sáng viền đỏ neon (`highlight-glow`) trong 2 giây cho khung nhắc nhở đi tiểu (`#bladder-reminder-alert`) khi nhấn Bắt đầu.
  * Dọn dẹp các đoạn mã CSS bị trùng lặp ở cuối file `styles.css`.
* **v1.1.17** (19/06/2026):
  * Thêm hiển thị phiên bản ở chân trang và nút "Kiểm tra cập nhật" thủ công.
  * Sửa lỗi xoay ngược biểu tượng dấu tích xanh khi rê chuột (hover).
* **v1.1.16** (19/06/2026):
  * Tích hợp PWA lần đầu tiên: tạo `manifest.json`, `sw.js` và Toast báo cập nhật Glassmorphic.
