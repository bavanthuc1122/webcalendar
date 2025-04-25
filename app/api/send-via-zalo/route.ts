import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { pdfUrl, phone, message } = await request.json();

    // Kiểm tra dữ liệu đầu vào
    if (!pdfUrl || !phone) {
      return NextResponse.json(
        { error: 'Thiếu thông tin cần thiết' },
        { status: 400 }
      );
    }

    console.log('Gửi hóa đơn qua Zalo:');
    console.log(`- Số điện thoại: ${phone}`);
    console.log(`- URL hóa đơn: ${pdfUrl}`);
    console.log(`- Tin nhắn: ${message || 'Không có tin nhắn'}`);

    // Trong môi trường thực tế, bạn sẽ tích hợp với Zalo API
    // Đây là một giả lập để demo

    // Giả lập thời gian xử lý
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Tạo ID tin nhắn giả
    const messageId = `MSG_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    return NextResponse.json({
      success: true,
      messageId,
      simulatedMessage: {
        to: phone,
        content: message || 'Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi. Đây là hóa đơn của bạn.',
        attachment: pdfUrl
      }
    });
  } catch (error) {
    console.error('Lỗi khi gửi hóa đơn qua Zalo:', error);
    return NextResponse.json(
      { error: 'Không thể gửi hóa đơn qua Zalo' },
      { status: 500 }
    );
  }
}
