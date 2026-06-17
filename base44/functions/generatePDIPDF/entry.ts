import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@4.2.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { resultId, pillars, participantName, dominantType, dominantTypeName, wing, confidence } = await req.json();

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const margin = 20;
    let y = 20;

    // Header
    doc.setFillColor(15, 15, 25);
    doc.rect(0, 0, pageW, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Plano de Desenvolvimento Individual', margin, 25);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Diagnostico de Lideranca e Equipes', margin, 34);

    y = 58;

    // Participant Info
    doc.setTextColor(40, 40, 55);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(participantName || 'Participante', margin, y);
    y += 8;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 115);
    doc.text(`Tipo Dominante: Tipo ${dominantType} — ${dominantTypeName}`, margin, y);
    y += 6;
    doc.text(`Asa: ${wing}w  |  Confianca: ${confidence}%`, margin, y);
    y += 6;
    const today = new Date().toLocaleDateString('pt-BR');
    doc.text(`Gerado em: ${today}`, margin, y);
    y += 12;

    // Divider
    doc.setDrawColor(120, 80, 255);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    y += 10;

    // Pillars
    (pillars || []).forEach((pillar, i) => {
      // Check if new page needed
      if (y > 240) {
        doc.addPage();
        y = 25;
      }

      // Section header
      doc.setFillColor(120, 80, 255, 0.08);
      doc.roundedRect(margin, y, pageW - margin * 2, 12, 3, 3, 'F');
      doc.setTextColor(120, 80, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(`${i + 1}. ${pillar.area}`, margin + 3, y + 8);
      y += 20;

      // Goal
      doc.setTextColor(40, 40, 55);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Objetivo:', margin, y);
      y += 6;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 95);
      
      // Wrap goal text
      const goalLines = doc.splitTextToSize(pillar.goal || '', pageW - margin * 2);
      goalLines.forEach(line => {
        doc.text(line, margin, y);
        y += 5;
      });
      y += 4;

      // Actions
      doc.setTextColor(40, 40, 55);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Acoes Recomendadas:', margin, y);
      y += 7;

      (pillar.actions || []).forEach((action, ai) => {
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 95);
        const actionLines = doc.splitTextToSize(`${ai + 1}. ${action}`, pageW - margin * 2 - 5);
        actionLines.forEach(line => {
          doc.text(line, margin + 3, y);
          y += 5;
        });
        y += 2;
      });

      // Timeline
      y += 3;
      doc.setTextColor(120, 80, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`Prazo: ${pillar.timeline || 'A definir'}`, margin, y);
      y += 12;

      // Separator between pillars
      if (i < (pillars.length - 1)) {
        doc.setDrawColor(200, 200, 210);
        doc.setLineWidth(0.2);
        doc.line(margin, y, pageW - margin, y);
        y += 8;
      }
    });

    // Footer on last page
    const pageCount = doc.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setTextColor(150, 150, 160);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Plataforma de Diagnostico de Lideranca e Equipes  |  Pagina ${p} de ${pageCount}`, margin, 287);
    }

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=pdi-${(participantName || 'participante').replace(/\s+/g, '-').toLowerCase()}.pdf`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});