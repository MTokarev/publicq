export interface FileUploadDto {
  content: Uint8Array;
  /**
   * Name of the file being uploaded.
   * @maxLength 255 characters (aligned with backend constraint)
   */
  name: string;
}