import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    // Kiểm tra xem request có body không
    const body = await request.text();
    if (!body) {
      return NextResponse.json(
        { error: 'Thiếu dữ liệu đầu vào' },
        { status: 400 }
      );
    }

    // Parse JSON từ body
    let data;
    try {
      data = JSON.parse(body);
    } catch (jsonError) {
      console.error('Lỗi khi parse JSON:', jsonError);
      return NextResponse.json(
        { error: 'Dữ liệu đầu vào không phải là JSON hợp lệ' },
        { status: 400 }
      );
    }

    const { batchText } = data;

    if (!batchText) {
      return NextResponse.json(
        { error: 'Thiếu thông tin đặt lịch' },
        { status: 400 }
      );
    }

    // Kiểm tra API key
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!apiKey) {
      console.error('API key không được cấu hình');
      return NextResponse.json(
        { error: 'API key không được cấu hình' },
        { status: 500 }
      );
    }

    // Khởi tạo Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Tạo prompt để phân tích nhiều lịch hẹn
    const prompt = `
      Phân tích thông tin đặt lịch sau và trả về dưới dạng mảng JSON hợp lệ.
      Mỗi lịch hẹn sẽ là một phần tử trong mảng.
      
      Thông tin đặt lịch:
      ${batchText}
      
      Trả về mảng JSON với mỗi phần tử có các trường:
      - customer: tên khách hàng (chỉ lấy tên người, không bao gồm các thông tin khác)
      - time: giờ bắt đầu chụp (định dạng HH:MM, ví dụ: 10:00, 14:30)
      - duration: thời lượng chụp tính bằng giờ (mặc định là 2 nếu không có thông tin)
      - deposit: tiền đặt cọc (chỉ số, không có đơn vị)
      - total: tổng chi phí (chỉ số, không có đơn vị)
      - phone: số điện thoại
      - date: ngày chụp (định dạng DD/MM/YYYY)
      - concepts: các ý tưởng chụp (nếu có)
      
      Quy tắc phân tích:
      - Nếu thấy "10h" hoặc tương tự, chuyển thành "10:00"
      - Nếu thấy "10h30" hoặc tương tự, chuyển thành "10:30"
      - Nếu thấy "950k" hoặc tương tự, chuyển thành 950000 (không có đơn vị)
      - Nếu thấy "2tr" hoặc tương tự, chuyển thành 2000000 (không có đơn vị)
      - Nếu thấy ngày dạng "25.5.2025" hoặc tương tự, chuyển thành "25/05/2025"
      - Nếu không có thông tin về thời lượng, mặc định là 2 giờ
      - Nếu thấy thời gian dạng "18h - 21h", tính thời lượng là 3 giờ và lấy 18:00 là giờ bắt đầu
      
      Chỉ trả về mảng JSON, không thêm bất kỳ văn bản nào khác.
    `;

    // Gọi Gemini API
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log('Phản hồi từ Gemini:', text);

    // Tìm và phân tích phần JSON từ phản hồi
    let parsedData: any[];
    try {
      // Thử phân tích trực tiếp nếu phản hồi là JSON hợp lệ
      parsedData = JSON.parse(text);
      
      // Kiểm tra xem kết quả có phải là mảng không
      if (!Array.isArray(parsedData)) {
        throw new Error('Kết quả không phải là mảng JSON');
      }
    } catch (jsonError) {
      console.log('Không thể phân tích trực tiếp, thử tìm JSON trong văn bản...');
      // Nếu không thành công, thử tìm JSON trong văn bản
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0]);
          
          // Kiểm tra xem kết quả có phải là mảng không
          if (!Array.isArray(parsedData)) {
            throw new Error('Kết quả không phải là mảng JSON');
          }
        } catch (matchError) {
          console.error('Lỗi khi phân tích JSON từ phần khớp:', matchError);
          throw new Error('Không thể phân tích JSON từ phản hồi');
        }
      } else {
        console.error('Không tìm thấy JSON trong phản hồi');
        throw new Error('Không tìm thấy JSON trong phản hồi');
      }
    }

    // Thêm trường status vào mỗi lịch hẹn
    const bookingsWithStatus = parsedData.map(booking => ({
      ...booking,
      status: 'pending'
    }));

    // Log để debug
    console.log('Đã phân tích thành công:', bookingsWithStatus);

    return new NextResponse(JSON.stringify(bookingsWithStatus), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Lỗi khi phân tích thông tin đặt lịch:', error);
    return NextResponse.json(
      { error: 'Không thể phân tích thông tin đặt lịch' },
      { status: 500 }
    );
  }
}
