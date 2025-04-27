import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Invoice } from '@/models';
import mongoose from 'mongoose';

// GET /api/invoices/[id] - Lấy invoice theo ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID invoice không hợp lệ' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return NextResponse.json(
        { error: 'Không tìm thấy invoice' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error(`Lỗi khi lấy invoice với ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy invoice' },
      { status: 500 }
    );
  }
}

// PUT /api/invoices/[id] - Cập nhật invoice
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
        { error: 'ID invoice không hợp lệ' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const invoice = await Invoice.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return NextResponse.json(
        { error: 'Không tìm thấy invoice' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error(`Lỗi khi cập nhật invoice với ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Lỗi khi cập nhật invoice' },
      { status: 500 }
    );
  }
}

// DELETE /api/invoices/[id] - Xóa invoice
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID invoice không hợp lệ' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const invoice = await Invoice.findByIdAndDelete(id);

    if (!invoice) {
      return NextResponse.json(
        { error: 'Không tìm thấy invoice' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Đã xóa invoice thành công' });
  } catch (error) {
    console.error(`Lỗi khi xóa invoice với ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa invoice' },
      { status: 500 }
    );
  }
}
