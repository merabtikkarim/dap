// app/api/badges/upload-pdf/route.ts
import { NextResponse } from 'next/server';
import sharp, { Sharp } from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import {
  PDFDocument,
  PDFRawStream,
  PDFName,
  PDFNumber,
  PDFRef,
  PDFArray,
  decodePDFRawStream,
} from 'pdf-lib';
import sharp from 'sharp';

// Dimensions connues des éléments graphiques FIXES du template de badge
// (logo, QR code, icônes) qui ne doivent JAMAIS être pris pour la photo
// de l'étudiant. À ajuster si le template change.
const KNOWN_ASSET_DIMENSIONS = new Set([
  '1012x638', // logo établissement
  '450x450', // QR code
  '100x100', // icônes
]);

interface ImageCandidate {
  ref: PDFRef;
  buffer: Buffer;
  width: number;
  height: number;
  isRawPixels: boolean;
  channels: number;
  filters: string[];
}

/**
 * Extrait et décompresse les données d'un flux PDFRawStream en Buffer standard
 */
function getDecodedStreamBuffer(stream: PDFRawStream): Buffer | null {
  try {
    const decoded = decodePDFRawStream(stream);
    return Buffer.from(decoded.decode());
  } catch (err) {
    try {
      return Buffer.from(stream.contents);
    } catch {
      return null;
    }
  }
}

/**
 * Retourne les noms de filtres appliqués au flux (ex: ['DCTDecode'], ['FlateDecode'])
 * Le /Filter peut être un PDFName unique ou un PDFArray de PDFName (filtres chaînés)
 */
function getFilterNames(stream: PDFRawStream): string[] {
  const filterObj = stream.dict.get(PDFName.of('Filter'));
  if (!filterObj) return [];

  if (filterObj instanceof PDFName) {
    return [filterObj.decodeText()];
  }
  if (filterObj instanceof PDFArray) {
    const names: string[] = [];
    for (let i = 0; i < filterObj.size(); i++) {
      const item = filterObj.get(i);
      if (item instanceof PDFName) names.push(item.decodeText());
    }
    return names;
  }
  return [];
}

/**
 * Détermine le nombre de canaux couleur à partir du /ColorSpace du PDF
 * (nécessaire pour reconstruire une image à partir de pixels bruts FlateDecode)
 */
function getChannelsFromColorSpace(stream: PDFRawStream): number {
  const csObj = stream.dict.get(PDFName.of('ColorSpace'));

  let csName = '';
  if (csObj instanceof PDFName) {
    csName = csObj.decodeText();
  } else if (csObj instanceof PDFArray && csObj.size() > 0) {
    const first = csObj.get(0);
    if (first instanceof PDFName) csName = first.decodeText();
  }

  if (csName.includes('Gray')) return 1;
  if (csName.includes('CMYK')) return 4;
  return 3; // DeviceRGB, CalRGB, ICCBased (RGB dans l'immense majorité des cas)
}

/**
 * Parcourt le PDF pour extraire la photo de profil valide.
 *
 * Étapes :
 *  1. Énumère TOUS les objets image indirects du document (fonctionne de façon
 *     fiable, contrairement à une lecture directe du dict /XObject de la page,
 *     qui ne renvoie que des PDFRef non résolues avec pdf-lib).
 *  2. Repère les images utilisées comme simple canal alpha (/SMask) d'une autre
 *     image, pour ne jamais les traiter comme candidates "photo" à part entière.
 *  3. Exclut les éléments graphiques fixes connus (logo, QR code, icônes) par
 *     leurs dimensions caractéristiques.
 *  4. Reconstruit correctement les images stockées en pixels bruts (FlateDecode)
 *     avec sharp, au lieu de leur passer les octets bruts (ce que sharp ne sait
 *     pas lire — c'est ce qui causait l'échec silencieux).
 */
