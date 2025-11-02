import * as pdfjsLib from 'pdfjs-dist';
// Use Vite worker bundling to avoid external CDN loading issues
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Vite's ?worker returns a Worker constructor
import PDFWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';

// Initialize dedicated worker via workerPort (recommended for bundlers)
pdfjsLib.GlobalWorkerOptions.workerPort = new (PDFWorker as unknown as { new (): Worker })();

export const convertPdfToImages = async (file: File): Promise<string[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const images: string[] = [];
  
  // Convert each page to an image
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Could not get canvas context');
    }
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({
      canvasContext: context,
      viewport: viewport,
    } as any).promise;
    
    // Convert canvas to base64
    const imageData = canvas.toDataURL('image/png');
    images.push(imageData);
  }
  
  return images;
};
