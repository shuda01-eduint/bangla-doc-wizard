import * as pdfjsLib from 'pdfjs-dist';
// Use Vite worker bundling to avoid external CDN loading issues
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Vite's ?worker returns a Worker constructor
import PDFWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';

// Initialize dedicated worker via workerPort (recommended for bundlers)
pdfjsLib.GlobalWorkerOptions.workerPort = new (PDFWorker as unknown as { new (): Worker })();

// Helper to compress and resize images
async function shrinkImage(dataUrl: string, maxDim = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = (height / width) * maxDim;
          width = maxDim;
        } else {
          width = (width / height) * maxDim;
          height = maxDim;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export const convertPdfToImages = async (file: File): Promise<string[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const images: string[] = [];
  
  // Convert each page to an image
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.2 }); // Balanced scale for quality and size
    
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
    
    // Convert canvas to base64 and compress
    const imageData = canvas.toDataURL('image/png');
    const compressedImage = await shrinkImage(imageData);
    images.push(compressedImage);
  }
  
  return images;
};
