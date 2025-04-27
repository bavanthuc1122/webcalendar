import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Kiểm tra xem người dùng đã đăng nhập chưa
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Các đường dẫn không cần xác thực
  const publicPaths = [
    '/auth/login',
    '/auth/register',
    '/auth/error',
    '/auth/verify-email',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/api/auth',
    '/test-mongodb',
  ];

  // Kiểm tra xem đường dẫn hiện tại có cần xác thực không
  const isPublicPath = publicPaths.some(path =>
    pathname.startsWith(path) || pathname === path
  );

  // Nếu đường dẫn cần xác thực và người dùng chưa đăng nhập
  if (!isPublicPath && !token) {
    // Chuyển hướng đến trang đăng nhập
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Nếu người dùng đã đăng nhập và đang truy cập trang đăng nhập hoặc đăng ký
  if (token && (pathname === '/auth/login' || pathname === '/auth/register')) {
    // Chuyển hướng đến trang chủ
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Các đường dẫn chỉ dành cho admin
  const adminPaths = [
    '/admin',
    '/api/users',
  ];

  // Kiểm tra xem đường dẫn hiện tại có chỉ dành cho admin không
  const isAdminPath = adminPaths.some(path =>
    pathname.startsWith(path) || pathname === path
  );

  // Nếu đường dẫn chỉ dành cho admin và người dùng không phải là admin
  if (isAdminPath && token?.role !== 'admin') {
    // Chuyển hướng đến trang chủ
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Chỉ áp dụng middleware cho các đường dẫn sau
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
