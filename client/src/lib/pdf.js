import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const NARANJA = [234, 88, 12];
const PIZARRA = [30, 41, 59];
const GRIS = [100, 116, 139];

function eur(n) {
  return Number(n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function fechaLarga(d = new Date()) {
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Genera y descarga el PDF profesional del presupuesto.
// datos = { configuracion, presupuesto }
export function generarPdf({ configuracion: cfg, presupuesto: p }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const margen = 15;
  let y = 18;

  // ---- Cabecera: datos del tecnico/empresa ----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...PIZARRA);
  doc.text(cfg.nombre_empresa || 'Mi Empresa', margen, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRIS);
  let yc = y + 6;
  const lineasEmpresa = [
    cfg.nif ? `NIF: ${cfg.nif}` : '',
    cfg.direccion,
    [cfg.telefono, cfg.email].filter(Boolean).join('  ·  '),
  ].filter(Boolean);
  lineasEmpresa.forEach((l) => { doc.text(l, margen, yc); yc += 4.5; });

  // Bloque "PRESUPUESTO" a la derecha
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...NARANJA);
  doc.text('PRESUPUESTO', W - margen, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRIS);
  doc.text(`Nº ${String(p.id).padStart(4, '0')}`, W - margen, y + 6, { align: 'right' });
  doc.text(`Fecha: ${fechaLarga(p.created_at ? new Date(p.created_at) : new Date())}`, W - margen, y + 10.5, { align: 'right' });

  y = Math.max(yc, y + 14) + 4;

  // Linea separadora
  doc.setDrawColor(...NARANJA);
  doc.setLineWidth(0.6);
  doc.line(margen, y, W - margen, y);
  y += 8;

  // ---- Datos del cliente ----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PIZARRA);
  doc.text('DATOS DEL CLIENTE', margen, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const datosCliente = [
    p.cliente_nombre,
    p.cliente_direccion,
    [p.cliente_telefono, p.cliente_email].filter(Boolean).join('  ·  '),
  ].filter(Boolean);
  if (datosCliente.length === 0) datosCliente.push('—');
  datosCliente.forEach((l) => { doc.text(l, margen, y); y += 5; });

  if (p.descripcion) {
    y += 1;
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...GRIS);
    doc.text(doc.splitTextToSize(`Trabajo: ${p.descripcion}`, W - margen * 2), margen, y);
    y += 6;
  }
  y += 2;

  // ---- Tabla de lineas ----
  const filas = (p.lineas || []).map((l) => [
    l.concepto,
    String(l.cantidad).replace('.', ','),
    eur(l.precio_unitario),
    eur(l.total),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Concepto', 'Cant.', 'Precio', 'Importe']],
    body: filas,
    margin: { left: margen, right: margen },
    styles: { fontSize: 10, cellPadding: 2.5, textColor: [40, 40, 40] },
    headStyles: { fillColor: PIZARRA, textColor: [255, 255, 255], halign: 'left', fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  let yt = doc.lastAutoTable.finalY + 6;

  // ---- Totales ----
  const t = p.totales || calcular(p);
  const xLabel = W - margen - 60;
  const xVal = W - margen;
  const linea = (label, val, bold = false, color = [40, 40, 40]) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 12 : 10);
    doc.setTextColor(...color);
    doc.text(label, xLabel, yt, { align: 'left' });
    doc.text(val, xVal, yt, { align: 'right' });
    yt += bold ? 7 : 5.5;
  };
  linea('Base imponible', eur(t.base_imponible));
  linea(`IVA (${p.iva_porcentaje}%)`, eur(t.iva));
  doc.setDrawColor(...GRIS);
  doc.setLineWidth(0.2);
  doc.line(xLabel, yt - 2, xVal, yt - 2);
  yt += 1;
  linea('TOTAL', eur(t.total_con_iva), true, NARANJA);

  yt += 6;

  // ---- Condiciones y validez ----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PIZARRA);
  doc.text('CONDICIONES', margen, yt);
  yt += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GRIS);
  const validez = `Validez de la oferta: ${cfg.dias_validez} días desde la fecha de emisión.`;
  const cond = doc.splitTextToSize([validez, cfg.condiciones_pago].filter(Boolean).join(' '), W - margen * 2);
  doc.text(cond, margen, yt);
  yt += cond.length * 4 + 10;

  // ---- Firma ----
  const yFirma = Math.min(yt, doc.internal.pageSize.getHeight() - 30);
  doc.setDrawColor(...GRIS);
  doc.setLineWidth(0.3);
  doc.line(margen, yFirma, margen + 55, yFirma);
  doc.line(W - margen - 55, yFirma, W - margen, yFirma);
  doc.setFontSize(8);
  doc.setTextColor(...GRIS);
  doc.text('Firma y sello (empresa)', margen, yFirma + 4);
  doc.text('Conforme cliente', W - margen - 55, yFirma + 4);

  const nombreArchivo = `Presupuesto_${String(p.id).padStart(4, '0')}_${(p.cliente_nombre || 'cliente').replace(/\s+/g, '_')}.pdf`;
  doc.save(nombreArchivo);
}

function calcular(p) {
  const base = (p.lineas || []).reduce((s, l) => s + Number(l.total || 0), 0);
  const iva = base * (Number(p.iva_porcentaje) / 100);
  return { base_imponible: base, iva, total_con_iva: base + iva };
}
