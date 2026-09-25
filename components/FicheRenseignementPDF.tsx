import React from 'react';
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';

import { reshape } from 'arabic-persian-reshaper';
import BidiEngine from 'bidi-js';

const bidi = BidiEngine();

/* =========================================================
   FORMATAGE ARABE
   ========================================================= */

function formatArabic(text?: string | null): string {
  if (!text) return '';

  try {
    const cleanText = text.trim();
    const reshaped = reshape(cleanText);
    const bidiTypes = bidi.getEmbeddingTypes(reshaped);
    const embeddingLevels = bidi.getEmbeddingLevels(
      reshaped,
      bidiTypes
    );

    return bidi.getReorderedString(
      reshaped,
      embeddingLevels
    );
  } catch {
    return text || '';
  }
}

/* =========================================================
   BASE URL
   ========================================================= */

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:3000';
};

/* =========================================================
   POLICE ARABE
   ========================================================= */

Font.register({
  family: 'AmiriBold',
  src: `${getBaseUrl()}/fonts/Cairo-Bold.ttf`,
});

/* =========================================================
   INTERFACE — NE PAS MODIFIER
   ========================================================= */

export interface EtudiantPDFProps {
  matEtudiant: string;
  nin?: string | null;
  matBac?: string | null;
  anneeBac?: number | null;
  carteRfid?: string | null;

  nom: string;
  prenom: string;
  civilite?: string | null;
  sexe?: string | null;
  dateNaissance?: string | null;
  lieuNaissance?: string | null;
  adresse?: string | null;
  telephone?: string | null;
  nationalite?: string | null;
  groupeSanguin?: string | null;
  situationFamiliale?: string | null;

  nomAr?: string | null;
  prenomAr?: string | null;
  lieuNaissanceAr?: string | null;
  nationaliteAr?: string | null;

  prenomPere?: string | null;
  prenomPereAr?: string | null;
  nomMere?: string | null;
  nomMereAr?: string | null;
  prenomMere?: string | null;
  prenomMereAr?: string | null;

  wilayaNaissance?: string | null;
  wilayaBac?: string | null;
  wilayaResidence?: string | null;
  villeNaissance?: string | null;
  serieBac?: string | null;
  libelleBac?: string | null;
  moyenneBac?: number | null;

  dateValidationInscription?: string | null;
  codeDomaine?: string | null;
  libelleDomaine?: string | null;
  libelleDomaineAr?: string | null;
  codeFiliere?: string | null;
  libelleFiliere?: string | null;
  libelleFiliereAr?: string | null;
  structure?: string | null;
  codeNiveau?: string | null;
  codeCycle?: string | null;
  libelleCycle?: string | null;

  niveau?: string | null;
  niveauAr?: string | null;
  filiere?: string | null;
  filiereAr?: string | null;
  specialite?: string | null;
  specialiteAr?: string | null;

  sitIns?: string | null;
  fraisInscriptionPaye?: boolean;
  fraisTransportPaye?: boolean;
  redoublant?: boolean | null;
  transfert?: boolean | null;

  photoUrl?: string;
}

/* =========================================================
   COULEURS ENS
   ========================================================= */

const COLORS = {
  navy: '#172554',
  blue: '#1e3a8a',
  cyan: '#18a4e0',
  lightBlue: '#eef8fc',
  paleBlue: '#f5faff',
  border: '#b8c4d1',
  borderDark: '#64748b',
  text: '#172033',
  muted: '#64748b',
  white: '#ffffff',
};

/* =========================================================
   STYLES
   ========================================================= */

