import React, { useState, useEffect } from 'react';
import { BannerService } from '../../services/bannerService';
import { BannerResponse } from '../../models/banner-response';
import { BannerRequest } from '../../models/banner-request';
import { BannerType } from '../../models/banner-type';
import { VALIDATION_CONSTRAINTS } from '../../constants/contstants';
import { formatDateToLocal } from '../../utils/dateUtils';
import styles from './BannerManagement.module.css';

// Utility function for conditional class names
const cn = (...classes: (string | undefined | false)[]): string => 
  classes.filter(Boolean).join(' ');

interface CreateBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (banner: BannerRequest) => void;
  loading?: boolean;
  error?: string;
}

interface EditBannerModalProps {
  isOpen: boolean;
  banner: BannerResponse | null;
  onClose: () => void;
  onSave: (bannerId: string, banner: BannerRequest) => void;
  loading?: boolean;
  error?: string;
}

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  banner: BannerResponse | null;
  onClose: () => void;
  onConfirm: (bannerId: string) => void;
}

const CreateBannerModal: React.FC<CreateBannerModalProps> = ({ isOpen, onClose, onSave, loading, error }) => {
  // Get current local time in datetime-local format (YYYY-MM-DDTHH:mm)
  const getLocalDateTimeString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState<BannerRequest>({
    type: BannerType.Message,
    title: '',
    content: '',
    showToAuthenticatedUsersOnly: false,
    isDismissible: true,
    startDateUtc: getLocalDateTimeString(),
    endDateUtc: null,
  });
  const [isPermanent, setIsPermanent] = useState(true);
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});

  const getFieldError = (fieldName: string): string | null => {
    if (!touched[fieldName]) return null;

    switch (fieldName) {
      case 'title':
        if (formData.title.length > VALIDATION_CONSTRAINTS.BANNER.TITLE_MAX_LENGTH) return `Title must be less than ${VALIDATION_CONSTRAINTS.BANNER.TITLE_MAX_LENGTH} characters`;
        break;
      case 'content':
        if (!formData.content.trim()) return 'Content is required';
        if (formData.content.trim().length < 10) return 'Content must be at least 10 characters long';
        if (formData.content.length > VALIDATION_CONSTRAINTS.BANNER.CONTENT_MAX_LENGTH) return `Content must be less than ${VALIDATION_CONSTRAINTS.BANNER.CONTENT_MAX_LENGTH} characters`;
        break;
    }
    return null;
  };

  const isFieldValid = (fieldName: string): boolean => {
    return getFieldError(fieldName) === null;
  };

  useEffect(() => {
    if (isOpen) {
      setFormData({
        type: BannerType.Message,
        title: '',
        content: '',
        showToAuthenticatedUsersOnly: false,
        isDismissible: true,
        startDateUtc: getLocalDateTimeString(),
        endDateUtc: null,
      });
      setIsPermanent(true);
      setTouched({});
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          if (!loading) {
            const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
            document.querySelector(`.${styles.modal} form`)?.dispatchEvent(submitEvent);
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, loading, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert local datetime to UTC ISO string
    const startDateUtc = new Date(formData.startDateUtc).toISOString();
    const endDateUtc = isPermanent || !formData.endDateUtc 
      ? null 
      : new Date(formData.endDateUtc).toISOString();
    
    onSave({
      ...formData,
      startDateUtc,
      endDateUtc,
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create New Banner</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formGroup}>
            <label className={styles.label}>Banner Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as BannerType })}
              className={styles.select}
              required
            >
              <option value={BannerType.Message}>Message</option>
              <option value={BannerType.Warning}>Warning</option>
              <option value={BannerType.Critical}>Critical</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={styles.input}
              style={{
                borderColor: touched.title && !isFieldValid('title') ? '#ef4444' : undefined,
              }}
              maxLength={VALIDATION_CONSTRAINTS.BANNER.TITLE_MAX_LENGTH}
              onBlur={() => setTouched({ ...touched, title: true })}
              placeholder="Enter banner title (optional)"
            />
            <div className={styles.characterCounter} style={{
              color: formData.title.length > VALIDATION_CONSTRAINTS.BANNER.TITLE_MAX_LENGTH * 0.9 ? '#ef4444' : '#6b7280'
            }}>
              {formData.title.length}/{VALIDATION_CONSTRAINTS.BANNER.TITLE_MAX_LENGTH}
            </div>
            {touched.title && getFieldError('title') && (
              <div className={styles.fieldError}>{getFieldError('title')}</div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Content *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className={styles.textarea}
              style={{
                borderColor: touched.content && !isFieldValid('content') ? '#ef4444' : undefined,
              }}
              rows={4}
              maxLength={VALIDATION_CONSTRAINTS.BANNER.CONTENT_MAX_LENGTH}
              onBlur={() => setTouched({ ...touched, content: true })}
              placeholder="Enter banner content"
              required
            />
            <div className={styles.characterCounter} style={{
              color: formData.content.length > VALIDATION_CONSTRAINTS.BANNER.CONTENT_MAX_LENGTH * 0.9 ? '#ef4444' : '#6b7280'
            }}>
              {formData.content.length}/{VALIDATION_CONSTRAINTS.BANNER.CONTENT_MAX_LENGTH}
            </div>
            {touched.content && getFieldError('content') && (
              <div className={styles.fieldError}>{getFieldError('content')}</div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Start Date (UTC) *</label>
            <input
              type="datetime-local"
              value={formData.startDateUtc}
              onChange={(e) => setFormData({ ...formData, startDateUtc: e.target.value })}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isPermanent}
                onChange={(e) => setIsPermanent(e.target.checked)}
                className={styles.checkbox}
              />
              Permanent Banner (no end date)
            </label>
          </div>

          {!isPermanent && (
            <div className={styles.formGroup}>
              <label className={styles.label}>End Date (UTC)</label>
              <input
                type="datetime-local"
                value={formData.endDateUtc || ''}
                onChange={(e) => setFormData({ ...formData, endDateUtc: e.target.value })}
                className={styles.input}
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.showToAuthenticatedUsersOnly}
                onChange={(e) => setFormData({ ...formData, showToAuthenticatedUsersOnly: e.target.checked })}
                className={styles.checkbox}
              />
              Show to authenticated users only
            </label>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.isDismissible}
                onChange={(e) => setFormData({ ...formData, isDismissible: e.target.checked })}
                className={styles.checkbox}
              />
              Allow users to dismiss
            </label>
          </div>

          <div className={styles.keyboardHints}>
            <span className={styles.hintText}><img src="/images/icons/light-bulb.svg" alt="" style={{width: '14px', height: '14px', verticalAlign: 'middle', marginRight: '4px'}} /> <strong>Ctrl+Enter</strong> to save  •  <strong>Esc</strong> to cancel</span>
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton} disabled={loading}>
              {loading ? 'Creating...' : 'Create Banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditBannerModal: React.FC<EditBannerModalProps> = ({ isOpen, banner, onClose, onSave, loading, error }) => {
  const [formData, setFormData] = useState<BannerRequest>({
    type: BannerType.Message,
    title: '',
    content: '',
    showToAuthenticatedUsersOnly: false,
    isDismissible: true,
    startDateUtc: new Date().toISOString().slice(0, 16),
    endDateUtc: null,
  });
  const [isPermanent, setIsPermanent] = useState(true);
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});

  const getFieldError = (fieldName: string): string | null => {
    if (!touched[fieldName]) return null;

    switch (fieldName) {
      case 'title':
        if (formData.title.length > VALIDATION_CONSTRAINTS.BANNER.TITLE_MAX_LENGTH) return `Title must be less than ${VALIDATION_CONSTRAINTS.BANNER.TITLE_MAX_LENGTH} characters`;
        break;
      case 'content':
        if (!formData.content.trim()) return 'Content is required';
        if (formData.content.trim().length < 10) return 'Content must be at least 10 characters long';
        if (formData.content.length > VALIDATION_CONSTRAINTS.BANNER.CONTENT_MAX_LENGTH) return `Content must be less than ${VALIDATION_CONSTRAINTS.BANNER.CONTENT_MAX_LENGTH} characters`;
        break;
    }
    return null;
  };

  const isFieldValid = (fieldName: string): boolean => {
    return getFieldError(fieldName) === null;
  };

  useEffect(() => {
    if (isOpen && banner) {
      // Convert UTC dates to local for display in datetime-local inputs
      const startDate = new Date(banner.startDateUtc.endsWith('Z') ? banner.startDateUtc : banner.startDateUtc + 'Z');
      const localStartDate = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      
      let localEndDate = null;
      if (banner.endDateUtc) {
        const endDate = new Date(banner.endDateUtc.endsWith('Z') ? banner.endDateUtc : banner.endDateUtc + 'Z');
        localEndDate = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
      }
      
      setFormData({
        type: banner.type,
        title: banner.title,
        content: banner.content,
        showToAuthenticatedUsersOnly: banner.showToAuthenticatedUsersOnly,
        isDismissible: banner.isDismissible,
        startDateUtc: localStartDate,
        endDateUtc: localEndDate,
      });
      setIsPermanent(!banner.endDateUtc);
      setTouched({});
    }
  }, [isOpen, banner]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          if (!loading && banner) {
            const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
            document.querySelectorAll(`.${styles.modal} form`)[1]?.dispatchEvent(submitEvent);
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, loading, banner, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (banner) {
      // Convert local datetime to UTC ISO string
      const startDateUtc = new Date(formData.startDateUtc).toISOString();
      const endDateUtc = isPermanent || !formData.endDateUtc 
        ? null 
        : new Date(formData.endDateUtc).toISOString();
      
      onSave(banner.id, {
        ...formData,
        startDateUtc,
        endDateUtc,
      });
    }
  };

  if (!isOpen || !banner) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Edit Banner</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formGroup}>
            <label className={styles.label}>Banner Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as BannerType })}
              className={styles.select}
              required
            >
              <option value={BannerType.Message}>Message</option>
              <option value={BannerType.Warning}>Warning</option>
              <option value={BannerType.Critical}>Critical</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={styles.input}
              style={{
                borderColor: touched.title && !isFieldValid('title') ? '#ef4444' : undefined,
              }}
              maxLength={VALIDATION_CONSTRAINTS.BANNER.TITLE_MAX_LENGTH}
              onBlur={() => setTouched({ ...touched, title: true })}
              placeholder="Enter banner title (optional)"
            />
            <div className={styles.characterCounter} style={{
              color: formData.title.length > VALIDATION_CONSTRAINTS.BANNER.TITLE_MAX_LENGTH * 0.9 ? '#ef4444' : '#6b7280'
            }}>
              {formData.title.length}/{VALIDATION_CONSTRAINTS.BANNER.TITLE_MAX_LENGTH}
            </div>
            {touched.title && getFieldError('title') && (
              <div className={styles.fieldError}>{getFieldError('title')}</div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Content *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className={styles.textarea}
              style={{
                borderColor: touched.content && !isFieldValid('content') ? '#ef4444' : undefined,
              }}
              rows={4}
              maxLength={VALIDATION_CONSTRAINTS.BANNER.CONTENT_MAX_LENGTH}
              onBlur={() => setTouched({ ...touched, content: true })}
              placeholder="Enter banner content"
              required
            />
            <div className={styles.characterCounter} style={{
              color: formData.content.length > VALIDATION_CONSTRAINTS.BANNER.CONTENT_MAX_LENGTH * 0.9 ? '#ef4444' : '#6b7280'
            }}>
              {formData.content.length}/{VALIDATION_CONSTRAINTS.BANNER.CONTENT_MAX_LENGTH}
            </div>
            {touched.content && getFieldError('content') && (
              <div className={styles.fieldError}>{getFieldError('content')}</div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Start Date (UTC) *</label>
            <input
              type="datetime-local"
              value={formData.startDateUtc}
              onChange={(e) => setFormData({ ...formData, startDateUtc: e.target.value })}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isPermanent}
                onChange={(e) => setIsPermanent(e.target.checked)}
                className={styles.checkbox}
              />
              Permanent Banner (no end date)
            </label>
          </div>

          {!isPermanent && (
            <div className={styles.formGroup}>
              <label className={styles.label}>End Date (UTC)</label>
              <input
                type="datetime-local"
                value={formData.endDateUtc || ''}
                onChange={(e) => setFormData({ ...formData, endDateUtc: e.target.value })}
                className={styles.input}
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.showToAuthenticatedUsersOnly}
                onChange={(e) => setFormData({ ...formData, showToAuthenticatedUsersOnly: e.target.checked })}
                className={styles.checkbox}
              />
              Show to authenticated users only
            </label>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.isDismissible}
                onChange={(e) => setFormData({ ...formData, isDismissible: e.target.checked })}
                className={styles.checkbox}
              />
              Allow users to dismiss
            </label>
          </div>

          <div className={styles.keyboardHints}>
            <span className={styles.hintText}><img src="/images/icons/light-bulb.svg" alt="" style={{width: '14px', height: '14px', verticalAlign: 'middle', marginRight: '4px'}} /> <strong>Ctrl+Enter</strong> to save  •  <strong>Esc</strong> to cancel</span>
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, banner, onClose, onConfirm }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          if (banner) {
            onConfirm(banner.id);
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, banner, onClose, onConfirm]);

  if (!isOpen || !banner) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.confirmTitle}>Delete Banner</h2>
        
        <p className={styles.confirmMessage}>
          Are you sure you want to delete the banner "<strong>{banner.title}</strong>"?
          This action cannot be undone.
        </p>
        
        <div className={styles.keyboardHints}>
          <span className={styles.hintText}><img src="/images/icons/light-bulb.svg" alt="" style={{width: '14px', height: '14px', verticalAlign: 'middle', marginRight: '4px'}} /> <strong>Ctrl+Enter</strong> to confirm  •  <strong>Esc</strong> to cancel</span>
        </div>
        
        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
          <button onClick={() => onConfirm(banner.id)} className={styles.deleteButton}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const BannerManagement: React.FC = () => {
  const [banners, setBanners] = useState<BannerResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<BannerResponse | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await BannerService.getAllBanners();
      if (response.isSuccess && response.data) {
        setBanners(response.data);
      } else {
        setError('Failed to load banners');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBanner = async (banner: BannerRequest) => {
    setModalLoading(true);
    setModalError('');
    try {
      const response = await BannerService.createBanner(banner as any);
      if (response.isSuccess) {
        setSuccess('Banner created successfully');
        setIsCreateModalOpen(false);
        loadBanners();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setModalError(response.errors?.join(', ') || 'Failed to create banner');
      }
    } catch (err: any) {
      setModalError(err?.response?.data?.message || 'Failed to create banner');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditBanner = async (bannerId: string, banner: BannerRequest) => {
    setModalLoading(true);
    setModalError('');
    try {
      const response = await BannerService.updateBanner(bannerId, banner as any);
      if (response.isSuccess) {
        setSuccess('Banner updated successfully');
        setIsEditModalOpen(false);
        setSelectedBanner(null);
        loadBanners();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setModalError(response.errors?.join(', ') || 'Failed to update banner');
      }
    } catch (err: any) {
      setModalError(err?.response?.data?.message || 'Failed to update banner');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await BannerService.deleteBanner(bannerId);
      if (response.isSuccess) {
        setSuccess('Banner deleted successfully');
        setIsDeleteModalOpen(false);
        setSelectedBanner(null);
        loadBanners();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to delete banner');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete banner');
    } finally {
      setLoading(false);
    }
  };

  const getBannerTypeLabel = (type: BannerType): string => {
    switch (type) {
      case BannerType.Message:
        return 'Message';
      case BannerType.Warning:
        return 'Warning';
      case BannerType.Critical:
        return 'Critical';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Never';
    return formatDateToLocal(dateString);
  };

  const isActive = (banner: BannerResponse): boolean => {
    const now = new Date();
    const start = new Date(banner.startDateUtc);
    const end = banner.endDateUtc ? new Date(banner.endDateUtc) : null;
    return start <= now && (!end || end >= now);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title} style={{display: 'flex', alignItems: 'center'}}><img src="/images/icons/megaphone.svg" alt="" style={{width: '28px', height: '28px', marginRight: '10px'}} />Banner Management</h2>
        <button onClick={() => setIsCreateModalOpen(true)} className={styles.createButton}>
          Create Banner
        </button>
      </div>

      <div className={styles.infoSection}>
        <div className={styles.infoHeader}>
          <span className={styles.infoIcon}><img src="/images/icons/information.svg" alt="" style={{width: '18px', height: '18px'}} /></span>
          <span className={styles.infoTitle}>Banner Management Information</span>
        </div>
        <div className={styles.infoContent}>
          <p className={styles.infoText}>
            <strong>Banner Types:</strong> Choose from <strong>Message</strong> (informational), <strong>Warning</strong> (important notices), or <strong>Critical</strong> (urgent information). Each type has distinct visual styling.
          </p>
          <p className={styles.infoText}>
            <strong>Title & Content:</strong> Title is limited to 200 characters and displayed prominently. Content can be up to 2000 characters and supports plain text.
          </p>
          <p className={styles.infoText}>
            <strong>Scheduling:</strong> Set a start date (defaults to now) and optionally an end date. Leave end date empty for permanent banners. Banners are only visible between these dates.
          </p>
          <p className={styles.infoText}>
            <strong>Visibility:</strong> Toggle "Show to authenticated users only" to restrict banner visibility to logged-in users. Unchecked means everyone sees it.
          </p>
          <p className={styles.infoText}>
            <strong>Dismissible:</strong> When enabled, users can close the banner (dismissal is stored per-user). When disabled, banner always shows during its active period.
          </p>
          <p className={styles.infoText}>
            <strong>Active Status:</strong> A banner is "Active" when the current time is between start and end dates. Active banners are highlighted with a green border.
          </p>
        </div>
      </div>

      {success && <div className={styles.success}>{success}</div>}
      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading banners...</div>
      ) : (
        <div className={styles.bannersGrid}>
          {banners.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No banners found. Create your first banner to get started.</p>
            </div>
          ) : (
            banners.map((banner) => (
              <div key={banner.id} className={cn(styles.bannerCard, isActive(banner) && styles.activeBanner)}>
                <div className={styles.bannerHeader}>
                  <span className={styles.bannerType}>{getBannerTypeLabel(banner.type)}</span>
                  {isActive(banner) && <span className={styles.activeBadge}>Active</span>}
                </div>
                
                <h3 className={styles.bannerTitle}>{banner.title}</h3>
                <p className={styles.bannerContent}>{banner.content}</p>
                
                <div className={styles.bannerMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Start:</span>
                    <span className={styles.metaValue}>{formatDate(banner.startDateUtc)}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>End:</span>
                    <span className={styles.metaValue}>{formatDate(banner.endDateUtc)}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Dismissible:</span>
                    <span className={styles.metaValue}>{banner.isDismissible ? 'Yes' : 'No'}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Authenticated Only:</span>
                    <span className={styles.metaValue}>{banner.showToAuthenticatedUsersOnly ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                <div className={styles.bannerActions}>
                  <button
                    onClick={() => {
                      setSelectedBanner(banner);
                      setIsEditModalOpen(true);
                    }}
                    className={styles.editButton}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedBanner(banner);
                      setIsDeleteModalOpen(true);
                    }}
                    className={styles.deleteButtonSmall}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <CreateBannerModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setModalError('');
        }}
        onSave={handleCreateBanner}
        loading={modalLoading}
        error={modalError}
      />

      <EditBannerModal
        isOpen={isEditModalOpen}
        banner={selectedBanner}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedBanner(null);
          setModalError('');
        }}
        onSave={handleEditBanner}
        loading={modalLoading}
        error={modalError}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        banner={selectedBanner}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedBanner(null);
        }}
        onConfirm={handleDeleteBanner}
      />
    </div>
  );
};

export default BannerManagement;
