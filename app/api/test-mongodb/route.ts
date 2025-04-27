import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/index';
import mongoose from 'mongoose';

// GET /api/test-mongodb - Kiểm tra kết nối MongoDB
export async function GET(req: NextRequest) {
  try {
    // Kết nối đến MongoDB
    await connectToDatabase();

    // Kiểm tra trạng thái kết nối
    const connectionState = mongoose.connection.readyState;
    const stateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
      99: 'uninitialized'
    };

    // Lấy thông tin về các collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    // Lấy thông tin về database
    const dbStats = await mongoose.connection.db.stats();

    return NextResponse.json({
      status: 'success',
      message: 'Kết nối MongoDB thành công',
      connectionState: stateMap[connectionState] || 'unknown',
      database: mongoose.connection.db.databaseName,
      collections: collectionNames,
      stats: {
        collections: dbStats.collections,
        views: dbStats.views,
        objects: dbStats.objects,
        avgObjSize: dbStats.avgObjSize,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes,
        indexSize: dbStats.indexSize,
      }
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra kết nối MongoDB:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Lỗi khi kiểm tra kết nối MongoDB',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
