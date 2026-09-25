// app/api/photos/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import {
  PDFDocument,
  PDFRawStream,
  PDFName,
  PDFNumber,
  PDFRef,
} from 'pdf-lib';
import sharp from 'sharp';

// Dimensions connues des éléments graphiques FIXES du template de badge
const KNOWN_ASSET_DIMENSIONS = new Set([
  '1012x638', // logo établissement
  '450x450',  // QR code
  '100x100',  // icônes
]);

interface ImageCandidate {
  ref: PDFRef;
  stream: PDFRawStream;
  width: number;
  height: number;
}

async function replacePhotoInPdfStream(
  pdfBuffer: Buffer,
  newPhotoBuffer: Buffer
): Promise<{ buffer: Buffer; replaced: boolean }> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  if (pdfDoc.getPageCount() === 0) {
    return { buffer: pdfBuffer, replaced: false };
  }

  const allCandidates: ImageCandidate[] = [];
  const smaskTargetRefs = new Set<string>();

  const enumeratedObjects = pdfDoc.context.enumerateIndirectObjects();

  // 1er passage : Identifier TOUS les masques /SMask utilisés dans le document
  for (const [ref, obj] of enumeratedObjects) {
    if (!(obj instanceof PDFRawStream)) continue;

    const smaskRefObj = obj.dict.get(PDFName.of('SMask'));
    if (smaskRefObj) {
      // Extraction sécurisée de la référence string, même sous forme indirecte
      const smaskStr = smaskRefObj.toString();
      if (smaskStr) smaskTargetRefs.add(smaskStr);
    }
  }

  // 2ème passage : Collecter les images candidates (excluant les masques et petits assets)
  for (const [ref, obj] of enumeratedObjects) {
    if (!(obj instanceof PDFRawStream)) continue;

    const subtype = obj.dict.get(PDFName.of('Subtype'));
    if (subtype !== PDFName.of('Image')) continue;

    const widthObj = obj.dict.get(PDFName.of('Width'));
    const heightObj = obj.dict.get(PDFName.of('Height'));
    const width = widthObj instanceof PDFNumber ? widthObj.asNumber() : 0;
    const height = heightObj instanceof PDFNumber ? heightObj.asNumber() : 0;

    // Ignorer les trop petites images
    if (width <= 50 || height <= 50) continue;

    allCandidates.push({ ref, stream: obj, width, height });
  }

  // Filtrage strict des candidats
  const photoCandidates = allCandidates.filter((c) => {
    // Si l'image est ciblée par un SMask d'une autre image, ce n'est pas la photo principale
    if (smaskTargetRefs.has(c.ref.toString())) return false;
    // Si c'est un asset fixe
    if (KNOWN_ASSET_DIMENSIONS.has(`${c.width}x${c.height}`)) return false;
    return true;
  });

  // La vraie photo de profil est la plus grande image restante
  photoCandidates.sort((a, b) => b.width * b.height - a.width * a.height);

  if (photoCandidates.length === 0) {
    return { buffer: pdfBuffer, replaced: false };
  }

  const target = photoCandidates[0];
  const stream = target.stream;

  // Récupérer l'ancien masque alpha pour le supprimer proprement s'il existe
  const oldSmaskRef = stream.dict.get(PDFName.of('SMask'));

  // Remplacement du contenu de l'image par la nouvelle photo JPEG
  stream.contents = new Uint8Array(newPhotoBuffer);
  stream.dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
  stream.dict.set(PDFName.of('Length'), PDFNumber.of(newPhotoBuffer.length));
  stream.dict.set(PDFName.of('Width'), PDFNumber.of(300));
  stream.dict.set(PDFName.of('Height'), PDFNumber.of(400));

  // Nettoyage des clés héritées incompatibles avec le JPEG RGB
  stream.dict.delete(PDFName.of('SMask'));
  stream.dict.delete(PDFName.of('Decode'));
  stream.dict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceRGB'));
  stream.dict.set(PDFName.of('BitsPerComponent'), PDFNumber.of(8));

  // Suppression physique du masque devenant orphelin
  if (oldSmaskRef instanceof PDFRef) {
    pdfDoc.context.delete(oldSmaskRef);
  }

  const modifiedPdfBytes = await pdfDoc.save();
  return { buffer: Buffer.from(modifiedPdfBytes), replaced: true };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const matEtudiant = formData.get('matEtudiant') as string | null;

    if (!file || !matEtudiant) {
      return NextResponse.json({ error: 'Fichier ou matricule manquant' }, { status: 400 });
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // 1. Formatage Sharp : Orientation EXIF + Redimensionnement 300x400
    const processedPhotoBuffer = await sharp(rawBuffer)
      .rotate()
      .resize(300, 400, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 92 })
      .toBuffer();

    // 2. Sauvegarde du fichier photo dans public/uploads/photos/
    const photosDir = path.join(process.cwd(), 'public', 'uploads', 'photos');
    await fs.mkdir(photosDir, { recursive: true });
    const photoPath = path.join(photosDir, `${matEtudiant}.jpg`);
    await fs.writeFile(photoPath, processedPhotoBuffer);

    // 3. Mise à jour du PDF du Badge
    const badgePath = path.join(process.cwd(), 'public', 'uploads', 'badges', `${matEtudiant}.pdf`);
    let pdfUpdated = false;

    try {
      await fs.access(badgePath);
      const existingPdfBuffer = await fs.readFile(badgePath);

      const { buffer: updatedPdfBuffer, replaced } = await replacePhotoInPdfStream(
        existingPdfBuffer,
        processedPhotoBuffer
      );

      if (replaced) {
        await fs.writeFile(badgePath, updatedPdfBuffer);
        pdfUpdated = true;
      } else {
        console.warn(`Aucun flux image correspondant trouvé pour ${matEtudiant}.`);
      }
    } catch (err) {
      console.warn(`Badge PDF non trouvé ou erreur lors du remplacement :`, err);
    }

    const timestamp = Date.now();

    return NextResponse.json({
      success: true,
      photoUrl: `/uploads/photos/${matEtudiant}.jpg?v=${timestamp}`,
      pdfUrl: pdfUpdated ? `/uploads/badges/${matEtudiant}.pdf?v=${timestamp}` : null,
      pdfUpdated,
    });
  } catch (error: any) {
    console.error('Erreur Upload & Remplacement Photo:', error);
    return NextResponse.json({ error: error.message || 'Échec du traitement' }, { status: 500 });
  }
}