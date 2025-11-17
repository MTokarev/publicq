/**
 * Utility function to parse and format file upload error messages
 * @param error - The error object from file upload request
 * @param fileName - Optional file name for more specific error messages
 * @returns A user-friendly error message
 */
export const parseFileUploadError = (error: any, fileName?: string): string => {
  if (error.response?.status === 400) {
    const errorResponse = error.response.data;
    
    // Handle file size limit errors specifically
    if (errorResponse?.errors?.['']?.some((msg: string) => msg.includes('Request body too large'))) {
      const sizeMatch = errorResponse.errors[''][0].match(/max request body size is (\d+) bytes/);
      const maxSizeBytes = sizeMatch ? parseInt(sizeMatch[1]) : 0;
      const maxSizeMB = maxSizeBytes > 0 ? (maxSizeBytes / (1024 * 1024)).toFixed(1) : 'unknown';
      
      if (fileName) {
        return `File upload failed: "${fileName}" exceeds the maximum size limit of ${maxSizeMB} MB. Please select a smaller file and try again.`;
      } else {
        return `File upload failed: One or more files exceed the maximum size limit of ${maxSizeMB} MB. Please select smaller files and try again.`;
      }
    } 
    
    // Handle other validation errors
    if (errorResponse?.title === 'One or more validation errors occurred.') {
      const allErrors = Object.values(errorResponse.errors || {}).flat() as string[];
      return `File upload failed: ${allErrors.join(', ')}`;
    }
    
    // Generic 400 error
    return fileName 
      ? `File upload failed for "${fileName}". Please check file size and try again.`
      : 'File upload failed. Please check file sizes and try again.';
  }
  
  // Handle other HTTP errors or network errors
  return error.response?.data?.message || error.message || (fileName 
    ? `File upload failed for "${fileName}". Please try again.`
    : 'File upload failed. Please try again.');
};