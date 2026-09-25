// app/api/badges/update-photo/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

export async function POST(req: Request) {
  try {
    const { matEtudiant, newPhotoBase64, x, y, width, height } = await req.json();

    const pdfPath = path.join(process.cwd(), 'public', 'uploads', 'badges', `${matEtudiant}.pdf`);
    const existingPdfBytes = await fs.readFile(pdfPath);

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Intégration de la nouvelle photo
    const imageBytes = Buffer.from(newPhotoBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const embeddedImage = newPhotoBase64.includes('image/png')
      ? await pdfDoc.embedPng(imageBytes)
      : await pdfDoc.embedJpg(imageBytes);

    // Dessiner la nouvelle photo par-dessus l'emplacement de l'ancienne
    // Remarque : Dans PDF, l'origine (0,0) est en bas à gauche
    firstPage.drawImage(embeddedImage, {
      x: x || 50,
      y: y || 100,
      width: width || 120,
      height: height || 150,
    });

    const modifiedPdfBytes = await pdfDoc.save();
    await fs.writeFile(pdfPath, modifiedPdfBytes);

    return NextResponse.json({ success: true, message: 'Photo mise à jour sur le PDF' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}