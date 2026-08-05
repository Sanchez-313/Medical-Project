import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import pool from "@/config/db";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { verifyTotp } from "@/lib/totp";
import type { RowDataPacket } from "mysql2";
import type { Role } from "@/types/next-auth";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  is_active: number;
  totp_secret: string | null;
  totp_enabled: number;
}

export const authOptions: AuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        recaptchaToken: { label: "recaptchaToken", type: "text" },
        totpCode: { label: "totpCode", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        const recaptcha = await verifyRecaptcha(credentials?.recaptchaToken);
        if (!recaptcha.ok) return null;

        const [rows] = await pool.query<UserRow[]>(
          "SELECT id, name, email, password_hash, role, is_active, totp_secret, totp_enabled FROM users WHERE email = :email LIMIT 1",
          { email }
        );
        const user = rows[0];
        if (!user || !user.is_active) return null;

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return null;

        // 2FA (owner/staff/agent only — see lib/totp.ts). The password step
        // completes fully before this runs, so a wrong TOTP code never
        // leaks anything about whether the password itself was right.
        if (user.totp_enabled && user.totp_secret) {
          const totpCode = credentials?.totpCode?.trim();
          if (!totpCode) throw new Error("TOTP_REQUIRED");
          if (!(await verifyTotp(totpCode, user.totp_secret))) throw new Error("TOTP_INVALID");
        }

        return { id: String(user.id), name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
