# Web Calendar - Ứng dụng quản lý đặt lịch

Ứng dụng quản lý đặt lịch và tạo hóa đơn sử dụng Next.js, React Hook Form, Google Generative AI, và các công nghệ khác.

## Cấu trúc dự án

Dự án được chia thành 6 block chính:

1. **Booking Input**: Nhận text thô → gọi Gemini phân tích JSON schema
2. **Parsed Review**: Hiển thị form các field đã parse, cho chỉnh sửa
3. **Calendar Add**: Tạo sự kiện Google Calendar
4. **Invoice Maker**: Chọn template & upload logo → generate PDF
5. **Send Invoice**: Gửi PDF qua Zalo OA (ZNS)
6. **Deployment**: Deploy lên Vercel, cấu hình environment variables

## Cài đặt

```bash
# Cài đặt các dependencies
npm install

# Chạy môi trường phát triển
npm run dev
```

## Biến môi trường

Tạo file `.env.local` trong thư mục gốc và thêm các biến môi trường sau:

```
NEXT_PUBLIC_GOOGLE_API_KEY=your_google_api_key
GOOGLE_API_KEY=your_google_api_key
ZALO_OA_TOKEN=your_zalo_oa_token
```

## Công nghệ sử dụng

- **Frontend**: Next.js, React, Tailwind CSS
- **Form Management**: React Hook Form
- **AI**: Google Generative AI (Gemini)
- **Calendar**: Google Calendar API
- **PDF Generation**: PDFKit
- **Messaging**: Zalo API

## Hướng dẫn sử dụng

1. Nhập thông tin đặt lịch vào ô textarea và nhấn "Gửi"
2. Kiểm tra và chỉnh sửa thông tin đã được phân tích
3. Thêm sự kiện vào Google Calendar
4. Tạo hóa đơn PDF
5. Gửi hóa đơn qua Zalo