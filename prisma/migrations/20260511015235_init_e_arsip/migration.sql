-- CreateTable
CREATE TABLE "SuratMasuk" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "noUrut" INTEGER NOT NULL,
    "noBerkas" TEXT NOT NULL,
    "alamatPengirim" TEXT NOT NULL,
    "tanggalSurat" DATETIME NOT NULL,
    "nomorSurat" TEXT NOT NULL,
    "perihal" TEXT NOT NULL,
    "noPetunjuk" TEXT,
    "noPaket" TEXT,
    "fileUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SuratKeluar" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "noUrut" INTEGER NOT NULL,
    "noBerkas" TEXT NOT NULL,
    "tujuanSurat" TEXT NOT NULL,
    "tanggalSurat" DATETIME NOT NULL,
    "nomorSurat" TEXT NOT NULL,
    "perihal" TEXT NOT NULL,
    "fileUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
