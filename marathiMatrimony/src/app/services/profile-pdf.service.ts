import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { NOTO_DEVANAGARI_BASE64 } from '../utilitydata/noto-devanagari-font';

@Injectable({
  providedIn: 'root' // 👈 makes it available everywhere
})
export class ProfilePdfService {

  constructor() {}

  // -------------------------------
  // Utility helpers
  // -------------------------------
  private val(v: any, fallback = '-') {
    return v !== undefined && v !== null && v !== '' ? String(v) : fallback;
  }

  private formatDate(d: string) {
    return d ? new Date(d).toLocaleDateString('en-IN') : '-';
  }

//   // -------------------------------
//   // MAIN PDF FUNCTION
//   // -------------------------------
// generateProfilePdf(p: any) {
//   if (!p) return;

//   const doc = new jsPDF('p', 'mm', 'a4');
//   const pageWidth = doc.internal.pageSize.getWidth();
//   const pageHeight = doc.internal.pageSize.getHeight();

//   let y = 10;

// // =========================================
// // CLEAN DIAGONAL WATERMARK (OPTIMIZED)
// // =========================================
// const addWatermark = () => {
//   const pageCount = doc.getNumberOfPages();
//   const pageWidth = doc.internal.pageSize.getWidth();
//   const pageHeight = doc.internal.pageSize.getHeight();

//   for (let i = 1; i <= pageCount; i++) {
//     doc.setPage(i);

//     doc.setFont('helvetica', 'bold');
//     doc.setFontSize(20);
//     doc.setTextColor(235); // VERY light gray

//     // Diagonal repeating watermark (less density)
//     for (let y = 60; y < pageHeight; y += 120) {
//       for (let x = -40; x < pageWidth; x += 160) {
//         doc.text(
//           'Sushil Maratha',
//           x,
//           y,
//           { angle: 45 }
//         );
//       }
//     }

//     // Center website text (small & subtle)
//     doc.setFontSize(9);
//     doc.setTextColor(225);
//     doc.text(
//       'www.sushilmaratha.in',
//       pageWidth / 2,
//       pageHeight / 2 + 30,
//       { angle: 45, align: 'center' }
//     );

//     doc.setTextColor(0);
//   }
// };


//   // =====================
//   // HEADER CARD
//   // =====================
//   doc.setFillColor(245, 245, 255);
//   doc.roundedRect(10, 10, 190, 28, 4, 4, 'F');

//   doc.setFont('helvetica', 'bold');
//   doc.setFontSize(16);
//   doc.text(
//     `${p.personalDetails?.firstName} ${p.personalDetails?.middleName || ''} ${p.personalDetails?.lastName}`,
//     15,
//     24
//   );

//   doc.setFontSize(8);
//   doc.setFont('helvetica', 'normal');
//   doc.text(`User ID: ${this.val(p.userId)}`, 15, 32);
//   doc.text(`Mobile: ${this.val(p.mobilenumber)}`, 70, 32);
//   doc.text(`Email: ${this.val(p.email)}`, 130, 32);

//   y = 44;

//   // =====================
//   // SECTION TITLE
//   // =====================
//   const sectionTitle = (title: string) => {
//     if (y > 265) {
//       doc.addPage();
//       y = 20;
//     }

//     doc.setFillColor(50, 90, 255);
//     doc.roundedRect(10, y, 190, 7, 2, 2, 'F');
//     doc.setTextColor(255);
//     doc.setFontSize(11);
//     doc.text(title, 14, y + 5);
//     doc.setTextColor(0);
//     y += 9;
//   };

//   const tableStyle = {
//     styles: { fontSize: 8.5, cellPadding: 1.8 }
//   };

//   // =====================
//   // PERSONAL INFORMATION
//   // =====================
//   sectionTitle('Personal Information');

//   autoTable(doc, {
//     startY: y,
//     ...tableStyle,
//     body: [
//       ['DOB', this.formatDate(p.personalDetails?.dateOfBirth)],
//       ['Age / Gender', `${this.val(p.personalDetails?.age)} / ${this.val(p.personalDetails?.gender)}`],
//       ['Religion / Caste', `${this.val(p.personalDetails?.religion)} / ${this.val(p.personalDetails?.caste)}`],
//       ['Sub Caste', this.val(p.personalDetails?.subCaste)],
//       ['Marital Status', this.val(p.personalDetails?.maritalStatus)],
//       ['Height / Weight', `${this.val(p.personalDetails?.height)} ${this.val(p.personalDetails?.heightUnit)} / ${this.val(p.personalDetails?.weight)}`],
//       ['Blood Group', this.val(p.personalDetails?.bloodGroup)],
//       ['Complexion', this.val(p.personalDetails?.complexion)],
//       ['Languages', this.val(p.personalDetails?.languagesSpoken)],
//       ['Disability', this.val(p.personalDetails?.physicalDisability)],
//     ]
//   });

//   y = (doc as any).lastAutoTable.finalY + 5;

//   // =====================
//   // CONTACT + LIFESTYLE
//   // =====================
//   sectionTitle('Contact & Lifestyle');

//   autoTable(doc, {
//     startY: y,
//     ...tableStyle,
//     body: [
//       ['Mobile', this.val(p.contactDetails?.phoneNumber)],
//       ['WhatsApp', this.val(p.contactDetails?.whatsappNumber)],
//       ['Email', this.val(p.contactDetails?.emailAddress)],
//       ['City / State', `${this.val(p.contactDetails?.city)}, ${this.val(p.contactDetails?.state)}`],
//       ['Diet', this.val(p.lifestyleDetails?.diet)],
//       ['Smoking / Drinking', `${this.val(p.lifestyleDetails?.smoking)} / ${this.val(p.lifestyleDetails?.drinking)}`],
//       ['Hobbies', this.val(p.lifestyleDetails?.hobbies)],
//     ]
//   });

//   y = (doc as any).lastAutoTable.finalY + 5;

//   // =====================
//   // EDUCATION & CAREER
//   // =====================
//   sectionTitle('Education & Career');

//   autoTable(doc, {
//     startY: y,
//     ...tableStyle,
//     body: [
//       ['Qualification', this.val(p.educationDetails?.highestQualification)],
//       ['College', this.val(p.educationDetails?.collegeName)],
//       ['Occupation', this.val(p.careerDetails?.occupation)],
//       ['Job Title', this.val(p.careerDetails?.jobTitle)],
//       ['Company', this.val(p.careerDetails?.companyName)],
//       ['Income', this.val(p.careerDetails?.annualIncome)],
//       [
//         'Work Location',
//         `${this.val(p.careerDetails?.workLocationCity)}, ${this.val(p.careerDetails?.workLocationState)}`
//       ],
//     ]
//   });

//   y = (doc as any).lastAutoTable.finalY + 5;

//   // =====================
//   // FAMILY DETAILS
//   // =====================
//   sectionTitle('Family Details');

//   autoTable(doc, {
//     startY: y,
//     ...tableStyle,
//     body: [
//       ['Father', `${this.val(p.familyDetails?.fatherName)} (${this.val(p.familyDetails?.fatherOccupation)})`],
//       ['Mother', `${this.val(p.familyDetails?.motherName)} (${this.val(p.familyDetails?.motherOccupation)})`],
//       ['Brothers', `${this.val(p.familyDetails?.brothersCount)} (Married: ${this.val(p.familyDetails?.brothersMarriedCount)})`],
//       ['Sisters', `${this.val(p.familyDetails?.sistersCount)} (Married: ${this.val(p.familyDetails?.sistersMarriedCount)})`],
//       ['Family Type', this.val(p.familyDetails?.familyType)],
//       ['Native Place', `${this.val(p.familyDetails?.nativeTaluka)}, ${this.val(p.familyDetails?.nativeDistrict)}`],
//       ['Family Wealth', this.val(p.familyDetails?.familyWealth)],
//     ]
//   });

//   y = (doc as any).lastAutoTable.finalY + 5;

//   // =====================
//   // PARTNER PREFERENCES
//   // =====================
//   sectionTitle('Partner Preferences');

//   autoTable(doc, {
//     startY: y,
//     ...tableStyle,
//     body: [
//       ['Age Range', this.val(p.partnerPreferencesDetails?.ageRange)],
//       ['Height', this.val(p.partnerPreferencesDetails?.heightPreference)],
//       ['Education', this.val(p.partnerPreferencesDetails?.educationPreferences)],
//       ['Occupation', this.val(p.partnerPreferencesDetails?.occupationPreferences)],
//       ['Location', this.val(p.partnerPreferencesDetails?.locationPreferences)],
//     ]
//   });

//   y = (doc as any).lastAutoTable.finalY + 4;

//   // =====================
//   // ABOUT ME (COMPACT)
//   // =====================
//   sectionTitle('About Me');

//   doc.setFontSize(8);
//   doc.text(
//     this.val(p.additionalInfoDetails?.personalDescription),
//     12,
//     y,
//     { maxWidth: 186, lineHeightFactor: 1.2 }
//   );

//   // =====================
//   // APPLY WATERMARK
//   // =====================
//   addWatermark();

//   // =====================
//   // SAVE
//   // =====================
//   doc.save(`${p.userId}_Biodata.pdf`);
// }

apiBaseUrl: string = "https://www.sushilmaratha.in/backend"


// -------------------------------
// MAIN PDF FUNCTION
// -------------------------------
async generateProfilePdf(p: any) {
  if (!p) return;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let y = 10;

  // ==============================
  // WATERMARK (PER PAGE – SAFE)
  // ==============================
  const drawWatermark = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(235);

    for (let yy = 80; yy < pageHeight; yy += 140) {
      for (let xx = -30; xx < pageWidth; xx += 180) {
        doc.text('Sushil Maratha', xx, yy, { angle: 45 });
      }
    }

    doc.setFontSize(9);
    doc.setTextColor(220);
    doc.text(
      'www.sushilmaratha.in',
      pageWidth / 2,
      pageHeight / 2,
      { angle: 45, align: 'center' }
    );

    doc.setTextColor(0);
  };

