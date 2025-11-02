import { useCallback, useState } from 'react';
import { Upload, FileImage } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      
      if (isValidType) {
        onFileSelect(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an image or PDF file",
          variant: "destructive",
        });
      }
    }
  }, [onFileSelect, toast]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      
      if (isValidType) {
        onFileSelect(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an image or PDF file",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-12 text-center
        transition-all duration-300 cursor-pointer
        ${isDragging 
          ? 'border-primary bg-primary/5 scale-[1.02]' 
          : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
        }
      `}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept="image/*,application/pdf"
        onChange={handleFileInput}
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <div className="flex flex-col items-center gap-4">
          <div className={`
            p-6 rounded-full bg-gradient-to-br from-primary/10 to-accent/10
            transition-transform duration-300
            ${isDragging ? 'scale-110' : 'hover:scale-105'}
          `}>
            {isDragging ? (
              <FileImage className="w-12 h-12 text-primary" />
            ) : (
              <Upload className="w-12 h-12 text-primary" />
            )}
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground mb-2">
              {isDragging ? 'Drop your file here' : 'Upload an image or PDF to extract text'}
            </p>
            <p className="text-sm text-muted-foreground">
              Drag and drop or click to browse • Supports images & PDFs • Bengali text extraction
            </p>
          </div>
        </div>
      </label>
    </div>
  );
};
