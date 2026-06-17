import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@4.2.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      participantName, participantEmail, participantCompany, participantRole,
      dominantType, dominantTypeName, wing, wingName, confidence,
      scores, ranking, strengths, weaknesses, recommendations,
      description, motivation, fears, leadership, communication, development,
      aiInsights, careerData, environment, avoid, skills, growth
    } = await req.json();

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const margin = 20;
    let y = 20;

    const accentColor = [99, 71, 235]; // purple
    const darkBg = [15, 15, 25];
    const textDark = [30, 30, 45];
    const textGray = [100, 100, 115];

    // Header background
    doc.setFillColor(...darkBg);
    doc.rect(0, 0, pageW, 55, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('Relatorio de Diagnostico', margin, 25);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(200, 200, 215);
    doc.text('Eneagrama Pro — Lideranca e Equipes', margin, 34);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, margin, 44);

    y = 65;

    // Participant Info
    doc.setTextColor(...accentColor);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(participantName || 'Participante', margin, y);
    y += 8;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...textGray);
    if (participantEmail) { doc.text(`E-mail: ${participantEmail}`, margin, y); y += 5; }
    if (participantCompany) { doc.text(`Empresa: ${participantCompany}`, margin, y); y += 5; }
    if (participantRole) { doc.text(`Cargo: ${participantRole}`, margin, y); y += 5; }
    y += 5;

    // Result Card
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(1);
    doc.roundedRect(margin, y, pageW - margin * 2, 28, 4, 4, 'D');
    y += 6;

    doc.setTextColor(...textDark);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`Tipo ${dominantType} — ${dominantTypeName}`, margin + 5, y);
    y += 7;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...textGray);
    doc.text(`Confianca: ${confidence}%  |  Asa: ${wing}w (${wingName})`, margin + 5, y);
    y += 16;

    // Section: Description
    y = addSection(doc, y, pageW, margin, 'Sobre o Tipo', description, accentColor, textDark, textGray);

    // Section: Strengths & Challenges
    if (y > 230) { doc.addPage(); y = 25; }
    y = addSection(doc, y, pageW, margin, 'Forcas', strengths?.length ? strengths.map(s => `• ${s}`).join('\n') : '', accentColor, textDark, textGray);
    if (y > 230) { doc.addPage(); y = 25; }
    y = addSection(doc, y, pageW, margin, 'Desafios', weaknesses?.length ? weaknesses.map(s => `• ${s}`).join('\n') : '', accentColor, textDark, textGray);

    // Recommendations
    if (y > 230) { doc.addPage(); y = 25; }
    y = addSection(doc, y, pageW, margin, 'Recomendacoes', recommendations?.length ? recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n') : '', accentColor, textDark, textGray);

    // Career Data
    if (careerData?.length) {
      if (y > 200) { doc.addPage(); y = 25; }
      y = addSection(doc, y, pageW, margin, 'Aptidao Profissional', '', accentColor, textDark, textGray);

      careerData.slice(0, 8).forEach((c, i) => {
        doc.setTextColor(...textDark);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`${i + 1}. ${c.career} — ${c.match}%`, margin + 3, y);
        y += 5;

        if (c.reason) {
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(...textGray);
          const reasonLines = doc.splitTextToSize(c.reason, pageW - margin * 2 - 6);
          reasonLines.forEach(line => { doc.text(line, margin + 6, y); y += 4; });
        }
        y += 3;
      });
    }

    // Environment
    if (environment) {
      if (y > 230) { doc.addPage(); y = 25; }
      y = addSection(doc, y, pageW, margin, 'Ambiente Ideal', environment, accentColor, textDark, textGray);
    }
    if (avoid) {
      if (y > 230) { doc.addPage(); y = 25; }
      y = addSection(doc, y, pageW, margin, 'Ambientes a Evitar', avoid, accentColor, textDark, textGray);
    }

    // Skills
    if (skills?.length) {
      if (y > 230) { doc.addPage(); y = 25; }
      doc.setTextColor(...accentColor);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('Habilidades Naturais', margin, y);
      y += 8;

      skills.forEach(s => {
        doc.setFillColor(...accentColor, 0.1);
        doc.roundedRect(margin, y, 50, 8, 2, 2, 'F');
        doc.setTextColor(...accentColor);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(s, margin + 2, y + 5.5);
        y += 12;
      });
      y += 4;
    }

    // Growth
    if (growth) {
      if (y > 230) { doc.addPage(); y = 25; }
      y = addSection(doc, y, pageW, margin, 'Alavanca de Crescimento', growth, accentColor, textDark, textGray);
    }

    // AI Insights
    if (aiInsights) {
      if (y > 200) { doc.addPage(); y = 25; }
      y = addSection(doc, y, pageW, margin, 'Insights com IA', '', accentColor, textDark, textGray);

      const insightItems = [
        { key: 'maior_forca', label: 'Maior Forca' },
        { key: 'segunda_forca', label: '2a Forca' },
        { key: 'principal_risco', label: 'Principal Risco' },
        { key: 'competencia_profissional', label: 'Competencia Profissional' },
        { key: 'limitacao_profissional', label: 'Limitacao Profissional' },
        { key: 'ambiente_ideal', label: 'Ambiente Ideal' },
        { key: 'ambiente_desgaste', label: 'Ambiente Desgaste' }
      ];

      insightItems.forEach(item => {
        const data = aiInsights[item.key];
        if (!data) return;
        if (y > 260) { doc.addPage(); y = 25; }

        doc.setTextColor(...textDark);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`${item.label}: ${data.titulo}`, margin + 3, y);
        y += 5;

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...textGray);
        const lines = doc.splitTextToSize(data.descricao || '', pageW - margin * 2 - 6);
        lines.forEach(line => { doc.text(line, margin + 6, y); y += 4; });
        y += 3;
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setTextColor(150, 150, 160);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Eneagrama Pro  |  Pagina ${p} de ${pageCount}`, margin, 287);
    }

    const pdfBytes = doc.output('arraybuffer');
    const safeName = (participantName || 'resultado').replace(/\s+/g, '-').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=diagnostico-${safeName}.pdf`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function addSection(doc, y, pageW, margin, title, text, accentColor, textDark, textGray) {
  if (!text) return y;

  if (y > 250) {
    doc.addPage();
    y = 25;
  }

  // Title
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 4, margin + 3, y + 4);
  doc.setTextColor(...accentColor);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(title, margin + 6, y + 5);
  y += 12;

  // Content
  doc.setTextColor(...textGray);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(text, pageW - margin * 2 - 6);
  lines.forEach(line => {
    if (y > 275) { doc.addPage(); y = 25; }
    doc.text(line, margin + 3, y);
    y += 5;
  });
  y += 6;
  return y;
}