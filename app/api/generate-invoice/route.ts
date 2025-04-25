import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { bookingData, templateId, logo, qrCode, accentColor, paymentInfo } = await request.json();

    // Kiểm tra dữ liệu đầu vào
    if (!bookingData) {
      return NextResponse.json(
        { error: 'Thiếu thông tin đặt lịch' },
        { status: 400 }
      );
    }

    // Tạo PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Tạo buffer để lưu PDF
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    // Tạo promise để đợi PDF được tạo xong
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
    });

    // Thêm nội dung vào PDF
    // Logo
    if (logo) {
      const logoData = logo.split(',')[1];
      const logoBuffer = Buffer.from(logoData, 'base64');
      doc.image(logoBuffer, 50, 50, { width: 100 });
    }

    // Tiêu đề
    doc.fontSize(24)
       .fillColor(accentColor || '#FF5A5F')
       .text('HÓA ĐƠN', logo ? 160 : 50, 50);

    // Thông tin hóa đơn
    doc.fontSize(10)
       .fillColor('#000000')
       .text(`Mã hóa đơn: INV-${Math.floor(Math.random() * 10000)}`, 400, 50)
       .text(`Ngày: ${bookingData.date}`, 400, 65);

    // Thông tin khách hàng
    doc.fontSize(12)
       .text('Thông tin khách hàng:', 50, 120)
       .fontSize(10)
       .text(`Tên: ${bookingData.customer}`, 50, 140)
       .text(`Số điện thoại: ${bookingData.phone}`, 50, 155);

    // Thông tin đặt lịch
    doc.fontSize(12)
       .text('Chi tiết đặt lịch:', 300, 120)
       .fontSize(10)
       .text(`Ngày chụp: ${bookingData.date}`, 300, 140)
       .text(`Thời gian: ${bookingData.time} (${bookingData.duration} giờ)`, 300, 155);

    // Bảng dịch vụ
    doc.moveTo(50, 200)
       .lineTo(550, 200)
       .strokeColor(accentColor || '#FF5A5F')
       .lineWidth(2)
       .stroke();

    doc.fontSize(12)
       .fillColor('#000000')
       .text('Dịch vụ', 50, 210)
       .text('Thành tiền', 450, 210, { align: 'right' });

    doc.moveTo(50, 230)
       .lineTo(550, 230)
       .strokeColor('#CCCCCC')
       .lineWidth(1)
       .stroke();

    // Dịch vụ chụp ảnh
    doc.fontSize(10)
       .text(`Dịch vụ chụp ảnh (${bookingData.duration} giờ)`, 50, 240)
       .text(`${bookingData.total.toLocaleString('vi-VN')}đ`, 450, 240, { align: 'right' });

    // Concept nếu có
    let yPos = 260;
    if (bookingData.concepts) {
      doc.text(`Concept: ${bookingData.concepts}`, 50, yPos)
         .text('-', 450, yPos, { align: 'right' });
      yPos += 20;
    }

    // Tổng cộng
    doc.moveTo(50, yPos)
       .lineTo(550, yPos)
       .strokeColor('#CCCCCC')
       .lineWidth(1)
       .stroke();

    yPos += 10;
    doc.text('Đã đặt cọc:', 50, yPos)
       .text(`${bookingData.deposit.toLocaleString('vi-VN')}đ`, 450, yPos, { align: 'right' });

    yPos += 20;
    doc.moveTo(50, yPos)
       .lineTo(550, yPos)
       .strokeColor(accentColor || '#FF5A5F')
       .lineWidth(2)
       .stroke();

    yPos += 10;
    doc.fontSize(12)
       .fillColor(accentColor || '#FF5A5F')
       .text('Còn lại:', 50, yPos)
       .text(`${(bookingData.total - bookingData.deposit).toLocaleString('vi-VN')}đ`, 450, yPos, { align: 'right' });

    // Thêm thông tin thanh toán và mã QR nếu có
    const paymentYPos = yPos + 40; // Đặt vị trí cho phần thanh toán dưới phần tổng cộng

    if (paymentInfo || qrCode) {
      doc.moveTo(50, paymentYPos)
         .lineTo(550, paymentYPos)
         .strokeColor('#CCCCCC')
         .lineWidth(1)
         .stroke();

      let currentYPos = paymentYPos + 20;
      doc.fontSize(12)
         .fillColor('#000000')
         .text('Thông tin thanh toán', 50, currentYPos);

      currentYPos += 20;

      if (paymentInfo) {
        doc.fontSize(10)
           .text(paymentInfo, 50, currentYPos, { width: 300 });
      }

      if (qrCode) {
        const qrData = qrCode.split(',')[1];
        const qrBuffer = Buffer.from(qrData, 'base64');

        // Nếu có thông tin thanh toán, đặt mã QR bên phải
        if (paymentInfo) {
          doc.image(qrBuffer, 400, currentYPos, { width: 100 });
        } else {
          doc.image(qrBuffer, 50, currentYPos, { width: 100 });
        }
      }
    }

    // Chân trang
    doc.fontSize(10)
       .fillColor('#666666')
       .text('Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!', 50, 700, { align: 'center' });

    // Kết thúc tạo PDF
    doc.end();

    // Đợi PDF được tạo xong
    const pdfBuffer = await pdfPromise;

    // Tạo tên file
    const fileName = `invoice_${bookingData.customer.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

    // Trong môi trường thực tế, bạn sẽ lưu file vào cloud storage như S3
    // Ở đây, chúng ta giả định rằng file được lưu vào thư mục public
    const publicDir = path.join(process.cwd(), 'public', 'invoices');

    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Lưu file
    fs.writeFileSync(path.join(publicDir, fileName), pdfBuffer);

    // Trả về URL của file
    const pdfUrl = `/invoices/${fileName}`;

    return NextResponse.json({
      success: true,
      pdfUrl,
      fileName
    });
  } catch (error) {
    console.error('Lỗi khi tạo hóa đơn PDF:', error);
    return NextResponse.json(
      { error: 'Không thể tạo hóa đơn PDF' },
      { status: 500 }
    );
  }
}
