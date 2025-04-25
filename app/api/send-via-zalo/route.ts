import { NextRequest, NextResponse } from 'next/server';
import zalo from 'zalo-api';

export async function POST(request: NextRequest) {
  try {
    const { pdfUrl, phone } = await request.json();

    // Kiểm tra dữ liệu đầu vào
    if (!pdfUrl || !phone) {
      return NextResponse.json(
        { error: 'Thiếu thông tin cần thiết' },
        { status: 400 }
      );
    }

    // Trong môi trường thực tế, bạn sẽ cần thiết lập Zalo OA
    // Đây là một ví dụ đơn giản
    const zaloOA = new zalo.ZaloOA({
      oaId: process.env.ZALO_OA_ID,
      secretKey: process.env.ZALO_SECRET_KEY,
    });

    // Tạo URL đầy đủ cho file PDF
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const fullPdfUrl = `${baseUrl}${pdfUrl}`;

    // Gửi tin nhắn qua Zalo
    const result = await zaloOA.sendMessage({
      phone,
      message: 'Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi. Đây là hóa đơn của bạn.',
      link: fullPdfUrl,
    });

    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Lỗi khi gửi hóa đơn qua Zalo:', error);
    return NextResponse.json(
      { error: 'Không thể gửi hóa đơn qua Zalo' },
      { status: 500 }
    );
  }
}
