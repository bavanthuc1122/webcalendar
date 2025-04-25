# Kịch bản kiểm thử Web Calendar

## Mục tiêu
Kiểm tra chức năng của các component chính:
1. **BookingInput**: Nhận và phân tích thông tin đặt lịch
2. **ParsedReviewForm**: Hiển thị và cho phép chỉnh sửa dữ liệu đã phân tích

## Dữ liệu kiểm thử
File `test-data.txt` đã được tạo với nội dung mẫu:
```
Đặt lịch chụp ảnh:
Khách hàng: Nguyễn Văn A
Ý tưởng chụp: Chụp ảnh gia đình, ngoại cảnh công viên
Số giờ chụp: 3
Tiền đặt cọc: 500000
Tổng chi phí: 2000000
Số điện thoại: 0912345678
Ngày chụp: 15/06/2024
```

## Các bước kiểm thử

### 1. Kiểm tra BookingInput
1. Mở ứng dụng tại http://localhost:3001/
2. Copy nội dung từ file `test-data.txt`
3. Dán vào textarea của BookingInput
4. Nhấn nút "Gửi"
5. Kiểm tra xem có hiển thị spinner "Đang xử lý..." không
6. Đợi kết quả phân tích

### 2. Kiểm tra ParsedReviewForm
1. Sau khi phân tích thành công, kiểm tra xem ParsedReviewForm có hiển thị không
2. Kiểm tra các trường thông tin đã được điền đúng:
   - Tên khách hàng: Nguyễn Văn A
   - Ý tưởng chụp: Chụp ảnh gia đình, ngoại cảnh công viên
   - Số giờ chụp: 3
   - Tiền đặt cọc: 500000
   - Tổng chi phí: 2000000
   - Số điện thoại: 0912345678
   - Ngày chụp: 15/06/2024
3. Kiểm tra chức năng chỉnh sửa:
   - Nhấn biểu tượng bút chì bên cạnh một trường
   - Chỉnh sửa giá trị
   - Nhấn biểu tượng tích để lưu
   - Kiểm tra xem giá trị đã được cập nhật chưa
4. Nhấn nút "Lưu thông tin" và kiểm tra console.log

## Kết quả mong đợi
1. BookingInput phân tích chính xác thông tin đặt lịch
2. ParsedReviewForm hiển thị đúng dữ liệu đã phân tích
3. Có thể chỉnh sửa từng trường thông tin
4. Dữ liệu form được lưu đúng khi nhấn "Lưu thông tin"

## Lưu ý
- Cần có API key của Google Generative AI để sử dụng Gemini Pro
- Kiểm tra file .env.local để đảm bảo đã cấu hình NEXT_PUBLIC_GOOGLE_API_KEY