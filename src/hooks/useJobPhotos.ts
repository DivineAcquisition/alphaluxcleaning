import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type PhotoType = 'arrival' | 'progress' | 'completion' | 'before' | 'after';

interface JobPhoto {
  id: string;
  photo_url: string;
  photo_type: PhotoType;
  caption?: string;
  uploaded_at: string;
}

export function useJobPhotos() {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadPhotos = async (
    files: File[],
    assignmentId: string,
    photoType: PhotoType = 'progress'
  ): Promise<string[]> => {
    if (files.length === 0) return [];

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${assignmentId}/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('job-photos')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('job-photos')
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          // Store photo metadata
          const { error: dbError } = await supabase
            .from('job_photos')
            .insert({
              assignment_id: assignmentId,
              photo_url: urlData.publicUrl,
              photo_type: photoType,
              created_by: (await supabase.auth.getUser()).data.user?.id || ''
            });

          if (dbError) {
            console.error('Database error:', dbError);
          } else {
            uploadedUrls.push(urlData.publicUrl);
          }
        }
      }

      if (uploadedUrls.length > 0) {
        toast({
          title: "Photos Uploaded",
          description: `Successfully uploaded ${uploadedUrls.length} photo(s)`,
        });
      }

    } catch (error) {
      console.error('Error uploading photos:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload some photos",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }

    return uploadedUrls;
  };

  const getJobPhotos = async (assignmentId: string): Promise<JobPhoto[]> => {
    try {
      const { data, error } = await supabase
        .from('job_photos')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(photo => ({
        ...photo,
        photo_type: photo.photo_type as PhotoType
      }));
    } catch (error) {
      console.error('Error fetching photos:', error);
      return [];
    }
  };

  const deletePhoto = async (photoId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('job_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;
      
      toast({
        title: "Photo Deleted",
        description: "Photo successfully deleted",
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: "Delete Error",
        description: "Failed to delete photo",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    uploadPhotos,
    getJobPhotos,
    deletePhoto,
    uploading
  };
}