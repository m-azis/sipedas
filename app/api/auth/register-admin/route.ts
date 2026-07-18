import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    // 1. Ambil parameter data dari URL (Query Params)
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    const password = searchParams.get("password");
    const nama = searchParams.get("nama");
    const role = searchParams.get("role") || "USER"; // Default jika tidak diisi adalah USER

    // 2. Validasi input wajib
    if (!username || !password || !nama) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Parameter 'username', 'password', dan 'nama' wajib diisi di URL!" 
        },
        { status: 400 }
      );
    }

    // 3. Periksa apakah username sudah terdaftar sebelumnya agar tidak duplikat
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: `Username '${username}' sudah digunakan oleh staf lain!` },
        { status: 400 }
      );
    }

    // 4. Enkripsi password baru menggunakan bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Simpan user baru ke database SQLite
    const newUser = await prisma.user.create({
      data: {
        username: username,
        password: hashedPassword,
        nama: nama,
        role: role.toUpperCase(), // Memastikan huruf kapital (ADMIN / USER)
      },
    });

    return NextResponse.json({
      success: true,
      message: `User baru berhasil didaftarkan ke sistem E-Arsip!`,
      data: {
        username: newUser.username,
        nama: newUser.nama,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error("[REGISTER_NEW_USER_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menambahkan user baru" },
      { status: 500 }
    );
  }
}