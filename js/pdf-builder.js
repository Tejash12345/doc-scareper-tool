class PdfBuilder {
  constructor() {
    this.objects = [];
    this.pages = [];
    this.currentPage = null;
    this.pageWidth = 595.28;
    this.pageHeight = 841.89;
    this.fontName = "Helvetica";
    this.fontSize = 10;
    this.fontBold = false;

    this.catalogId = this.addObj("<< /Type /Catalog /Pages 2 0 R >>");
    this.pagesId = 2;
    this.addObj(null);

    this.fontRegId = this.addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
    this.fontBoldId = this.addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  }

  addObj(content) {
    const id = this.objects.length + 1;
    this.objects.push({ id, content });
    return id;
  }

  addPage() {
    const stream = [];
    const pageContentId = this.addObj(null);
    const pageId = this.addObj(null);
    this.pages.push({ pageId, contentId: pageContentId, stream });
    this.currentPage = this.pages[this.pages.length - 1];
    return this;
  }

  setFont(size, bold) {
    this.fontSize = size;
    this.fontBold = bold || false;
    const fontRef = this.fontBold ? "/F2" : "/F1";
    this.currentPage.stream.push(`${fontRef} ${size} Tf`);
  }

  drawText(text, x, y) {
    const safe = this.escPdf(text);
    this.currentPage.stream.push(`BT 0 0 0 rg ${x.toFixed(2)} ${y.toFixed(2)} Td (${safe}) Tj ET`);
  }

  drawTextCentered(text, y) {
    const width = this.measureText(text, this.fontSize);
    const x = (this.pageWidth - width) / 2;
    this.drawText(text, x, y);
  }

  drawLine(x1, y1, x2, y2, width) {
    this.currentPage.stream.push(`${(width || 1).toFixed(2)} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  }

  drawRect(x, y, w, h, fill) {
    if (fill) {
      const rgb = this.hexToRgb(fill);
      this.currentPage.stream.push(`${rgb} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
    }
    this.currentPage.stream.push(`0 0 0 RG 0.4 w ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
  }

  drawCellBorder(x, y, w, h) {
    this.currentPage.stream.push(`0 0 0 RG 0.4 w ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
  }

  hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
  }

  measureText(text, size) {
    const avgCharWidth = size * 0.52;
    return text.length * avgCharWidth;
  }

  wrapText(text, maxWidth, fontSize) {
    if (!text) return [""];
    const words = text.split(" ");
    const lines = [];
    let current = "";

    for (const word of words) {
      const test = current ? current + " " + word : word;
      if (this.measureText(test, fontSize) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [""];
  }

  escPdf(str) {
    return String(str || "")
      .replace(/[—–]/g, "-")
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[^\x20-\x7E]/g, "")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/[\r\n]/g, " ");
  }

  build() {
    const pageIds = [];
    for (const page of this.pages) {
      const streamContent = page.stream.join("\n");
      const streamBytes = new TextEncoder().encode(streamContent);

      this.objects[page.contentId - 1].content = `<< /Length ${streamBytes.length} >>\nstream\n${streamContent}\nendstream`;

      this.objects[page.pageId - 1].content = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.pageWidth} ${this.pageHeight}] /Contents ${page.contentId} 0 R /Resources << /Font << /F1 ${this.fontRegId} 0 R /F2 ${this.fontBoldId} 0 R >> >> >>`;
      pageIds.push(`${page.pageId} 0 R`);
    }

    this.objects[this.pagesId - 1].content = `<< /Type /Pages /Kids [${pageIds.join(" ")}] /Count ${this.pages.length} >>`;

    let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
    const offsets = [];

    for (const obj of this.objects) {
      offsets.push(pdf.length);
      pdf += `${obj.id} 0 obj\n${obj.content}\nendobj\n`;
    }

    const xrefOffset = pdf.length;
    pdf += "xref\n";
    pdf += `0 ${this.objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    for (const off of offsets) {
      pdf += String(off).padStart(10, "0") + " 00000 n \n";
    }

    pdf += "trailer\n";
    pdf += `<< /Size ${this.objects.length + 1} /Root ${this.catalogId} 0 R >>\n`;
    pdf += "startxref\n";
    pdf += `${xrefOffset}\n`;
    pdf += "%%EOF";

    return new Blob([pdf], { type: "application/pdf" });
  }
}
