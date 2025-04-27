import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Invoice } from '@/models';

// GET /api/invoices - Lấy tất cả các invoices
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const bookingId = searchParams.get('bookingId');
    const customerId = searchParams.get('customerId');

    await connectToDatabase();

    // Xây dựng query dựa trên các tham số
    const query: any = {};
    if (status) query.status = status;
    if (bookingId) query.bookingId = bookingId;
    if (customerId) query.customerId = customerId;

    const invoices = await Invoice.find(query).sort({ createdAt: -1 });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách invoices:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách invoices' },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Tạo invoice mới
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await connectToDatabase();

    // Tạo invoice mới
    const invoice = new Invoice(body);
    await invoice.save();

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Lỗi khi tạo invoice:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tạo invoice' },
      { status: 500 }
    );
  }
}
