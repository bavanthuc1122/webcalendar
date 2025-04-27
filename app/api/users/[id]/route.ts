import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models';
import mongoose from 'mongoose';

// GET /api/users/[id] - Lấy user theo ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID user không hợp lệ' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const user = await User.findById(id).select('-password');

    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy user' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error(`Lỗi khi lấy user với ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy user' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Cập nhật user
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID user không hợp lệ' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Nếu cập nhật email, kiểm tra xem email đã tồn tại chưa
    if (body.email) {
      const existingUser = await User.findOne({ email: body.email, _id: { $ne: id } });
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email đã tồn tại' },
          { status: 400 }
        );
      }
    }

    // Cập nhật user
    const user = await User.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy user' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error(`Lỗi khi cập nhật user với ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Lỗi khi cập nhật user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Xóa user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID user không hợp lệ' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy user' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Đã xóa user thành công' });
  } catch (error) {
    console.error(`Lỗi khi xóa user với ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa user' },
      { status: 500 }
    );
  }
}
