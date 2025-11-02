import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ResultsDisplayProps {
  extractedText: string;
  onDownload: () => void;
}

export const ResultsDisplay = ({ extractedText, onDownload }: ResultsDisplayProps) => {
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Extracted Text</h3>
          </div>
          <Button 
            onClick={onDownload}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            <Download className="w-4 h-4 mr-2" />
            Download DOC
          </Button>
        </div>
        <div className="bg-background rounded-lg p-6 border border-border min-h-[300px] max-h-[600px] overflow-y-auto">
          <pre className="whitespace-pre-wrap font-sans text-foreground leading-relaxed">
            {extractedText || 'No text extracted'}
          </pre>
        </div>
      </Card>
    </div>
  );
};
