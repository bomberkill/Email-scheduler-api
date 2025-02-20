import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    secure: false,
    port: Number(process.env.SMTP_PORT),
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async (to: string, subject: string, text: string) => {
    try {
        const info = await transporter.sendMail({
            from: `"Service auto" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
        });
        console.log(`✅ E-mail envoyé à ${to}: ${info.messageId} [ At ${new Date().toLocaleDateString()}]`);
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi de l'e-mail:", error ,`[ At ${new Date().toLocaleDateString()}]`);
    };
};