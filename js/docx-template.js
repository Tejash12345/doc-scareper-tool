class DocxTemplateEngine {
  async loadTemplate(url) {
    const resp = await fetch(url);
    const buf = await resp.arrayBuffer();
    this.entries = this.parseZip(new Uint8Array(buf));
    return this;
  }

  _readCentralDirectory(data) {
    const result = {};
    let eocdOff = data.length - 22;
    while (eocdOff >= 0) {
      if (data[eocdOff]===0x50 && data[eocdOff+1]===0x4b && data[eocdOff+2]===0x05 && data[eocdOff+3]===0x06) break;
      eocdOff--;
    }
    if (eocdOff < 0) return result;
    const cdSize = data[eocdOff+12]|(data[eocdOff+13]<<8)|(data[eocdOff+14]<<16)|(data[eocdOff+15]<<24);
    const cdStart = data[eocdOff+16]|(data[eocdOff+17]<<8)|(data[eocdOff+18]<<16)|(data[eocdOff+19]<<24);
    let pos = cdStart;
    while (pos < cdStart + cdSize && pos + 46 <= data.length) {
      const sig = data[pos]|(data[pos+1]<<8)|(data[pos+2]<<16)|(data[pos+3]<<24);
      if (sig !== 0x02014b50) break;
      const crc = data[pos+16]|(data[pos+17]<<8)|(data[pos+18]<<16)|(data[pos+19]<<24);
      const compSize = data[pos+20]|(data[pos+21]<<8)|(data[pos+22]<<16)|(data[pos+23]<<24);
      const uncompSize = data[pos+24]|(data[pos+25]<<8)|(data[pos+26]<<16)|(data[pos+27]<<24);
      const nameLen = data[pos+28]|(data[pos+29]<<8);
      const extraLen = data[pos+30]|(data[pos+31]<<8);
      const commentLen = data[pos+32]|(data[pos+33]<<8);
      const name = new TextDecoder().decode(data.slice(pos+46, pos+46+nameLen));
      result[name] = { crc, compSize, uncompSize };
      pos += 46 + nameLen + extraLen + commentLen;
    }
    return result;
  }

  parseZip(data) {
    const cdMeta = this._readCentralDirectory(data);
    const entries = [];
    let offset = 0;
    while (offset < data.length - 4) {
      const sig = data[offset] | (data[offset+1]<<8) | (data[offset+2]<<16) | (data[offset+3]<<24);
      if (sig !== 0x04034b50) break;
      const flags = data[offset+6] | (data[offset+7]<<8);
      const method = data[offset+8] | (data[offset+9]<<8);
      let crc = data[offset+14] | (data[offset+15]<<8) | (data[offset+16]<<16) | (data[offset+17]<<24);
      let compSize = data[offset+18] | (data[offset+19]<<8) | (data[offset+20]<<16) | (data[offset+21]<<24);
      let uncompSize = data[offset+22] | (data[offset+23]<<8) | (data[offset+24]<<16) | (data[offset+25]<<24);
      const nameLen = data[offset+26] | (data[offset+27]<<8);
      const extraLen = data[offset+28] | (data[offset+29]<<8);
      const name = new TextDecoder().decode(data.slice(offset+30, offset+30+nameLen));
      const dataStart = offset + 30 + nameLen + extraLen;

      const cd = cdMeta[name];
      if (cd) { crc = cd.crc; compSize = cd.compSize; uncompSize = cd.uncompSize; }

      const fileData = data.slice(dataStart, dataStart + compSize);
      entries.push({ name, method, data: fileData, crc, uncompSize });

      if (flags & 0x08) {
        let descOff = dataStart + compSize;
        const maybeSig = data[descOff]|(data[descOff+1]<<8)|(data[descOff+2]<<16)|(data[descOff+3]<<24);
        offset = descOff + (maybeSig === 0x08074b50 ? 16 : 12);
      } else {
        offset = dataStart + compSize;
      }
    }
    return entries;
  }

  async getDocumentXml() {
    const entry = this.entries.find(e => e.name === "word/document.xml");
    if (!entry) return "";
    const raw = entry.method === 8 ? await this.inflate(entry.data) : entry.data;
    return new TextDecoder("utf-8").decode(raw);
  }

  async setDocumentXml(xml) {
    const idx = this.entries.findIndex(e => e.name === "word/document.xml");
    if (idx < 0) return;
    const encoded = new TextEncoder().encode(xml);
    this.entries[idx].data = encoded;
    this.entries[idx].method = 0;
    this.entries[idx].uncompSize = encoded.length;
    this.entries[idx].crc = this.crc32(encoded);
  }

  async inflate(data) {
    const attempts = [
      () => this.decompressStream(data, "raw"),
      () => this._chunkedInflate(data),
      () => this.decompressStream(data, "deflate"),
      () => Promise.resolve(this.manualInflate(data)),
    ];
    for (const attempt of attempts) {
      try {
        const result = await attempt();
        if (result && result.length > 0) return result;
      } catch (e) {}
    }
    return data;
  }

  async _chunkedInflate(data) {
    const ds = new DecompressionStream("deflate");
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();
    const header = new Uint8Array([0x78, 0x9C]);
    const trailer = new Uint8Array([0, 0, 0, 1]);
    const writeAll = (async () => {
      try {
        await writer.write(header);
        for (let i = 0; i < data.length; i += 1024) {
          await writer.write(data.slice(i, Math.min(i + 1024, data.length)));
        }
        await writer.write(trailer);
        await writer.close();
      } catch (e) {}
    })();
    const chunks = [];
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } catch (e) {}
    await writeAll;
    const total = chunks.reduce((s, c) => s + c.length, 0);
    if (total === 0) throw new Error("no output");
    const result = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) { result.set(c, off); off += c.length; }
    return result;
  }

  manualInflate(data) {
    const input = data instanceof Uint8Array ? data : new Uint8Array(data);
    let pos = 0;
    if (input.length > 2 && (input[0] & 0x0F) === 8) pos = 16;
    const output = [];
    let bfinal = 0;

    const readBits = (n) => {
      let val = 0;
      for (let i = 0; i < n; i++) {
        const bytePos = pos >> 3;
        const bitPos = pos & 7;
        if (bytePos >= input.length) throw new Error("EOF");
        val |= ((input[bytePos] >> bitPos) & 1) << i;
        pos++;
      }
      return val;
    };

    const buildTree = (lengths) => {
      const filtered = lengths.filter(l => l > 0);
      if (filtered.length === 0) return {};
      const maxBits = Math.max(...filtered);
      const blCount = new Array(maxBits + 1).fill(0);
      lengths.forEach(l => { if (l > 0) blCount[l]++; });
      const nextCode = new Array(maxBits + 1).fill(0);
      let code = 0;
      for (let bits = 1; bits <= maxBits; bits++) {
        code = (code + blCount[bits - 1]) << 1;
        nextCode[bits] = code;
      }
      const table = {};
      for (let sym = 0; sym < lengths.length; sym++) {
        const len = lengths[sym];
        if (len === 0) continue;
        const c = nextCode[len]++;
        let bitStr = "";
        for (let i = len - 1; i >= 0; i--) bitStr += ((c >> i) & 1);
        table[bitStr] = sym;
      }
      return table;
    };

    const decodeSymbol = (tree) => {
      let bits = "";
      for (let i = 0; i < 25; i++) {
        const bytePos = pos >> 3;
        const bitPos = pos & 7;
        if (bytePos >= input.length) throw new Error("EOF");
        bits += ((input[bytePos] >> bitPos) & 1);
        pos++;
        if (bits in tree) return tree[bits];
      }
      throw new Error("Bad Huffman");
    };

    const FIXED_LIT = (() => { const l = new Array(288); for (let i=0;i<=143;i++)l[i]=8; for(let i=144;i<=255;i++)l[i]=9; for(let i=256;i<=279;i++)l[i]=7; for(let i=280;i<=287;i++)l[i]=8; return l; })();
    const FIXED_DIST = new Array(32).fill(5);
    const lenBase=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258];
    const lenExtra=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
    const distBase=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577];
    const distExtra=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];

    try {
      while (!bfinal) {
        bfinal = readBits(1);
        const btype = readBits(2);
        if (btype === 0) {
          pos = (pos + 7) & ~7;
          const len = readBits(8) | (readBits(8) << 8);
          readBits(16);
          for (let i = 0; i < len; i++) output.push(readBits(8));
        } else if (btype === 1 || btype === 2) {
          let litTree, distTree;
          if (btype === 1) { litTree = buildTree(FIXED_LIT); distTree = buildTree(FIXED_DIST); }
          else {
            const hlit = readBits(5) + 257, hdist = readBits(5) + 1, hclen = readBits(4) + 4;
            const clOrder = [16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];
            const clLengths = new Array(19).fill(0);
            for (let i = 0; i < hclen; i++) clLengths[clOrder[i]] = readBits(3);
            const clTree = buildTree(clLengths);
            const all = [];
            while (all.length < hlit + hdist) {
              const sym = decodeSymbol(clTree);
              if (sym <= 15) all.push(sym);
              else if (sym === 16) { const r = readBits(2)+3; const v = all[all.length-1]||0; for(let i=0;i<r;i++)all.push(v); }
              else if (sym === 17) { const r = readBits(3)+3; for(let i=0;i<r;i++)all.push(0); }
              else if (sym === 18) { const r = readBits(7)+11; for(let i=0;i<r;i++)all.push(0); }
            }
            litTree = buildTree(all.slice(0, hlit));
            const dl = all.slice(hlit, hlit+hdist);
            distTree = dl.some(l => l > 0) ? buildTree(dl) : null;
          }
          while (true) {
            const sym = decodeSymbol(litTree);
            if (sym === 256) break;
            if (sym < 256) output.push(sym);
            else {
              const li = sym-257;
              const length = lenBase[li] + (lenExtra[li] ? readBits(lenExtra[li]) : 0);
              const di = distTree ? decodeSymbol(distTree) : 0;
              const distance = distBase[di] + (distExtra[di] ? readBits(distExtra[di]) : 0);
              for (let i = 0; i < length; i++) output.push(output[output.length - distance]);
            }
          }
        }
      }
    } catch (e) {}
    return new Uint8Array(output);
  }

  adler32(data) {
    if (!data) return 1;
    let a = 1, b = 0;
    for (let i = 0; i < data.length; i++) {
      a = (a + data[i]) % 65521;
      b = (b + a) % 65521;
    }
    return ((b << 16) | a) >>> 0;
  }

  async decompressStream(data, format) {
    const ds = new DecompressionStream(format);
    const writer = ds.writable.getWriter();
    const writePromise = writer.write(data).then(() => writer.close()).catch(() => {});
    const reader = ds.readable.getReader();
    const chunks = [];
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } catch (e) {
      await writePromise;
      if (chunks.length === 0) throw e;
    }
    await writePromise;
    const total = chunks.reduce((s, c) => s + c.length, 0);
    const result = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) { result.set(c, off); off += c.length; }
    return result;
  }

  crc32(data) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
      crc ^= data[i];
      for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  async buildZip() {
    const parts = [];
    const centralDir = [];
    let offset = 0;

    for (const entry of this.entries) {
      let fileData = entry.data;
      if (entry.method !== 0) {
        try { fileData = await this.inflate(entry.data); } catch (e) {}
      }
      const crc = this.crc32(fileData);
      const nameBytes = new TextEncoder().encode(entry.name);
      const localHeader = new Uint8Array(30 + nameBytes.length);
      const view = new DataView(localHeader.buffer);
      view.setUint32(0, 0x04034b50, true);
      view.setUint16(4, 20, true);
      view.setUint32(14, crc, true);
      view.setUint32(18, fileData.length, true);
      view.setUint32(22, fileData.length, true);
      view.setUint16(26, nameBytes.length, true);
      localHeader.set(nameBytes, 30);

      const cdEntry = new Uint8Array(46 + nameBytes.length);
      const cdView = new DataView(cdEntry.buffer);
      cdView.setUint32(0, 0x02014b50, true);
      cdView.setUint16(4, 20, true);
      cdView.setUint16(6, 20, true);
      cdView.setUint32(16, crc, true);
      cdView.setUint32(20, fileData.length, true);
      cdView.setUint32(24, fileData.length, true);
      cdView.setUint16(28, nameBytes.length, true);
      cdView.setUint32(42, offset, true);
      cdEntry.set(nameBytes, 46);

      parts.push(localHeader);
      parts.push(fileData);
      centralDir.push(cdEntry);
      offset += localHeader.length + fileData.length;
    }

    const cdStart = offset;
    let cdSize = 0;
    for (const cd of centralDir) { parts.push(cd); cdSize += cd.length; }

    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true);
    eocdView.setUint16(8, this.entries.length, true);
    eocdView.setUint16(10, this.entries.length, true);
    eocdView.setUint32(12, cdSize, true);
    eocdView.setUint32(16, cdStart, true);
    parts.push(eocd);

    const totalLen = parts.reduce((s, p) => s + p.length, 0);
    const result = new Uint8Array(totalLen);
    let pos = 0;
    for (const p of parts) { result.set(p, pos); pos += p.length; }
    return result;
  }

  escXml(str) {
    return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  makeRun(text, props) {
    const rpr = props || "";
    return `<w:r>${rpr}<w:t xml:space="preserve">${this.escXml(text)}</w:t></w:r>`;
  }

  fillTableCell(xml, rowIndex, cellIndex, value) {
    let rowCount = 0;
    let searchFrom = 0;
    while (rowCount <= rowIndex) {
      const trStart = xml.indexOf("<w:tr ", searchFrom);
      const trStartAlt = xml.indexOf("<w:tr>", searchFrom);
      const trActual = trStart < 0 ? trStartAlt : (trStartAlt < 0 ? trStart : Math.min(trStart, trStartAlt));
      if (trActual < 0) return xml;
      if (rowCount === rowIndex) {
        const trEnd = xml.indexOf("</w:tr>", trActual);
        if (trEnd < 0) return xml;
        const rowXml = xml.substring(trActual, trEnd + 7);

        let cellCount = 0;
        let cellSearch = 0;
        let cellStart = -1, cellEnd = -1;
        while (cellCount <= cellIndex) {
          const tcIdx = rowXml.indexOf("<w:tc>", cellSearch);
          const tcIdx2 = rowXml.indexOf("<w:tc ", cellSearch);
          const tcStart = tcIdx < 0 ? tcIdx2 : (tcIdx2 < 0 ? tcIdx : Math.min(tcIdx, tcIdx2));
          if (tcStart < 0) return xml;
          if (cellCount === cellIndex) {
            cellStart = tcStart;
            cellEnd = rowXml.indexOf("</w:tc>", cellStart);
            break;
          }
          cellSearch = rowXml.indexOf("</w:tc>", tcStart) + 7;
          cellCount++;
        }

        if (cellStart < 0 || cellEnd < 0) return xml;
        const cellXml = rowXml.substring(cellStart, cellEnd + 7);

        const pStart = cellXml.lastIndexOf("<w:p ");
        const pAlt = cellXml.lastIndexOf("<w:p>");
        const pIdx = Math.max(pStart, pAlt);
        if (pIdx < 0) return xml;

        const pEnd = cellXml.indexOf("</w:p>", pIdx);
        if (pEnd < 0) return xml;
        const pXml = cellXml.substring(pIdx, pEnd + 6);

        let rprMatch = pXml.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/);
        if (!rprMatch) {
          const runMatch = rowXml.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/);
          rprMatch = runMatch;
        }
        const rpr = rprMatch ? `<w:rPr>${rprMatch[1]}</w:rPr>` : "";

        const newRun = this.makeRun(value || "NA", rpr);
        const hasRun = pXml.includes("<w:r>") || pXml.includes("<w:r ");
        let newP;
        if (hasRun) {
          newP = pXml.replace(/<w:r[ >][\s\S]*<\/w:r>/, newRun);
        } else {
          newP = pXml.replace("</w:p>", newRun + "</w:p>");
        }

        const newCell = cellXml.substring(0, pIdx) + newP + cellXml.substring(pEnd + 6);
        const newRow = rowXml.substring(0, cellStart) + newCell + rowXml.substring(cellEnd + 7);
        return xml.substring(0, trActual) + newRow + xml.substring(trEnd + 7);
      }
      const trEndSkip = xml.indexOf("</w:tr>", trActual);
      if (trEndSkip < 0) return xml;
      searchFrom = trEndSkip + 7;
      rowCount++;
    }
    return xml;
  }

  _extractText(xmlFragment) {
    const texts = [];
    const re = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let m;
    while ((m = re.exec(xmlFragment)) !== null) texts.push(m[1]);
    return texts.join("").trim();
  }

  _findRowByLabel(xml, labelText) {
    let sf = 0;
    while (true) {
      const a = xml.indexOf("<w:tr ", sf);
      const b = xml.indexOf("<w:tr>", sf);
      const trActual = a < 0 ? b : (b < 0 ? a : Math.min(a, b));
      if (trActual < 0) return null;
      const trEnd = xml.indexOf("</w:tr>", trActual);
      if (trEnd < 0) return null;
      const rowXml = xml.substring(trActual, trEnd + 7);
      const rowText = this._extractText(rowXml);
      if (rowText.includes(labelText)) {
        return { start: trActual, end: trEnd + 7, xml: rowXml };
      }
      sf = trEnd + 7;
    }
  }

  _parseCells(rowXml) {
    const cells = [];
    let cs = 0;
    while (true) {
      const a = rowXml.indexOf("<w:tc>", cs);
      const b = rowXml.indexOf("<w:tc ", cs);
      const tcS = a < 0 ? b : (b < 0 ? a : Math.min(a, b));
      if (tcS < 0) break;
      const tcE = rowXml.indexOf("</w:tc>", tcS);
      if (tcE < 0) break;
      cells.push({ start: tcS, end: tcE + 7, xml: rowXml.substring(tcS, tcE + 7) });
      cs = tcE + 7;
    }
    return cells;
  }

  _fillLastParagraph(cellXml, value, rowXml) {
    const pS = cellXml.lastIndexOf("<w:p ");
    const pA = cellXml.lastIndexOf("<w:p>");
    const pIdx = Math.max(pS, pA);
    if (pIdx < 0) return cellXml;
    const pEnd = cellXml.indexOf("</w:p>", pIdx);
    if (pEnd < 0) return cellXml;
    const pXml = cellXml.substring(pIdx, pEnd + 6);
    let rprMatch = pXml.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/);
    if (!rprMatch) rprMatch = (rowXml || "").match(/<w:rPr>([\s\S]*?)<\/w:rPr>/);
    const rpr = rprMatch ? `<w:rPr>${rprMatch[1]}</w:rPr>` : "";
    const newRun = this.makeRun(value || "NA", rpr);
    const hasRun = pXml.includes("<w:r>") || pXml.includes("<w:r ");
    let newP;
    if (hasRun) {
      newP = pXml.replace(/<w:r[ >][\s\S]*<\/w:r>/, newRun);
    } else {
      newP = pXml.replace("</w:p>", newRun + "</w:p>");
    }
    return cellXml.substring(0, pIdx) + newP + cellXml.substring(pEnd + 6);
  }

  fillByLabel(xml, labelText, value, cellOffset) {
    const row = this._findRowByLabel(xml, labelText);
    if (!row) return xml;
    const cells = this._parseCells(row.xml);
    const ti = cellOffset !== undefined ? cellOffset : cells.length - 1;
    if (ti < 0 || ti >= cells.length) return xml;
    const newCellXml = this._fillLastParagraph(cells[ti].xml, value, row.xml);
    const newRow = row.xml.substring(0, cells[ti].start) + newCellXml + row.xml.substring(cells[ti].end);
    return xml.substring(0, row.start) + newRow + xml.substring(row.end);
  }

  fillByLabelFull(xml, labelText, value, cellOffset) {
    const row = this._findRowByLabel(xml, labelText);
    if (!row) return xml;
    const cells = this._parseCells(row.xml);
    const ti = cellOffset !== undefined ? cellOffset : cells.length - 1;
    if (ti < 0 || ti >= cells.length) return xml;
    const cellXml = cells[ti].xml;
    const tcPrMatch = cellXml.match(/<w:tcPr>[\s\S]*?<\/w:tcPr>/);
    const tcPr = tcPrMatch ? tcPrMatch[0] : "";
    let rprMatch = cellXml.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/) || row.xml.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/);
    const rpr = rprMatch ? `<w:rPr>${rprMatch[1]}</w:rPr>` : "";
    const newRun = this.makeRun(value || "NA", rpr);
    const cellTag = cellXml.match(/^<w:tc[^>]*>/)[0];
    const newCell = cellTag + tcPr + `<w:p>${newRun}</w:p></w:tc>`;
    const newRow = row.xml.substring(0, cells[ti].start) + newCell + row.xml.substring(cells[ti].end);
    return xml.substring(0, row.start) + newRow + xml.substring(row.end);
  }

  fillByLabelMulti(xml, labelText, labelMap, cellOffset) {
    const row = this._findRowByLabel(xml, labelText);
    if (!row) return xml;
    const cells = this._parseCells(row.xml);
    const ti = cellOffset !== undefined ? cellOffset : cells.length - 1;
    if (ti < 0 || ti >= cells.length) return xml;
    let cellXml = cells[ti].xml;
    for (const [label, value] of Object.entries(labelMap)) {
      const pRegex = /<w:p[ >][\s\S]*?<\/w:p>/g;
      let pm;
      while ((pm = pRegex.exec(cellXml)) !== null) {
        const pText = this._extractText(pm[0]);
        if (pText === label || pText.startsWith(label)) {
          const pXml = pm[0];
          let rprMatch = pXml.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/) || row.xml.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/);
          const rpr = rprMatch ? `<w:rPr>${rprMatch[1]}</w:rPr>` : "";
          const newRun = this.makeRun(label + ": " + (value || "NA"), rpr);
          const pprMatch = pXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
          const ppr = pprMatch ? pprMatch[0] : "";
          const pTag = pXml.match(/^<w:p[^>]*>/)[0];
          const newP = pTag + ppr + newRun + "</w:p>";
          cellXml = cellXml.substring(0, pm.index) + newP + cellXml.substring(pm.index + pm[0].length);
          break;
        }
      }
    }
    const newRow = row.xml.substring(0, cells[ti].start) + cellXml + row.xml.substring(cells[ti].end);
    return xml.substring(0, row.start) + newRow + xml.substring(row.end);
  }

  fillCellByLabels(xml, rowIndex, cellIndex, labelMap) {
    let rowCount = 0;
    let searchFrom = 0;
    while (rowCount <= rowIndex) {
      const trStart = xml.indexOf("<w:tr ", searchFrom);
      const trStartAlt = xml.indexOf("<w:tr>", searchFrom);
      const trActual = trStart < 0 ? trStartAlt : (trStartAlt < 0 ? trStart : Math.min(trStart, trStartAlt));
      if (trActual < 0) return xml;
      if (rowCount === rowIndex) {
        const trEnd = xml.indexOf("</w:tr>", trActual);
        if (trEnd < 0) return xml;
        let rowXml = xml.substring(trActual, trEnd + 7);
        const tcRegex = /<w:tc[ >][\s\S]*?<\/w:tc>/g;
        let cm, ci = 0, cellStart = -1, cellEnd = -1;
        while ((cm = tcRegex.exec(rowXml)) !== null) {
          if (ci === cellIndex) { cellStart = cm.index; cellEnd = cm.index + cm[0].length; break; }
          ci++;
        }
        if (cellStart < 0) return xml;
        let cellXml = rowXml.substring(cellStart, cellEnd);
        for (const [label, value] of Object.entries(labelMap)) {
          const pRegex = new RegExp("<w:p[ >][\\s\\S]*?<\\/w:p>", "g");
          let pm;
          while ((pm = pRegex.exec(cellXml)) !== null) {
            const pText = pm[0].replace(/<[^>]+>/g, "").trim();
            if (pText === label || pText.startsWith(label)) {
              const pXml = pm[0];
              let rprMatch = pXml.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/);
              if (!rprMatch) rprMatch = rowXml.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/);
              const rpr = rprMatch ? `<w:rPr>${rprMatch[1]}</w:rPr>` : "";
              const newRun = this.makeRun(label + ": " + (value || "NA"), rpr);
              const pprMatch = pXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
              const ppr = pprMatch ? pprMatch[0] : "";
              const pTag = pXml.match(/^<w:p[^>]*>/)[0];
              const newP = pTag + ppr + newRun + "</w:p>";
              cellXml = cellXml.substring(0, pm.index) + newP + cellXml.substring(pm.index + pm[0].length);
              break;
            }
          }
        }
        const newRow = rowXml.substring(0, cellStart) + cellXml + rowXml.substring(cellEnd);
        return xml.substring(0, trActual) + newRow + xml.substring(trEnd + 7);
      }
      const trEndSkip2 = xml.indexOf("</w:tr>", trActual);
      if (trEndSkip2 < 0) return xml;
      searchFrom = trEndSkip2 + 7;
      rowCount++;
    }
    return xml;
  }

  replaceText(xml, search, replacement) {
    return xml.split(search).join(this.escXml(replacement || "NA"));
  }

  replaceUnderscorePlaceholder(xml, beforeText, value) {
    const pattern = new RegExp(
      "(" + this.escXml(beforeText).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")" +
      "(</w:t></w:r>)" +
      "([\\s\\S]*?)" +
      "(<w:r[^>]*><w:rPr>[\\s\\S]*?</w:rPr>)?<w:t[^>]*>_{3,}[^<]*</w:t></w:r>"
    );
    const match = xml.match(pattern);
    if (match) {
      return xml.replace(pattern, "$1 " + this.escXml(value || "NA") + "$2");
    }

    const simplePattern = "_{5,}";
    const idx = xml.indexOf(beforeText);
    if (idx >= 0) {
      const afterIdx = idx + beforeText.length;
      const chunk = xml.substring(afterIdx, Math.min(afterIdx + 500, xml.length));
      const underscoreMatch = chunk.match(new RegExp(simplePattern));
      if (underscoreMatch) {
        const replaceStart = afterIdx + underscoreMatch.index;
        const replaceEnd = replaceStart + underscoreMatch[0].length;
        return xml.substring(0, replaceStart) + this.escXml(value || "NA") + xml.substring(replaceEnd);
      }
    }
    return xml;
  }

  async download(filename) {
    const zipData = await this.buildZip();
    const blob = new Blob([zipData], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
