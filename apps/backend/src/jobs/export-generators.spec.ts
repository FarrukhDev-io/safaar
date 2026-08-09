import {
  contentTypeForFormat,
  extensionForFormat,
  renderCsv,
  renderExport,
  renderJson,
  renderPdf,
  renderXlsx,
  type JsonExportData,
  type TabularExportData,
} from './export-generators';

const tabular: TabularExportData = {
  kind: 'tabular',
  title: 'Test Report',
  columns: [
    { key: 'name', header: 'Ism' },
    { key: 'amount', header: 'Summa' },
  ],
  rows: [
    { name: 'Laziz', amount: 100000 },
    { name: 'Aziz, "VIP"', amount: 50000 },
  ],
};

const jsonData: JsonExportData = {
  kind: 'json',
  title: 'Personal data',
  data: { user: { id: 'u1' }, bookings: [{ id: 'b1' }] },
};

describe('export-generators', () => {
  it('renderCsv escapes commas/quotes and includes a UTF-8 BOM', () => {
    const buffer = renderCsv(tabular);
    const text = buffer.toString('utf8');

    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text).toContain('Ism,Summa');
    expect(text).toContain('"Aziz, ""VIP"""');
  });

  it('renderJson serializes the raw data object', () => {
    const buffer = renderJson(jsonData);
    expect(JSON.parse(buffer.toString('utf8'))).toEqual(jsonData.data);
  });

  it('renderXlsx produces a real, non-empty xlsx workbook buffer', async () => {
    const buffer = await renderXlsx(tabular);
    expect(buffer.length).toBeGreaterThan(0);
    // xlsx fayllari ZIP konteyner — magic bytes "PK" bilan boshlanadi.
    expect(buffer.subarray(0, 2).toString('ascii')).toBe('PK');
  });

  it('renderPdf produces a real, non-empty PDF buffer', async () => {
    const buffer = await renderPdf(tabular);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('renderExport routes tabular data to the requested format', async () => {
    const csv = await renderExport(tabular, 'csv');
    expect(csv.toString('utf8')).toContain('Ism,Summa');

    const xlsx = await renderExport(tabular, 'xlsx');
    expect(xlsx.subarray(0, 2).toString('ascii')).toBe('PK');
  });

  it('renderExport rejects json-typed data for a non-json format', async () => {
    await expect(renderExport(jsonData, 'csv')).rejects.toThrow(/JSON/);
  });

  it('renderExport rejects an unsupported format for tabular data', async () => {
    await expect(renderExport(tabular, 'docx')).rejects.toThrow(
      /qo'llab-quvvatlanmaydi/,
    );
  });

  it('extensionForFormat / contentTypeForFormat cover all supported formats', () => {
    expect(extensionForFormat('csv')).toBe('.csv');
    expect(extensionForFormat('xlsx')).toBe('.xlsx');
    expect(extensionForFormat('pdf')).toBe('.pdf');
    expect(extensionForFormat('json')).toBe('.json');
    expect(contentTypeForFormat('csv')).toContain('text/csv');
    expect(contentTypeForFormat('xlsx')).toContain('spreadsheetml');
    expect(contentTypeForFormat('pdf')).toBe('application/pdf');
    expect(contentTypeForFormat('json')).toContain('application/json');
  });
});
