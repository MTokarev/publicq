const DISMISSED_BANNERS_KEY = 'dismissedBannerIds';

export class BannerStorageService {
  /**
   * Get list of dismissed banner IDs from localStorage
   */
  static getDismissedBannerIds(): string[] {
    try {
      const stored = localStorage.getItem(DISMISSED_BANNERS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to parse dismissed banners from localStorage:', error);
    }
    return [];
  }

  /**
   * Add a banner ID to the dismissed list
   */
  static dismissBanner(bannerId: string): void {
    try {
      const currentDismissed = this.getDismissedBannerIds();
      if (!currentDismissed.includes(bannerId)) {
        const updated = [...currentDismissed, bannerId];
        localStorage.setItem(DISMISSED_BANNERS_KEY, JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Failed to dismiss banner:', error);
    }
  }

  /**
   * Check if a banner has been dismissed
   */
  static isBannerDismissed(bannerId: string): boolean {
    const dismissed = this.getDismissedBannerIds();
    return dismissed.includes(bannerId);
  }

  /**
   * Clear all dismissed banner IDs (useful for testing or reset)
   */
  static clearDismissedBanners(): void {
    try {
      localStorage.removeItem(DISMISSED_BANNERS_KEY);
    } catch (error) {
      console.error('Failed to clear dismissed banners:', error);
    }
  }

  /**
   * Remove a specific banner ID from dismissed list (re-show banner)
   */
  static undismissBanner(bannerId: string): void {
    try {
      const currentDismissed = this.getDismissedBannerIds();
      const updated = currentDismissed.filter(id => id !== bannerId);
      localStorage.setItem(DISMISSED_BANNERS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to undismiss banner:', error);
    }
  }
}
