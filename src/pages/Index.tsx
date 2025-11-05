import { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { ImagePreview } from '@/components/ImagePreview';
import { ProcessingState } from '@/components/ProcessingState';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { FileQueue, QueuedFile } from '@/components/FileQueue';
import { PreviewGallery } from '@/components/PreviewGallery';
import { useToast } from '@/hooks/use-toast';
import { generateAndDownloadDoc } from '@/utils/docGenerator';
import { supabase } from '@/integrations/supabase/client';
import { convertPdfToImages } from '@/utils/pdfConverter';
import { Button } from '@/components/ui/button';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [fileQueue, setFileQueue] = useState<QueuedFile[]>([]);
  const [previewItems, setPreviewItems] = useState<Array<{
    id: string;
    fileName: string;
    imageUrl?: string;
    extractedText: string;
    pageNumber?: number;
  }>>([]);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    
    setIsProcessing(true);
    
    try {
      let imagesToProcess: string[] = [];
      
      // Handle PDFs differently
      if (file.type === 'application/pdf') {
        console.log('Converting PDF to images...');
        toast({
          title: "Processing PDF",
          description: "Converting pages to images...",
        });
        
        imagesToProcess = await convertPdfToImages(file);
        console.log(`Converted ${imagesToProcess.length} PDF pages to images`);
        if (imagesToProcess[0]) {
          setImageUrl(imagesToProcess[0]);
        }
      } else {
        // Handle regular images
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        const imageData = await base64Promise;
        imagesToProcess = [imageData];
      }

      console.log(`Processing ${imagesToProcess.length} image(s) with OCR...`);
      
      // Process all images with error recovery
      const extractedTexts: string[] = [];
      const failedPages: number[] = [];
      setProgress({ current: 0, total: imagesToProcess.length });
      
      for (let i = 0; i < imagesToProcess.length; i++) {
        console.log(`Processing image ${i + 1} of ${imagesToProcess.length}...`);
        setProgress({ current: i + 1, total: imagesToProcess.length });
        
        try {
          const { data, error } = await supabase.functions.invoke('ocr-process', {
            body: { imageData: imagesToProcess[i] }
          });

          if (error) {
            console.error(`Page ${i + 1} error:`, error);
            
            // Check for specific errors
            if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
              toast({
                title: "Rate limit exceeded",
                description: "Too many requests. Waiting before retry...",
                variant: "destructive",
              });
              throw new Error('Rate limited - please wait and try again');
            }
            if (error.message?.includes('credits') || error.message?.includes('402')) {
              toast({
                title: "Out of AI credits",
                description: "Please add credits to your workspace in Settings → Usage",
                variant: "destructive",
              });
              throw new Error('No credits available');
            }
            
            failedPages.push(i + 1);
            extractedTexts.push(`[Page ${i + 1} failed to process]`);
            continue;
          }

          if (data?.error) {
            console.error(`Page ${i + 1} OCR error:`, data.error);
            
            if (data.error.includes('Rate limit') || data.error.includes('429')) {
              toast({
                title: "Rate limit exceeded",
                description: "Too many requests. Please wait a moment.",
                variant: "destructive",
              });
              throw new Error('Rate limited');
            }
            if (data.error.includes('credits') || data.error.includes('402')) {
              toast({
                title: "Out of AI credits",
                description: "Add credits in Settings → Workspace → Usage",
                variant: "destructive",
              });
              throw new Error('No credits');
            }
            
            failedPages.push(i + 1);
            extractedTexts.push(`[Page ${i + 1} failed to process]`);
            continue;
          }

          extractedTexts.push(data.extractedText || '');
          
          // Add 2-second delay between pages to avoid rate limiting
          if (i < imagesToProcess.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (pageError: any) {
          console.error(`Page ${i + 1} exception:`, pageError);
          failedPages.push(i + 1);
          extractedTexts.push(`[Page ${i + 1} failed to process]`);
        }
      }

      // Combine all extracted text
      const combinedText = extractedTexts.join('\n\n--- Page Break ---\n\n');
      setExtractedText(combinedText || 'No text found in the document');
      
      const successCount = imagesToProcess.length - failedPages.length;
      toast({
        title: "Processing complete",
        description: failedPages.length > 0 
          ? `Successfully extracted ${successCount}/${imagesToProcess.length} pages. Failed: ${failedPages.join(', ')}`
          : `Successfully extracted text from ${imagesToProcess.length} page(s)`,
        variant: failedPages.length > 0 ? "default" : "default"
      });
    } catch (error: any) {
      console.error('OCR processing error:', error);
      
      let errorMessage = "Unable to process the file";
      
      if (error.message?.includes('Rate limit')) {
        errorMessage = "Rate limit exceeded. Please try again in a moment.";
      } else if (error.message?.includes('credits')) {
        errorMessage = "AI credits depleted. Please add credits to continue.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Processing failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      setExtractedText('');
    } finally {
      setIsProcessing(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleFolderSelect = async (files: File[]) => {
    setIsBatchMode(true);
    setFileQueue([]);
    setPreviewItems([]);
    
    const queuedFiles: QueuedFile[] = files.map((file, idx) => ({
      id: `file-${idx}-${Date.now()}`,
      file,
      status: 'pending' as const,
    }));
    
    setFileQueue(queuedFiles);
    
    // Process files sequentially
    for (const queuedFile of queuedFiles) {
      await processSingleFile(queuedFile);
    }
    
    toast({
      title: "Batch processing complete",
      description: `Processed ${files.length} files`,
    });
  };

  const processSingleFile = async (queuedFile: QueuedFile) => {
    setFileQueue(prev => prev.map(f => 
      f.id === queuedFile.id ? { ...f, status: 'processing' as const } : f
    ));

    try {
      let imagesToProcess: string[] = [];
      const fileUrl = URL.createObjectURL(queuedFile.file);
      
      if (queuedFile.file.type === 'application/pdf') {
        imagesToProcess = await convertPdfToImages(queuedFile.file);
      } else {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(queuedFile.file);
        });
        imagesToProcess = [await base64Promise];
      }

      const extractedTexts: string[] = [];
      
      for (let i = 0; i < imagesToProcess.length; i++) {
        setFileQueue(prev => prev.map(f => 
          f.id === queuedFile.id 
            ? { ...f, progress: `Processing page ${i + 1} of ${imagesToProcess.length}...` }
            : f
        ));

        try {
          const { data, error } = await supabase.functions.invoke('ocr-process', {
            body: { imageData: imagesToProcess[i] }
          });

          // Check for specific error types
          if (error) {
            if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
              toast({
                title: "Rate limit exceeded",
                description: "Too many requests. Please wait a moment and try again.",
                variant: "destructive",
              });
              throw new Error('Rate limited');
            }
            if (error.message?.includes('credits') || error.message?.includes('402')) {
              toast({
                title: "Out of AI credits",
                description: "Please add credits to your workspace to continue processing.",
                variant: "destructive",
              });
              throw new Error('No credits');
            }
            extractedTexts.push(`[Page ${i + 1} failed]`);
            continue;
          }

          if (data?.error) {
            if (data.error.includes('Rate limit') || data.error.includes('429')) {
              toast({
                title: "Rate limit exceeded",
                description: "Too many requests. Please wait a moment and try again.",
                variant: "destructive",
              });
              throw new Error('Rate limited');
            }
            if (data.error.includes('credits') || data.error.includes('402')) {
              toast({
                title: "Out of AI credits",
                description: "Please add credits to your workspace to continue processing.",
                variant: "destructive",
              });
              throw new Error('No credits');
            }
            extractedTexts.push(`[Page ${i + 1} failed]`);
            continue;
          }

          const pageText = data.extractedText || '';
          extractedTexts.push(pageText);
          
          // Add to preview gallery
          setPreviewItems(prev => [...prev, {
            id: `${queuedFile.id}-page-${i}`,
            fileName: queuedFile.file.name,
            imageUrl: imagesToProcess[i],
            extractedText: pageText,
            pageNumber: imagesToProcess.length > 1 ? i + 1 : undefined,
          }]);

          // Add delay between requests to avoid rate limiting (2 seconds)
          if (i < imagesToProcess.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error: any) {
          if (error.message === 'Rate limited' || error.message === 'No credits') {
            throw error; // Stop processing this file
          }
          extractedTexts.push(`[Page ${i + 1} failed]`);
        }
      }

      const combinedText = extractedTexts.join('\n\n--- Page Break ---\n\n');
      
      setFileQueue(prev => prev.map(f => 
        f.id === queuedFile.id 
          ? { ...f, status: 'completed' as const, extractedText: combinedText, progress: undefined }
          : f
      ));

      URL.revokeObjectURL(fileUrl);
    } catch (error: any) {
      setFileQueue(prev => prev.map(f => 
        f.id === queuedFile.id 
          ? { ...f, status: 'failed' as const, error: error.message || 'Processing failed', progress: undefined }
          : f
      ));
    }
  };

  const handleRemoveImage = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setSelectedFile(null);
    setImageUrl('');
    setExtractedText('');
    setIsBatchMode(false);
    setFileQueue([]);
    setPreviewItems([]);
  };

  const handleRemoveFromQueue = (id: string) => {
    setFileQueue(prev => prev.filter(f => f.id !== id));
    setPreviewItems(prev => prev.filter(p => !p.id.startsWith(id)));
  };

  const handleClearQueue = () => {
    setFileQueue([]);
    setPreviewItems([]);
    setIsBatchMode(false);
  };

  const handleDownload = async () => {
    try {
      toast({
        title: "Generating document...",
        description: "Your DOC file is being created",
      });

      await generateAndDownloadDoc(extractedText, 'bengali-ocr-result.docx');

      toast({
        title: "Download complete",
        description: "Your document has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Unable to generate the document",
        variant: "destructive",
      });
    }
  };

  const handleDownloadAll = async () => {
    const completedFiles = fileQueue.filter(f => f.status === 'completed' && f.extractedText);
    
    if (completedFiles.length === 0) {
      toast({
        title: "No files to download",
        description: "No completed files found",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Generating documents...",
        description: `Creating ${completedFiles.length} files...`,
      });

      const zip = new JSZip();
      
      for (const file of completedFiles) {
        const fileName = file.file.name.replace(/\.[^/.]+$/, '') + '.docx';
        const result = await generateAndDownloadDoc(file.extractedText!, fileName, true);
        if (result instanceof Blob) {
          zip.file(fileName, result);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'bengali-ocr-results.zip');

      toast({
        title: "Download complete",
        description: `${completedFiles.length} documents packaged in ZIP`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Unable to generate documents",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Bengali OCR
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Extract Bengali text from images and PDFs with formatting and table preservation
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {!selectedFile && !isBatchMode && (
            <FileUpload 
              onFileSelect={handleFileSelect} 
              onFolderSelect={handleFolderSelect}
            />
          )}

          {selectedFile && imageUrl && !isBatchMode && (
            <ImagePreview imageUrl={imageUrl} onRemove={handleRemoveImage} />
          )}

          {isBatchMode && (
            <>
              <FileQueue 
                files={fileQueue} 
                onRemove={handleRemoveFromQueue}
                onClear={handleClearQueue}
              />
              
              {fileQueue.some(f => f.status === 'completed') && (
                <div className="flex justify-end">
                  <Button 
                    onClick={handleDownloadAll}
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download All ({fileQueue.filter(f => f.status === 'completed').length} files)
                  </Button>
                </div>
              )}

              <PreviewGallery items={previewItems} />
            </>
          )}

          {isProcessing && !isBatchMode && (
            <ProcessingState current={progress.current} total={progress.total} />
          )}

          {!isProcessing && extractedText && !isBatchMode && (
            <ResultsDisplay 
              extractedText={extractedText} 
              onDownload={handleDownload}
              disabled={!extractedText}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
