const fs = require("fs");
const path = require("path");

const outputPath = path.join(__dirname, "..", "assets", "files", "demo-book.pdf");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const stream = [
  "BT",
  "/F1 24 Tf",
  "72 770 Td",
  "(Blue Shelf Test PDF) Tj",
  "0 -34 Td",
  "/F1 14 Tf",
  "(Temporary download file for checkout testing.) Tj",
  "0 -24 Td",
  "(Replace this file with the real ebook later.) Tj",
  "ET",
  ""
].join("\n");

const objects = [
  "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
  "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
  "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
  `4 0 obj\n<< /Length ${Buffer.byteLength(stream, "ascii")} >>\nstream\n${stream}endstream\nendobj\n`,
  "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
];

const header = "%PDF-1.4\n";
let offset = Buffer.byteLength(header, "ascii");
const offsets = [];

for (const object of objects) {
  offsets.push(offset);
  offset += Buffer.byteLength(object, "ascii");
}

const xrefStart = offset;
let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

for (const objectOffset of offsets) {
  xref += `${String(objectOffset).padStart(10, "0")} 00000 n \n`;
}

const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
const pdf = header + objects.join("") + xref + trailer;

fs.writeFileSync(outputPath, pdf, "ascii");
console.log(outputPath);
