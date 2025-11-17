/**
 * Assessment Module Filter
 * Used to filter assessment modules by ID or Title
 */
export interface AssessmentModuleFilter {
  /**
   * Module Id (optional)
   */
  id?: string;
  
  /**
   * Module Title (optional)
   */
  title?: string;
}
