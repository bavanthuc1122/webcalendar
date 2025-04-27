import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Booking } from '@/models';

// GET /api/bookings - Lấy tất cả các bookings
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const phone = searchParams.get('phone');
    const date = searchParams.get('date');
    const customerId = searchParams.get('customerId');

    await connectToDatabase();

    // Xây dựng query dựa trên các tham số
    const query: any = {};
    if (status && status !== 'all') query.status = status;
    if (phone) query.phone = phone;
    if (date) query.date = date;
    if (customerId) query.customerId = customerId;

    const bookings = await Booking.find(query).sort({ createdAt: -1 });
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bookings:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách bookings' },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Tạo booking mới
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await connectToDatabase();

    // Tạo booking mới
    const booking = new Booking(body);
    await booking.save();

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Lỗi khi tạo booking:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tạo booking' },
      { status: 500 }
    );
  }
}
