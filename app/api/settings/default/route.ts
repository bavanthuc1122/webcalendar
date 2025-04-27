import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, releaseConnection } from '@/lib/mongodb';

// Cấu hình mặc định cho từng loại
const defaultSettings = {
  invoice: {
    companyName: 'Studio Ảnh Thức',
    companyAddress: '123 Đường ABC, Quận 1, TP.HCM',
    companyPhone: '0987654321',
    companyEmail: 'contact@anhthuc.com',
    companyWebsite: 'www.anhthuc.com',
    companyLogo: '',
    vatRate: 10,
    invoicePrefix: 'INV-',
    invoiceFooter: 'Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!',
  },
  email: {
    host: 'smtp.gmail.com',
    port: '587',
    user: '',
    pass: '',
    from: '',
  },
  googleSheet: {
    apiKey: '',
    sheetId: '',
    sheetName: 'Customers',
  },
  googleCalendar: {
    apiKey: '',
    clientId: '',
    clientSecret: '',
  },
  payment: {
    bankName: '',
    accountNumber: '',
    accountName: '',
    branch: '',
    qrCodeUrl: '',
  },
  invoiceSettings: {
    selectedTemplate: 1,
    logo: '',
    qrCode: '',
    accentColor: '#FF5A5F',
    paymentInfo: '',
    bankInfo: null,
  },
  general: {
    siteName: 'Web Calendar Booking',
    siteDescription: 'Hệ thống đặt lịch chụp ảnh',
    contactEmail: '',
    contactPhone: '',
    address: '',
  },
  adminEmail: 'admin@anhthuc.com',
};

// GET /api/settings/default - Lấy cấu hình mặc định
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (!type || !(type in defaultSettings)) {
      return NextResponse.json(
        { error: 'Loại cấu hình không hợp lệ' },
        { status: 400 }
      );
    }

    // Kết nối đến MongoDB
    await connectToDatabase();

    // Trả về cấu hình mặc định
    const defaultSetting = {
      type,
      data: defaultSettings[type],
      isDefault: true,
    };

    // Giải phóng kết nối MongoDB
    releaseConnection();

    return NextResponse.json(defaultSetting);
  } catch (error) {
    console.error('Lỗi khi lấy cấu hình mặc định:', error);

    // Giải phóng kết nối MongoDB
    releaseConnection();

    return NextResponse.json(
      { error: 'Lỗi khi lấy cấu hình mặc định' },
      { status: 500 }
    );
  }
}
