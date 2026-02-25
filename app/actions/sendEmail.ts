'use server'

import nodemailer from 'nodemailer'

export async function sendSuspensionEmail(to: string, days: number, untilString: string) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('SMTP credentials not configured. Skipping email sending.')
        return
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    })

    const endDate = new Date(untilString).toLocaleDateString('ko-KR')

    const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: '[DevLog] 계정 활동 정지 처분 안내',
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px; max-w-[600px]; margin: 0 auto;">
                <h2 style="color: #ef4444;">계정 활동 정지 안내</h2>
                <p>회원님의 계정이 서비스 이용 약관 위반으로 인해 <strong>${days}일간 활동 정지</strong> 처리되었습니다.</p>
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>정지 해제 예정일:</strong> ${endDate}</p>
                </div>
                <p>정지 해제 시점까지 새로운 게시물 및 댓글 작성 등 일부 서비스 이용이 제한됨을 알려드립니다.<br/>추가 문의사항이 있으시면 고객센터로 연락 바랍니다.</p>
                <br/>
                <p style="color: #6b7280; font-size: 14px;">감사합니다.<br/>DevLog 관리팀 드림</p>
            </div>
        `
    }

    try {
        await transporter.sendMail(mailOptions)
        console.log(`[Success] Suspension email sent to ${to}`)
    } catch (error) {
        console.error('[Error] Email sending failed:', error)
    }
}
