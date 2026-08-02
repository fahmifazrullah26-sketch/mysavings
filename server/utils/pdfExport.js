// Membuat PDF sederhana berisi tabel riwayat transaksi.
// Membutuhkan: npm install pdfkit
const PDFDocument = require('pdfkit');

function generatePdf(res, rows) {
  const doc = new PDFDocument({ margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=mysavings-transactions.pdf');
  doc.pipe(res);

  doc.fontSize(18).text('MySavings — Riwayat Transaksi', { align: 'center' });
  doc.moveDown();

  const tableTop = doc.y;
  const colWidths = [80, 60, 90, 90, 160];
  const headers = ['Tanggal', 'Jenis', 'Kategori', 'Nominal', 'Keterangan'];

  let x = 40;
  headers.forEach((h, i) => {
    doc.fontSize(10).font('Helvetica-Bold').text(h, x, tableTop, { width: colWidths[i] });
    x += colWidths[i];
  });

  let y = tableTop + 20;
  doc.font('Helvetica');
  rows.forEach((row) => {
    if (y > 750) {
      doc.addPage();
      y = 40;
    }
    x = 40;
    const values = [
      row.transaction_date,
      row.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      row.category,
      `Rp ${Number(row.amount).toLocaleString('id-ID')}`,
      row.description || '-',
    ];
    values.forEach((v, i) => {
      doc.fontSize(9).text(String(v), x, y, { width: colWidths[i] });
      x += colWidths[i];
    });
    y += 18;
  });

  doc.end();
}

module.exports = generatePdf;
