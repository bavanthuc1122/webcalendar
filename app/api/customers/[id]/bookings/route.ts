import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Booking } from '@/models';
import mongoose from 'mongoose';

// GET /api/customers/[id]/bookings - Lấy tất cả các bookings của một customer
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
    const bookings = await Booking.find({ customerId: id }).sort({ createdAt: -1 });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error(`Lỗi khi lấy bookings của customer với ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy bookings của customer' },
      { status: 500 }
    );
  }
}
