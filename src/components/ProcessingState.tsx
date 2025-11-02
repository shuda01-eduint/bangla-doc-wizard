import { Loader2 } from 'lucide-react';

export const ProcessingState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent opacity-20 animate-pulse" />
        <Loader2 className="w-16 h-16 text-primary animate-spin absolute inset-0" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Processing your image...
        </h3>
        <p className="text-sm text-muted-foreground">
          Extracting Bengali text with formatting and tables
        </p>
      </div>
    </div>
  );
};
