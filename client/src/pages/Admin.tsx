import React, { useEffect, useState } from 'react';
import UserManagement from '../components/UserManagement/UserManagement';
import GroupManagement from '../components/GroupManagement/GroupManagement';
import ModuleManagement from '../components/ModuleManagement/ModuleManagement';
import EmailManagement from '../components/EmailManagement/EmailManagement';
import BannerManagement from '../components/BannerManagement/BannerManagement';
import PageManagement from '../components/PageManagement/PageManagement';
import AiConfiguration from '../components/AiConfiguration/AiConfiguration';
import AiChatDemo from './AiChat';
import TokenManagement from '../components/TokenManagement/TokenManagement';
import PasswordManagement from '../components/PasswordManagement/PasswordManagement';
import UserRegistrationManagement from '../components/UserRegistrationManagement/UserRegistrationManagement';
import CacheManagement from '../components/CacheManagement/CacheManagement';
import FileStorageManagement from '../components/FileStorageManagement/FileStorageManagement';
import LogManagement from '../components/LogManagement/LogManagement';
import IpRateLimiting from '../components/IpRateLimiting/IpRateLimiting';
import AssignmentManagement from '../components/AssignmentManagement/AssignmentManagement';
import ReportsAnalytics from '../components/ReportsAnalytics/ReportsAnalytics';
import { PlatformStatisticService } from '../services/platformStatisticService';
import { User } from '../models/user';
import { Group } from '../models/group';
import { Assignment } from '../models/assignment';
import { AssessmentModuleDto } from '../models/assessment-module';
import { MessageProvider } from '../models/MessageProvider';
import { useAuth } from '../context/AuthContext';
import { UserPolicies } from '../models/user-policy';
import { cn } from '../utils/cn';
import cssStyles from './Admin.module.css';

type AdminSection = 'dashboard' | 'users' | 'groups' | 'assignments' | 'assessments' | 'reports' | 'email' | 'banners' | 'pages' | 'ai' | 'ai-chat' | 'security' | 'cache' | 'storage' | 'logs';

// Animated Counter Component
const AnimatedCounter = ({ target, duration = 1000, delay = 0 }: { target: number; duration?: number; delay?: number }) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const startAnimation = () => {
      setHasStarted(true);
      let startTimestamp: number | null = null;

      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);

        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);

        setCount(Math.floor(easeOutQuart * target));

        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          setCount(target); // Ensure we end exactly at target
        }
      };

      window.requestAnimationFrame(step);
    };

    if (target > 0) {
      if (delay > 0) {
        setTimeout(startAnimation, delay);
      } else {
        startAnimation();
      }
    }
  }, [target, duration, delay]);

  return <span style={{ opacity: hasStarted ? 1 : 0.3, transition: 'opacity 0.3s ease-in-out' }}>{count}</span>;
};

