import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    // 1. Cari user berdasarkan username di dev.db
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
    }

    // 2. Cocokkan password teks biasa dengan hash yang ada di database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
    }

    // 3. Berikan cookie akses tanda sukses login (Berlaku 7 hari)
const cookieStore = await cookies();

// Setel cookie dengan opsi yang ramah terhadap domain lokal non-HTTPS
cookieStore.set("session_user", user.username, {
  httpOnly: true,
  secure: false, // Wajib FALSE karena sipedas.local:3000 tidak menggunakan sertifikat SSL/HTTPS
  sameSite: "lax", // Mengizinkan cookie dibawa saat pengalihan rute internal
  maxAge: 60 * 60 * 24 * 7, // 7 hari
  path: "/",
});

return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LOGIN_API_ERROR]:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada sistem server" }, { status: 500 });
  }
}