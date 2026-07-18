import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const { id, targetFolderId, type } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });
    }

    // Menentukan ID tujuan (null berarti pindah ke root/beranda dokumentasi)
    const destinationId = targetFolderId === "null" || !targetFolderId ? null : targetFolderId;

    if (type === "folder") {
      // Pindahkan FolderDokumentasi ke folder orang tua (parent) lain
      const updatedFolder = await prisma.folderDokumentasi.update({
        where: { id: id },
        data: { parentId: destinationId },
      });
      return NextResponse.json(updatedFolder);
    } else {
      // Pindahkan Dokumentasi ke FolderDokumentasi lain
      const updatedDokumentasi = await prisma.dokumentasi.update({
        where: { id: parseInt(id) },
        data: { folderId: destinationId },
      });
      return NextResponse.json(updatedDokumentasi);
    }
  } catch (error) {
    console.error("Move Dokumentasi Error:", error);
    return NextResponse.json({ error: "Gagal memindahkan data dokumentasi" }, { status: 500 });
  }
}