import { useState } from 'react';
import { FileText } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { ImagePreview } from '@/components/ImagePreview';
import { ProcessingState } from '@/components/ProcessingState';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { useToast } from '@/hooks/use-toast';
import { generateAndDownloadDoc } from '@/utils/docGenerator';
import { supabase } from '@/integrations/supabase/client';
import { convertPdfToImages } from '@/utils/pdfConverter';

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
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
      
      // Process all images
      const extractedTexts: string[] = [];
      
      for (let i = 0; i < imagesToProcess.length; i++) {
        console.log(`Processing image ${i + 1} of ${imagesToProcess.length}...`);
        
        const { data, error } = await supabase.functions.invoke('ocr-process', {
          body: { imageData: imagesToProcess[i] }
        });

        if (error) {
          console.error('Supabase function error:', error);
          throw error;
        }

        if (data?.error) {
          console.error('OCR processing error:', data.error);
          throw new Error(data.error);
        }

        extractedTexts.push(data.extractedText || '');
      }

      // Combine all extracted text
      const combinedText = extractedTexts.join('\n\n--- Page Break ---\n\n');
      setExtractedText(combinedText || 'No text found in the document');
      
      toast({
        title: "Processing complete",
        description: `Successfully extracted text from ${imagesToProcess.length} page(s)`,
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
    }
  };

  const handleRemoveImage = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setSelectedFile(null);
    setImageUrl('');
    setExtractedText('');
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
          {!selectedFile && (
            <FileUpload onFileSelect={handleFileSelect} />
          )}

          {selectedFile && imageUrl && (
            <ImagePreview imageUrl={imageUrl} onRemove={handleRemoveImage} />
          )}

          {isProcessing && <ProcessingState />}

          {!isProcessing && extractedText && (
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
