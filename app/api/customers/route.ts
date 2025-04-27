import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/index';
import { Customer } from '@/models';

// GET /api/customers - Lấy tất cả các customers
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    const search = searchParams.get('search');

    await connectToDatabase();

    // Xây dựng query dựa trên các tham số
    let query: any = {};
    if (phone) query.phone = phone;
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách customers:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách customers' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Tạo customer mới
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await connectToDatabase();

    // Kiểm tra xem khách hàng đã tồn tại chưa
    const existingCustomer = await Customer.findOne({ phone: body.phone });
    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Số điện thoại đã tồn tại' },
        { status: 400 }
      );
    }

    // Tạo customer mới
    const customer = new Customer(body);
    await customer.save();

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Lỗi khi tạo customer:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tạo customer' },
      { status: 500 }
    );
  }
}
