import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Image, X, FileText, Check } from "lucide-react";
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
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      
      // Validate file type
      if (accept === "image/*" && !file.type.startsWith("image/")) {
        throw new Error("Please select an image file (JPG, PNG, etc.)");
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

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
      toast.success('File uploaded successfully!', {
        description: 'Your file has been saved and is ready to use.',
      });
    } catch (error: any) {
      toast.error('Upload failed', {
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    await handleFileUpload(event.target.files[0]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    onUpload('');
    toast.success('File removed successfully');
  };

  const openFileViewer = () => {
    if (currentUrl) {
      window.open(currentUrl, '_blank');
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="file-upload">{label} {required && <span className="text-destructive">*</span>}</Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      
      {currentUrl ? (
        <Card className="relative border-success/20 bg-success/5 animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Image className="h-8 w-8 text-success" />
                  <div className="absolute -top-1 -right-1 bg-success rounded-full p-0.5">
                    <Check className="h-3 w-3 text-success-foreground" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-success">File uploaded successfully</p>
                  <p className="text-xs text-muted-foreground cursor-pointer hover:text-primary" onClick={openFileViewer}>
                    Click to view file
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card 
          className={`border-dashed border-2 transition-all duration-200 ${
            dragActive 
              ? "border-primary bg-primary/5 scale-[1.02]" 
              : uploading 
                ? "border-muted-foreground/30 bg-muted/30" 
                : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/10"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className={`transition-transform duration-200 ${dragActive ? "scale-110" : ""}`}>
                {uploading ? (
                  <div className="relative">
                    <Upload className="h-12 w-12 text-muted-foreground animate-pulse" />
                    <div className="absolute inset-0 animate-spin">
                      <div className="h-12 w-12 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  </div>
                ) : (
                  <Upload className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              
              <div>
                <p className="text-sm font-medium">
                  {dragActive ? "Drop file here" : "Drop files here or click to upload"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports JPG, PNG files (max 5MB)
                </p>
              </div>
              
              <Button
                variant="outline"
                disabled={uploading}
                onClick={() => document.getElementById('file-upload')?.click()}
                className="transition-all duration-200 hover:scale-105"
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
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
      />
    </div>
  );
}