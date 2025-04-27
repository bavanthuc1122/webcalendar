import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/index';
import { User } from '@/models';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token và mật khẩu mới không được cung cấp' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Tìm user với token đặt lại mật khẩu
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Token không hợp lệ hoặc đã hết hạn' },
        { status: 400 }
      );
    }

    // Cập nhật mật khẩu
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return NextResponse.json({
      message: 'Mật khẩu đã được đặt lại thành công'
    });
  } catch (error) {
    console.error('Lỗi khi đặt lại mật khẩu:', error);
    return NextResponse.json(
      { error: 'Lỗi khi đặt lại mật khẩu' },
      { status: 500 }
    );
  }
}
