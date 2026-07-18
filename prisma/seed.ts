import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 1. Bersihkan data user admin-sarpras lama jika ada agar tidak bentrok
  await prisma.user.deleteMany({
    where: { username: "admin-sarpras" },
  });

  // 2. Buat hash password yang fresh langsung dari library
  const hashedPassword = await bcrypt.hash("adminbojonegoro123", 10);

  // 3. Masukkan data ke database dev.db
  const admin = await prisma.user.create({
    data: {
      username: "admin-sarpras",
      password: hashedPassword,
      nama: "Admin Sarpras Dinas",
      role: "ADMIN",
    },
  });

  console.log("=== SEEDING SUKSES ===");
  console.log("User Admin Berhasil Dibuat:", admin.username);
  console.log("======================");
}

main()
  .catch((e) => {
    console.error("Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });