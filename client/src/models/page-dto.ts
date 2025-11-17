import { PageType } from './page-type';

/**
 * Page Data Transfer Object
 */
export interface PageDto {
  /**
   * Unique identifier
   */
  id: string;
  
  /**
   * Page type
   */
  type: PageType;
  
  /**
   * Page title
   */
  title: string;
  
  /**
   * Page body
   */
  body: string;
  
  /**
   * Page JSON data
   * Can be used to store additional information related to the page
   */
  jsonData: string;
  
  /**
   * When the entity was created (in UTC)
   */
  createdAtUtc: string;
  
  /**
   * Created by user identifier
   */
  createdBy: string;
  
  /**
   * Updated by user identifier
   */
  updatedBy?: string | null;
  
  /**
   * When the entity was last updated (in UTC)
   */
  updatedAtUtc?: string | null;
}

