import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const { id, targetFolderId, type } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });
    }

    const destinationId = targetFolderId === "null" || !targetFolderId ? null : targetFolderId;

    if (type === "folder") {
      // Pindahkan FolderSuratMasuk ke folder orang tua lain
      const updatedFolder = await prisma.folderSuratMasuk.update({
        where: { id: id },
        data: { parentId: destinationId },
      });
      return NextResponse.json(updatedFolder);
    } else {
      // Pindahkan SuratMasuk ke FolderSuratMasuk lain
      const updatedSurat = await prisma.suratMasuk.update({
        where: { id: parseInt(id) },
        data: { folderId: destinationId },
      });
      return NextResponse.json(updatedSurat);
    }
  } catch (error) {
    console.error("Move Surat Masuk Error:", error);
    return NextResponse.json({ error: "Gagal memindahkan data" }, { status: 500 });
  }
}