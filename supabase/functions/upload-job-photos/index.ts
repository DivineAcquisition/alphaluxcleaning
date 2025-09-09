import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const formData = await req.formData();
    const booking_id = formData.get('booking_id') as string;
    const subcontractor_id = formData.get('subcontractor_id') as string;
    const checkpoint_type = formData.get('checkpoint_type') as string || 'progress';
    const files = formData.getAll('photos') as File[];

    if (!booking_id || !subcontractor_id || files.length === 0) {
      throw new Error('Missing required fields: booking_id, subcontractor_id, or photos');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify booking and subcontractor
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('company_id')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    const { data: subcontractor, error: subError } = await supabaseClient
      .from('subcontractors')
      .select('id, full_name')
      .eq('id', subcontractor_id)
      .single();

    if (subError || !subcontractor) {
      throw new Error('Subcontractor not found');
    }

    const uploadedUrls: string[] = [];
    const company_id = booking.company_id || '550e8400-e29b-41d4-a716-446655440000';

    // Upload each photo to storage
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `${company_id}/${booking_id}/${checkpoint_type}/${crypto.randomUUID()}.${fileExtension}`;
      
      // Convert file to ArrayBuffer
      const fileBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(fileBuffer);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('job-photos')
        .upload(fileName, uint8Array, {
          contentType: file.type || 'image/jpeg',
          duplex: 'half'
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload photo ${i + 1}: ${uploadError.message}`);
      }

      // Get public URL (signed URL for private bucket)
      const { data: urlData } = await supabaseClient.storage
        .from('job-photos')
        .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days

      if (urlData?.signedUrl) {
        uploadedUrls.push(urlData.signedUrl);
      }
    }

    // Check if there's an existing checkpoint to update
    const { data: existingCheckpoint, error: checkpointFindError } = await supabaseClient
      .from('checkpoints')
      .select('*')
      .eq('booking_id', booking_id)
      .eq('subcontractor_id', subcontractor_id)
      .eq('type', checkpoint_type)
      .single();

    if (existingCheckpoint) {
      // Update existing checkpoint with new photos
      const existingPhotos = existingCheckpoint.photos || [];
      const updatedPhotos = [...existingPhotos, ...uploadedUrls];

      const { error: updateError } = await supabaseClient
        .from('checkpoints')
        .update({ photos: updatedPhotos })
        .eq('id', existingCheckpoint.id);

      if (updateError) {
        throw new Error('Failed to update checkpoint with photos');
      }
    } else {
      // Create new checkpoint with photos
      const { error: createError } = await supabaseClient
        .from('checkpoints')
        .insert({
          booking_id,
          subcontractor_id,
          company_id,
          type: checkpoint_type,
          photos: uploadedUrls,
          notes: `Photos uploaded via mobile app - ${new Date().toLocaleString()}`
        });

      if (createError) {
        throw new Error('Failed to create checkpoint with photos');
      }
    }

    // Log the photo upload activity
    await supabaseClient
      .from('order_status_updates')
      .insert({
        order_id: booking_id, // Assuming booking_id is same as order_id for this context
        subcontractor_id,
        status_message: `${subcontractor.full_name} uploaded ${files.length} ${checkpoint_type} photo${files.length > 1 ? 's' : ''}`
      });

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully uploaded ${files.length} photo${files.length > 1 ? 's' : ''}`,
      uploaded_urls: uploadedUrls,
      checkpoint_type,
      count: files.length
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in upload-job-photos:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to upload photos"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);