  // =====================
  // HEADER CARD
  // =====================
  doc.setFillColor(245, 245, 255);
  doc.roundedRect(10, 10, 190, 28, 4, 4, 'F');

  // ---------------------
  // PROFILE PHOTO BLOCK
  // ---------------------
  const photoSize = 22;
  const photoX = pageWidth - photoSize - 18;
  const photoY = 14;

  doc.setDrawColor(200);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(photoX, photoY, photoSize, photoSize, 4, 4, 'FD');

  const photoObj =
  p.photoDetails?.profilePicture?.find((img: any) => img.isProfile)
  || p.photoDetails?.profilePicture?.[0];
  
  const photoUrl = photoObj?.originalUrl
  ? `${this.apiBaseUrl}${photoObj.originalUrl}`
  : null;

  if (photoUrl) {
    try {
      const img = await fetch(photoUrl).then(r => r.blob());
      const imgData = await new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.readAsDataURL(img);
      });

      doc.addImage(
        imgData,
        'JPEG',
        photoX + 1,
        photoY + 1,
        photoSize - 2,
        photoSize - 2,
        undefined,
        'FAST'
      );
    } catch {}
  }

  // ---------------------
  // NAME
  // ---------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(
    `${p.personalDetails?.firstName} ${p.personalDetails?.middleName || ''} ${p.personalDetails?.lastName}`,
    15,
    24
  );

  // ---------------------
  // PREMIUM / VERIFIED BADGE
  // ---------------------
  const isPremium = p.plan === 'Premium' || p.planDetails?.isPremium;
  const isVerified = p.isVerified === true;

  let badgeText = '';
  let badgeColor: [number, number, number] = [0, 0, 0];

  if (isPremium && isVerified) {
    badgeText = 'PREMIUM • VERIFIED';
    badgeColor = [255, 193, 7];
  } else if (isPremium) {
    badgeText = 'PREMIUM MEMBER';
    badgeColor = [76, 175, 80];
  } else if (isVerified) {
    badgeText = 'VERIFIED PROFILE';
    badgeColor = [33, 150, 243];
  }

  if (badgeText) {
    doc.setFontSize(8);
    doc.setTextColor(255);
    doc.setFillColor(...badgeColor);

    const w = doc.getTextWidth(badgeText) + 8;
    doc.roundedRect(15, 27, w, 6, 2, 2, 'F');
    doc.text(badgeText, 15 + w / 2, 31.3, { align: 'center' });
    doc.setTextColor(0);
  }

  // ---------------------
  // BASIC INFO
  // ---------------------
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`User ID: ${this.val(p.userId)}`, 15, 36);
  // doc.text(`Mobile: ${this.val(p.mobilenumber)}`, 70, 36);
  // doc.text(`Email: ${this.val(p.email)}`, 130, 36);

  y = 46;

  // =====================
  // SECTION TITLE
  // =====================
  const sectionTitle = (title: string) => {
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 20;
      drawWatermark();
    }

    doc.setFillColor(50, 90, 255);
    doc.roundedRect(10, y, 190, 7, 2, 2, 'F');
    doc.setTextColor(255);
    doc.setFontSize(11);
    doc.text(title, 14, y + 5);
    doc.setTextColor(0);
    y += 9;
  };

  const tableStyle: any = {
    styles: { fontSize: 8.5, cellPadding: 1.8 },
    alternateRowStyles: {
      fillColor: [245, 247, 255] as [number, number, number]
    }
  };

  // =====================
  // PERSONAL INFORMATION
  // =====================
  sectionTitle('Personal Information');
  autoTable(doc, {
    startY: y,
    ...tableStyle,
    didDrawPage: () => drawWatermark(),
    body: [
      ['DOB', this.formatDate(p.personalDetails?.dateOfBirth)],
      ['Age / Gender', `${this.val(p.personalDetails?.age)} / ${this.val(p.personalDetails?.gender)}`],
      ['Religion / Caste', `${this.val(p.personalDetails?.religion)} / ${this.val(p.personalDetails?.caste)}`],
      ['Sub Caste', this.val(p.personalDetails?.subCaste)],
      ['Marital Status', this.val(p.personalDetails?.maritalStatus)],
      ['Height / Weight', `${this.val(p.personalDetails?.height)} ${this.val(p.personalDetails?.heightUnit)} / ${this.val(p.personalDetails?.weight)}`],
      ['Blood Group', this.val(p.personalDetails?.bloodGroup)],
      ['Complexion', this.val(p.personalDetails?.complexion)],
      ['Languages', this.val(p.personalDetails?.languagesSpoken)],
      ['Disability', this.val(p.personalDetails?.physicalDisability)]
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  // =====================
  // CONTACT & LIFESTYLE
  // ['Mobile', this.val(p.contactDetails?.phoneNumber)],
  //     ['WhatsApp', this.val(p.contactDetails?.whatsappNumber)],
  //     ['Email', this.val(p.contactDetails?.emailAddress)],
  // =====================
  sectionTitle('Contact & Lifestyle');
  autoTable(doc, {
    startY: y,
    ...tableStyle,
    didDrawPage: () => drawWatermark(),
    body: [
      ['City / State', `${this.val(p.contactDetails?.city)}, ${this.val(p.contactDetails?.state)}`],
      ['Diet', this.val(p.lifestyleDetails?.diet)],
      ['Smoking / Drinking', `${this.val(p.lifestyleDetails?.smoking)} / ${this.val(p.lifestyleDetails?.drinking)}`],
      ['Hobbies', this.val(p.lifestyleDetails?.hobbies)]
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  // =====================
  // EDUCATION & CAREER
  // =====================
  sectionTitle('Education & Career');
  autoTable(doc, {
    startY: y,
    ...tableStyle,
    didDrawPage: () => drawWatermark(),
    body: [
      ['Qualification', this.val(p.educationDetails?.highestQualification)],
      ['College', this.val(p.educationDetails?.collegeName)],
      ['Occupation', this.val(p.careerDetails?.occupation)],
      ['Job Title', this.val(p.careerDetails?.jobTitle)],
      ['Company', this.val(p.careerDetails?.companyName)],
      ['Income', this.val(p.careerDetails?.annualIncome)],
      ['Work Location', `${this.val(p.careerDetails?.workLocationCity)}, ${this.val(p.careerDetails?.workLocationState)}`]
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  // =====================
  // FAMILY DETAILS
  // =====================
  sectionTitle('Family Details');
  autoTable(doc, {
    startY: y,
    ...tableStyle,
    didDrawPage: () => drawWatermark(),
    body: [
      ['Father', `${this.val(p.familyDetails?.fatherName)} (${this.val(p.familyDetails?.fatherOccupation)})`],
      ['Mother', `${this.val(p.familyDetails?.motherName)} (${this.val(p.familyDetails?.motherOccupation)})`],
      ['Brothers', `${this.val(p.familyDetails?.brothersCount)} (Married: ${this.val(p.familyDetails?.brothersMarriedCount)})`],
      ['Sisters', `${this.val(p.familyDetails?.sistersCount)} (Married: ${this.val(p.familyDetails?.sistersMarriedCount)})`],
      ['Family Type', this.val(p.familyDetails?.familyType)],
      ['Native Place', `${this.val(p.familyDetails?.nativeTaluka)}, ${this.val(p.familyDetails?.nativeDistrict)}`],
      ['Family Wealth', this.val(p.familyDetails?.familyWealth)]
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  // =====================
  // PARTNER PREFERENCES
  // =====================
  sectionTitle('Partner Preferences');
  autoTable(doc, {
    startY: y,
    ...tableStyle,
    didDrawPage: () => drawWatermark(),
    body: [
      ['Age Range', this.val(p.partnerPreferencesDetails?.ageRange)],
      ['Height', this.val(p.partnerPreferencesDetails?.heightPreference)],
      ['Education', this.val(p.partnerPreferencesDetails?.educationPreferences)],
      ['Occupation', this.val(p.partnerPreferencesDetails?.occupationPreferences)],
      ['Location', this.val(p.partnerPreferencesDetails?.locationPreferences)]
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  // =====================
  // ABOUT ME
  // =====================
  sectionTitle('About Me');
  const aboutText = doc.splitTextToSize(
    this.val(p.additionalInfoDetails?.personalDescription),
    186
  );
  doc.setFontSize(8);
  doc.text(aboutText, 12, y);

  // =====================
  // FIRST PAGE WATERMARK
  // =====================
  drawWatermark();

  // =====================
  // SAVE
  // =====================
  doc.save(`${p.userId}_Biodata.pdf`);
}

private mr(v: any): string {
if (v === undefined || v === null || v === '') return '-';
return String(v).normalize('NFC');
}

generateProfilePdfMr(p: any) {
if (!p) return;

const doc = new jsPDF('p', 'mm', 'a4');

// ===============================
// REGISTER MARATHI FONT
// ===============================
doc.addFileToVFS('NotoSansDeva.ttf', NOTO_DEVANAGARI_BASE64);
doc.addFont('NotoSansDeva.ttf', 'Noto', 'normal');
doc.setFont('Noto', 'normal');

const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
let y = 10;

  // ===============================
  // HEADER
  // ===============================
  doc.setFillColor(245, 246, 255);
  doc.roundedRect(10, 10, 190, 26, 4, 4, 'F');

  doc.setFontSize(15);
  doc.text(
    this.mr(
      `${p.personalDetails?.firstName} ${p.personalDetails?.middleName || ''} ${p.personalDetails?.lastName}`
    ),
    14,
    22
  );

  doc.setFontSize(8.5);
  doc.text(this.mr(`युजर आयडी : ${p.userId}`), 14, 30);
  doc.text(this.mr(`मोबाईल : ${p.mobilenumber}`), 80, 30);
  doc.text(this.mr(`ई-मेल : ${p.email}`), 140, 30);

  y = 44;

  // ===============================
  // SECTION TITLE
  // ===============================
  const sectionTitle = (title: string) => {
    if (y > 260) {
      doc.addPage();
      y = 18;
    }

    doc.setFillColor(52, 88, 255);
    doc.roundedRect(10, y, 190, 7, 2, 2, 'F');
    doc.setTextColor(255);
    doc.setFontSize(10.5);
    doc.text(this.mr(title), 14, y + 5);
    doc.setTextColor(0);
    y += 8;
  };

  // ===============================
  // वैयक्तिक माहिती
  // ===============================
  sectionTitle('वैयक्तिक माहिती');

  autoTable(doc, {
    startY: y,
    styles: { font: 'Noto', fontSize: 8.5, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 60 } },
    body: [
      ['जन्मतारीख', this.mr(new Date(p.personalDetails?.dateOfBirth).toLocaleDateString('en-IN'))],
      ['वय / लिंग', this.mr(`${p.personalDetails?.age} वर्षे / पुरुष`)],
      ['धर्म / जात', this.mr(`${p.personalDetails?.religion} / ${p.personalDetails?.caste}`)],
      ['पोटजात', this.mr(p.personalDetails?.subCaste)],
      ['वैवाहिक स्थिती', this.mr('अविवाहित')],
      ['उंची', this.mr(`${p.personalDetails?.height} फूट`)],
      ['रक्तगट', this.mr(p.personalDetails?.bloodGroup)],
      ['वर्ण', this.mr('निमगोरा')],
      ['मातृभाषा', this.mr('मराठी')],
      ['इतर भाषा', this.mr('हिंदी, इंग्रजी')],
      ['शारीरिक अपंगत्व', this.mr('नाही')]
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ===============================
  // शिक्षण व व्यवसाय
  // ===============================
  sectionTitle('शिक्षण व व्यवसाय');

  autoTable(doc, {
    startY: y,
    styles: { font: 'Noto', fontSize: 8.5, cellPadding: 2 },
    body: [
      ['शैक्षणिक पात्रता', this.mr(p.educationDetails?.highestQualification)],
      ['अतिरिक्त शिक्षण', this.mr(p.educationDetails?.additionalQualifications)],
      ['महाविद्यालय', this.mr('शिवाजी विद्यापीठ')],
      ['व्यवसाय', this.mr('अॅनिमेटर (VFX)')],
      ['पद', this.mr('सीनियर रोटो आर्टिस्ट')],
      ['कंपनी', this.mr(p.careerDetails?.companyName)],
      ['वार्षिक उत्पन्न', this.mr(`₹ ${p.careerDetails?.annualIncome}`)],
      ['कामाचे ठिकाण', this.mr('पुणे, महाराष्ट्र')]
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ===============================
  // कौटुंबिक माहिती
  // ===============================
  sectionTitle('कौटुंबिक माहिती');

  autoTable(doc, {
    startY: y,
    styles: { font: 'Noto', fontSize: 8.5, cellPadding: 2 },
    body: [
      ['वडीलांचे नाव', this.mr('स्व. विष्णू निवृत्ती बाबर')],
      ['वडीलांचा व्यवसाय', this.mr('शेतकरी')],
      ['आईचे नाव', this.mr('वनिता विष्णू बाबर')],
      ['आईचा व्यवसाय', this.mr('गृहिणी')],
      ['भाऊ', this.mr('नाही')],
      ['बहिणी', this.mr('१ (विवाहित)')],
      ['कुटुंब प्रकार', this.mr('विभक्त कुटुंब')],
      ['कौटुंबिक संपत्ती', this.mr('१.१० एकर शेती, स्वतःचे घर')],
      ['मूळगाव', this.mr('हातकणंगले, कोल्हापूर')]
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ===============================
  // स्वतःबद्दल
  // ===============================
  sectionTitle('स्वतःबद्दल');

  doc.setFontSize(8.5);
  doc.text(
    this.mr(
      'मी शांत, समजूतदार व कुटुंबप्रिय व्यक्ती आहे. परस्पर आदर, विश्वास आणि स्पष्ट संवादावर माझा विश्वास आहे.'
    ),
    12,
    y,
    { maxWidth: 185 }
  );

  // ===============================
  // WATERMARK
  // ===============================
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(14);
    doc.setTextColor(235);
    doc.text(
      this.mr('सुशील मराठा वधू-वर सूचक मंडळ'),
      pageWidth / 2,
      pageHeight / 2,
      { angle: 45, align: 'center' }
    );
    doc.setTextColor(0);
  }

  doc.save(`${p.userId}_Marathi_Biodata.pdf`);
}



}
