import LoginPage from './pages/Login';
import './App.css';
import { Link, Route, Routes, BrowserRouter, useLocation } from 'react-router-dom';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import NavBar from './components/NavBar/NavBar';
import Banner from './components/Banner/Banner';
import { AuthProvider, useAuth } from './context/AuthContext';
import Admin from './pages/Admin';
import ModuleCreationPage from './pages/ModuleCreationPage';
import ModuleBuilderPage from './pages/ModuleBuilderPage';
import { RoleGuard } from './components/Shared/RoleGuard';
import MyAssignments from './pages/MyAssignments';
import AssignmentExecutionPage from './pages/AssignmentExecutionPage';
import Questions from './components/Questions';
import { UserPolicies } from './models/user-policy';
import { UserRole } from './models/UserRole';
import homeStyles from './pages/Home/Home.module.css';
import { ROUTES } from './constants/contstants';
import AiChatDemo from './pages/AiChat';
import DemoExam from './components/DemoExam/DemoExam';
import ContactUs from './pages/ContactUs/ContactUs';

function HomePage() {
  const { isAuthenticated, userRoles } = useAuth();
  const isExamTaker = userRoles.includes(UserRole.EXAM_TAKER);

  return (
    <div className={homeStyles.homePage}>
      <div className={homeStyles.container}>
        <div className={homeStyles.hero}>
          <h1 className={homeStyles.title}>
            Welcome to <span className={homeStyles.brandName}>PublicQ</span>
          </h1>
          <p className={homeStyles.subtitle}>
            Create, manage, and deploy assessment modules with ease.
            Build comprehensive quizzes and exams for educational and professional purposes.
          </p>

          <div className={homeStyles.features}>
            <div className={homeStyles.feature}>
              <div className={homeStyles.featureIcon}><img src="/images/icons/notepad.svg" alt="Create" style={{width: '48px', height: '48px'}} /></div>
              <h3 className={homeStyles.featureTitle}>Create Assessments</h3>
              <p className={homeStyles.featureDesc}>Design custom assessment modules with multiple question types</p>
            </div>
            <div className={homeStyles.feature}>
              <div className={homeStyles.featureIcon}><img src="/images/icons/chart.svg" alt="Track" style={{width: '48px', height: '48px'}} /></div>
              <h3 className={homeStyles.featureTitle}>Track Progress</h3>
              <p className={homeStyles.featureDesc}>Monitor performance and analyze results in real-time</p>
            </div>
            <div className={homeStyles.feature}>
              <div className={homeStyles.featureIcon}><img src="/images/icons/rocket.svg" alt="Deploy" style={{width: '48px', height: '48px'}} /></div>
              <h3 className={homeStyles.featureTitle}>Deploy Instantly</h3>
              <p className={homeStyles.featureDesc}>Publish your assessments and share them with your audience</p>
            </div>
          </div>

          {/* Take Exam Call-to-Action */}
          <Link
            to={ROUTES.MY_ASSIGNMENTS}
            className={homeStyles.examCTA}
          >
            <div className={homeStyles.examCTAContent}>
              <h2 className={homeStyles.examCTATitle}>Ready to Take Your Exam?</h2>
              <p className={homeStyles.examCTADescription}>
                If you have an assignment or exam to complete, access your personalized dashboard to get started.
              </p>
              <div className={homeStyles.examCTAHint}>Click here to continue →</div>
            </div>
          </Link>

          <div className={homeStyles.actions}>
            <Link
              to={ROUTES.DEMO}
              className={homeStyles.secondaryButton}
            >
              Try Demo
            </Link>
            {!isExamTaker && (
              <Link
                to={ROUTES.MODULE_CREATE}
                className={homeStyles.primaryButton}
              >
                Create Assessment Module
              </Link>
            )}
            {!isAuthenticated && (
              <Link
                to={ROUTES.LOGIN}
                className={homeStyles.secondaryButton}
              >
                Sign In
              </Link>
            )}
          </div>

          <div className={homeStyles.footer}>
            <p className={homeStyles.footerText}>
              Powered by <a href="https://publicq.app" target="_blank" rel="noopener noreferrer" className={homeStyles.footerLink}>PublicQ</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const isExamPage = location.pathname.startsWith('/assignment/') || 
                     location.pathname.startsWith(ROUTES.QUESTIONS);

  return (
    <>
      {!isExamPage && <NavBar />}
      {!isExamPage && <Banner />}
      <Routes>
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
        <Route path={ROUTES.ADMIN} element={
          <RoleGuard requiredRoles={[...UserPolicies.Contributors, ...UserPolicies.Analysts]} redirectTo={ROUTES.LOGIN}>
            <Admin />
          </RoleGuard>
        } />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.MY_ASSIGNMENTS} element={<MyAssignments />} />
        <Route path={ROUTES.ASSIGNMENT} element={<AssignmentExecutionPage />} />
        <Route path={ROUTES.QUESTIONS} element={<Questions />} />
        <Route path={ROUTES.MODULE_CREATE} element={
          <RoleGuard requiredRoles={[...UserPolicies.Contributors]} redirectTo={ROUTES.LOGIN}>
            <ModuleCreationPage />
          </RoleGuard>
        } />
        <Route path={ROUTES.MODULE_BUILD} element={
          <RoleGuard requiredRoles={[...UserPolicies.Contributors]} redirectTo={ROUTES.LOGIN}>
            <ModuleBuilderPage />
          </RoleGuard>
        } />
        <Route path={ROUTES.AI_CHAT} element={
          <RoleGuard requiredRoles={[...UserPolicies.Contributors]} redirectTo={ROUTES.LOGIN}>
            <AiChatDemo />
          </RoleGuard>
        } />
        <Route path={ROUTES.DEMO} element={<DemoExam />} />
        <Route path={ROUTES.CONTACT_US} element={<ContactUs />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;