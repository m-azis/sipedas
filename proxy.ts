import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Di Next.js 16, nama fungsi WAJIB 'proxy' agar aktif saat kompilasi build
export function proxy(request: NextRequest) {
  const session = request.cookies.get("session_user")?.value;
  const { pathname } = request.nextUrl;

  // Daftar halaman internal SIPEDAS yang wajib dikunci
  const protectedRoutes = ["/", "/surat-masuk", "/surat-keluar", "/dokumen-kerja", "/dokumentasi"];

  // 1. Jika mencoba masuk halaman internal TAPI cookie kosong
  if (!session && protectedRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Jika cookie ada (sudah login), jangan biarkan masuk ke form login lagi
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Abaikan aset statis, gambar, api internal, dan prefetch agar tidak memicu loop
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo.png|.*\\..*).*)"],
};