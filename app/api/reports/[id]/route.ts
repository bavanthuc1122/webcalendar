import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Report } from '@/models';
import mongoose from 'mongoose';

// GET /api/reports/[id] - Lấy report theo ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID report không hợp lệ' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const report = await Report.findById(id);

    if (!report) {
      return NextResponse.json(
        { error: 'Không tìm thấy report' },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error(`Lỗi khi lấy report với ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy report' },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/[id] - Xóa report
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID report không hợp lệ' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const report = await Report.findByIdAndDelete(id);

    if (!report) {
      return NextResponse.json(
        { error: 'Không tìm thấy report' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Đã xóa report thành công' });
  } catch (error) {
    console.error(`Lỗi khi xóa report với ID ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa report' },
      { status: 500 }
    );
  }
}
