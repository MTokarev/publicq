import React, { useState, useEffect } from 'react';
import { BannerService } from '../../services/bannerService';
import { BannerResponse } from '../../models/banner-response';
import { BannerType } from '../../models/banner-type';
import { BannerStorageService } from '../../utils/bannerStorage';
import { useAuth } from '../../context/AuthContext';
import styles from './Banner.module.css';

const Banner: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [banners, setBanners] = useState<BannerResponse[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load dismissed banner IDs from localStorage
    setDismissedIds(BannerStorageService.getDismissedBannerIds());

    // Fetch active banners
    loadActiveBanners();
  }, []);

  const loadActiveBanners = async () => {
    setLoading(true);
    try {
      const response = await BannerService.getActiveBanners();
      if (response.isSuccess && response.data) {
        setBanners(response.data);
      }
    } catch (error) {
      console.error('Failed to load banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (bannerId: string) => {
    BannerStorageService.dismissBanner(bannerId);
    setDismissedIds(BannerStorageService.getDismissedBannerIds());
  };

  const getBannerClass = (type: BannerType): string => {
    switch (type) {
      case BannerType.Message:
        return styles.bannerTypeMessage;
      case BannerType.Warning:
        return styles.bannerTypeWarning;
      case BannerType.Critical:
        return styles.bannerTypeCritical;
      default:
        return styles.bannerTypeMessage;
    }
  };

  const getBannerIcon = (type: BannerType): string => {
    switch (type) {
      case BannerType.Message:
        return '📄';
      case BannerType.Warning:
        return '⚠️';
      case BannerType.Critical:
        return '🚨';
      default:
        return '📄';
    }
  };

  // Filter out dismissed banners and apply authentication filter
  const visibleBanners = banners.filter(banner => {
    // Check if dismissed
    if (dismissedIds.includes(banner.id)) {
      return false;
    }
    
    // Check authentication requirement
    if (banner.showToAuthenticatedUsersOnly && !isAuthenticated) {
      return false;
    }
    
    return true;
  });

  if (loading || visibleBanners.length === 0) {
    return null;
  }

  return (
    <div className={styles.bannerContainer}>
      {visibleBanners.map((banner) => (
        <div key={banner.id} className={`${styles.banner} ${getBannerClass(banner.type)}`}>
          <div className={styles.bannerContent}>
            <span className={styles.bannerIcon}>{getBannerIcon(banner.type)}</span>
            <div className={styles.bannerText}>
              {banner.title && <h4 className={styles.bannerTitle}>{banner.title}</h4>}
              <p className={styles.bannerMessageText}>{banner.content}</p>
            </div>
          </div>
          {banner.isDismissible && (
            <button
              onClick={() => handleDismiss(banner.id)}
              className={styles.dismissButton}
              aria-label="Dismiss banner"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default Banner;
