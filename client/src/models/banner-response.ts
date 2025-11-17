import { BannerRequest } from './banner-request';

/**
 * Banner response model (includes audit fields)
 */
export interface BannerResponse extends BannerRequest {
  /**
   * Unique identifier for the banner
   */
  id: string;

  /**
   * User who created the banner
   * @maxLength 200 characters
   */
  createdByUser: string;

  /**
   * User who last updated the banner
   * @maxLength 200 characters
   */
  updatedByUser: string;

  /**
   * When the banner was created (UTC)
   */
  createdAtUtc: string; // ISO date string

  /**
   * When the banner was last updated (UTC)
   */
  updatedAtUtc: string; // ISO date string
}
