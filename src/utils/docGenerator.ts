import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

interface ParsedElement {
  type: 'table' | 'header' | 'paragraph';
  data?: string[][];
  level?: number;
  text?: string;
}

// Parse structured text to identify tables, headers, and paragraphs
function parseStructuredText(text: string): ParsedElement[] {
  const lines = text.split('\n');
  const elements: ParsedElement[] = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Detect Markdown table
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1]?.includes('|---')) {
      const tableData = extractTable(lines, i);
      if (tableData.rows.length > 0) {
        elements.push({ type: 'table', data: tableData.rows });
      }
      i = tableData.endIndex;
    }
    // Detect header (## or ###)
    else if (line.trim().startsWith('##')) {
      const headerMatch = line.match(/^(#+)\s*(.+)/);
      if (headerMatch) {
        elements.push({ 
          type: 'header', 
          level: headerMatch[1].length,
          text: headerMatch[2].trim()
        });
      }
      i++;
    }
    // Normal paragraph (skip empty lines and page breaks)
    else if (line.trim() && !line.includes('--- Page Break ---')) {
      elements.push({ type: 'paragraph', text: line });
      i++;
    } else {
      i++;
    }
  }
  
  return elements;
}

// Extract table rows from Markdown format
function extractTable(lines: string[], startIndex: number): { rows: string[][], endIndex: number } {
  const rows: string[][] = [];
  let i = startIndex;
  
  while (i < lines.length && lines[i].includes('|')) {
    const line = lines[i].trim();
    
    // Skip separator rows (|---|---|)
    if (!line.includes('|---')) {
      const cells = line
        .split('|')
        .map(c => c.trim())
        .filter(c => c.length > 0);
      
      if (cells.length > 0) {
        rows.push(cells);
      }
    }
    
    i++;
    
    // Stop if next line doesn't contain a pipe
    if (i < lines.length && !lines[i].includes('|')) {
      break;
    }
  }
  
  return { rows, endIndex: i };
}

// Generate DOCX elements from parsed structure
function generateDocxElements(elements: ParsedElement[]): (Paragraph | Table)[] {
  const children: (Paragraph | Table)[] = [];
  
  for (const el of elements) {
    if (el.type === 'table' && el.data) {
      children.push(createDocxTable(el.data));
    } else if (el.type === 'header' && el.text) {
      children.push(createHeader(el.text, el.level || 2));
    } else if (el.type === 'paragraph' && el.text?.trim()) {
      children.push(createParagraph(el.text));
    }
  }
  
  return children;
}

// Create a Word table with proper formatting
function createDocxTable(rows: string[][]): Table {
  if (rows.length === 0) {
    return new Table({ rows: [] });
  }
  
  return new Table({
    rows: rows.map((row, rowIdx) => new TableRow({
      children: row.map(cell => new TableCell({
        children: [new Paragraph({
          children: [new TextRun({
            text: cell,
            font: 'Kalpurush, SolaimanLipi, Arial Unicode MS',
            size: rowIdx === 0 ? 24 : 22,  // Slightly larger for header row
            bold: rowIdx === 0
          })],
          alignment: AlignmentType.LEFT
        })],
        width: { size: 100 / row.length, type: WidthType.PERCENTAGE }
      }))
    })),
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' }
    }
  });
}

// Create a header paragraph with proper styling
function createHeader(text: string, level: number): Paragraph {
  return new Paragraph({
    children: [new TextRun({
      text,
      font: 'Kalpurush, SolaimanLipi, Arial Unicode MS',
      size: level === 2 ? 32 : 28,  // ## = 16pt, ### = 14pt
      bold: true
    })],
    spacing: { before: 400, after: 200 }
  });
}

// Create a normal paragraph
function createParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({
      text: text || ' ',
      font: 'Kalpurush, SolaimanLipi, Arial Unicode MS',
      size: 24  // 12pt font (size is in half-points)
    })],
    spacing: { after: 200 }
  });
}

export const generateAndDownloadDoc = async (text: string, fileName: string = 'extracted-text.docx', returnBlob: boolean = false): Promise<Blob | true> => {
  try {
    // Parse the text to identify structure
    const elements = parseStructuredText(text);
    
    // Generate DOCX elements
    const children = generateDocxElements(elements);
    
    // If no structured elements found, fall back to simple paragraphs
    const finalChildren = children.length === 0 
      ? text.split('\n').map(line => 
          new Paragraph({
            children: [
              new TextRun({
                text: line || ' ',
                font: 'Kalpurush, SolaimanLipi, Arial Unicode MS',
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          })
        )
      : children;
    
    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: finalChildren,
      }],
    });

    // Generate blob
    const blob = await Packer.toBlob(doc);
    
    // Return blob or download
    if (returnBlob) {
      return blob;
    }
    
    saveAs(blob, fileName);
    return true;
  } catch (error) {
    console.error('Error generating DOC file:', error);
    throw error;
  }
};
