import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, releaseConnection } from '@/lib/mongodb';
import { Setting, Customer, Booking, Invoice } from '@/models';

interface BatchRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: any;
}

interface BatchResponse {
  status: number;
  data?: any;
  error?: string;
}

// POST /api/batch - Xử lý nhiều requests trong một lần gọi
export async function POST(req: NextRequest) {
  try {
    const { requests } = await req.json() as { requests: BatchRequest[] };

    if (!Array.isArray(requests) || requests.length === 0) {
      return NextResponse.json(
        { error: 'Yêu cầu không hợp lệ. Cần cung cấp mảng requests.' },
        { status: 400 }
      );
    }

    // Giới hạn số lượng requests trong một batch
    if (requests.length > 10) {
      return NextResponse.json(
        { error: 'Số lượng requests vượt quá giới hạn (tối đa 10).' },
        { status: 400 }
      );
    }

    // Kết nối đến MongoDB
    await connectToDatabase();

    // Xử lý từng request
    const responses: BatchResponse[] = [];

    for (const request of requests) {
      try {
        const { method, path, body } = request;

        // Chỉ cho phép các đường dẫn an toàn
        const allowedPaths = ['/api/settings', '/api/customers', '/api/bookings', '/api/invoices'];
        const isAllowed = allowedPaths.some(allowedPath => path.startsWith(allowedPath));

        if (!isAllowed) {
          responses.push({
            status: 403,
            error: 'Đường dẫn không được phép'
          });
          continue;
        }

        // Xử lý request dựa trên method và path
        let response: BatchResponse;

        if (path === '/api/settings' || path.startsWith('/api/settings?')) {
          if (method === 'GET') {
            // Lấy tất cả settings hoặc theo loại
            const type = new URL(`http://localhost${path}`).searchParams.get('type');
            const isDefault = new URL(`http://localhost${path}`).searchParams.get('isDefault') === 'true';

            const query: any = {};
            if (type) query.type = type;
            if (isDefault) query.isDefault = true;

            const settings = await Setting.find(query);

            response = {
              status: 200,
              data: settings
            };
          } else if (method === 'POST' && body) {
            // Tạo hoặc cập nhật setting

            // Nếu setting mới là mặc định, cập nhật các setting khác cùng loại
            if (body.isDefault) {
              await Setting.updateMany(
                { type: body.type, isDefault: true },
                { isDefault: false }
              );
            }

            // Kiểm tra xem setting đã tồn tại chưa
            let setting;

            if (body._id || body.id) {
              const settingId = body._id || body.id;
              setting = await Setting.findByIdAndUpdate(
                settingId,
                { ...body, updatedAt: new Date() },
                { new: true }
              );
            } else {
              setting = new Setting(body);
              await setting.save();
            }

            response = {
              status: 200,
              data: setting
            };
          } else {
            response = {
              status: 405,
              error: 'Method not allowed'
            };
          }
        } else if (path.startsWith('/api/settings/')) {
          // Xử lý request với ID
          const id = path.split('/').pop();

          if (!id) {
            response = {
              status: 400,
              error: 'ID không hợp lệ'
            };
          } else if (method === 'GET') {
            // Lấy setting theo ID
            const setting = await Setting.findById(id);

            if (!setting) {
              response = {
                status: 404,
                error: 'Không tìm thấy setting'
              };
            } else {
              response = {
                status: 200,
                data: setting
              };
            }
          } else if (method === 'DELETE') {
            // Xóa setting
            const result = await Setting.findByIdAndDelete(id);

            if (!result) {
              response = {
                status: 404,
                error: 'Không tìm thấy setting'
              };
            } else {
              response = {
                status: 200,
                data: { message: 'Đã xóa setting thành công' }
              };
            }
          } else {
            response = {
              status: 405,
              error: 'Method not allowed'
            };
          }
        } else if (path === '/api/customers' || path.startsWith('/api/customers?')) {
          if (method === 'GET') {
            // Lấy tất cả customers hoặc theo query
            const searchParams = new URL(`http://localhost${path}`).searchParams;
            const phone = searchParams.get('phone');
            const search = searchParams.get('search');

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

            const customers = await Customer.find(query);

            response = {
              status: 200,
              data: customers
            };
          } else {
            response = {
              status: 405,
              error: 'Method not allowed'
            };
          }
        } else if (path === '/api/bookings' || path.startsWith('/api/bookings?')) {
          if (method === 'GET') {
            // Lấy tất cả bookings hoặc theo query
            const searchParams = new URL(`http://localhost${path}`).searchParams;
            const status = searchParams.get('status');
            const phone = searchParams.get('phone');
            const date = searchParams.get('date');
            const customerId = searchParams.get('customerId');

            // Xây dựng query dựa trên các tham số
            const query: any = {};
            if (status && status !== 'all') query.status = status;
            if (phone) query.phone = phone;
            if (date) query.date = date;
            if (customerId) query.customerId = customerId;

            const bookings = await Booking.find(query);

            response = {
              status: 200,
              data: bookings
            };
          } else {
            response = {
              status: 405,
              error: 'Method not allowed'
            };
          }
        } else if (path === '/api/invoices' || path.startsWith('/api/invoices?')) {
          if (method === 'GET') {
            // Lấy tất cả invoices hoặc theo query
            const searchParams = new URL(`http://localhost${path}`).searchParams;
            const customerId = searchParams.get('customerId');
            const status = searchParams.get('status');

            // Xây dựng query dựa trên các tham số
            const query: any = {};
            if (customerId) query.customerId = customerId;
            if (status) query.status = status;

            const invoices = await Invoice.find(query);

            response = {
              status: 200,
              data: invoices
            };
          } else {
            response = {
              status: 405,
              error: 'Method not allowed'
            };
          }
        } else {
          response = {
            status: 404,
            error: 'Not found'
          };
        }

        responses.push(response);
      } catch (error) {
        console.error('Lỗi khi xử lý request:', error);

        responses.push({
          status: 500,
          error: 'Lỗi server khi xử lý request'
        });
      }
    }

    // Giải phóng kết nối MongoDB
    releaseConnection();

    return NextResponse.json({ responses });
  } catch (error) {
    console.error('Lỗi khi xử lý batch request:', error);

    // Giải phóng kết nối MongoDB
    releaseConnection();

    return NextResponse.json(
      { error: 'Lỗi khi xử lý batch request' },
      { status: 500 }
    );
  }
}
