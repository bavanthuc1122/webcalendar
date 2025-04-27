import { NextRequest, NextResponse } from 'next/server';

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

    const { text } = data;

    if (!text) {
      return NextResponse.json(
        { error: 'Thiếu thông tin đặt lịch' },
        { status: 400 }
      );
    }

    // Phân tích thông tin đặt lịch từ văn bản
    const parsedData = parseBookingText(text);

    // Log để debug
    console.log('Đã phân tích thành công:', parsedData);

    return new NextResponse(JSON.stringify(parsedData), {
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

function parseBookingText(text: string) {
  // Các regex để tìm thông tin
  const customerRegex = /(?:khách hàng|tên|kh)[:\s]+([^\n,]+)/i;
  const phoneRegex = /(?:số điện thoại|sđt|điện thoại|phone)[:\s]+([0-9]{10,11})/i;
  const dateRegex = /(?:ngày|date)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i;
  const timeRegex = /(?:giờ|time|lúc)[:\s]+(\d{1,2}[:\.]?\d{0,2})/i;
  const durationRegex = /(?:thời lượng|thời gian|duration)[:\s]+(\d+)(?:\s*(?:giờ|tiếng|h|hour))?/i;
  const depositRegex = /(?:đặt cọc|cọc|deposit)[:\s]+(\d+(?:[,.]\d+)?)[k\s]*(?:đồng|vnd|đ)?/i;
  const totalRegex = /(?:tổng|total|chi phí|giá)[:\s]+(\d+(?:[,.]\d+)?)[k\s]*(?:đồng|vnd|đ)?/i;
  const conceptsRegex = /(?:concept|ý tưởng)[:\s]+([^\n]+)/i;

  // Tìm thông tin từ văn bản
  const customerMatch = text.match(customerRegex);
  const phoneMatch = text.match(phoneRegex);
  const dateMatch = text.match(dateRegex);
  const timeMatch = text.match(timeRegex);
  const durationMatch = text.match(durationRegex);
  const depositMatch = text.match(depositRegex);
  const totalMatch = text.match(totalRegex);
  const conceptsMatch = text.match(conceptsRegex);

  // Xử lý ngày tháng
  let formattedDate = '';
  if (dateMatch) {
    const dateParts = dateMatch[1].split(/[\/\-\.]/);
    if (dateParts.length === 3) {
      // Kiểm tra xem định dạng là DD/MM/YYYY hay MM/DD/YYYY
      // Giả định là DD/MM/YYYY
      const day = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]);
      let year = parseInt(dateParts[2]);

      // Nếu năm chỉ có 2 chữ số, thêm 2000 hoặc 1900
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }

      formattedDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    }
  }

  // Xử lý giờ
  let formattedTime = '';
  if (timeMatch) {
    const timeStr = timeMatch[1];
    if (timeStr.includes(':') || timeStr.includes('.')) {
      // Nếu đã có định dạng HH:MM hoặc HH.MM
      const timeParts = timeStr.split(/[:.]/);
      const hours = parseInt(timeParts[0]);
      const minutes = timeParts.length > 1 ? parseInt(timeParts[1]) : 0;
      formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else {
      // Nếu chỉ có giờ
      const hours = parseInt(timeStr);
      formattedTime = `${hours.toString().padStart(2, '0')}:00`;
    }
  }

  // Xử lý số tiền
  const parseAmount = (match: RegExpMatchArray | null): number => {
    if (!match) return 0;

    let amount = match[1].replace(/[,.]/g, '');
    // Kiểm tra xem có 'k' không (nghĩa là nghìn)
    if (match[0].toLowerCase().includes('k')) {
      return parseInt(amount) * 1000;
    }
    return parseInt(amount);
  };

  // Tạo đối tượng dữ liệu
  const parsedData = {
    customer: customerMatch ? customerMatch[1].trim() : 'Khách hàng không xác định',
    phone: phoneMatch ? phoneMatch[1].trim() : '0000000000',
    date: formattedDate || '01/01/2023',
    time: formattedTime || '09:00',
    duration: durationMatch ? parseInt(durationMatch[1]) : 2,
    deposit: parseAmount(depositMatch),
    total: parseAmount(totalMatch) || 1000000, // Mặc định là 1 triệu nếu không tìm thấy
    concepts: conceptsMatch ? conceptsMatch[1].trim() : '',
  };

  return parsedData;
}
