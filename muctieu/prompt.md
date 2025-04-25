Dự án webcalendar sẽ được chuyển đổi từ lưu trữ cục bộ (localStorage/IndexedDB) sang MongoDB để cải thiện khả năng mở rộng, đồng bộ hóa dữ liệu và tự động hóa quy trình. MongoDB được chọn vì tính linh hoạt của cấu trúc dữ liệu, khả năng mở rộng và hỗ trợ tốt cho ứng dụng JavaScript/TypeScript.

Cấu trúc dữ liệu MongoDB
Collections (Bộ sưu tập)
bookings - Lưu trữ thông tin lịch hẹn chụp ảnh
customers - Lưu trữ thông tin khách hàng
invoices - Lưu trữ hóa đơn đã tạo
settings - Lưu trữ cấu hình hệ thống (email, thanh toán, hóa đơn)
reports - Lưu trữ báo cáo doanh thu
users - Lưu trữ thông tin người dùng (admin, nhân viên)
Các bước triển khai
Thiết lập MongoDB Atlas - Tạo cụm MongoDB trên đám mây
Tạo API Routes - Xây dựng các API endpoints để tương tác với MongoDB
Chuyển đổi dữ liệu - Di chuyển dữ liệu từ localStorage sang MongoDB
Cập nhật UI - Điều chỉnh giao diện để phản ánh thay đổi lưu trữ
Triển khai tính năng tự động hóa - Thêm các tác vụ tự động hóa sử dụng MongoDB



Tôi cần chuyển đổi dự án webcalendar từ lưu trữ cục bộ (localStorage) sang MongoDB. Dự án là ứng dụng quản lý lịch chụp ảnh thương mại với các tính năng: quản lý lịch hẹn, quản lý khách hàng, tạo hóa đơn, gửi thông báo qua Zalo và email, tích hợp Google Calendar.

## Yêu cầu:

1. Thiết lập MongoDB Atlas và kết nối với dự án Next.js
2. Tạo các schema MongoDB cho:
   - Bookings (lịch hẹn)
   - Customers (khách hàng)
   - Invoices (hóa đơn)
   - Settings (cấu hình)
   - Reports (báo cáo)
   - Users (người dùng)

3. Xây dựng API Routes để:
   - CRUD cho tất cả các collections
   - Tìm kiếm và lọc dữ liệu
   - Tạo báo cáo tự động

4. Triển khai tính năng tự động hóa:
   - Gửi email tự động khi hoàn thành buổi chụp
   - Tạo báo cáo doanh thu hàng ngày/tuần/tháng
   - Đồng bộ với Google Calendar

5. Cập nhật các components hiện có để sử dụng MongoDB thay vì localStorage:
   - BookingForm.tsx
   - SessionCompletionForm.tsx
   - CustomerList.tsx
   - InvoiceMaker.tsx

6. Thêm xác thực người dùng cơ bản (đăng nhập/đăng ký)

7. Triển khai tính năng sao lưu và khôi phục dữ liệu

## Cấu trúc dữ liệu hiện tại:

Hiện tại, dự án đang sử dụng localStorage để lưu trữ dữ liệu với cấu trúc sau:

