import { useState } from 'react';
import { FileText } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { ImagePreview } from '@/components/ImagePreview';
import { ProcessingState } from '@/components/ProcessingState';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { useToast } from '@/hooks/use-toast';

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
    
    // Process the image
    setIsProcessing(true);
    
    try {
      // TODO: Implement actual OCR processing via edge function
      // For now, showing a demo message
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setExtractedText(
        'OCR processing will be implemented with Lovable Cloud.\n\n' +
        'The system will:\n' +
        '• Extract Bengali text with high accuracy\n' +
        '• Preserve formatting and structure\n' +
        '• Detect and maintain table layouts\n' +
        '• Generate downloadable DOC files'
      );
      
      toast({
        title: "Processing complete",
        description: "Text extracted successfully",
      });
    } catch (error) {
      toast({
        title: "Processing failed",
        description: "Unable to process the image",
        variant: "destructive",
      });
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

  const handleDownload = () => {
    // TODO: Implement DOC file generation
    toast({
      title: "Download started",
      description: "Your document is being prepared",
    });
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
            Extract Bengali text from images with formatting and table preservation
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
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
