import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Report, Booking } from '@/models';

// GET /api/reports - Lấy tất cả các reports
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    await connectToDatabase();

    // Xây dựng query dựa trên các tham số
    const query: any = {};
    if (type) query.type = type;
    if (startDate) query.startDate = { $gte: new Date(startDate) };
    if (endDate) query.endDate = { $lte: new Date(endDate) };

    const reports = await Report.find(query).sort({ createdAt: -1 });
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách reports:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách reports' },
      { status: 500 }
    );
  }
}

// POST /api/reports - Tạo report mới
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await connectToDatabase();

    // Tính toán số liệu báo cáo nếu không được cung cấp
    if (!body.totalBookings || !body.totalRevenue || !body.completedBookings || !body.cancelledBookings) {
      const startDate = new Date(body.startDate);
      const endDate = new Date(body.endDate);

      // Lấy tất cả các bookings trong khoảng thời gian
      const bookings = await Booking.find({
        createdAt: { $gte: startDate, $lte: endDate }
      });

      // Tính toán số liệu
      body.totalBookings = bookings.length;
      body.totalRevenue = bookings.reduce((sum, booking) => {
        return booking.status === 'completed' ? sum + booking.total : sum;
      }, 0);
      body.completedBookings = bookings.filter(booking => booking.status === 'completed').length;
      body.cancelledBookings = bookings.filter(booking => booking.status === 'cancelled').length;
      
      // Lưu dữ liệu chi tiết
      body.data = {
        bookings: bookings.map(booking => ({
          id: booking._id,
          customer: booking.customer,
          date: booking.date,
          time: booking.time,
          total: booking.total,
          status: booking.status
        }))
      };
    }

    // Tạo report mới
    const report = new Report(body);
    await report.save();

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Lỗi khi tạo report:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tạo report' },
      { status: 500 }
    );
  }
}
