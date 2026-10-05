import { jsPDF } from 'jspdf';
import { NameSearchResponse, EntityType } from '../types/company-search';

export interface CompanyReportLeadData {
  fullName: string;
  phone: string;
  email: string;
}

export interface GenerateReportOptions {
  searchResult: NameSearchResponse;
  leadData: CompanyReportLeadData;
  entityType: EntityType;
  entityLabel: string;
  entitySuffix: string;
  actReference: string;
  activityCategory?: string;
}

/**
 * Cleanly wraps text and draws to PDF, advancing yPos
 */
function drawWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  for (let i = 0; i < lines.length; i++) {
    doc.text(lines[i], x, y + i * lineHeight);
  }
  return y + lines.length * lineHeight;
}

/**
 * Isolated PDF Generation for Company Name Search & Availability Report
 * Does not use window.print(). Produces a clean, vector-rendered A4 document.
 */
export function generateCompanyNameReportPdf(options: GenerateReportOptions): jsPDF {
  const {
    searchResult,
    leadData,
    entityLabel,
    entitySuffix,
    actReference,
    activityCategory,
  } = options;

  if (!searchResult || !searchResult.fullProposedName) {
    throw new Error('Invalid analysis data: Cannot generate report without proposed name.');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const reportRef = `LMI-CNS-${Date.now().toString(36).toUpperCase()}`;
  const generatedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const primaryNavy = [11, 19, 43] as const; // #0B132B
  const slateDark = [30, 41, 59] as const; // #1E293B
  const slateMuted = [100, 116, 139] as const; // #64748B
  const orangeAccent = [234, 88, 12] as const; // #EA580C
  const borderLight = [226, 232, 240] as const; // #E2E8F0
  const bgLight = [248, 250, 252] as const; // #F8FAFC

  // Helper for Header Bar
  const drawPageHeader = (pageNumber: number, totalPages: number) => {
    // Top primary header banner
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(0, 0, pageWidth, 24, 'F');

    // Accent line
    doc.setFillColor(orangeAccent[0], orangeAccent[1], orangeAccent[2]);
    doc.rect(0, 24, pageWidth, 1.5, 'F');

    // Brand Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('LEGOMARK INDIA', margin, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text('CORPORATE LEGAL ADVISORY & STATUTORY COMPLIANCE', margin, 17);

    // Report Meta (Right aligned)
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`REPORT REF: ${reportRef}`, pageWidth - margin, 11, { align: 'right' });
    doc.setTextColor(203, 213, 225);
    doc.text(`DATE: ${generatedDate}  |  PAGE ${pageNumber} OF ${totalPages}`, pageWidth - margin, 17, {
      align: 'right',
    });
  };

  // Helper for Footer Bar
  const drawPageFooter = (pageNumber: number, totalPages: number) => {
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(
      'LEGOMARK INDIA · PRELIMINARY STATUTORY NAME REPORT · CONFIDENTIAL & ADVISORY USE ONLY',
      margin,
      pageHeight - 7.5
    );
    doc.text(
      `Page ${pageNumber} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 7.5,
      { align: 'right' }
    );
  };

  // ================= PAGE 1 =================
  drawPageHeader(1, 2);

  let y = 33;

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('COMPANY NAME AVAILABILITY & STRENGTH REPORT', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(
    'Preliminary Statutory Diagnostic under Ministry of Corporate Affairs (MCA) Rule 8 Principles',
    margin,
    y
  );
  y += 7;

  // Box 1: Client & Evaluation Context (2 Columns)
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 23, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('CLIENT DETAILS (PREPARED FOR)', margin + 4, y + 5.5);
  doc.text('STATUTORY CONSTITUTION', margin + contentWidth / 2 + 4, y + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(leadData.fullName || 'Valued Client', margin + 4, y + 11.5);
  doc.text(`${entityLabel} (${entitySuffix})`, margin + contentWidth / 2 + 4, y + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`Mobile: ${leadData.phone}  |  Email: ${leadData.email}`, margin + 4, y + 17.5);
  doc.text(actReference, margin + contentWidth / 2 + 4, y + 17.5);

  y += 28;

  // Box 2: Proposed Name & Score Summary
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(249, 115, 22); // orange border accent
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 36, 2, 2, 'FD');

  // Left banner bar
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(margin, y, 4, 36, 'F');

  // Proposed Name details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(orangeAccent[0], orangeAccent[1], orangeAccent[2]);
  doc.text('PROPOSED CORPORATE IDENTITY', margin + 8, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  const proposedNameTrunc = doc.splitTextToSize(searchResult.fullProposedName, contentWidth - 65);
  doc.text(proposedNameTrunc[0] || searchResult.fullProposedName, margin + 8, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(
    `Industry Activity: ${activityCategory?.trim() || 'General Commercial / Technology Services'}`,
    margin + 8,
    y + 20
  );

  // Score Badge on Right Side
  const scoreBoxX = pageWidth - margin - 52;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(scoreBoxX, y + 4, 48, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('NAME STRENGTH SCORE', scoreBoxX + 24, y + 9.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  const scoreColor =
    searchResult.availabilityScore >= 80
      ? [16, 185, 129]
      : searchResult.availabilityScore >= 60
      ? [59, 130, 246]
      : searchResult.availabilityScore >= 40
      ? [245, 158, 11]
      : [239, 68, 68];
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(`${searchResult.availabilityScore}`, scoreBoxX + 24, y + 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('OUT OF 100 · PRELIMINARY', scoreBoxX + 24, y + 23, { align: 'center' });
  doc.text(
    searchResult.availabilityScore >= 80
      ? 'Favorable Baseline'
      : searchResult.availabilityScore >= 60
      ? 'Acceptable Baseline'
      : 'Review Recommended',
    scoreBoxX + 24,
    y + 28,
    { align: 'center' }
  );

  // Summary Text underneath
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  const summaryLines = doc.splitTextToSize(searchResult.summary, contentWidth - 65);
  doc.text(summaryLines.slice(0, 2), margin + 8, y + 27);

  y += 42;

  // Section 3: Statutory Rule 8 Compliance Checks
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('1. MCA RULE 8 & STATUTORY CRITERIA AUDIT', margin, y);
  y += 4;

  // Table Header
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('RULE / EVALUATION CHECK', margin + 3, y + 4.8);
  doc.text('MCA STATUTORY BASIS', margin + 95, y + 4.8);
  doc.text('EVALUATION', pageWidth - margin - 3, y + 4.8, { align: 'right' });
  y += 7;

  // Table Rows for Checks
  searchResult.checks.forEach((chk, index) => {
    const isEven = index % 2 === 0;
    const rowHeight = 13;

    doc.setFillColor(isEven ? 255 : bgLight[0], isEven ? 255 : bgLight[1], isEven ? 255 : bgLight[2]);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, contentWidth, rowHeight, 'FD');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(chk.title, margin + 3, y + 4.5);

    // Description snippet
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    const desc = doc.splitTextToSize(chk.description, 88);
    doc.text(desc[0] || '', margin + 3, y + 9.2);

    // Authority
    doc.text(chk.mcaReference || 'MCA Rule 8 Guidelines', margin + 95, y + 6.5);

    // Status pill
    if (chk.passed) {
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('COMPLIANT', pageWidth - margin - 3, y + 7, { align: 'right' });
    } else {
      doc.setTextColor(chk.severity === 'warning' ? 245 : 239, chk.severity === 'warning' ? 158 : 68, 68);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(chk.severity === 'warning' ? 'REVIEW REQ.' : 'FLAGGED', pageWidth - margin - 3, y + 7, {
        align: 'right',
      });
    }

    y += rowHeight;
  });

  y += 5;

  // Prohibited Words Warning Banner if detected
  if (searchResult.prohibitedWordsFound && searchResult.prohibitedWordsFound.length > 0) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(248, 113, 113);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(185, 28, 28);
    doc.text('STATUTORY PROHIBITED WORD ALERT (SECTION 4(2))', margin + 3, y + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.text(
      `Protected terms detected: "${searchResult.prohibitedWordsFound.join(', ')}". Reserved under Emblems Act 1950.`,
      margin + 3,
      y + 9
    );
    y += 15;
  }

  drawPageFooter(1, 2);

  // ================= PAGE 2 =================
  doc.addPage();
  drawPageHeader(2, 2);

  y = 33;

  // Section 4: Phonetic & Trademark Similarity Findings (Local Heuristics)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('2. PHONETIC SIMILARITY FINDINGS (LOCAL BENCHMARK HEURISTICS)', margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(
    'Heuristic similarity evaluation against standard reference corporate dataset. Does not query live MCA records.',
    margin,
    y
  );
  y += 5;

  if (searchResult.similarRegisteredNames && searchResult.similarRegisteredNames.length > 0) {
    // Table Header
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('BENCHMARK CORPORATE NAME', margin + 3, y + 4.8);
    doc.text('DATASET SOURCE', margin + 100, y + 4.8);
    doc.text('MATCH PROXIMITY', pageWidth - margin - 3, y + 4.8, { align: 'right' });
    y += 7;

    searchResult.similarRegisteredNames.forEach((sim, idx) => {
      const isEven = idx % 2 === 0;
      const rowHeight = 10;
      doc.setFillColor(isEven ? 255 : bgLight[0], isEven ? 255 : bgLight[1], isEven ? 255 : bgLight[2]);
      doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
      doc.setLineWidth(0.2);
      doc.rect(margin, y, contentWidth, rowHeight, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.text(sim.name, margin + 3, y + 6.2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      doc.text('Local Reference Benchmark', margin + 100, y + 6.2);

      doc.setFont('helvetica', 'bold');
      const simColor = sim.similarity >= 85 ? [220, 38, 38] : sim.similarity >= 70 ? [217, 119, 6] : [75, 85, 99];
      doc.setTextColor(simColor[0], simColor[1], simColor[2]);
      doc.text(`${sim.similarity}% Match`, pageWidth - margin - 3, y + 6.2, { align: 'right' });

      y += rowHeight;
    });
  } else {
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(16, 185, 129);
    doc.text('NO HIGH PHONETIC MATCHES IN LOCAL BENCHMARK', margin + 4, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(
      'No names with high phonetic similarity were detected in the reference dataset. Verify live MCA data before filing.',
      margin + 4,
      y + 9
    );
    y += 14;
  }

  y += 6;

  // Section 5: Statutory Next Steps
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('3. STATUTORY RECOMMENDATIONS & FILING NEXT STEPS', margin, y);
  y += 4.5;

  const nextSteps = [
    {
      title: 'Prepare Dual Name Preferences for SPICe+ Part A / RUN Filing',
      desc: 'The Ministry of Corporate Affairs permits submission of two proposed names in order of preference. Always submit an alternate coined variation alongside your primary choice.',
    },
    {
      title: 'Conduct Cross-Class Trademark Search (NICE Classification)',
      desc: 'Ensure no registered trademarks or pending applications exist under relevant Nice classes matching your business objects to avoid objection under Section 4(2)(b).',
    },
    {
      title: 'Draft Memorandum of Association (MoA) Object Clause',
      desc: 'Ensure the primary objects align strictly with the chosen activity keyword (e.g., Technologies, Solutions, Consultancy, Logistics) to prevent ROC resubmission requisitions.',
    },
  ];

  nextSteps.forEach((step, idx) => {
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');

    // Number circle
    doc.setFillColor(orangeAccent[0], orangeAccent[1], orangeAccent[2]);
    doc.circle(margin + 6, y + 7, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(`${idx + 1}`, margin + 6, y + 8, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(step.title, margin + 13, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    const lines = doc.splitTextToSize(step.desc, contentWidth - 18);
    doc.text(lines, margin + 13, y + 9.5);

    y += 16;
  });

  y += 4;

  // Section 6: Statutory Disclaimer Box
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('STATUTORY & PRELIMINARY ASSESSMENT DISCLAIMER', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  const disclaimerText =
    'This report is an automated preliminary diagnostic tool provided by Legomark India based on standard Ministry of Corporate Affairs (MCA) Rule 8 guidelines, Emblems and Names (Prevention of Improper Use) Act provisions, and local phonetic heuristics. This report does not query live MCA Master Data in real-time and does not constitute official government reservation, approval, or pre-clearance from the Registrar of Companies (ROC). Official name approval and reservation authority resides exclusively with the Central Registration Centre (CRC / MCA, Government of India) upon formal submission of SPICe+ Part A or RUN forms. Legomark India recommends engaging a qualified Company Secretary (CS) or Chartered Accountant (CA) prior to statutory capital commitments.';
  drawWrappedText(doc, disclaimerText, margin + 4, y + 10, contentWidth - 8, 3.4);

  y += 37;

  // Support / Contact Box
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('NEED PROFESSIONAL CS / CA ASSISTANCE FOR SPICe+ FILING?', margin + 6, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text(
    'Contact Legomark India Corporate Advisory Team · Email: advisory@legomark.in · Portal: www.legomark.in',
    margin + 6,
    y + 10.5
  );

  drawPageFooter(2, 2);

  return doc;
}
