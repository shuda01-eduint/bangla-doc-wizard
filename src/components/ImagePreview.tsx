import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImagePreviewProps {
  imageUrl: string;
  onRemove: () => void;
}

export const ImagePreview = ({ imageUrl, onRemove }: ImagePreviewProps) => {
  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-card border border-border shadow-soft">
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-4 right-4 z-10 rounded-full shadow-medium"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
      <img
        src={imageUrl}
        alt="Uploaded document"
        className="w-full h-auto max-h-[500px] object-contain"
      />
    </div>
  );
};
