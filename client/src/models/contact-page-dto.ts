import { PageDto } from './page-dto';
import { ContactPageParts } from './contact-page-parts';

/**
 * Contact Page Data Transfer Object
 */
export interface ContactPageDto extends PageDto {
  /**
   * Contact Page Parts
   */
  parts: ContactPageParts;
}

