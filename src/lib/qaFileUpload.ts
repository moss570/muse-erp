import { supabase } from '@/integrations/supabase/client';

const BUCKET_NAME = 'qa-test-evidence';

/**
 * Upload a photo as evidence for a QA test
 */
export async function uploadQATestPhoto(
  lotId: string,
  testId: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${lotId}/${testId}/photos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload photo: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Upload a document as evidence for a QA test
 */
export async function uploadQATestDocument(
  lotId: string,
  testId: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${Date.now()}-${safeFileName}`;
  const filePath = `${lotId}/${testId}/documents/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload document: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Delete a file from QA test evidence storage
 */
export async function deleteQATestFile(fileUrl: string): Promise<void> {
  // Extract the path from the URL
  const urlParts = fileUrl.split(`${BUCKET_NAME}/`);
  if (urlParts.length < 2) {
    throw new Error('Invalid file URL');
  }

  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Upload multiple photos for a QA test
 */
export async function uploadMultiplePhotos(
  lotId: string,
  testId: string,
  files: File[]
): Promise<string[]> {
  const uploadPromises = files.map((file) =>
    uploadQATestPhoto(lotId, testId, file)
  );
  return Promise.all(uploadPromises);
}

/**
 * Upload multiple documents for a QA test
 */
export async function uploadMultipleDocuments(
  lotId: string,
  testId: string,
  files: File[]
): Promise<string[]> {
  const uploadPromises = files.map((file) =>
    uploadQATestDocument(lotId, testId, file)
  );
  return Promise.all(uploadPromises);
}

/**
 * Get file name from URL
 */
export function getFileNameFromUrl(url: string): string {
  const parts = url.split('/');
  const fileName = parts[parts.length - 1];
  // Remove timestamp prefix if present
  const match = fileName.match(/^\d+-(.+)$/);
  return match ? match[1] : fileName;
}

/**
 * Check if URL is an image
 */
export function isImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some((ext) => lowerUrl.includes(ext));
}

/**
 * Check if URL is a PDF
 */
export function isPdfUrl(url: string): boolean {
  return url.toLowerCase().includes('.pdf');
}
