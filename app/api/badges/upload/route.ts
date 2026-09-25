// app/api/badges/upload/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma'; // Adaptez l'import selon votre configuration Prisma

export async function POST(req: Request) {
  try {
    const { matEtudiant, imageBase64 } = await req.json();

    if (!matEtudiant || !imageBase64) {
      return NextResponse.json(
        { error: 'Matricule et image requis.' },
        { status: 400 }
      );
    }

    // Nettoyage de la chaîne Base64
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Répertoire de destination
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'badges');
    await fs.mkdir(uploadDir, { recursive: true });

    // Nom de fichier unique basé sur le matricule
    const fileName = `${matEtudiant}.png`;
    const filePath = path.join(uploadDir, fileName);

    // Écriture du fichier sur le disque
    await fs.writeFile(filePath, buffer);

    const badgeUrl = `/uploads/badges/${fileName}`;

    // Mise à jour de l'étudiant dans la base de données
    await prisma.etudiant.update({
      where: { matEtudiant },
      data: { badgeUrl }, // Assurez-vous d'avoir un champ badgeUrl ou photoUrl dans votre schéma Prisma
    });

    return NextResponse.json({ success: true, matEtudiant, badgeUrl });
  } catch (error: any) {
    console.error('Erreur lors de la sauvegarde du badge :', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}