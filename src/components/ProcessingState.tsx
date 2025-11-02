import { Loader2 } from 'lucide-react';

interface ProcessingStateProps {
  current?: number;
  total?: number;
}

export const ProcessingState = ({ current, total }: ProcessingStateProps) => {
  const showProgress = current && total && total > 0;
  
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent opacity-20 animate-pulse" />
        <Loader2 className="w-16 h-16 text-primary animate-spin absolute inset-0" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {showProgress 
            ? `Processing page ${current} of ${total}...`
            : 'Processing your image...'
          }
        </h3>
        <p className="text-sm text-muted-foreground">
          Extracting Bengali text with formatting and tables
        </p>
        {showProgress && (
          <p className="text-xs text-muted-foreground mt-2">
            Using fast OCR model (Gemini Flash)
          </p>
        )}
      </div>
    </div>
  );
};
