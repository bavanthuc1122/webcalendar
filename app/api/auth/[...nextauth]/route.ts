import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { connectToDatabase } from '@/lib/mongodb/index';
import { User } from '@/models';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mật khẩu', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Vui lòng nhập email và mật khẩu');
        }

        await connectToDatabase();

        // Tìm user theo email
        const user = await User.findOne({ email: credentials.email });

        if (!user) {
          throw new Error('Email không tồn tại');
        }

        // Kiểm tra mật khẩu
        const isPasswordValid = await user.comparePassword(credentials.password);

        if (!isPasswordValid) {
          throw new Error('Mật khẩu không đúng');
        }

        // Kiểm tra trạng thái hoạt động
        if (!user.isActive) {
          throw new Error('Tài khoản đã bị vô hiệu hóa');
        }

        // Kiểm tra xác thực email
        // Bỏ comment dòng dưới đây nếu muốn bắt buộc xác thực email
        // if (!user.emailVerified) {
        //   throw new Error('Vui lòng xác thực email trước khi đăng nhập');
        // }

        // Cập nhật thời gian đăng nhập cuối
        user.lastLogin = new Date();
        await user.save();

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 ngày
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Xử lý đăng nhập bằng Google
      if (account?.provider === 'google') {
        try {
          await connectToDatabase();

          // Kiểm tra xem người dùng đã tồn tại chưa
          let dbUser = await User.findOne({ email: user.email });

          if (!dbUser) {
            // Tạo người dùng mới nếu chưa tồn tại
            dbUser = new User({
              name: user.name,
              email: user.email,
              password: Math.random().toString(36).slice(-10), // Tạo mật khẩu ngẫu nhiên
              emailVerified: true, // Email đã được xác thực qua Google
              googleId: profile.sub,
            });

            await dbUser.save();
          } else if (!dbUser.googleId) {
            // Cập nhật googleId nếu người dùng đã tồn tại nhưng chưa liên kết với Google
            dbUser.googleId = profile.sub;
            await dbUser.save();
          }

          // Cập nhật thời gian đăng nhập cuối cùng
          dbUser.lastLogin = new Date();
          await dbUser.save();

          // Thêm thông tin vai trò vào user
          user.role = dbUser.role;
          user.id = dbUser._id.toString();
        } catch (error) {
          console.error('Lỗi khi xử lý đăng nhập Google:', error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      // Thêm thông tin từ đăng nhập Google
      if (account?.provider === 'google' && user) {
        token.role = user.role;
        token.id = user.id;
      } else if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
