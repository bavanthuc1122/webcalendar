import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/models';

export async function POST(request: NextRequest) {
  try {
    console.log('=== RESET GOOGLE CALENDAR CONFIG ===');
    console.log('Bắt đầu xóa tất cả cấu hình Google Calendar');
    
    // Kết nối đến MongoDB
    await connectToDatabase();
    
    // Xóa tất cả cấu hình Google Calendar
    const result = await Setting.deleteMany({ type: 'googleCalendar' });
    
    console.log(`Đã xóa ${result.deletedCount} cấu hình Google Calendar`);
    
    return NextResponse.json({
      success: true,
      message: `Đã xóa ${result.deletedCount} cấu hình Google Calendar`,
    });
  } catch (error) {
    console.error('Lỗi khi xóa cấu hình Google Calendar:', error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa cấu hình Google Calendar' },
      { status: 500 }
    );
  }
}