const styles = StyleSheet.create({
  page: {
    paddingTop: 9,
    paddingBottom: 25,
    paddingLeft: 20,
    paddingRight: 20,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },

  officialHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'space-between',
    marginBottom: 4,
    paddingBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.navy,
  },

  logo: {
    width: 60,
    height: 60,
    objectFit: 'contain',
  },

  officialHeaderContent: {
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 4,
  },

  headerTextArBold: {
    fontSize: 11,
    fontFamily: 'AmiriBold',
    color: COLORS.navy,
    marginBottom: 1,
  },

  headerTextArSub: {
    fontSize: 10,
    fontFamily: 'AmiriBold',
    color: COLORS.blue,
  },

  documentHeaderArabicOnly: {
    paddingVertical: 4,
    marginBottom: 5,
    borderBottomWidth: 0.8,
    borderBottomColor: COLORS.cyan,
  },

  mainTitleAr: {
    fontSize: 14,
    fontFamily: 'AmiriBold',
    color: COLORS.navy,
    textAlign: 'center',
  },

  identityCard: {
    flexDirection: 'row',
    borderWidth: 0.6,
    borderColor: COLORS.border,
    borderRadius: 3,
    padding: 4,
    marginBottom: 5,
    backgroundColor: COLORS.white,
    minHeight: 72,
  },

  photoContainer: {
    width: 58,
    height: 68,
    borderWidth: 0.6,
    borderColor: COLORS.borderDark,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
  },

  photo: {
    width: '100%',
    height: '100%',
  },

  identityDetails: {
    flex: 1,
    marginLeft: 6,
  },

  identityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
    paddingBottom: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#d9e1e8',
  },

  identityFr: {
    width: '48%',
    textAlign: 'left',
  },

  identityAr: {
    width: '48%',
    alignItems: 'flex-end',
  },

  smallLabelFr: {
    fontSize: 8,
    color: COLORS.muted,
    textTransform: 'uppercase',
  },

  identityValueFr: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.text,
    marginTop: 1,
  },

  smallLabelAr: {
    fontSize: 8,
    fontFamily: 'AmiriBold',
    color: COLORS.muted,
  },

  identityValueAr: {
    fontSize: 9,
    fontFamily: 'AmiriBold',
    color: COLORS.text,
    marginTop: 1,
  },

  quickInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },

  quickInfo: {
    fontSize: 8,
    color: COLORS.muted,
  },

  sectionTitleBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.lightBlue,
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 2.5,
    paddingBottom: 2.5,
    borderRadius: 2,
    marginTop: 4,
    marginBottom: 2,
  },

  sectionTitleFr: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.navy,
  },

  sectionTitleAr: {
    fontSize: 9,
    fontFamily: 'AmiriBold',
    color: COLORS.navy,
    textAlign: 'right',
  },

  bilingualRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#d8e0e8',
    paddingTop: 1,
    paddingBottom: 1,
    minHeight: 17,
  },

  colFr: {
    width: '50%',
    paddingRight: 6,
    borderRightWidth: 0.5,
    borderRightColor: COLORS.border,
    textAlign: 'left',
  },

  colAr: {
    width: '50%',
    paddingLeft: 6,
    textAlign: 'right',
  },

  labelFr: {
    fontSize: 8,
    color: COLORS.muted,
    textTransform: 'uppercase',
  },

  valueFr: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.text,
    marginTop: 0.5,
  },

  labelAr: {
    fontSize: 8,
    fontFamily: 'AmiriBold',
    color: COLORS.muted,
  },

  valueAr: {
    fontSize: 9,
    fontFamily: 'AmiriBold',
    color: COLORS.text,
    marginTop: 0.5,
  },

  curriculumTable: {
    marginTop: 3,
    borderWidth: 0.6,
    borderColor: COLORS.navy,
  },

  curriculumHeaderRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.paleBlue,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.navy,
    minHeight: 18,
  },

  curriculumBodyRow: {
    flexDirection: 'row',
    minHeight: 14,
  },

  curriculumCellHeader: {
    paddingTop: 1,
    paddingBottom: 1,
    paddingLeft: 2,
    paddingRight: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 0.5,
    borderRightColor: COLORS.borderDark,
  },

  curriculumCell: {
    padding: 1,
    borderRightWidth: 0.5,
    borderRightColor: COLORS.borderDark,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.borderDark,
    justifyContent: 'center',
    alignItems: 'center',
  },

  curriculumHeaderTextFr: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.navy,
    textAlign: 'center',
  },

  curriculumHeaderTextAr: {
    fontSize: 8,
    fontFamily: 'AmiriBold',
    color: COLORS.navy,
    textAlign: 'center',
  },

  footer: {
    position: 'absolute',
    bottom: 8,
    left: 22,
    right: 22,
    textAlign: 'center',
    fontSize: 8,
    color: COLORS.muted,
    borderTopWidth: 0.4,
    borderTopColor: '#cbd5e1',
    paddingTop: 2,
  },
});