async function extractPhotoFromSinglePagePdf(pdfBuffer: Buffer): Promise<Buffer | null> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    if (pdfDoc.getPageCount() === 0) return null;

    const allCandidates: ImageCandidate[] = [];
    const smaskTargetRefs = new Set<string>();

    const enumeratedObjects = pdfDoc.context.enumerateIndirectObjects();

    for (const [ref, obj] of enumeratedObjects) {
      if (!(obj instanceof PDFRawStream)) continue;

      const subtype = obj.dict.get(PDFName.of('Subtype'));
      if (subtype !== PDFName.of('Image')) continue;

      const widthObj = obj.dict.get(PDFName.of('Width'));
      const heightObj = obj.dict.get(PDFName.of('Height'));
      const width = widthObj instanceof PDFNumber ? widthObj.asNumber() : 0;
      const height = heightObj instanceof PDFNumber ? heightObj.asNumber() : 0;

      if (width <= 60 || height <= 60) continue;

      // Repérer si CETTE image référence une autre image comme masque alpha
      const smaskRefObj = obj.dict.get(PDFName.of('SMask'));
      if (smaskRefObj instanceof PDFRef) {
        smaskTargetRefs.add(smaskRefObj.toString());
      }

      const rawBuffer = getDecodedStreamBuffer(obj);
      if (!rawBuffer || rawBuffer.length === 0) continue;

      const filters = getFilterNames(obj);
      const isRawPixels = filters.includes('FlateDecode') || filters.includes('LZWDecode');
      const channels = getChannelsFromColorSpace(obj);

      allCandidates.push({ ref, buffer: rawBuffer, width, height, isRawPixels, channels, filters });
    }

    // Filtrer : exclure (a) les masques alpha utilisés par une autre image,
    // et (b) les éléments graphiques fixes connus (logo/QR/icônes)
    const photoCandidates = allCandidates.filter((c) => {
      if (smaskTargetRefs.has(c.ref.toString())) return false;
      if (KNOWN_ASSET_DIMENSIONS.has(`${c.width}x${c.height}`)) return false;
      return true;
    });

    // Trier par surface décroissante : la vraie photo est presque toujours
    // la plus grande image restante une fois les assets fixes exclus
    photoCandidates.sort((a, b) => b.width * b.height - a.width * a.height);

    for (const candidate of photoCandidates) {
      try {
        let sharpInput: sharp.Sharp;

        if (candidate.isRawPixels) {
          const expectedLength = candidate.width * candidate.height * candidate.channels;
          if (candidate.buffer.length !== expectedLength) {
            // Le buffer ne correspond pas au format attendu (ex: canal supplémentaire
            // non géré) -> on essaie le candidat suivant plutôt que de planter
            continue;
          }
          sharpInput = sharp(candidate.buffer, {
            raw: {
              width: candidate.width,
              height: candidate.height,
              channels: candidate.channels as 1 | 2 | 3 | 4,
            },
          });
        } else {
          // Image déjà encodée (JPEG via /DCTDecode, etc.) - lisible directement
          sharpInput = sharp(candidate.buffer);
        }

        return await sharpInput
          .rotate()
          .resize(300, 400, { fit: 'cover' })
          .jpeg({ quality: 92 })
          .toBuffer();
      } catch (sharpError) {
        // Format non reconnu pour ce candidat -> tester le suivant
        continue;
      }
    }
  } catch (err) {
    console.warn('Extraction d’image depuis le PDF impossible :', err);
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { matEtudiant, pdfBase64, pageIndex } = await req.json();

    if (!matEtudiant || !pdfBase64 || pageIndex === undefined) {
      return NextResponse.json({ error: 'Données incomplètes.' }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(
      pdfBase64.replace(/^data:application\/pdf;base64,/, ''),
      'base64'
    );

    const srcDoc = await PDFDocument.load(pdfBuffer);
    const singlePageDoc = await PDFDocument.create();

    const [copiedPage] = await singlePageDoc.copyPages(srcDoc, [pageIndex]);
    singlePageDoc.addPage(copiedPage);

    const singlePagePdfBytes = await singlePageDoc.save();
    const pdfBufferSingle = Buffer.from(singlePagePdfBytes);

    const badgesDir = path.join(process.cwd(), 'public', 'uploads', 'badges');
    await fs.mkdir(badgesDir, { recursive: true });
    const badgePath = path.join(badgesDir, `${matEtudiant}.pdf`);
    await fs.writeFile(badgePath, pdfBufferSingle);

    let photoExtracted = false;
    const photoBuffer = await extractPhotoFromSinglePagePdf(pdfBufferSingle);

    if (photoBuffer) {
      const photosDir = path.join(process.cwd(), 'public', 'uploads', 'photos');
      await fs.mkdir(photosDir, { recursive: true });
      const photoPath = path.join(photosDir, `${matEtudiant}.jpg`);
      await fs.writeFile(photoPath, photoBuffer);
      photoExtracted = true;
    }

    const timestamp = Date.now();

    return NextResponse.json({
      success: true,
      pdfUrl: `/uploads/badges/${matEtudiant}.pdf?v=${timestamp}`,
      photoUrl: photoExtracted ? `/uploads/photos/${matEtudiant}.jpg?v=${timestamp}` : null,
      photoExtracted,
    });
  } catch (error: any) {
    console.error('Erreur découpage PDF et photo :', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}