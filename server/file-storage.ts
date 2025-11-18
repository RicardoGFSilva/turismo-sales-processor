import { storagePut, storageGet } from './storage';

/**
 * Upload a PDF file to S3 and return the path
 */
export async function uploadPDFFile(
  buffer: Buffer,
  filename: string,
  userId: number
): Promise<{ key: string; url: string }> {
  try {
    // Create a unique key with user ID and timestamp
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileKey = `invoices/${userId}/${timestamp}-${sanitizedFilename}`;

    const result = await storagePut(fileKey, buffer, 'application/pdf');
    return result;
  } catch (error) {
    console.error('Error uploading PDF file:', error);
    throw new Error('Failed to upload PDF file');
  }
}

/**
 * Upload an attachment file (voucher, billet, etc.)
 */
export async function uploadAttachmentFile(
  buffer: Buffer,
  filename: string,
  invoiceId: string,
  type: 'voucher' | 'billet'
): Promise<{ key: string; url: string }> {
  try {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileKey = `attachments/${invoiceId}/${type}/${timestamp}-${sanitizedFilename}`;

    // Determine MIME type based on file extension
    let mimeType = 'application/octet-stream';
    if (filename.toLowerCase().endsWith('.pdf')) {
      mimeType = 'application/pdf';
    } else if (filename.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/i)) {
      mimeType = `image/${filename.toLowerCase().split('.').pop()}`;
    }

    const result = await storagePut(fileKey, buffer, mimeType);
    return result;
  } catch (error) {
    console.error('Error uploading attachment file:', error);
    throw new Error('Failed to upload attachment file');
  }
}

/**
 * Get a presigned URL for a file
 */
export async function getFileUrl(fileKey: string): Promise<string> {
  try {
    const result = await storageGet(fileKey);
    return result.url;
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw new Error('Failed to get file URL');
  }
}

/**
 * Delete a file from S3 (if needed in future)
 */
export async function deleteFile(fileKey: string): Promise<void> {
  // Note: This would require additional S3 client setup
  // For now, we'll just log that deletion is not implemented
  console.log(`File deletion not implemented for key: ${fileKey}`);
}
