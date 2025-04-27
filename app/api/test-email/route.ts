import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, config } = await request.json();

    // Kiểm tra dữ liệu đầu vào
    if (!email) {
      return NextResponse.json(
        { error: 'Thiếu địa chỉ email' },
        { status: 400 }
      );
    }

    console.log('Kiểm tra email:');
    console.log(`- Email: ${email}`);
    if (config) {
      console.log(`- SMTP Host: ${config.host}`);
      console.log(`- SMTP Port: ${config.port}`);
      console.log(`- SMTP User: ${config.user}`);
      console.log(`- SMTP Pass: ${config.pass ? '******' : 'không có'}`);
    }

    // Trong môi trường thực tế, bạn sẽ kiểm tra kết nối SMTP
    // Đây là một giả lập để demo
    
    // Giả lập thời gian xử lý
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return NextResponse.json({ 
      success: true, 
      message: 'Đã gửi email kiểm tra thành công',
      simulatedEmail: {
        to: email,
        subject: 'Kiểm tra kết nối email',
        content: 'Đây là email kiểm tra kết nối. Nếu bạn nhận được email này, cấu hình email của bạn đã hoạt động đúng.'
      }
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra email:', error);
    return NextResponse.json(
      { error: 'Không thể kiểm tra email' },
      { status: 500 }
    );
  }
}
