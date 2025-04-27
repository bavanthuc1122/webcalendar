import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, subject, message, pdfUrl, config } = await request.json();

    // Kiểm tra dữ liệu đầu vào
    if (!email || !subject || !message) {
      return NextResponse.json(
        { error: 'Thiếu thông tin cần thiết' },
        { status: 400 }
      );
    }

    console.log('Gửi email cho admin:');
    console.log(`- Email: ${email}`);
    console.log(`- Tiêu đề: ${subject}`);
    console.log(`- Nội dung: ${message}`);
    if (pdfUrl) {
      console.log(`- Đính kèm PDF: ${pdfUrl}`);
    }

    // Kiểm tra cấu hình email
    if (config) {
      console.log('Sử dụng cấu hình SMTP:');
      console.log(`- SMTP Host: ${config.host}`);
      console.log(`- SMTP Port: ${config.port}`);
      console.log(`- SMTP User: ${config.user}`);
      console.log(`- SMTP Pass: ${config.pass ? '******' : 'không có'}`);

      // Trong môi trường thực tế, bạn sẽ sử dụng thư viện như nodemailer
      // để gửi email qua SMTP
      // Ví dụ:
      /*
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: parseInt(config.port),
        secure: parseInt(config.port) === 465,
        auth: {
          user: config.user,
          pass: config.pass
        }
      });

      await transporter.sendMail({
        from: config.user,
        to: email,
        subject: subject,
        text: message,
        attachments: pdfUrl ? [{ path: pdfUrl }] : []
      });
      */
    } else {
      console.log('Không có cấu hình SMTP, sử dụng dịch vụ email mặc định');
      // Trong môi trường thực tế, bạn sẽ tích hợp với dịch vụ email như SendGrid, Mailgun, v.v.
    }

    // Giả lập thời gian xử lý
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      message: 'Đã gửi email thành công',
      simulatedEmail: {
        to: email,
        subject,
        content: message,
        attachment: pdfUrl || null,
        usedConfig: config ? true : false
      }
    });
  } catch (error) {
    console.error('Lỗi khi gửi email:', error);
    return NextResponse.json(
      { error: 'Không thể gửi email' },
      { status: 500 }
    );
  }
}
