import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Booking } from '@/models';
import mongoose from 'mongoose';

// GET /api/bookings/[id] - Lấy booking theo ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID booking không hợp lệ' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const booking = await Booking.findById(id);

    if (!booking) {
      return NextResponse.json(
        { error: 'Không tìm thấy booking' },
        { status: 404 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error(`Lỗi khi lấy booking với ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy booking' },
      { status: 500 }
    );
  }
}

// PUT /api/bookings/[id] - Cập nhật booking
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
        { error: 'ID booking không hợp lệ' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const booking = await Booking.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!booking) {
      return NextResponse.json(
        { error: 'Không tìm thấy booking' },
        { status: 404 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error(`Lỗi khi cập nhật booking với ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Lỗi khi cập nhật booking' },
      { status: 500 }
    );
  }
}

// DELETE /api/bookings/[id] - Xóa booking
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID booking không hợp lệ' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const booking = await Booking.findByIdAndDelete(id);

    if (!booking) {
      return NextResponse.json(
        { error: 'Không tìm thấy booking' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Đã xóa booking thành công' });
  } catch (error) {
    console.error(`Lỗi khi xóa booking với ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa booking' },
      { status: 500 }
    );
  }
}
