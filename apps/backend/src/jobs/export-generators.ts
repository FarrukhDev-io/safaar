import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export interface ExportColumn {
  key: string;
  header: string;
}

export interface TabularExportData {
  kind: 'tabular';
  title: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
}

export interface JsonExportData {
  kind: 'json';
  title: string;
  data: unknown;
}

export type ExportData = TabularExportData | JsonExportData;

function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function renderCsv(data: TabularExportData): Buffer {
  const header = data.columns.map((c) => csvEscape(c.header)).join(',');
  const lines = data.rows.map((row) =>
    data.columns.map((c) => csvEscape(cellText(row[c.key]))).join(','),
  );
  // Excel'da to'g'ri ochilishi uchun UTF-8 BOM qo'shiladi (kirill/lotin
  // aralash matn — hamkor/mijoz nomlari — buzilib ko'rinmasligi uchun).
  return Buffer.concat([
    Buffer.from('﻿', 'utf8'),
    Buffer.from([header, ...lines].join('\r\n'), 'utf8'),
  ]);
}

export function renderJson(data: JsonExportData): Buffer {
  return Buffer.from(JSON.stringify(data.data, null, 2), 'utf8');
}

export async function renderXlsx(data: TabularExportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(data.title.slice(0, 31) || 'Export');
  sheet.columns = data.columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: Math.min(40, Math.max(12, c.header.length + 4)),
  }));
  sheet.getRow(1).font = { bold: true };
  for (const row of data.rows) {
    sheet.addRow(row);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function renderPdf(data: TabularExportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 36, size: 'A4', layout: 'landscape' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text(data.title, { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('#555').text(
      `Generated: ${new Date().toISOString()} — ${data.rows.length} rows`,
    );
    doc.moveDown(1);
    doc.fillColor('#000');

    const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = usableWidth / Math.max(1, data.columns.length);

    const drawRow = (values: string[], bold: boolean) => {
      const y = doc.y;
      doc.fontSize(8).font(bold ? 'Helvetica-Bold' : 'Helvetica');
      values.forEach((value, i) => {
        doc.text(value, doc.page.margins.left + i * colWidth, y, {
          width: colWidth - 4,
          ellipsis: true,
        });
      });
      doc.moveDown(0.9);
    };

    drawRow(data.columns.map((c) => c.header), true);
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor('#ccc')
      .stroke();
    doc.moveDown(0.3);

    for (const row of data.rows) {
      if (doc.y > doc.page.height - doc.page.margins.bottom - 20) {
        doc.addPage();
      }
      drawRow(
        data.columns.map((c) => cellText(row[c.key])),
        false,
      );
    }

    doc.end();
  });
}

export function extensionForFormat(format: string): string {
  switch (format) {
    case 'csv':
      return '.csv';
    case 'xlsx':
      return '.xlsx';
    case 'pdf':
      return '.pdf';
    case 'json':
      return '.json';
    default:
      return '.txt';
  }
}

export function contentTypeForFormat(format: string): string {
  switch (format) {
    case 'csv':
      return 'text/csv; charset=utf-8';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'pdf':
      return 'application/pdf';
    case 'json':
      return 'application/json; charset=utf-8';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Berilgan formatga mos ravishda export ma'lumotini fayl bytelariga
 * aylantiradi. `personal-data` kabi JSON turidagi ma'lumot faqat
 * `json` formatga mos keladi — boshqa format so'ralsa xato qaytariladi
 * (hozircha bunday chaqiruv yo'q, lekin kelajakda ExportsService.create()
 * orqali erkin type+format kombinatsiyasi so'ralishi mumkin).
 */
export async function renderExport(
  data: ExportData,
  format: string,
): Promise<Buffer> {
  if (data.kind === 'json') {
    if (format !== 'json') {
      throw new Error(
        `"${data.title}" export turi faqat JSON formatni qo'llab-quvvatlaydi`,
      );
    }
    return renderJson(data);
  }

  switch (format) {
    case 'csv':
      return renderCsv(data);
    case 'xlsx':
      return renderXlsx(data);
    case 'pdf':
      return renderPdf(data);
    default:
      throw new Error(`"${format}" export formati qo'llab-quvvatlanmaydi`);
  }
}
