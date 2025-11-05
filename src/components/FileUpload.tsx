import { useCallback, useState, useRef } from 'react';
import { Upload, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFolderSelect: (files: File[]) => void;
}

export const FileUpload = ({ onFileSelect, onFolderSelect }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

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
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
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

  const handleFolderInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );
    
    if (validFiles.length === 0) {
      toast({
        title: "No valid files",
        description: "No images or PDFs found in the selected folder",
        variant: "destructive",
      });
      return;
    }

    if (validFiles.length !== files.length) {
      toast({
        title: "Some files skipped",
        description: `${validFiles.length} of ${files.length} files are valid (images/PDFs only)`,
      });
    }

    onFolderSelect(validFiles);
  };

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-12 text-center
        transition-all duration-300
        ${isDragging 
          ? 'border-primary bg-primary/5 scale-[1.02]' 
          : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
        }
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        id="file-upload"
        className="hidden"
        accept="image/*,application/pdf"
        onChange={handleFileInput}
      />
      <input
        ref={folderInputRef}
        type="file"
        id="folder-upload"
        className="hidden"
        {...({ webkitdirectory: '', directory: '' } as any)}
        multiple
        onChange={handleFolderInput}
      />
      
      <div className="flex flex-col items-center gap-6">
        <div className={`
          p-6 rounded-full bg-gradient-to-br from-primary/10 to-accent/10
          transition-transform duration-300
          ${isDragging ? 'scale-110' : 'hover:scale-105'}
        `}>
          <Upload className="w-12 h-12 text-primary" />
        </div>
        
        <div>
          <p className="text-lg font-semibold text-foreground mb-2">
            {isDragging ? 'Drop your file here' : 'Upload files to extract Bengali text'}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Drag and drop or select files/folders • Supports images & PDFs
          </p>
        </div>

        <div className="flex gap-3">
          <label
            htmlFor="file-upload"
            className="cursor-pointer px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-medium hover:opacity-90 transition-opacity shadow-medium flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Select File
          </label>
          
          <label
            htmlFor="folder-upload"
            className="cursor-pointer px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors shadow-medium flex items-center gap-2"
          >
            <FolderOpen className="w-4 h-4" />
            Select Folder
          </label>
        </div>
      </div>
    </div>
  );
};