/* =========================================================
   UTILITAIRE : PREMIÈRE ANNÉE UNIVERSITAIRE
   ========================================================= */

function getFirstAcademicYear(
  dateValidationInscription?: string | null
): string {
  if (!dateValidationInscription) return '';
  const value = String(dateValidationInscription).trim();
  if (!value) return '';

  const isoMatch = value.match(/^(\d{4})[-/]/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    if (Number.isFinite(year)) return `${year}/${year + 1}`;
  }

  const endYearMatch = value.match(/(\d{4})$/);
  if (endYearMatch) {
    const year = Number(endYearMatch[1]);
    if (Number.isFinite(year)) return `${year}/${year + 1}`;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    return `${year}/${year + 1}`;
  }

  return '';
}

/* =========================================================
   COMPOSANT PRINCIPAL
   ========================================================= */

export const FicheRenseignementPDF = ({
  etudiants,
}: {
  etudiants: EtudiantPDFProps[];
}) => {
  const baseUrl = getBaseUrl();
  return (
    <Document>
      {etudiants.map((e) => {
        const photoSrc = e.photoUrl
          ? e.photoUrl.startsWith('http')
            ? e.photoUrl
            : `${baseUrl}${e.photoUrl}`
          : `${baseUrl}/uploads/photos/${e.matEtudiant}.jpg`;

        const firstAcademicYear = getFirstAcademicYear(
          e.dateValidationInscription
        );

        const curriculumRows = Array.from({ length: 6 });

        return (
          <Page key={e.matEtudiant} size="A4" style={styles.page}>
            {/* EN-TÊTE OFFICIEL */}
            <View style={styles.officialHeaderContainer}>
     

              <View style={styles.officialHeaderContent}>
                <Text style={styles.headerTextArBold}>
                  {formatArabic('الجمهورية الجزائرية الديمقراطية الشعبية')}
                </Text>
                <Text style={styles.headerTextArBold}>
                  {formatArabic('وزارة التعليم العالي والبحث العلمي')}
                </Text>
                <Text style={styles.headerTextArSub}>
                  {formatArabic(
                    'المدرسة العليا للأساتذة بسعيدة المجاهد المرحوم وزاني الشيخ'
                  )}
                </Text>
              </View>

            </View>

            {/* TITRE DOCUMENT (ARABE ONLY) */}
            <View
              style={{
                ...styles.documentHeaderArabicOnly,
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              <Text style={styles.mainTitleAr}>
                {formatArabic('بطاقة معلومات الطالب')}
              </Text>

              <View
                style={{
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: 'AmiriBold',
                    color: COLORS.muted,
                  }}
                >
                  {formatArabic('رقم التسجيل')} : {e.matEtudiant}
                </Text>

                <Text style={{ fontSize: 10, color: COLORS.muted }}>
                  {'  |  '}
                </Text>

                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: 'AmiriBold',
                    color: COLORS.muted,
                  }}
                >
                  {formatArabic('الرقم الوطني')} : {e.nin || 'N/A'}
                </Text>
              </View>
            </View>

            {/* IDENTITÉ + PHOTO */}
            <View style={styles.identityCard}>
              <View style={styles.photoContainer}>
                <Image src={photoSrc} style={styles.photo} />
              </View>

              <View style={styles.identityDetails}>
                <View style={styles.identityRow}>
                  <View style={styles.identityFr}>
                    <Text style={styles.smallLabelFr}>Nom & Prénom</Text>
                    <Text style={styles.identityValueFr}>
                      {e.nom} {e.prenom}
                    </Text>
                  </View>

                  <View style={styles.identityAr}>
                    <Text style={styles.smallLabelAr}>
                      {formatArabic('الاسم و اللقب')}
                    </Text>
                    <Text style={styles.identityValueAr}>
                      {formatArabic(`${e.nomAr || ''} ${e.prenomAr || ''}`)}
                    </Text>
                  </View>
                </View>

                <View style={styles.identityRow}>
                  <View style={styles.identityFr}>
                    <Text style={styles.smallLabelFr}>
                      Date & Lieu de naissance
                    </Text>
                    <Text style={styles.identityValueFr}>
                      {e.dateNaissance || '-'} ({e.lieuNaissance || '-'})
                    </Text>
                  </View>

                  <View style={styles.identityAr}>
                    <Text style={styles.smallLabelAr}>
                      {formatArabic('تاريخ و مكان الميلاد')}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row-reverse',
                        alignItems: 'center',
                        marginTop: 1,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontFamily: 'AmiriBold',
                        }}
                      >
                        {formatArabic(
                          e.lieuNaissanceAr || '-'
                        )}
                      </Text>
                      <Text
                        style={{
                          fontSize: 9,
                          fontFamily: 'Helvetica-Bold',
                        }}
                      >
                        {' '}
                        {e.dateNaissance || '-'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.quickInfoRow}>
                  <Text style={styles.quickInfo}>
                    Sexe : {e.sexe || '-'} | Groupe sanguin :{' '}
                    {e.groupeSanguin || '-'}
                  </Text>
                  <Text style={styles.quickInfo}>
                    RFID : {e.carteRfid || '-'} | Statut : {e.sitIns || '-'}
                  </Text>
                </View>
              </View>
            </View>

            {/* 1 — ÉTAT CIVIL ET PARENTÉ */}
            <View style={styles.sectionTitleBox}>
              <Text style={styles.sectionTitleFr}>
                1. ÉTAT CIVIL ET PARENTÉ
              </Text>
              <Text style={styles.sectionTitleAr}>
                {formatArabic('1. الحالة المدنية و العائلية')}
              </Text>
            </View>

            <View style={styles.bilingualRow}>
              <View style={styles.colFr}>
                <Text style={styles.labelFr}>Prénom du Père</Text>
                <Text style={styles.valueFr}>{e.prenomPere || '-'}</Text>
              </View>
              <View style={styles.colAr}>
                <Text style={styles.labelAr}>{formatArabic('اسم الأب')}</Text>
                <Text style={styles.valueAr}>
                  {formatArabic(e.prenomPereAr || '-')}
                </Text>
              </View>
            </View>

            <View style={styles.bilingualRow}>
              <View style={styles.colFr}>
                <Text style={styles.labelFr}>Nom & Prénom de la Mère</Text>
                <Text style={styles.valueFr}>
                  {e.nomMere || '-'} {e.prenomMere || ''}
                </Text>
              </View>
              <View style={styles.colAr}>
                <Text style={styles.labelAr}>
                  {formatArabic('اسم و لقب الأم')}
                </Text>
                <Text style={styles.valueAr}>
                  {formatArabic(
                    `${e.nomMereAr || ''} ${e.prenomMereAr || ''}`
                  )}
                </Text>
              </View>
            </View>

            <View style={styles.bilingualRow}>
              <View style={styles.colFr}>
                <Text style={styles.labelFr}>
                  Nationalité / Situation / Téléphone
                </Text>
                <Text style={styles.valueFr}>
                  {e.nationalite || 'Algérienne'} |{' '}
                  {e.situationFamiliale || 'Célibataire'} | {e.telephone || '-'}
                </Text>
              </View>
              <View style={styles.colAr}>
                <Text style={styles.labelAr}>
                  {formatArabic('الجنسية / الوضعية العائلية / الهاتف')}
                </Text>
                <Text style={styles.valueAr}>
                  {formatArabic(
                    `${e.nationaliteAr || 'جزائرية'} | ${
                      e.situationFamiliale || 'أعزب(ة)'
                    } | ${e.telephone || '-'}`
                  )}
                </Text>
              </View>
            </View>

            <View style={styles.bilingualRow}>
              <View style={styles.colFr}>
                <Text style={styles.labelFr}>Adresse de résidence</Text>
                <Text style={styles.valueFr}>{e.adresse || '-'}</Text>
              </View>
              <View style={styles.colAr}>
                <Text style={styles.labelAr}>
                  {formatArabic('عنوان الإقامة')}
                </Text>
                <Text style={styles.valueAr}>
                  {formatArabic(e.adresse || '-')}
                </Text>
              </View>
            </View>

            {/* 2 — BACCALAURÉAT */}
            <View style={styles.sectionTitleBox}>
              <Text style={styles.sectionTitleFr}>
                2. INFORMATIONS BACCALAURÉAT
              </Text>
              <Text style={styles.sectionTitleAr}>
                {formatArabic('2. معلومات البكالوريا')}
              </Text>
            </View>

            <View style={styles.bilingualRow}>
              <View style={styles.colFr}>
                <Text style={styles.labelFr}>Matricule & Année du Bac</Text>
                <Text style={styles.valueFr}>
                  {e.matBac || '-'} ({e.anneeBac || '-'})
                </Text>
              </View>
              <View style={styles.colAr}>
                <Text style={styles.labelAr}>
                  {formatArabic('رقم و سنة البكالوريا')}
                </Text>
                <Text style={styles.valueAr}>
                  {formatArabic(`${e.matBac || '-'} (${e.anneeBac || '-'})`)}
                </Text>
              </View>
            </View>

            <View style={styles.bilingualRow}>
              <View style={styles.colFr}>
                <Text style={styles.labelFr}>
                  Série / Moyenne / Wilaya du Bac
                </Text>
                <Text style={styles.valueFr}>
                  {e.serieBac || e.libelleBac || '-'} |{' '}
                  {e.moyenneBac != null ? `${e.moyenneBac.toFixed(2)}/20` : '-'}{' '}
                  | Wilaya : {e.wilayaBac || '-'}
                </Text>
              </View>
              <View style={styles.colAr}>
                <Text style={styles.labelAr}>
                  {formatArabic('الشعبة / المعدل / ولاية البكالوريا')}
                </Text>
                <Text style={styles.valueAr}>
                  {formatArabic(
                    `${e.serieBac || e.libelleBac || '-'} | ${
                      e.moyenneBac != null ? e.moyenneBac.toFixed(2) : '-'
                    } | ولاية: ${e.wilayaBac || '-'}`
                  )}
                </Text>
              </View>
            </View>

            {/* 3 — PARCOURS ACADÉMIQUE */}
            <View style={styles.sectionTitleBox}>
              <Text style={styles.sectionTitleFr}>
                3. INSCRIPTION ET PARCOURS ACADÉMIQUE
              </Text>
              <Text style={styles.sectionTitleAr}>
                {formatArabic('3. التسجيل و المسار الأكاديمي')}
              </Text>
            </View>

            <View style={styles.bilingualRow}>
              <View style={styles.colFr}>
                <Text style={styles.labelFr}>Domaine</Text>
                <Text style={styles.valueFr}>
                  {e.libelleDomaine || e.codeDomaine || '-'}
                </Text>
              </View>
              <View style={styles.colAr}>
                <Text style={styles.labelAr}>{formatArabic('الميدان')}</Text>
                <Text style={styles.valueAr}>
                  {formatArabic(e.libelleDomaineAr || '-')}
                </Text>
              </View>
            </View>

            <View style={styles.bilingualRow}>
              <View style={styles.colFr}>
                <Text style={styles.labelFr}>Cycle / Mlemah</Text>
                <Text style={styles.valueFr}>{e.libelleCycle || '-'}</Text>
              </View>
              <View style={styles.colAr}>
                <Text style={styles.labelAr}>{formatArabic('الملمح')}</Text>
                <Text style={styles.valueAr}>
                  {formatArabic(e.filiereAr || '-')}
                </Text>
              </View>
            </View>

            <View style={styles.bilingualRow}>
              <View style={styles.colFr}>
                <Text style={styles.labelFr}>Spécialité</Text>
                <Text style={styles.valueFr}>{e.specialite || '-'}</Text>
              </View>
              <View style={styles.colAr}>
                <Text style={styles.labelAr}>{formatArabic('التخصص')}</Text>
                <Text style={styles.valueAr}>
                  {formatArabic(e.specialiteAr || '-')}
                </Text>
              </View>
            </View>

            {/* TABLEAU SUIVI DU CURSUS (6 LIGNES) */}
            <View style={styles.curriculumTable}>
              <View style={styles.curriculumHeaderRow}>
                <View style={[styles.curriculumCellHeader, { width: '15%' }]}>
                  <Text style={styles.curriculumHeaderTextFr}>Année Univ.</Text>
                  <Text style={styles.curriculumHeaderTextAr}>
                    {formatArabic('السنة الجامعية')}
                  </Text>
                </View>

                <View style={[styles.curriculumCellHeader, { width: '15%' }]}>
                  <Text style={styles.curriculumHeaderTextFr}>Niveau</Text>
                  <Text style={styles.curriculumHeaderTextAr}>
                    {formatArabic('المستوى')}
                  </Text>
                </View>

                <View style={[styles.curriculumCellHeader, { width: '25%' }]}>
                  <Text style={styles.curriculumHeaderTextFr}>Décision</Text>
                  <Text style={styles.curriculumHeaderTextAr}>
                    {formatArabic('القرار / النتيجة')}
                  </Text>
                </View>

                <View style={[styles.curriculumCellHeader, { width: '15%' }]}>
                  <Text style={styles.curriculumHeaderTextFr}>Moyenne</Text>
                  <Text style={styles.curriculumHeaderTextAr}>
                    {formatArabic('المعدل')}
                  </Text>
                </View>

                <View style={[styles.curriculumCellHeader, { width: '30%' }]}>
                  <Text style={styles.curriculumHeaderTextFr}>
                    Observation / Signature
                  </Text>
                  <Text style={styles.curriculumHeaderTextAr}>
                    {formatArabic('الملاحظات والتوقيع')}
                  </Text>
                </View>
              </View>

              {/* Rendu des 6 lignes du tableau */}
              {curriculumRows.map((_, index) => {
                const isFirstRow = index === 0;
                return (
                  <View key={index} style={styles.curriculumBodyRow}>
                    <View style={[styles.curriculumCell, { width: '15%' }]}>
                      <Text style={{ fontSize: 8 }}>
                      
                      </Text>
                    </View>

                    <View style={[styles.curriculumCell, { width: '15%' }]}>
                      <Text style={{ fontSize: 8 }}>
                       
                      </Text>
                    </View>

                    <View style={[styles.curriculumCell, { width: '25%' }]}>
                      <Text style={{ fontSize: 8 }}>
                        
                      </Text>
                    </View>

                    <View style={[styles.curriculumCell, { width: '15%' }]}>
                      <Text style={{ fontSize: 8 }} />
                    </View>

                    <View style={[styles.curriculumCell, { width: '30%' }]}>
                      <Text style={{ fontSize: 8 }} />
                    </View>
                  </View>
                );
              })}
            </View>

            {/* PIED DE PAGE */}
            <View style={styles.footer} fixed>
              <Text>
                École Normale Supérieure de Saïda - Fiche de Renseignement -
                Généré automatiquement
              </Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
};