import MongoDBConnectionManager from './connection-manager';

/**
 * Kết nối đến MongoDB sử dụng Connection Manager
 */
export async function connectToDatabase() {
  try {
    const connectionManager = MongoDBConnectionManager.getInstance();
    const connection = await connectionManager.getConnection();
    return connection;
  } catch (error) {
    console.error('Lỗi khi kết nối đến MongoDB:', error);
    throw error;
  }
}

/**
 * Hàm đóng kết nối đến MongoDB
 */
export async function disconnectFromDatabase() {
  const connectionManager = MongoDBConnectionManager.getInstance();
  connectionManager.releaseConnection();
}

/**
 * Kiểm tra trạng thái kết nối MongoDB
 */
export function getConnectionStatus() {
  const connectionManager = MongoDBConnectionManager.getInstance();
  return connectionManager.getConnectionStatus();
}
