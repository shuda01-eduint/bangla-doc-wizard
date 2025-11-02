import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

export const generateAndDownloadDoc = async (text: string, fileName: string = 'extracted-text.docx') => {
  try {
    // Split text into paragraphs
    const paragraphs = text.split('\n').map(line => 
      new Paragraph({
        children: [
          new TextRun({
            text: line || ' ', // Empty line if blank
            font: 'Arial',
            size: 24, // 12pt font (size is in half-points)
          }),
        ],
        spacing: {
          after: 200, // Add spacing after each paragraph
        },
      })
    );

    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
    });

    // Generate and download
    const blob = await Packer.toBlob(doc);
    saveAs(blob, fileName);
    
    return true;
  } catch (error) {
    console.error('Error generating DOC file:', error);
    throw error;
  }
};
