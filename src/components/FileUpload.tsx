import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Image, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FileUploadProps {
  onUpload: (url: string) => void;
  currentUrl?: string;
  accept?: string;
  label: string;
  description?: string;
  required?: boolean;
}

export default function FileUpload({ 
  onUpload, 
  currentUrl, 
  accept = "image/*", 
  label, 
  description,
  required = false 
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      onUpload(data.publicUrl);
      toast.success('File uploaded successfully!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    onUpload('');
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="file-upload">{label} {required && '*'}</Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      
      {currentUrl ? (
        <Card className="relative">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium">File uploaded</p>
                  <p className="text-xs text-muted-foreground">Click to view</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Drop files here or click to upload</p>
                <p className="text-xs text-muted-foreground">Supports JPG, PNG files</p>
              </div>
              <Button
                variant="outline"
                disabled={uploading}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <input
        id="file-upload"
        type="file"
        accept={accept}
        onChange={handleFileUpload}
        disabled={uploading}
        className="hidden"
      />
    </div>
  );
}