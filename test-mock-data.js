// Dữ liệu mẫu mô phỏng kết quả phân tích từ Gemini API
const mockParsedData = {
  customer: "Nguyễn Văn A",
  concepts: "Chụp ảnh gia đình, ngoại cảnh công viên",
  hours: 3,
  deposit: 500000,
  total: 2000000,
  phone: "0912345678",
  date: "15/06/2024"
};

// Hàm mô phỏng phân tích dữ liệu
const mockParseBookingData = (text) => {
  console.log('Đang mô phỏng phân tích dữ liệu:', text);
  
  // Trong thực tế, đây là nơi Gemini API sẽ phân tích văn bản
  // Trả về dữ liệu mẫu để kiểm thử
  return new Promise((resolve) => {
    // Mô phỏng độ trễ của API call
    setTimeout(() => {
      resolve(mockParsedData);
    }, 1500);
  });
};

// Export để sử dụng trong các file khác
export { mockParsedData, mockParseBookingData };