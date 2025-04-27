import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/index';
import { User } from '@/models';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email không được cung cấp' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Tìm user với email
    const user = await User.findOne({ email });

    if (!user) {
      // Không thông báo lỗi cụ thể để tránh lộ thông tin
      return NextResponse.json(
        { message: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu' },
        { status: 200 }
      );
    }

    // Tạo token đặt lại mật khẩu
    const { token, expires } = user.generatePasswordResetToken();
    await user.save();

    // Tạo URL đặt lại mật khẩu
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;

    // Trong môi trường thực tế, gửi email với URL đặt lại mật khẩu
    // Ở đây chúng ta chỉ trả về URL để kiểm tra

    // Trả về thông báo thành công và URL đặt lại mật khẩu (chỉ để kiểm tra)
    return NextResponse.json({
      message: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu',
      // Trong môi trường thực tế, không nên trả về resetUrl
      resetUrl,
      expires
    });
  } catch (error) {
    console.error('Lỗi khi xử lý yêu cầu quên mật khẩu:', error);
    return NextResponse.json(
      { error: 'Lỗi khi xử lý yêu cầu quên mật khẩu' },
      { status: 500 }
    );
  }
}
