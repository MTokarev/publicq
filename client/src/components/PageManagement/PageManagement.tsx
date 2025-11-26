import React, { useState, useEffect } from 'react';
import { PageService } from '../../services/pageService';
import { ContactPageDto } from '../../models/contact-page-dto';
import { PageType } from '../../models/page-type';
import { GenericOperationStatuses } from '../../models/GenericOperationStatuses';
import { ContactPageParts } from '../../models/contact-page-parts';
import { PageDto } from '../../models/page-dto';
import { VALIDATION_CONSTRAINTS } from '../../constants/contstants';
import pageManagementStyles from './PageManagement.module.css';

const cn = (...classes: (string | undefined | false)[]): string => 
  classes.filter(Boolean).join(' ');

const PageManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'contact' | 'other'>('contact');
  
  // Contact page state
  const [contactPage, setContactPage] = useState<ContactPageDto | null>(null);
  const [contactParts, setContactParts] = useState<ContactPageParts>({
    email: '',
    phone: '',
    address: ''
  });
  const [pageTitle, setPageTitle] = useState('Contact');
  const [pageBody, setPageBody] = useState('');

  // Load contact page data
  useEffect(() => {
    loadContactPage();
  }, []);

  const loadContactPage = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await PageService.getContactPage();
      if (response.status === GenericOperationStatuses.Completed && response.data) {
        setContactPage(response.data);
        setPageTitle(response.data.title);
        setPageBody(response.data.body);
        // Parse jsonData to get contact parts
        if (response.data.jsonData) {
          try {
            const parsedParts = JSON.parse(response.data.jsonData);
            setContactParts(parsedParts);
          } catch {
            // If parsing fails, use parts property if available
            if (response.data.parts) {
              setContactParts(response.data.parts);
            }
          }
        } else if (response.data.parts) {
          // Fallback to parts property if jsonData is empty
          setContactParts(response.data.parts);
        }
      }
    } catch (err: any) {
      // Silently handle 404 - page doesn't exist yet, user can create it
      if (err.response?.status !== 404) {
        setError('Failed to load contact page: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!pageTitle.trim()) {
      setError('Page title is required');
      return false;
    }
    if (pageTitle.length > VALIDATION_CONSTRAINTS.PAGE.TITLE_MAX_LENGTH) {
      setError(`Page title must not exceed ${VALIDATION_CONSTRAINTS.PAGE.TITLE_MAX_LENGTH} characters`);
      return false;
    }
    if (pageBody.length > VALIDATION_CONSTRAINTS.PAGE.BODY_MAX_LENGTH) {
      setError(`Page body must not exceed ${VALIDATION_CONSTRAINTS.PAGE.BODY_MAX_LENGTH} characters`);
      return false;
    }
    if (!contactParts.email.trim()) {
      setError('Email address is required');
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactParts.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (contactParts.email.length > VALIDATION_CONSTRAINTS.USER.EMAIL_MAX_LENGTH) {
      setError(`Email must not exceed ${VALIDATION_CONSTRAINTS.USER.EMAIL_MAX_LENGTH} characters`);
      return false;
    }
    setError('');
    return true;
  };

  const handleContactPageSave = async () => {
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const pageDto: PageDto = {
        id: contactPage?.id || '',
        type: PageType.Contact,
        title: pageTitle,
        body: pageBody,
        jsonData: JSON.stringify(contactParts),
        createdAtUtc: contactPage?.createdAtUtc || new Date().toISOString(),
        createdBy: contactPage?.createdBy || '',
        updatedBy: contactPage?.updatedBy || null,
        updatedAtUtc: contactPage?.updatedAtUtc || null
      };
      
      const response = await PageService.setPageContent(pageDto);
      if (response.status === GenericOperationStatuses.Completed) {
        setSuccess('Contact page updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
        await loadContactPage();
      } else {
        setError('Failed to update contact page');
      }
    } catch (err: any) {
      setError('Failed to save contact page: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleContactFieldChange = (field: keyof ContactPageParts, value: string) => {
    setContactParts(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={pageManagementStyles.container}>
      <div className={pageManagementStyles.header}>
        <h2 className={pageManagementStyles.title} style={{display: 'flex', alignItems: 'center'}}><img src="/images/icons/clipboard.svg" alt="" style={{width: '28px', height: '28px', marginRight: '10px'}} />Page Management</h2>
        <p className={pageManagementStyles.subtitle}>
          Manage static pages and content across the platform
        </p>
      </div>

      {error && (
        <div className={pageManagementStyles.errorBanner}>
          <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}><img src="/images/icons/warning.svg" alt="" style={{width: '16px', height: '16px'}} /> {error}</span>
          <button onClick={() => setError('')} className={pageManagementStyles.closeBanner}>×</button>
        </div>
      )}

      {success && (
        <div className={pageManagementStyles.successBanner}>
          <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}><img src="/images/icons/check.svg" alt="" style={{width: '16px', height: '16px'}} /> {success}</span>
          <button onClick={() => setSuccess('')} className={pageManagementStyles.closeBanner}>×</button>
        </div>
      )}

      <div className={pageManagementStyles.tabs}>
        <button
          onClick={() => setActiveTab('contact')}
          className={cn(
            pageManagementStyles.tab,
            activeTab === 'contact' && pageManagementStyles.activeTab
          )}
        >
          <img src="/images/icons/chat.svg" alt="" style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle'}} />Contact Page
        </button>
        <button
          onClick={() => setActiveTab('other')}
          className={cn(
            pageManagementStyles.tab,
            activeTab === 'other' && pageManagementStyles.activeTab
          )}
          disabled
        >
          <img src="/images/icons/notepad.svg" alt="" style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle'}} />Other Pages (Coming Soon)
        </button>
      </div>

      <div className={pageManagementStyles.content}>
        {activeTab === 'contact' && (
          <div className={pageManagementStyles.formSection}>
            <h3 className={pageManagementStyles.sectionTitle}>Page Details</h3>
            
            <div className={pageManagementStyles.formGroup}>
              <label className={pageManagementStyles.label}>
                Page Title
                <span className={pageManagementStyles.required}>*</span>
              </label>
              <input
                type="text"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                placeholder="Contact"
                className={pageManagementStyles.input}
              />
            </div>

            <div className={pageManagementStyles.formGroup}>
              <label className={pageManagementStyles.label}>Page Body</label>
              <textarea
                value={pageBody}
                onChange={(e) => setPageBody(e.target.value)}
                placeholder="Enter page content or description..."
                rows={4}
                className={pageManagementStyles.textarea}
              />
            </div>

            <h3 className={pageManagementStyles.sectionTitle}>Contact Information</h3>
            
            <div className={pageManagementStyles.formGroup}>
              <label className={pageManagementStyles.label}>
                Email Address
                <span className={pageManagementStyles.required}>*</span>
              </label>
              <input
                type="email"
                value={contactParts.email}
                onChange={(e) => handleContactFieldChange('email', e.target.value)}
                placeholder="contact@publicq.com"
                className={pageManagementStyles.input}
              />
            </div>

            <div className={pageManagementStyles.formGroup}>
              <label className={pageManagementStyles.label}>Phone Number</label>
              <input
                type="tel"
                value={contactParts.phone}
                onChange={(e) => handleContactFieldChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className={pageManagementStyles.input}
              />
            </div>

            <div className={pageManagementStyles.formGroup}>
              <label className={pageManagementStyles.label}>Physical Address</label>
              <textarea
                value={contactParts.address}
                onChange={(e) => handleContactFieldChange('address', e.target.value)}
                placeholder="123 Main St, City, State, ZIP"
                rows={3}
                className={pageManagementStyles.textarea}
              />
            </div>

            <div className={pageManagementStyles.actions}>
              <button
                onClick={handleContactPageSave}
                disabled={loading}
                className={pageManagementStyles.saveButton}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={loadContactPage}
                disabled={loading}
                className={pageManagementStyles.cancelButton}
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PageManagement;
