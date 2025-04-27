import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/models';
import mongoose from 'mongoose';

// GET /api/settings/[id] - Lấy setting theo ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID setting không hợp lệ' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const setting = await Setting.findById(id);

    if (!setting) {
      return NextResponse.json(
        { error: 'Không tìm thấy setting' },
        { status: 404 }
      );
    }

    return NextResponse.json(setting);
  } catch (error) {
    console.error(`Lỗi khi lấy setting với ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy setting' },
      { status: 500 }
    );
  }
}

// PUT /api/settings/[id] - Cập nhật setting
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
        { error: 'ID setting không hợp lệ' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Lấy setting hiện tại để biết loại
    const currentSetting = await Setting.findById(id);
    if (!currentSetting) {
      return NextResponse.json(
        { error: 'Không tìm thấy setting' },
        { status: 404 }
      );
    }

    // Nếu setting được cập nhật thành mặc định, cập nhật các setting khác cùng loại
    if (body.isDefault) {
      await Setting.updateMany(
        { type: currentSetting.type, isDefault: true, _id: { $ne: id } },
        { isDefault: false }
      );
    }

    const setting = await Setting.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    return NextResponse.json(setting);
  } catch (error) {
    console.error(`Lỗi khi cập nhật setting với ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Lỗi khi cập nhật setting' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/[id] - Xóa setting
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID setting không hợp lệ' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const setting = await Setting.findByIdAndDelete(id);

    if (!setting) {
      return NextResponse.json(
        { error: 'Không tìm thấy setting' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Đã xóa setting thành công' });
  } catch (error) {
    console.error(`Lỗi khi xóa setting với ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa setting' },
      { status: 500 }
    );
  }
}