const Admin = () => {
  const { userRoles } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userCount, setUserCount] = useState<number>(0);
  const [groupCount, setGroupCount] = useState<number>(0);
  const [moduleCount, setModuleCount] = useState<number>(0);
  const [assignmentCount, setAssignmentCount] = useState<number>(0);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [dashboardDataLoaded, setDashboardDataLoaded] = useState<boolean>(false);
  const [dashboardLoading, setDashboardLoading] = useState<boolean>(false);
  const [dashboardError, setDashboardError] = useState<string>('');

  // User management state
  const [userManagementData, setUserManagementData] = useState({
    users: [] as User[],
    totalPages: 1,
    currentPage: 1,
    dataLoaded: false,
  });

  // Group management state
  const [groupManagementData, setGroupManagementData] = useState({
    groups: [] as Group[],
    totalPages: 1,
    currentPage: 1,
    dataLoaded: false,
  });

  // Assignment management state
  const [assignmentManagementData, setAssignmentManagementData] = useState({
    assignments: [] as Assignment[],
    totalPages: 1,
    currentPage: 1,
    dataLoaded: false,
  });

  // Module management state
  const [moduleManagementData, setModuleManagementData] = useState({
    modules: [] as AssessmentModuleDto[], // Now using AssessmentModuleDto with latestVersion property
    totalPages: 1,
    currentPage: 1,
    dataLoaded: false,
  });

  // Email configuration
  const [emailOptions, setEmailOptions] = useState({
    enabled: false,
    messageProvider: MessageProvider.Sendgrid,
    sendFrom: '',
    dataLoaded: false,
  });

  // Token configuration
  const [tokenOptions, setTokenOptions] = useState({
    jwtSettings: {
      secret: '',
      issuer: '',
      audience: '',
      tokenExpiryMinutes: undefined as number | undefined,
    } as {
      secret: string;
      issuer: string;
      audience: string;
      tokenExpiryMinutes?: number;
    },
    dataLoaded: false,
  });

  // Password policy configuration
  const [passwordOptions, setPasswordOptions] = useState({
    requiredLength: 6,
    requireDigit: false,
    requireUppercase: false,
    requireLowercase: false,
    requireNonAlphanumeric: false,
    dataLoaded: false,
  });

  // User registration configuration
  const [userRegistrationOptions, setUserRegistrationOptions] = useState({
    enabled: false,
    dataLoaded: false,
  });

  // Cache configuration
  const [cacheOptions, setCacheOptions] = useState({
    enable: false,
    connectionString: '',
    keyPrefix: '',
    reportCacheDurationInMinutes: 60,
    dataLoaded: false,
  });

  // Log configuration
  const [logOptions, setLogOptions] = useState({
    enable: true,
    logLevel: 'Information' as any,
    retentionPeriodInDays: 30,
    dataLoaded: false,
  });

  // File storage configuration
  const [fileStorageOptions, setFileStorageOptions] = useState({
    maxSizeKb: 0, // Start with 0 to show loading state
    dataLoaded: false,
  });

  // Hash-based navigation setup
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) as AdminSection || 'dashboard';
      setActiveSection(hash);
    };

    window.addEventListener('hashchange', handleHashChange);

    // Set initial section from hash on page load
    const initialHash = window.location.hash.slice(1) as AdminSection || 'dashboard';
    setActiveSection(initialHash);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Navigation function
  const navigateToSection = (section: AdminSection) => {
    // Update URL hash (this will trigger handleHashChange)
    window.location.hash = section;
  };

  // Get section display info
  const getSectionInfo = (section: AdminSection) => {
    const sectionMap = {
      dashboard: { title: 'Dashboard', icon: <img src="/images/icons/chart.svg" alt="Dashboard" style={{width: '28px', height: '28px'}} />, description: 'Overview and statistics' },
      users: { title: 'User Management', icon: <img src="/images/icons/users.svg" alt="Users" style={{width: '28px', height: '28px'}} />, description: 'Manage users and permissions' },
      groups: { title: 'Group Management', icon: <img src="/images/icons/users.svg" alt="Groups" style={{width: '28px', height: '28px'}} />, description: 'Organize users into groups' },
      assignments: { title: 'Assignment Management', icon: <img src="/images/icons/clipboard.svg" alt="Assignments" style={{width: '28px', height: '28px'}} />, description: 'Create and manage assignments' },
      assessments: { title: 'Module Management', icon: <img src="/images/icons/books.svg" alt="Modules" style={{width: '28px', height: '28px'}} />, description: 'Manage assessment modules' },
      reports: { title: 'Reports & Analytics', icon: <img src="/images/icons/line-chart.svg" alt="Reports" style={{width: '28px', height: '28px'}} />, description: 'View reports and analytics' },
      email: { title: 'Email Configuration', icon: <img src="/images/icons/chat.svg" alt="Email" style={{width: '28px', height: '28px'}} />, description: 'Configure email settings' },
      banners: { title: 'Banner Management', icon: <img src="/images/icons/megaphone.svg" alt="Banners" style={{width: '28px', height: '28px'}} />, description: 'Manage site-wide banners' },
      pages: { title: 'Page Management', icon: <img src="/images/icons/clipboard.svg" alt="Pages" style={{width: '28px', height: '28px'}} />, description: 'Manage static pages' },
      ai: { title: 'AI Settings', icon: <img src="/images/icons/robot.svg" alt="AI" style={{width: '28px', height: '28px'}} />, description: 'Configure AI Monkey settings' },
      'ai-chat': { title: 'AI Chat', icon: <img src="/images/icons/chat.svg" alt="Chat" style={{width: '28px', height: '28px'}} />, description: 'Chat with AI Monkey' },
      security: { title: 'Security Settings', icon: <img src="/images/icons/lock.svg" alt="Security" style={{width: '28px', height: '28px'}} />, description: 'Manage security and authentication' },
      cache: { title: 'Cache Management', icon: <img src="/images/icons/filing-cabinet.svg" alt="Cache" style={{width: '28px', height: '28px'}} />, description: 'Manage application cache' },
      storage: { title: 'File Storage', icon: <img src="/images/icons/save.svg" alt="Storage" style={{width: '28px', height: '28px'}} />, description: 'Configure file storage settings' },
      logs: { title: 'Log Management', icon: <img src="/images/icons/clipboard.svg" alt="Logs" style={{width: '28px', height: '28px'}} />, description: 'View and manage system logs' },
    };
    return sectionMap[section] || sectionMap.dashboard;
  };

  // Keyboard shortcuts setup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.ctrlKey || e.metaKey)) {
        switch (e.key.toUpperCase()) {
          case 'D':
            // Dashboard is always available
            e.preventDefault();
            navigateToSection('dashboard');
            break;
          case 'U':
            // Users - Admin access required
            if (UserPolicies.hasAdminAccess(userRoles)) {
              e.preventDefault();
              navigateToSection('users');
            }
            break;
          case 'A':
            // Assignments - Admin access required
            if (UserPolicies.hasAdminAccess(userRoles)) {
              e.preventDefault();
              navigateToSection('assignments');
            }
            break;
          case 'M':
            // Modules - Contributor access required
            if (UserPolicies.hasContributorAccess(userRoles)) {
              e.preventDefault();
              navigateToSection('assessments');
            }
            break;
          case 'G':
            // Groups - Contributor access required
            if (UserPolicies.hasContributorAccess(userRoles)) {
              e.preventDefault();
              navigateToSection('groups');
            }
            break;
          case 'E':
            // Email Settings - Admin access required
            if (UserPolicies.hasAdminAccess(userRoles)) {
              e.preventDefault();
              navigateToSection('email');
            }
            break;
          case 'I':
            // AI Settings - Admin access required
            if (UserPolicies.hasAdminAccess(userRoles)) {
              e.preventDefault();
              navigateToSection('ai');
            }
            break;
          case 'K':
            // AI Chat - Admin access required
            if (UserPolicies.hasAdminAccess(userRoles)) {
              e.preventDefault();
              navigateToSection('ai-chat');
            }
            break;
          case 'S':
            // Security Settings - Admin access required
            if (UserPolicies.hasAdminAccess(userRoles)) {
              e.preventDefault();
              navigateToSection('security');
            }
            break;
          case 'C':
            // Cache Settings - Admin access required
            if (UserPolicies.hasAdminAccess(userRoles)) {
              e.preventDefault();
              navigateToSection('cache');
            }
            break;
          case 'F':
            // File Storage Settings - Admin access required
            if (UserPolicies.hasAdminAccess(userRoles)) {
              e.preventDefault();
              navigateToSection('storage');
            }
            break;
          case 'L':
            // Logs - Admin access required
            if (UserPolicies.hasAdminAccess(userRoles)) {
              e.preventDefault();
              navigateToSection('logs');
            }
            break;
          case 'R':
            // Reports & Analytics - Analyst access required
            if (UserPolicies.hasAnalystAccess(userRoles)) {
              e.preventDefault();
              navigateToSection('reports');
            }
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [userRoles]);

  // Fetch dashboard data only once on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!dashboardDataLoaded && !dashboardLoading) {
        setDashboardLoading(true);
        setDashboardError('');

        try {
          // Fetch all dashboard metrics with a single API call
          const response = await PlatformStatisticService.getPlatformStatistics();
          
          if (response.isSuccess && response.data) {
            setUserCount(response.data.totalUsers);
            setGroupCount(response.data.totalGroups);
            setModuleCount(response.data.totalModules);
            setAssignmentCount(response.data.totalAssignments);
            setQuestionCount(response.data.totalQuestions);
            setDashboardDataLoaded(true);
          } else {
            throw new Error('Failed to fetch platform statistics');
          }
        } catch (error) {
          setDashboardError('Failed to load dashboard data. Please try refreshing the page.');
        } finally {
          setDashboardLoading(false);
        }
      }
    };

    fetchDashboardData();
  }, []); // Empty dependency array - only run once on mount

  const renderContent = () => {
    switch (activeSection) {
      case 'users':
        return (
          <UserManagement
            userManagementData={userManagementData}
            setUserManagementData={setUserManagementData}
            currentUserRoles={userRoles}
          />
        );
      case 'groups':
        return (
          <GroupManagement
            groupManagementData={groupManagementData}
            setGroupManagementData={setGroupManagementData}
          />
        );
      case 'assignments':
        return (
          <AssignmentManagement
            assignmentManagementData={assignmentManagementData}
            setAssignmentManagementData={setAssignmentManagementData}
          />
        );
      case 'assessments':
        return (
          <ModuleManagement
            moduleManagementData={moduleManagementData}
            setModuleManagementData={setModuleManagementData}
            onNavigateToGroups={() => navigateToSection('groups')}
          />
        );
      case 'email':
        return (
          <EmailManagement
            emailConfig={emailOptions}
            setEmailConfig={setEmailOptions}
          />
        );
      case 'banners':
        return <BannerManagement />;
      case 'pages':
        return <PageManagement />;
      case 'ai':
        return <AiConfiguration />;
      case 'ai-chat':
        return <AiChatDemo onNavigateToSettings={() => navigateToSection('ai')}  />;
      case 'security':
        return (
          <div>
            <UserRegistrationManagement
              userRegistrationConfig={userRegistrationOptions}
              setUserRegistrationConfig={setUserRegistrationOptions}
            />
            <TokenManagement
              tokenConfig={tokenOptions}
              setTokenConfig={setTokenOptions}
            />
            <PasswordManagement
              passwordConfig={passwordOptions}
              setPasswordConfig={setPasswordOptions}
            />
            <IpRateLimiting />
          </div>
        );
      case 'cache':
        return (
          <CacheManagement
            cacheConfig={cacheOptions}
            setCacheConfig={setCacheOptions}
          />
        );
      case 'storage':
        return (
          <FileStorageManagement
            fileStorageConfig={fileStorageOptions}
            setFileStorageConfig={setFileStorageOptions}
          />
        );
      case 'logs':
        return (
          <LogManagement 
            logConfig={logOptions}
            setLogConfig={setLogOptions}
          />
        );
      case 'dashboard':
        return <DashboardContent
          userCount={userCount}
          groupCount={groupCount}
          moduleCount={moduleCount}
          assignmentCount={assignmentCount}
          questionCount={questionCount}
          loading={dashboardLoading}
          error={dashboardError}
          onNavigate={navigateToSection}
        />;
      case 'reports':
        return <ReportsAnalytics />;
      default:
        return <DashboardContent
          userCount={userCount}
          groupCount={groupCount}
          moduleCount={moduleCount}
          assignmentCount={assignmentCount}
          questionCount={questionCount}
          loading={dashboardLoading}
          error={dashboardError}
          onNavigate={navigateToSection}
        />;
    }
  };

  return (
    <div className={cssStyles.container}>
      <div className={cssStyles.sidebar}>
        <nav className={cssStyles.nav}>
          <button
            onClick={() => navigateToSection('dashboard')}
            className={cn(cssStyles.navButton, {
              [cssStyles.activeNavButton]: activeSection === 'dashboard'
            })}
          >
            <img src="/images/icons/chart.svg" alt="" style={{width: '16px', height: '16px', marginRight: '8px'}} /> Dashboard
          </button>
          {UserPolicies.hasAdminAccess(userRoles) && (
            <button
              onClick={() => navigateToSection('ai')}
              className={cn(cssStyles.navButton, {
                [cssStyles.activeNavButton]: activeSection === 'ai'
              })}
            >
              <img src="/images/icons/robot.svg" alt="" style={{width: '16px', height: '16px', marginRight: '8px'}} /> AI Settings
            </button>
          )}
          {UserPolicies.hasContributorAccess(userRoles) && (
            <button
              onClick={() => navigateToSection('ai-chat')}
              className={cn(cssStyles.navButton, {
                [cssStyles.activeNavButton]: activeSection === 'ai-chat'
              })}
            >
              <img src="/images/icons/chat.svg" alt="" style={{width: '16px', height: '16px', marginRight: '8px'}} /> AI Chat
            </button>
          )}
          {UserPolicies.hasManagerAccess(userRoles) && (
            <button
              onClick={() => navigateToSection('assignments')}
              className={cn(cssStyles.navButton, {
                [cssStyles.activeNavButton]: activeSection === 'assignments'
              })}
            >
              <img src="/images/icons/clipboard.svg" alt="" style={{width: '16px', height: '16px', marginRight: '8px'}} /> Assignments
            </button>
          )}
          {UserPolicies.hasManagerAccess(userRoles) && (
            <button
              onClick={() => navigateToSection('banners')}
              className={cn(cssStyles.navButton, {
                [cssStyles.activeNavButton]: activeSection === 'banners'
              })}
            >
              <img src="/images/icons/megaphone.svg" alt="" style={{width: '16px', height: '16px', marginRight: '8px'}} /> Banners
            </button>
          )}
          {UserPolicies.hasManagerAccess(userRoles) && (
            <button
              onClick={() => navigateToSection('pages')}
              className={cn(cssStyles.navButton, {
                [cssStyles.activeNavButton]: activeSection === 'pages'
              })}
            >
              <img src="/images/icons/clipboard.svg" alt="" style={{width: '16px', height: '16px', marginRight: '8px'}} /> Pages
            </button>
          )}
          {UserPolicies.hasAdminAccess(userRoles) && (
            <button
              onClick={() => navigateToSection('cache')}
              className={cn(cssStyles.navButton, {
                [cssStyles.activeNavButton]: activeSection === 'cache'
              })}
            >
              <img src="/images/icons/filing-cabinet.svg" alt="" style={{width: '16px', height: '16px', marginRight: '8px'}} /> Cache
            </button>
          )}
          {UserPolicies.hasAdminAccess(userRoles) && (
            <button
              onClick={() => navigateToSection('email')}
              className={cn(cssStyles.navButton, {
                [cssStyles.activeNavButton]: activeSection === 'email'
              })}
            >
              <img src="/images/icons/chat.svg" alt="" style={{width: '16px', height: '16px', marginRight: '8px'}} /> Email
            </button>
          )}
          {UserPolicies.hasAdminAccess(userRoles) && (
            <button
              onClick={() => navigateToSection('storage')}
              className={cn(cssStyles.navButton, {
                [cssStyles.activeNavButton]: activeSection === 'storage'
              })}
            >
              <img src="/images/icons/save.svg" alt="" style={{width: '16px', height: '16px', marginRight: '8px'}} /> File Storage
            </button>
          )}
          {UserPolicies.hasContributorAccess(userRoles) && (
            <button
              onClick={() => navigateToSection('groups')}
              className={cn(cssStyles.navButton, {
                [cssStyles.activeNavButton]: activeSection === 'groups'
              })}
            >
              <img src="/images/icons/users.svg" alt="" style={{width: '16px', height: '16px', marginRight: '8px'}} /> Groups
            </button>
          )}
          {UserPolicies.hasAdminAccess(userRoles) && (
            <button
              onClick={() => navigateToSection('logs')}
              className={cn(cssStyles.navButton, {
                [cssStyles.activeNavButton]: activeSection === 'logs'
              })}
            >
              <img src="/images/icons/clipboard.svg" alt="" style={{width: '16px', height: '16px', marginRight: '8px'}} /> Logs
            </button>
          )}
          {UserPolicies.hasContributorAccess(userRoles) && (
            <button
              onClick={() => navigateToSection('assessments')}
              className={cn(cssStyles.navButton, {
                [cssStyles.activeNavButton]: activeSection === 'assessments'
              })}
            >
              <img src="/images/icons/books.svg" alt="" style={{width: '16px', height: '16px', marginRight: '8px'}} /> Modules
            </button>
          )}
          {UserPolicies.hasManagerAccess(userRoles) && (
            <button
              onClick={() => navigateToSection('reports')}
              className={cn(cssStyles.navButton, {
                [cssStyles.activeNavButton]: activeSection === 'reports'
              })}
            >
              <img src="/images/icons/line-chart.svg" alt="" style={{width: '16px', height: '16px', marginRight: '8px'}} /> Reports & Analytics
            </button>
          )}
          {UserPolicies.hasAdminAccess(userRoles) && (
            <button
              onClick={() => navigateToSection('security')}
              className={cn(cssStyles.navButton, {
                [cssStyles.activeNavButton]: activeSection === 'security'
              })}
            >
              <img src="/images/icons/lock.svg" alt="" style={{width: '16px', height: '16px', marginRight: '8px'}} /> Security
            </button>
          )}
          {UserPolicies.hasManagerAccess(userRoles) && (
            <button
              onClick={() => navigateToSection('users')}
              className={cn(cssStyles.navButton, {
                [cssStyles.activeNavButton]: activeSection === 'users'
              })}
            >
              <img src="/images/icons/users.svg" alt="" style={{width: '16px', height: '16px', marginRight: '8px'}} /> Users
            </button>
          )}
        </nav>
      </div>
      
      {/* Section Header */}
      <div className={cssStyles.sectionHeader}>
        <div className={cssStyles.sectionInfo}>
          <div className={cssStyles.sectionText}>
            <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
              {getSectionInfo(activeSection).title} {getSectionInfo(activeSection).icon}
            </h2>
            <p className={cssStyles.sectionDescription}>{getSectionInfo(activeSection).description}</p>
          </div>
        </div>
        
        {/* Section Dropdown for Quick Navigation */}
        <div className={cssStyles.sectionDropdown} style={{ position: 'relative' }}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cssStyles.sectionSelectButton}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '12px', background: 'white', cursor: 'pointer', minWidth: '250px' }}
          >
            {getSectionInfo(activeSection).icon}
            <span style={{ flex: 1, textAlign: 'left' }}>{getSectionInfo(activeSection).title}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.5 }}>
              <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          {isDropdownOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ccc', borderRadius: '12px', marginTop: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 1000, maxHeight: '400px', overflowY: 'auto' }}>
              <button
                onClick={() => { navigateToSection('dashboard'); setIsDropdownOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%', border: 'none', background: activeSection === 'dashboard' ? '#f0f0f0' : 'white', cursor: 'pointer', textAlign: 'left' }}
              >
                {getSectionInfo('dashboard').icon}
                <span>Dashboard</span>
              </button>
              {UserPolicies.hasAdminAccess(userRoles) && (
                <button
                  onClick={() => { navigateToSection('ai'); setIsDropdownOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%', border: 'none', background: activeSection === 'ai' ? '#f0f0f0' : 'white', cursor: 'pointer', textAlign: 'left' }}
                >
                  {getSectionInfo('ai').icon}
                  <span>AI Settings</span>
                </button>
              )}
              {UserPolicies.hasContributorAccess(userRoles) && (
                <button
                  onClick={() => { navigateToSection('ai-chat'); setIsDropdownOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%', border: 'none', background: activeSection === 'ai-chat' ? '#f0f0f0' : 'white', cursor: 'pointer', textAlign: 'left' }}
                >
                  {getSectionInfo('ai-chat').icon}
                  <span>AI Chat</span>
                </button>
              )}
              {UserPolicies.hasManagerAccess(userRoles) && (
                <button
                  onClick={() => { navigateToSection('assignments'); setIsDropdownOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%', border: 'none', background: activeSection === 'assignments' ? '#f0f0f0' : 'white', cursor: 'pointer', textAlign: 'left' }}
                >
                  {getSectionInfo('assignments').icon}
                  <span>Assignments</span>
                </button>
              )}
              {UserPolicies.hasManagerAccess(userRoles) && (
                <button
                  onClick={() => { navigateToSection('banners'); setIsDropdownOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%', border: 'none', background: activeSection === 'banners' ? '#f0f0f0' : 'white', cursor: 'pointer', textAlign: 'left' }}
                >
                  {getSectionInfo('banners').icon}
                  <span>Banners</span>
                </button>
              )}
              {UserPolicies.hasManagerAccess(userRoles) && (
                <button
                  onClick={() => { navigateToSection('pages'); setIsDropdownOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%', border: 'none', background: activeSection === 'pages' ? '#f0f0f0' : 'white', cursor: 'pointer', textAlign: 'left' }}
                >
                  {getSectionInfo('pages').icon}
                  <span>Pages</span>
                </button>
              )}
              {UserPolicies.hasAdminAccess(userRoles) && (
                <button
                  onClick={() => { navigateToSection('cache'); setIsDropdownOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%', border: 'none', background: activeSection === 'cache' ? '#f0f0f0' : 'white', cursor: 'pointer', textAlign: 'left' }}
                >
                  {getSectionInfo('cache').icon}
                  <span>Cache</span>
                </button>
              )}
              {UserPolicies.hasAdminAccess(userRoles) && (
                <button
                  onClick={() => { navigateToSection('email'); setIsDropdownOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%', border: 'none', background: activeSection === 'email' ? '#f0f0f0' : 'white', cursor: 'pointer', textAlign: 'left' }}
                >
                  {getSectionInfo('email').icon}
                  <span>Email</span>
                </button>
              )}
              {UserPolicies.hasAdminAccess(userRoles) && (
                <button
                  onClick={() => { navigateToSection('storage'); setIsDropdownOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%', border: 'none', background: activeSection === 'storage' ? '#f0f0f0' : 'white', cursor: 'pointer', textAlign: 'left' }}
                >
                  {getSectionInfo('storage').icon}
                  <span>File Storage</span>
                </button>
              )}
              {UserPolicies.hasContributorAccess(userRoles) && (
                <button
                  onClick={() => { navigateToSection('groups'); setIsDropdownOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%', border: 'none', background: activeSection === 'groups' ? '#f0f0f0' : 'white', cursor: 'pointer', textAlign: 'left' }}
                >
                  {getSectionInfo('groups').icon}
                  <span>Groups</span>
                </button>
              )}
              {UserPolicies.hasAdminAccess(userRoles) && (
                <button
                  onClick={() => { navigateToSection('logs'); setIsDropdownOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%', border: 'none', background: activeSection === 'logs' ? '#f0f0f0' : 'white', cursor: 'pointer', textAlign: 'left' }}
                >
                  {getSectionInfo('logs').icon}
                  <span>Logs</span>
                </button>
              )}
              {UserPolicies.hasContributorAccess(userRoles) && (
                <button
                  onClick={() => { navigateToSection('assessments'); setIsDropdownOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%', border: 'none', background: activeSection === 'assessments' ? '#f0f0f0' : 'white', cursor: 'pointer', textAlign: 'left' }}
                >
                  {getSectionInfo('assessments').icon}
                  <span>Modules</span>
                </button>
              )}
              {UserPolicies.hasManagerAccess(userRoles) && (
                <button
                  onClick={() => { navigateToSection('reports'); setIsDropdownOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%', border: 'none', background: activeSection === 'reports' ? '#f0f0f0' : 'white', cursor: 'pointer', textAlign: 'left' }}
                >
                  {getSectionInfo('reports').icon}
                  <span>Reports & Analytics</span>
                </button>
              )}
              {UserPolicies.hasAdminAccess(userRoles) && (
                <button
                  onClick={() => { navigateToSection('security'); setIsDropdownOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%', border: 'none', background: activeSection === 'security' ? '#f0f0f0' : 'white', cursor: 'pointer', textAlign: 'left' }}
                >
                  {getSectionInfo('security').icon}
                  <span>Security</span>
                </button>
              )}
              {UserPolicies.hasManagerAccess(userRoles) && (
                <button
                  onClick={() => { navigateToSection('users'); setIsDropdownOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%', border: 'none', background: activeSection === 'users' ? '#f0f0f0' : 'white', cursor: 'pointer', textAlign: 'left' }}
                >
                  {getSectionInfo('users').icon}
                  <span>Users</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className={cssStyles.content}>
        {renderContent()}
      </div>
    </div>
  );
};

const DashboardContent = ({
  userCount,
  groupCount,
  moduleCount,
  assignmentCount,
  questionCount,
  loading,
  error,
  onNavigate
}: {
  userCount: number;
  groupCount: number;
  moduleCount: number;
  assignmentCount: number;
  questionCount: number;
  loading: boolean;
  error: string;
  onNavigate: (section: AdminSection) => void;
}) => {
  const { userRoles } = useAuth();
  // Add CSS animation keyframes to the document
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (loading) {
    return (
      <div className={cssStyles.dashboardContainer}>
        <h2 className={cssStyles.dashboardTitle} style={{display: 'flex', alignItems: 'center'}}><img src="/images/icons/chart.svg" alt="" style={{width: '28px', height: '28px', marginRight: '10px'}} />Admin Dashboard</h2>
        <div className={cssStyles.loadingContainer}>
          <p className={cssStyles.loadingText}>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cssStyles.dashboardContainer}>
        <h2 className={cssStyles.dashboardTitle} style={{display: 'flex', alignItems: 'center'}}><img src="/images/icons/chart.svg" alt="" style={{width: '28px', height: '28px', marginRight: '10px'}} />Admin Dashboard</h2>
        <div className={cssStyles.errorContainer}>
          <p className={cssStyles.errorText}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cssStyles.dashboardContainer}>
      <h2 className={cssStyles.dashboardTitle} style={{display: 'flex', alignItems: 'center'}}><img src="/images/icons/chart.svg" alt="" style={{width: '28px', height: '28px', marginRight: '10px'}} />Admin Dashboard</h2>
      <div className={cssStyles.statsGrid}>
        <div
          className={cssStyles.statCard}
          style={{ animationDelay: '0.1s' }}
        >
          <h3>Users</h3>
          <p className={cssStyles.statNumber}>
            <AnimatedCounter target={userCount} duration={1000} delay={100} />
          </p>
        </div>
        <div
          className={cssStyles.statCard}
          style={{ animationDelay: '0.2s' }}
        >
          <h3>Groups</h3>
          <p className={cssStyles.statNumber} style={{ color: '#28a745' }}>
            <AnimatedCounter target={groupCount} duration={1000} delay={300} />
          </p>
        </div>
        <div
          className={cssStyles.statCard}
          style={{ animationDelay: '0.3s' }}
        >
          <h3>Assignments</h3>
          <p className={cssStyles.statNumber} style={{ color: '#a855f7' }}>
            <AnimatedCounter target={assignmentCount} duration={1000} delay={500} />
          </p>
        </div>
        <div
          className={cssStyles.statCard}
          style={{ animationDelay: '0.4s' }}
        >
          <h3>Modules</h3>
          <p className={cssStyles.statNumber} style={{ color: '#ffc107' }}>
            <AnimatedCounter target={moduleCount} duration={1000} delay={700} />
          </p>
        </div>
        <div
          className={cssStyles.statCard}
          style={{ animationDelay: '0.5s' }}
        >
          <h3>Questions</h3>
          <p className={cssStyles.statNumber} style={{ color: '#dc3545' }}>
            <AnimatedCounter target={questionCount} duration={1000} delay={900} />
          </p>
        </div>
      </div>
      <div className={cssStyles.welcomeMessage}>
        <p>Welcome to the PublicQ Admin Panel. Use the navigation menu on the left to manage different aspects of the system.</p>
        <div className={cssStyles.statisticsNote}>
          <p className={cssStyles.statisticsNoteText}>
            <img src="/images/icons/information.svg" alt="Info" className={cssStyles.infoIcon} style={{width: '16px', height: '16px'}} />
            Statistics are updated periodically and may not reflect real-time changes.
          </p>
        </div>
        <div className={cssStyles.shortcutsSection}>
          <div className={cssStyles.shortcutsHeader}>
            <span className={cssStyles.shortcutsTitle}>Keyboard Shortcuts</span>
          </div>
          <div className={cssStyles.shortcutsList}>
            <div className={cssStyles.shortcutItem}>
              <span className={cssStyles.shortcutKeys}>Ctrl+Shift+D</span>
              <span className={cssStyles.shortcutLabel}>Dashboard</span>
            </div>
            {UserPolicies.hasManagerAccess(userRoles) && (
              <div className={cssStyles.shortcutItem}>
                <span className={cssStyles.shortcutKeys}>Ctrl+Shift+U</span>
                <span className={cssStyles.shortcutLabel}>Users</span>
              </div>
            )}
            {UserPolicies.hasManagerAccess(userRoles) && (
              <div className={cssStyles.shortcutItem}>
                <span className={cssStyles.shortcutKeys}>Ctrl+Shift+A</span>
                <span className={cssStyles.shortcutLabel}>Assignments</span>
              </div>
            )}
            {UserPolicies.hasContributorAccess(userRoles) && (
              <div className={cssStyles.shortcutItem}>
                <span className={cssStyles.shortcutKeys}>Ctrl+Shift+M</span>
                <span className={cssStyles.shortcutLabel}>Modules</span>
              </div>
            )}
            {UserPolicies.hasContributorAccess(userRoles) && (
              <div className={cssStyles.shortcutItem}>
                <span className={cssStyles.shortcutKeys}>Ctrl+Shift+G</span>
                <span className={cssStyles.shortcutLabel}>Groups</span>
              </div>
            )}
            {UserPolicies.hasAdminAccess(userRoles) && (
              <div className={cssStyles.shortcutItem}>
                <span className={cssStyles.shortcutKeys}>Ctrl+Shift+E</span>
                <span className={cssStyles.shortcutLabel}>Email Settings</span>
              </div>
            )}
            {UserPolicies.hasAdminAccess(userRoles) && (
              <div className={cssStyles.shortcutItem}>
                <span className={cssStyles.shortcutKeys}>Ctrl+Shift+I</span>
                <span className={cssStyles.shortcutLabel}>AI Settings</span>
              </div>
            )}
            {UserPolicies.hasContributorAccess(userRoles) && (
              <div className={cssStyles.shortcutItem}>
                <span className={cssStyles.shortcutKeys}>Ctrl+Shift+K</span>
                <span className={cssStyles.shortcutLabel}>AI Chat</span>
              </div>
            )}
            {UserPolicies.hasAdminAccess(userRoles) && (
              <div className={cssStyles.shortcutItem}>
                <span className={cssStyles.shortcutKeys}>Ctrl+Shift+S</span>
                <span className={cssStyles.shortcutLabel}>Security Settings</span>
              </div>
            )}
            {UserPolicies.hasAdminAccess(userRoles) && (
              <div className={cssStyles.shortcutItem}>
                <span className={cssStyles.shortcutKeys}>Ctrl+Shift+C</span>
                <span className={cssStyles.shortcutLabel}>Cache Settings</span>
              </div>
            )}
            {UserPolicies.hasAdminAccess(userRoles) && (
              <div className={cssStyles.shortcutItem}>
                <span className={cssStyles.shortcutKeys}>Ctrl+Shift+F</span>
                <span className={cssStyles.shortcutLabel}>File Storage</span>
              </div>
            )}
            {UserPolicies.hasAdminAccess(userRoles) && (
              <div className={cssStyles.shortcutItem}>
                <span className={cssStyles.shortcutKeys}>Ctrl+Shift+L</span>
                <span className={cssStyles.shortcutLabel}>Logs</span>
              </div>
            )}
            {UserPolicies.hasManagerAccess(userRoles) && (
              <div className={cssStyles.shortcutItem}>
                <span className={cssStyles.shortcutKeys}>Ctrl+Shift+R</span>
                <span className={cssStyles.shortcutLabel}>Reports & Analytics</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
