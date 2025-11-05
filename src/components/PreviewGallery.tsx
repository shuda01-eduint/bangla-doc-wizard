import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Image as ImageIcon } from 'lucide-react';

interface PreviewItem {
  id: string;
  fileName: string;
  imageUrl?: string;
  extractedText: string;
  pageNumber?: number;
}

interface PreviewGalleryProps {
  items: PreviewItem[];
}

export const PreviewGallery = ({ items }: PreviewGalleryProps) => {
  if (items.length === 0) return null;

  return (
    <Card className="p-6 bg-card border-border shadow-soft">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Processed Results</h3>
        <span className="text-sm text-muted-foreground">({items.length} items)</span>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-6">
          {items.map((item) => (
            <div key={item.id} className="border border-border rounded-lg overflow-hidden">
              <div className="bg-secondary/50 px-4 py-2 border-b border-border">
                <p className="text-sm font-medium text-foreground">
                  {item.fileName}
                  {item.pageNumber && ` - Page ${item.pageNumber}`}
                </p>
              </div>

              <Tabs defaultValue="text" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b">
                  <TabsTrigger value="text" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Extracted Text
                  </TabsTrigger>
                  {item.imageUrl && (
                    <TabsTrigger value="image" className="gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Original Image
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="text" className="p-4">
                  <ScrollArea className="h-[300px]">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
                      {item.extractedText || 'No text extracted'}
                    </pre>
                  </ScrollArea>
                </TabsContent>

                {item.imageUrl && (
                  <TabsContent value="image" className="p-4">
                    <img
                      src={item.imageUrl}
                      alt={`Preview of ${item.fileName}`}
                      className="w-full h-auto max-h-[300px] object-contain rounded border border-border"
                    />
                  </TabsContent>
                )}
              </Tabs>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
