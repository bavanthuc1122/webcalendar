import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/index';
import { User } from '@/models';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token không được cung cấp' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Tìm user với token xác thực email
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Token không hợp lệ hoặc đã hết hạn' },
        { status: 400 }
      );
    }

    // Cập nhật trạng thái xác thực email
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Chuyển hướng đến trang đăng nhập với thông báo thành công
    return NextResponse.redirect(new URL('/auth/login?verified=true', req.url));
  } catch (error) {
    console.error('Lỗi khi xác thực email:', error);
    return NextResponse.json(
      { error: 'Lỗi khi xác thực email' },
      { status: 500 }
    );
  }
}
