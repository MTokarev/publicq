import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RoleGuard } from '../Shared/RoleGuard';
import { UserPolicies } from '../../models/user-policy';
import { cn } from '../../utils/cn';
import { PageService } from '../../services/pageService';
import { PageType } from '../../models/page-type';
import { GenericOperationStatuses } from '../../models/GenericOperationStatuses';
import { ROUTES } from '../../constants/contstants';
import navStyles from './NavBar.module.css';

const NavBar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasContactPage, setHasContactPage] = useState(false);

  const { token, logout, userRoles } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkContactPageExists();
  }, []);

  const checkContactPageExists = async () => {
    try {
      await PageService.getPageFromFile(PageType.Contact);
      setHasContactPage(true);
    } catch (err: any) {
      // If 404 or any error, don't show the link
      setHasContactPage(false);
    }
  };

  const handleLogout = () => {
    closeMobileMenu();
    logout();
    navigate('/');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={navStyles.navbar}>
      <h1 className={navStyles.logo}>
        <NavLink to="/" className={navStyles.logoLink}>
          PublicQ
        </NavLink>
      </h1>
      
      {/* Hamburger menu button - only visible on mobile */}
      <button 
        className={navStyles.hamburgerButton}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <span className={cn(navStyles.hamburgerLine, isMobileMenuOpen && navStyles['hamburgerLine--open'])}></span>
        <span className={cn(navStyles.hamburgerLine, isMobileMenuOpen && navStyles['hamburgerLine--open'])}></span>
        <span className={cn(navStyles.hamburgerLine, isMobileMenuOpen && navStyles['hamburgerLine--open'])}></span>
      </button>

      <ul className={cn(navStyles.navLinks, isMobileMenuOpen && navStyles['navLinks--open'])}>
        <li>
          <NavLink 
            to="/my-assignments" 
            className={({ isActive }) => cn(
              navStyles.navBtn,
              isActive && navStyles['navBtn--active']
            )}
            onClick={closeMobileMenu}
          >
            Take Exam
          </NavLink>
        </li>
        {hasContactPage && (
          <li>
            <NavLink 
              to={ROUTES.CONTACT_US}
              className={({ isActive }) => cn(
                navStyles.navBtn,
                isActive && navStyles['navBtn--active']
              )}
              onClick={closeMobileMenu}
            >
              Contact Us
            </NavLink>
          </li>
        )}
        {token && (
          <>
            <RoleGuard requiredRoles={[...UserPolicies.Contributors, ...UserPolicies.Analysts]} redirectTo="/login">
              <li>
                <NavLink 
                  to="/admin"
                  className={({ isActive }) => cn(
                    navStyles.navBtn,
                    isActive && navStyles['navBtn--active']
                  )}
                  onClick={closeMobileMenu}
                >
                  Admin Panel
                </NavLink>
              </li>
            </RoleGuard>
            <li>
              <button 
                className={navStyles.navBtn}
                onClick={handleLogout}
              >
                Logout
              </button>
            </li>
          </>
        )}
        {!token && (
          <>
            <li>
              <NavLink 
                to="/register" 
                className={({ isActive }) => cn(
                  navStyles.navBtn,
                  isActive && navStyles['navBtn--active']
                )}
                onClick={closeMobileMenu}
              >
                Register
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/login"
                className={({ isActive }) => cn(
                  navStyles.navBtn,
                  isActive && navStyles['navBtn--active']
                )}
                onClick={closeMobileMenu}
              >
                Login
              </NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default NavBar;