import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Vui lòng định nghĩa biến môi trường MONGODB_URI trong .env.local'
  );
}

/**
 * Biến toàn cục để lưu trữ kết nối MongoDB
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Kết nối đến MongoDB
 */
export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Xử lý sự kiện kết nối
mongoose.connection.on('connected', () => {
  console.log('MongoDB đã kết nối thành công');
});

mongoose.connection.on('error', (err) => {
  console.error('Lỗi kết nối MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB đã ngắt kết nối');
});

// Xử lý khi ứng dụng đóng
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});
