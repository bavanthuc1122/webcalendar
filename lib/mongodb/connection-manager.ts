import mongoose from 'mongoose';

// Thời gian tối đa không hoạt động trước khi đóng kết nối (ms)
const IDLE_TIMEOUT = 60000; // 1 phút

class MongoDBConnectionManager {
  private static instance: MongoDBConnectionManager;
  private connection: mongoose.Connection | null = null;
  private connectionPromise: Promise<mongoose.Connection> | null = null;
  private idleTimer: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;
  private connectionCount: number = 0;

  private constructor() {}

  public static getInstance(): MongoDBConnectionManager {
    if (!MongoDBConnectionManager.instance) {
      MongoDBConnectionManager.instance = new MongoDBConnectionManager();
    }
    return MongoDBConnectionManager.instance;
  }

  /**
   * Lấy kết nối MongoDB hiện tại hoặc tạo kết nối mới
   */
  public async getConnection(): Promise<mongoose.Connection> {
    // Tăng số lượng kết nối đang sử dụng
    this.connectionCount++;
    
    // Hủy timer đóng kết nối nếu có
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    // Nếu đã có kết nối và kết nối đang hoạt động, trả về kết nối đó
    if (this.connection && this.connection.readyState === 1) {
      return this.connection;
    }

    // Nếu đang trong quá trình kết nối, đợi kết nối hoàn tất
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    // Tạo kết nối mới
    this.isConnecting = true;
    
    try {
      this.connectionPromise = this.createConnection();
      this.connection = await this.connectionPromise;
      return this.connection;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Giải phóng kết nối khi không còn sử dụng
   */
  public releaseConnection(): void {
    // Giảm số lượng kết nối đang sử dụng
    if (this.connectionCount > 0) {
      this.connectionCount--;
    }

    // Nếu không còn kết nối nào đang sử dụng, đặt timer để đóng kết nối
    if (this.connectionCount === 0 && this.connection && !this.idleTimer) {
      this.idleTimer = setTimeout(() => {
        this.closeConnection();
      }, IDLE_TIMEOUT);
    }
  }

  /**
   * Đóng kết nối MongoDB
   */
  private async closeConnection(): Promise<void> {
    if (this.connection && this.connection.readyState !== 0) {
      try {
        await mongoose.disconnect();
        console.log('MongoDB connection closed due to inactivity');
        this.connection = null;
        this.connectionPromise = null;
      } catch (error) {
        console.error('Error closing MongoDB connection:', error);
      }
    }
    
    this.idleTimer = null;
  }

  /**
   * Tạo kết nối MongoDB mới
   */
  private async createConnection(): Promise<mongoose.Connection> {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI không được định nghĩa trong biến môi trường');
    }

    try {
      console.log('Creating new MongoDB connection...');
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // Timeout khi chọn server
        socketTimeoutMS: 45000, // Timeout khi không có hoạt động trên socket
      });

      const connection = mongoose.connection;

      // Xử lý sự kiện kết nối
      connection.on('connected', () => {
        console.log('MongoDB connected successfully');
      });

      connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });

      connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
      });

      // Xử lý khi ứng dụng đóng
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('MongoDB connection closed due to app termination');
        process.exit(0);
      });

      return connection;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra trạng thái kết nối
   */
  public getConnectionStatus(): {
    isConnected: boolean;
    readyState: number;
    connectionCount: number;
  } {
    return {
      isConnected: this.connection?.readyState === 1,
      readyState: this.connection?.readyState || 0,
      connectionCount: this.connectionCount,
    };
  }
}

export default MongoDBConnectionManager;
