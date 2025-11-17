import { BannerType } from './banner-type';

/**
 * Banner request model for creating and updating banners
 */
export interface BannerRequest {
  /**
   * Banner type
   * @see BannerType
   */
  type: BannerType;

  /**
   * Banner title
   * @maxLength 200 characters
   */
  title: string;

  /**
   * Banner content/message
   * @maxLength 5000 characters
   */
  content: string;

  /**
   * Show banner to authenticated users only
   * @default false
   */
  showToAuthenticatedUsersOnly: boolean;

  /**
   * Can the banner be dismissed by the user
   * @default true
   */
  isDismissible: boolean;

  /**
   * When the banner should start being displayed (UTC)
   */
  startDateUtc: string; // ISO date string

  /**
   * When the banner should stop being displayed (UTC)
   * Optional: null means permanent banner
   */
  endDateUtc?: string | null; // ISO date string
}
