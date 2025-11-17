import React, { useState } from 'react';
import ReportsSummary from './ReportsSummary';
import UsersReports from './UsersReports';
import cssStyles from './ReportsAnalytics.module.css';

// Utility function for conditional class names
const cn = (...classes: (string | undefined | false)[]): string => 
  classes.filter(Boolean).join(' ');

interface ReportsAnalyticsProps {
  // No props needed for now, but keeping the pattern consistent
}

// Tab interface
interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = () => {
  const [activeTab, setActiveTab] = useState<string>('analytics');

  // Define the tabs
  const tabs: Tab[] = [
    {
      id: 'analytics',
      label: 'Analytics Dashboard',
      content: <ReportsSummary />
    },
    {
      id: 'users',
      label: 'Users & Reports',
      content: <UsersReports />
    }
  ];

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // Get current tab content
  const getCurrentTabContent = () => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    return currentTab?.content || null;
  };

  return (
    <div className={cssStyles.container}>
      {/* Tab Navigation */}
      <div className={cssStyles.tabsContainer}>
        <div className={cssStyles.tabsWrapper}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                cssStyles.tab,
                activeTab === tab.id ? cssStyles.activeTab : cssStyles.inactiveTab
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className={cssStyles.tabsUnderline}>
          <div 
            className={cssStyles.activeTabIndicator}
            style={{
              transform: `translateX(${tabs.findIndex(tab => tab.id === activeTab) * 100}%)`,
              width: `${100 / tabs.length}%`
            }}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className={cssStyles.tabContent}>
        {getCurrentTabContent()}
      </div>
    </div>
  );
};

export default ReportsAnalytics;