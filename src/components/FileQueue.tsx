import { CheckCircle, XCircle, Loader2, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export type FileStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface QueuedFile {
  id: string;
  file: File;
  status: FileStatus;
  progress?: string;
  extractedText?: string;
  error?: string;
}

interface FileQueueProps {
  files: QueuedFile[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export const FileQueue = ({ files, onRemove, onClear }: FileQueueProps) => {
  if (files.length === 0) return null;

  const statusIcon = (status: FileStatus) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const failedCount = files.filter(f => f.status === 'failed').length;

  return (
    <Card className="p-4 bg-card border-border shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">File Queue</h3>
          <p className="text-sm text-muted-foreground">
            {completedCount} completed · {failedCount} failed · {files.length} total
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onClear}>
          Clear All
        </Button>
      </div>
      
      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {files.map((file) => (
            <div 
              key={file.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors"
            >
              {statusIcon(file.status)}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {file.file.name}
                </p>
                {file.progress && (
                  <p className="text-xs text-muted-foreground">{file.progress}</p>
                )}
                {file.error && (
                  <p className="text-xs text-destructive">{file.error}</p>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onRemove(file.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
