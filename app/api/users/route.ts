import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models';

// GET /api/users - Lấy tất cả các users
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');

    await connectToDatabase();

    // Xây dựng query dựa trên các tham số
    const query: any = {};
    if (role) query.role = role;
    if (isActive !== null) query.isActive = isActive === 'true';

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách users:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Tạo user mới
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await connectToDatabase();

    // Kiểm tra xem email đã tồn tại chưa
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email đã tồn tại' },
        { status: 400 }
      );
    }

    // Tạo user mới
    const user = new User(body);

    // Tạo token xác thực email
    const { token } = user.generateVerificationToken();

    await user.save();

    // Gửi email xác thực (trong môi trường thực tế)
    // Ở đây chúng ta chỉ trả về token để kiểm tra

    // Trả về user không bao gồm mật khẩu và thêm verificationToken để kiểm tra
    const userResponse = user.toObject();
    delete userResponse.password;

    // Trong môi trường thực tế, không nên trả về token này
    // Chỉ trả về để kiểm tra trong quá trình phát triển
    userResponse.verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;

    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    console.error('Lỗi khi tạo user:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tạo user' },
      { status: 500 }
    );
  }
}
