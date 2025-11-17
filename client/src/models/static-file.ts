export interface StaticFileDto {
  /**
   * Guid identifier for the static file.
   * @maxLength 50 characters (aligned with backend constraint)
   */
  id: string;
  
  /**
   * URL of the static file.
   * @maxLength 2048 characters (aligned with backend constraint)
   */
  url?: string;
  
  /**
   * Name of the static file.
   * @maxLength 255 characters (aligned with backend constraint)
   */
  name?: string;
  
  /**
   * MIME type of the static file.
   * @maxLength 100 characters (aligned with backend constraint)
   */
  type?: string;
  
  /**
   * Whether this file is module-level or not.
   */
  isModuleLevelFile?: boolean
}