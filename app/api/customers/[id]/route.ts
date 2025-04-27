import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Customer, Booking } from '@/models';
import mongoose from 'mongoose';

// GET /api/customers/[id] - Lấy customer theo ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID customer không hợp lệ' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const customer = await Customer.findById(id);

    if (!customer) {
      return NextResponse.json(
        { error: 'Không tìm thấy customer' },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error(`Lỗi khi lấy customer với ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy customer' },
      { status: 500 }
    );
  }
}

// PUT /api/customers/[id] - Cập nhật customer
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
        { error: 'ID customer không hợp lệ' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const customer = await Customer.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return NextResponse.json(
        { error: 'Không tìm thấy customer' },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error(`Lỗi khi cập nhật customer với ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Lỗi khi cập nhật customer' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] - Xóa customer
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID customer không hợp lệ' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    // Kiểm tra xem customer có booking nào không
    const bookings = await Booking.find({ customerId: id });
    if (bookings.length > 0) {
      return NextResponse.json(
        { error: 'Không thể xóa customer vì có booking liên quan' },
        { status: 400 }
      );
    }

    const customer = await Customer.findByIdAndDelete(id);

    if (!customer) {
      return NextResponse.json(
        { error: 'Không tìm thấy customer' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Đã xóa customer thành công' });
  } catch (error) {
    console.error(`Lỗi khi xóa customer với ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa customer' },
      { status: 500 }
    );
  }
}
