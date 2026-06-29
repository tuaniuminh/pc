# Quy Tắc Cho AI Assistant Trong Dự Án PC Flex

Tệp này quy định các nguyên tắc ứng xử và kỹ thuật bắt buộc đối với AI Assistant khi làm việc trong dự án này:

## 1. Ràng Buộc Đẩy Mã Nguồn (Git Push Constraint)
* **KHÔNG TỰ ĐỘNG TẢI LÊN GITHUB**: Tuyệt đối không được chạy lệnh `git push` tự động để đẩy code lên kho chứa từ xa mà chưa có sự đồng ý hoặc phê duyệt rõ ràng từ người dùng.
* Hãy luôn để người dùng duyệt qua và đồng ý trước khi thực hiện hành động này.

## 2. Quản Lý Bộ Nhớ Cache & Phiên Bản (Version Control & Cache Busting)
* **NÂNG CẤP PHIÊN BẢN VỚI MỖI CHỈNH SỬA**: Mỗi khi thay đổi bất kỳ đoạn code nào trong HTML/CSS/JS, bắt buộc phải nâng số phiên bản (Ví dụ: `v1.1.20` -> `v1.1.21`).
* **Đồng bộ phiên bản**: Phải cập nhật phiên bản mới này đồng bộ tại:
  1. `index.html`: Thay đổi các thẻ link `styles.css?v=...` và `app.js?v=...`, đồng thời đổi số phiên bản hiển thị tại chân trang (`footer`).
  2. `sw.js`: Thay đổi hằng số `CACHE_NAME = 'pc-flex-cache-v...'` và các tham số query trong danh sách `ASSETS`.
* **Cập nhật tệp tóm tắt**: Mỗi khi nâng số phiên bản, hãy ghi chép thông tin phiên bản mới cùng mô tả thay đổi vào phần **Lịch Sử Phiên Bản** ở cuối tệp [PROJECT_SUMMARY.md](file:///c:/Users/PC%20VIP/Downloads/suckhoe/PROJECT_SUMMARY.md).