1. Bookings:
```javascript
const bookings = [
  {
    id: "unique-id",
    customer: "Tên khách hàng",
    phone: "Số điện thoại",
    date: "Ngày chụp",
    time: "Giờ chụp",
    duration: 2, // Số giờ
    concepts: "Concept chụp",
    deposit: 500000, // Tiền đặt cọc
    total: 2000000, // Tổng tiền
    status: "confirmed", // pending, confirmed, completed, cancelled
    createdAt: "2023-04-25T10:30:00Z",
    updatedAt: "2023-04-25T10:30:00Z"
  }
]


const customers = [
  {
    id: "unique-id",
    name: "Tên khách hàng",
    phone: "Số điện thoại",
    email: "Email",
    address: "Địa chỉ",
    bookingHistory: ["booking-id-1", "booking-id-2"],
    notes: "Ghi chú về khách hàng",
    createdAt: "2023-04-25T10:30:00Z",
    updatedAt: "2023-04-25T10:30:00Z"
  }
]

const invoiceConfig = {
  companyInfo: {
    name: "Tên studio",
    address: "Địa chỉ studio",
    phone: "Số điện thoại",
    email: "Email",
    website: "Website",
    logo: "base64-encoded-logo"
  },
  templates: [
    {
      id: 1,
      name: "Mẫu cơ bản",
      style: "basic",
      accentColor: "#FF5A5F"
    }
  ],
  selectedTemplate: 1,
  paymentInfo: {
    bankName: "Tên ngân hàng",
    accountNumber: "Số tài khoản",
    accountName: "Tên chủ tài khoản",
    branchName: "Chi nhánh",
    isDefault: true,
    qrCode: "url-to-qr-code"
  },
  settings: {
    invoicePrefix: "INV-",
    vatRate: 10,
    invoiceFooter: "Cảm ơn quý khách!"
  }
}


const invoiceConfig = {
  companyInfo: {
    name: "Tên studio",
    address: "Địa chỉ studio",
    phone: "Số điện thoại",
    email: "Email",
    website: "Website",
    logo: "base64-encoded-logo"
  },
  templates: [
    {
      id: 1,
      name: "Mẫu cơ bản",
      style: "basic",
      accentColor: "#FF5A5F"
    }
  ],
  selectedTemplate: 1,
  paymentInfo: {
    bankName: "Tên ngân hàng",
    accountNumber: "Số tài khoản",
    accountName: "Tên chủ tài khoản",
    branchName: "Chi nhánh",
    isDefault: true,
    qrCode: "url-to-qr-code"
  },
  settings: {
    invoicePrefix: "INV-",
    vatRate: 10,
    invoiceFooter: "Cảm ơn quý khách!"
  }
}


const emailConfig = {
  smtp: {
    host: "smtp.gmail.com",
    port: "587",
    user: "your-email@gmail.com",
    pass: "encrypted-password",
    secure: true
  },
  notifications: {
    sendToAdmin: true,
    adminEmail: "admin@example.com",
    sendToCustomer: true,
    emailTemplate: "Mẫu email thông báo",
    includeInvoice: true
  }
}


Công nghệ sử dụng:
Next.js
MongoDB Atlas
Mongoose (để tương tác với MongoDB)
NextAuth.js (cho xác thực)
React Query (để quản lý trạng thái và cache)
Tailwind CSS (đã được sử dụng trong dự án)




## Lộ trình triển khai

### Giai đoạn 1: Thiết lập cơ sở dữ liệu và API cơ bản
- Thiết lập MongoDB Atlas
- Tạo các schema Mongoose
- Xây dựng API Routes cơ bản (CRUD)
- Cập nhật các components chính để sử dụng MongoDB

### Giai đoạn 2: Triển khai tính năng nâng cao
- Thêm xác thực người dùng
- Triển khai tính năng tự động hóa
- Tích hợp với Google Calendar và Google Sheets
- Triển khai tính năng báo cáo

### Giai đoạn 3: Tối ưu hóa và mở rộng
- Tối ưu hiệu suất truy vấn
- Thêm tính năng sao lưu và khôi phục
- Triển khai tính năng phân quyền
- Thêm tính năng thông báo thời gian thực

## Lợi ích khi chuyển sang MongoDB

1. **Khả năng mở rộng** - MongoDB có thể xử lý lượng dữ liệu lớn và tăng trưởng theo thời gian
2. **Đồng bộ hóa dữ liệu** - Dữ liệu được lưu trữ trên đám mây, có thể truy cập từ nhiều thiết bị
3. **Tự động hóa cao** - Có thể thiết lập các tác vụ tự động hóa như gửi email, tạo báo cáo
4. **Bảo mật tốt hơn** - MongoDB Atlas cung cấp các tính năng bảo mật như mã hóa, xác thực, và kiểm soát truy cập
5. **Tích hợp dễ dàng** - MongoDB có thể dễ dàng tích hợp với các dịch vụ bên thứ ba như Google Calendar, Zalo API

## Kết luận

Việc chuyển đổi dự án webcalendar sang MongoDB sẽ giúp nâng cao khả năng mở rộng, đồng bộ hóa dữ liệu và tự động hóa quy trình. MongoDB là lựa chọn phù hợp cho dự án này vì tính linh hoạt của cấu trúc dữ liệu và khả năng mở rộng. Với prompt được cung cấp, AI sẽ có thể giúp triển khai MongoDB cho dự án webcalendar một cách hiệu quả.