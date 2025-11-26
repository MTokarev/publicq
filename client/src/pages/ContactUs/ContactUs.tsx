import React, { useState, useEffect } from 'react';
import { PageService } from '../../services/pageService';
import { ContactPageDto } from '../../models/contact-page-dto';
import { PageType } from '../../models/page-type';
import { GenericOperationStatuses } from '../../models/GenericOperationStatuses';
import contactStyles from './ContactUs.module.css';

const ContactUs: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [contactPage, setContactPage] = useState<ContactPageDto | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadContactPage();
  }, []);

  const loadContactPage = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await PageService.getPageFromFile(PageType.Contact);
      // Handle both PascalCase (from JSON) and camelCase property names
      const jsonDataString = (data as any).JsonData || data.jsonData;
      const parts = jsonDataString ? JSON.parse(jsonDataString) : { email: '', phone: '', address: '' };
      
      // Normalize to camelCase
      const normalizedData: ContactPageDto = {
        id: (data as any).Id || data.id || '',
        type: (data as any).Type ?? data.type ?? 0,
        title: (data as any).Title || data.title || 'Contact Us',
        body: (data as any).Body || data.body || '',
        jsonData: jsonDataString || '',
        createdAtUtc: (data as any).CreatedAtUtc || data.createdAtUtc || '',
        createdBy: (data as any).CreatedBy || data.createdBy || '',
        updatedBy: (data as any).UpdatedBy || data.updatedBy || null,
        updatedAtUtc: (data as any).UpdatedAtUtc || data.updatedAtUtc || null,
        parts
      };
      
      setContactPage(normalizedData);
    } catch (err: any) {
      setError('Contact information is not available at this time');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={contactStyles.container}>
        <div className={contactStyles.loading}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={contactStyles.container}>
        <div className={contactStyles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={contactStyles.container}>
      <div className={contactStyles.content}>
        <h1 className={contactStyles.title}>{contactPage?.title || 'Contact Us'}</h1>
        
        {contactPage?.body && (
          <div className={contactStyles.bodySection}>
            <p className={contactStyles.description}>{contactPage.body}</p>
          </div>
        )}

        <div className={contactStyles.contactInfo}>
          {contactPage?.parts?.email && (
            <div className={contactStyles.contactItem}>
              <div className={contactStyles.contactIcon}><img src="/images/icons/email.svg" alt="" style={{width: '32px', height: '32px'}} /></div>
              <div className={contactStyles.contactDetails}>
                <h3 className={contactStyles.contactLabel}>Email</h3>
                <a href={`mailto:${contactPage.parts.email}`} className={contactStyles.contactLink}>
                  {contactPage.parts.email}
                </a>
              </div>
            </div>
          )}

          {contactPage?.parts?.phone && (
            <div className={contactStyles.contactItem}>
              <div className={contactStyles.contactIcon}><img src="/images/icons/person.svg" alt="" style={{width: '32px', height: '32px'}} /></div>
              <div className={contactStyles.contactDetails}>
                <h3 className={contactStyles.contactLabel}>Phone</h3>
                <a href={`tel:${contactPage.parts.phone}`} className={contactStyles.contactLink}>
                  {contactPage.parts.phone}
                </a>
              </div>
            </div>
          )}

          {contactPage?.parts?.address && (
            <div className={contactStyles.contactItem}>
              <div className={contactStyles.contactIcon}><img src="/images/icons/navigation.svg" alt="" style={{width: '32px', height: '32px'}} /></div>
              <div className={contactStyles.contactDetails}>
                <h3 className={contactStyles.contactLabel}>Address</h3>
                <p className={contactStyles.contactText}>{contactPage.parts.address}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
