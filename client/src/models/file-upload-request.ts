export interface FileUploadRequest {
  /**
   * Module identifier to which the static file belongs.
   */
  moduleId: string; // GUID as string

  /**
   * File to be uploaded.
   */
  file?: File; // optional

  /**
   * Indicates if the file is being uploaded at module level (true) or question/answer level (false).
   */
  isModuleLevelFile?: boolean;
}