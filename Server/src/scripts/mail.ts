import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FRONTEND_URL = process.env.URL_FRONTEND_LOGIN || 'http://localhost:3000';

export const sendForgotPasswordEmail = async (email: string, newPass: string) => {
  await resend.emails.send({
    from: 'Kra Tognoek <onboarding@resend.dev>',
    to: email,
    subject: '🔑 Mật khẩu mới cho tài khoản Kra Tognoek',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; text-align: center; background-color: #ffffff;">
        <div style="margin-bottom: 24px;">
            <span style="font-size: 40px;">🛡️</span>
        </div>
        <h2 style="color: #1e293b; margin-top: 0; font-size: 24px;">Mật khẩu đã được đặt lại</h2>
        <p style="color: #64748b; font-size: 16px;">Chào bạn, chúng tôi đã tạo một mật khẩu tạm thời cho tài khoản của bạn. Vui lòng sử dụng thông tin bên dưới:</p>
        
        <div style="margin: 32px 0;">
            <p style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Mật khẩu mới của bạn</p>
            <div style="background: #f1f5f9; padding: 20px; border-radius: 16px; border: 2px dashed #cbd5e1; position: relative;">
                <code style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; color: #2563eb; letter-spacing: 2px; user-select: all;">
                  ${newPass}
                </code>
            </div>
        </div>

        <div style="margin-top: 32px;">
            <a href="${FRONTEND_URL}" 
               style="display: inline-block; background: #1e293b; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; transition: background 0.2s;">
               Quay lại Trang chủ
            </a>
        </div>

        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #f1f5f9;">
            <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
                Vì lý do an toàn, hãy đổi mật khẩu này ngay sau khi đăng nhập thành công.<br>
                Nếu không phải bạn yêu cầu, hãy liên hệ hỗ trợ ngay lập tức.
            </p>
        </div>
      </div>
    `
  });
};