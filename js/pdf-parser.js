class PdfTextExtractor {
  async extract(arrayBuffer) {
    const data = new Uint8Array(arrayBuffer);
    const raw = new TextDecoder("latin1").decode(data);
    const texts = [];

    const streams = this.findStreams(raw, data);
    for (const s of streams) {
      try {
        const decoded = await this.decodeStream(s.content, s.filters);
        if (decoded && decoded.length > 5) {
          const extracted = this.extractTextOps(decoded);
          if (extracted.trim().length > 2) texts.push(extracted);
        }
      } catch (e) {}
    }

    const directText = this.extractDirectText(raw);
    if (directText.length > 20) texts.push(directText);

    let result = texts.join(" ").replace(/\s+/g, " ").trim();

    if (result.length < 30) {
      result = raw.replace(/[^\x20-\x7E\n]/g, " ").replace(/\s+/g, " ").trim();
    }
    return result;
  }

  findStreams(raw, data) {
    const streams = [];
    const re = /<<([\s\S]*?)>>\s*stream\r?\n/g;
    let m;
    while ((m = re.exec(raw)) !== null) {
      const dict = m[1];
      const start = m.index + m[0].length;

      const lengthMatch = dict.match(/\/Length\s+(\d+)/);
      let end;
      if (lengthMatch) {
        end = start + parseInt(lengthMatch[1]);
      } else {
        const endIdx = raw.indexOf("endstream", start);
        end = endIdx > 0 ? endIdx : start;
      }

      if (end <= start || end > data.length) {
        const endIdx = raw.indexOf("endstream", start);
        end = endIdx > 0 ? endIdx : start;
      }

      const filters = [];
      const filterMatch = dict.match(/\/Filter\s*\/(\w+)/);
      if (filterMatch) filters.push(filterMatch[1]);
      const filterArrayMatch = dict.match(/\/Filter\s*\[([^\]]+)\]/);
      if (filterArrayMatch) {
        const parts = filterArrayMatch[1].match(/\/(\w+)/g) || [];
        parts.forEach(p => filters.push(p.slice(1)));
      }

      const content = data.slice(start, end);
      if (content.length > 0) {
        streams.push({ content, filters, dict });
      }
    }
    return streams;
  }

  async decodeStream(content, filters) {
    let result = content;
    for (const filter of filters) {
      if (filter === "FlateDecode") {
        result = await this.nativeInflate(result);
        if (!result) return null;
      } else if (filter === "ASCIIHexDecode") {
        result = this.asciiHexDecode(result);
      } else if (filter === "ASCII85Decode") {
        result = this.ascii85Decode(result);
      } else {
        return null;
      }
    }
    return new TextDecoder("latin1").decode(result);
  }

  async nativeInflate(data) {
    const input = data instanceof Uint8Array ? data : new Uint8Array(data);

    const attempts = [
      () => this.decompressWithApi(input, "deflate"),
      () => this.decompressWithApi(input, "raw"),
      () => {
        if (input.length > 2 && (input[0] & 0x0F) === 8) {
          return this.decompressWithApi(input.slice(2), "raw");
        }
        return null;
      },
      () => this.manualInflate(input),
    ];

    for (const attempt of attempts) {
      try {
        const result = await attempt();
        if (result && result.length > 0) return result;
      } catch (e) {}
    }
    return null;
  }

  async decompressWithApi(data, format) {
    if (typeof DecompressionStream === "undefined") throw new Error("No DecompressionStream");
    const ds = new DecompressionStream(format);
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();
    writer.write(data);
    writer.close();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const total = chunks.reduce((s, c) => s + c.length, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) { result.set(c, offset); offset += c.length; }
    return result;
  }

  manualInflate(data) {
    const input = data instanceof Uint8Array ? data : new Uint8Array(data);
    let pos = 0;
    if (input.length > 2 && (input[0] & 0x0F) === 8) pos = 2;
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
      const max = Math.max(...lengths.filter(l => l > 0));
      if (max === 0) return {};
      const counts = new Array(max + 1).fill(0);
      lengths.forEach(l => { if (l > 0) counts[l]++; });
      const offsets = new Array(max + 2).fill(0);
      for (let i = 1; i <= max; i++) offsets[i + 1] = offsets[i] + counts[i];
      const table = {};
      for (let sym = 0; sym < lengths.length; sym++) {
        const len = lengths[sym];
        if (len === 0) continue;
        let code = offsets[len]++;
        let bits = "";
        for (let i = len - 1; i >= 0; i--) bits += ((code >> i) & 1);
        table[bits] = sym;
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

  asciiHexDecode(data) {
    const str = new TextDecoder("latin1").decode(data);
    const hex = str.replace(/\s/g, "").replace(/>$/, "");
    const out = [];
    for (let i = 0; i + 1 < hex.length; i += 2) out.push(parseInt(hex.substring(i, i + 2), 16));
    return new Uint8Array(out);
  }

  ascii85Decode(data) {
    const str = new TextDecoder("latin1").decode(data).replace(/\s/g, "").replace(/^<~/, "").replace(/~>$/, "");
    const out = [];
    for (let i = 0; i < str.length;) {
      if (str[i] === "z") { out.push(0, 0, 0, 0); i++; continue; }
      const chunk = [];
      for (let j = 0; j < 5; j++) chunk.push(i + j < str.length ? str.charCodeAt(i + j) - 33 : 84);
      let val = 0;
      for (let j = 0; j < 5; j++) val = val * 85 + chunk[j];
      const bytes = Math.min(str.length - i, 5) - 1;
      for (let j = 3; j >= 4 - bytes; j--) out.push((val >> (j * 8)) & 0xFF);
      i += Math.min(str.length - i, 5);
    }
    return new Uint8Array(out);
  }

  extractTextOps(stream) {
    const parts = [];
    let lastY = null;

    const btBlocks = stream.match(/BT[\s\S]*?ET/g) || [];
    for (const block of btBlocks) {
      const ops = block.match(/(\((?:[^\\)]|\\.)*\)\s*Tj|\[(?:[^\]]*)\]\s*TJ|[\d.\-]+\s+[\d.\-]+\s+Td|[\d.\-]+\s+[\d.\-]+\s+[\d.\-]+\s+[\d.\-]+\s+[\d.\-]+\s+[\d.\-]+\s+Tm|T\*)/g) || [];
      for (const op of ops) {
        if (/Td$/.test(op) || /Tm$/.test(op)) {
          const nums = op.match(/[\d.\-]+/g);
          if (nums && nums.length >= 2) {
            const ty = parseFloat(nums[nums.length === 6 ? 5 : 1]);
            if (lastY !== null && Math.abs(ty - lastY) > 2) parts.push(" ");
            lastY = ty;
          }
        } else if (/T\*$/.test(op)) {
          parts.push(" ");
        } else if (/TJ$/.test(op)) {
          const strs = op.match(/\((?:[^\\)]|\\.)*\)/g) || [];
          parts.push(strs.map(s => this.decodePdfString(s.slice(1, -1))).join(""));
        } else if (/Tj$/.test(op)) {
          const m = op.match(/\(((?:[^\\)]|\\.)*)\)/);
          if (m) parts.push(this.decodePdfString(m[1]));
        }
      }
      parts.push(" ");
    }

    if (parts.length === 0) {
      const tjArrays = stream.match(/\[([^\]]*?)\]\s*TJ/g) || [];
      for (const tj of tjArrays) {
        const strs = tj.match(/\((?:[^\\)]|\\.)*\)/g) || [];
        parts.push(strs.map(s => this.decodePdfString(s.slice(1, -1))).join(""));
        parts.push(" ");
      }
      const tjMatches = stream.match(/\((?:[^\\)]|\\.)*\)\s*Tj/g) || [];
      for (const td of tjMatches) {
        const m = td.match(/\(((?:[^\\)]|\\.)*)\)/);
        if (m) parts.push(this.decodePdfString(m[1]) + " ");
      }
    }

    return parts.join("");
  }

  decodePdfString(str) {
    return str
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      .replace(/\\\\/g, "\\")
      .replace(/\\(\d{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
  }

  extractDirectText(raw) {
    const parts = [];
    const textMatches = raw.match(/\(([^)]{2,400})\)/g) || [];
    for (const m of textMatches) {
      const inner = m.slice(1, -1);
      if (/[a-zA-Z]{2,}/.test(inner) && !/^[\d.]+$/.test(inner)) {
        parts.push(this.decodePdfString(inner));
      }
    }
    return parts.join(" ");
  }
}
