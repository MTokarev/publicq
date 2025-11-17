import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../models/user';
import { UserRole } from '../../models/UserRole';
import { userService } from '../../services/userService';
import userTableStyles from './UserTable.module.css';

// Module-level cache to persist data across component remounts
let sessionCache: {
  users: User[];
  totalPages: number;
  currentPage: number;
  hasLoadedData: boolean;
} = {
  users: [],
  totalPages: 1,
  currentPage: 1,
  hasLoadedData: false
};

// Function to clear session cache (exported for external use)
export const clearUserTableCache = () => {
  sessionCache.hasLoadedData = false;
  sessionCache.users = [];
  sessionCache.totalPages = 1;
  sessionCache.currentPage = 1;
};

interface UserTableProps {
  users?: User[]; // External users data
  selectedUsers?: string[];
  onUserSelect?: (userId: string) => void;
  onUserDeselect?: (userId: string) => void;
  onSelectAll?: (userIds: string[]) => void; // Callback for select all
  onDeselectAll?: () => void; // Callback for deselect all
  selectionMode?: 'single' | 'multiple' | 'none';
  showActions?: boolean;
  maxHeight?: string;
  onUserAction?: (action: 'edit' | 'delete' | 'resetPassword' | 'manageRoles', user: User) => void;
  title?: string;
  emptyMessage?: string;
  searchPlaceholder?: string;
  enableSearch?: boolean; // Enable/disable search functionality
  enablePagination?: boolean; // Enable/disable pagination
  refreshTrigger?: number; // When this changes, the table will refresh its data
  pageSize?: number; // Number of items per page (default: 10)
  onPageSizeChange?: (pageSize: number) => void; // Callback when page size changes
  // External state management props
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onSearchChange?: (searchTerm: string) => void;
  onSearchTypeChange?: (searchType: 'email' | 'id') => void;
  loading?: boolean;
  externalDataLoaded?: boolean; // Flag to indicate if external data management is used
  currentUserRoles?: UserRole[]; // Current user's roles for permission checks
}

const UserTable: React.FC<UserTableProps> = ({
  users: externalUsers,
  selectedUsers = [],
  onUserSelect,
  onUserDeselect,
  onSelectAll,
  onDeselectAll,
  selectionMode = 'none',
  showActions = false,
  maxHeight = '400px',
  onUserAction,
  title = 'Users',
  emptyMessage = 'No users found',
  searchPlaceholder = 'Search users...',
  enableSearch = true,
  enablePagination = true,
  refreshTrigger,
  pageSize = 10, // Default to 10 items per page
  onPageSizeChange,
  // External state management props
  totalPages: externalTotalPages,
  currentPage: externalCurrentPage,
  onPageChange,
  onSearchChange,
  onSearchTypeChange,
  loading: externalLoading,
  externalDataLoaded = false,
  currentUserRoles = [],
}) => {
  // Check if current user is administrator
  const isAdmin = currentUserRoles.includes(UserRole.ADMINISTRATOR);
  
  const [internalUsers, setInternalUsers] = useState<User[]>(sessionCache.users);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchType, setSearchType] = useState<'email' | 'id'>('email');
  const [internalCurrentPage, setInternalCurrentPage] = useState(sessionCache.currentPage);
  const [internalTotalPages, setInternalTotalPages] = useState(sessionCache.totalPages);
  
  // Track if this is the initial mount
  const isInitialMount = useRef(true);

  // Use the configurable pageSize passed as prop
  const isExternalData = !!externalUsers || externalDataLoaded;
  
  // Use external state when available, otherwise use internal state
  const loading = externalDataLoaded ? (externalLoading || false) : internalLoading;
  const currentPage = externalDataLoaded ? (externalCurrentPage || 1) : internalCurrentPage;
  const totalPages = externalDataLoaded ? (externalTotalPages || 1) : internalTotalPages;

  // Single effect to handle initial data loading and setup
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      
      if (!isExternalData) {
        if (sessionCache.hasLoadedData) {
          // Use cached data
          setInternalUsers(sessionCache.users);
          setFilteredUsers(sessionCache.users);
          setInternalCurrentPage(sessionCache.currentPage);
          setInternalTotalPages(sessionCache.totalPages);
          applyFilters(sessionCache.users);
        } else {
          // Load fresh data
          loadUsers();
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle external users data (only runs when external data is provided)
  useEffect(() => {
    if (isExternalData && externalUsers) {
      setInternalUsers(externalUsers);
      applyFilters(externalUsers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalUsers, search, searchType, currentPage]);

  // Handle search functionality (when user actively searches or clears search)
  useEffect(() => {
    if (!isExternalData && !isInitialMount.current) {
      const debounceTimeout = setTimeout(() => {
        // Clear cache for search/clear to get fresh results
        sessionCache.hasLoadedData = false;
        loadUsers(1);
      }, 300);
      return () => clearTimeout(debounceTimeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, searchType]);

  // Handle refresh trigger from parent component
  useEffect(() => {
    if (!isExternalData && refreshTrigger !== undefined && refreshTrigger > 0 && !isInitialMount.current) {
      // Clear cache to force reload
      sessionCache.hasLoadedData = false;
      loadUsers(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // Handle page size changes
  useEffect(() => {
    if (!isExternalData && !isInitialMount.current) {
      // Reset to page 1 when page size changes and reload data
      setInternalCurrentPage(1);
      sessionCache.currentPage = 1;
      loadUsers(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize]);

  const loadUsers = async (page: number = currentPage) => {
    if (isExternalData) return;
    
    setInternalLoading(true);
    setError('');

    try {
      let response: Awaited<ReturnType<typeof userService.fetchUsers>>;
      
      if (search.trim()) {
        const emailPart = searchType === 'email' ? search.trim() : '';
        const idPart = searchType === 'id' ? search.trim() : '';
        response = await userService.searchUsers(emailPart, idPart, page, pageSize);
      } else {
        response = await userService.fetchUsers(page, pageSize);
      }
      
      const users = response.data.data || [];
      const pages = response.data.totalPages || 1;
      
      setInternalUsers(users);
      setFilteredUsers(users);
      setInternalTotalPages(pages);
      setInternalCurrentPage(page);
      
      // Update session cache
      sessionCache.users = users;
      sessionCache.totalPages = pages;
      sessionCache.currentPage = page;
      sessionCache.hasLoadedData = true;
    } catch (err: any) {
      setError('Failed to load users: ' + (err.response?.data?.message || err.message));
      setInternalUsers([]);
      setFilteredUsers([]);
    } finally {
      setInternalLoading(false);
    }
  };

  const applyFilters = (users: User[]) => {
    let filtered = [...users];
    
    // Apply search filter for external data
    if (search.trim() && enableSearch) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(user => {
        if (searchType === 'email') {
          return user.email?.toLowerCase().includes(searchLower) || false;
        } else {
          return user.id?.toLowerCase().includes(searchLower) || false;
        }
      });
    }
    
    // Apply pagination for external data
    if (enablePagination && !externalDataLoaded) {
      const totalItems = filtered.length;
      const totalPagesCalc = Math.ceil(totalItems / pageSize);
      setInternalTotalPages(totalPagesCalc);
      
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      filtered = filtered.slice(startIndex, endIndex);
    }
    
    setFilteredUsers(filtered);
  };

  const handleUserClick = (user: User) => {
    if (selectionMode === 'none') return;

    const isSelected = selectedUsers.includes(user.id);
    
    if (isSelected) {
      onUserDeselect?.(user.id);
    } else {
      if (selectionMode === 'single') {
        // For single selection, deselect all others first
        selectedUsers.forEach(id => onUserDeselect?.(id));
      }
      onUserSelect?.(user.id);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    
    if (externalDataLoaded && onSearchChange) {
      onSearchChange(newSearch);
    } else {
      setInternalCurrentPage(1); // Reset to first page when searching
    }
  };

  const handleSearchTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as 'email' | 'id';
    setSearchType(newType);
    setSearch(''); // Clear search when changing type
    
    if (externalDataLoaded && onSearchTypeChange) {
      onSearchTypeChange(newType);
    } else if (!externalDataLoaded) {
      setInternalCurrentPage(1); // Reset to first page when changing search type
    }
  };

  const getSearchPlaceholder = () => {
    return searchType === 'email' ? 'Search by email...' : 'Search by user ID...';
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      
      if (externalDataLoaded && onPageChange) {
        onPageChange(newPage);
      } else {
        setInternalCurrentPage(newPage);
        if (!isExternalData) {
          loadUsers(newPage);
        } else {
          applyFilters(internalUsers);
        }
      }
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      
      if (externalDataLoaded && onPageChange) {
        onPageChange(newPage);
      } else {
        setInternalCurrentPage(newPage);
        if (!isExternalData) {
          loadUsers(newPage);
        } else {
          // For external data without external data management, still paginate through the provided data
          applyFilters(internalUsers);
        }
      }
    }
  };

  const displayUsers = filteredUsers;

  // Select All functionality
  const currentPageUserIds = displayUsers.map(user => user.id);
  const areAllCurrentPageSelected = displayUsers.length > 0 && 
    displayUsers.every(user => selectedUsers.includes(user.id));
  const areSomeCurrentPageSelected = displayUsers.some(user => selectedUsers.includes(user.id));

  const handleSelectAllToggle = () => {
    if (areAllCurrentPageSelected) {
      // Deselect all on current page
      currentPageUserIds.forEach(id => onUserDeselect?.(id));
    } else {
      // Select all on current page
      currentPageUserIds.forEach(id => {
        if (!selectedUsers.includes(id)) {
          onUserSelect?.(id);
        }
      });
    }
  };

  return (
    <div className={userTableStyles.container}>
      {title && <h4 className={userTableStyles.title}>{title}</h4>}
      
      {enableSearch && (
        <div className={userTableStyles.searchContainer}>
          <div className={userTableStyles.searchWrapper}>
            <select
              value={searchType}
              onChange={handleSearchTypeChange}
              className={userTableStyles.searchTypeSelect}
            >
              <option value="email">Email</option>
              <option value="id">ID</option>
            </select>
            
            <input
              type="text"
              placeholder={getSearchPlaceholder()}
              value={search}
              onChange={handleSearchChange}
              className={userTableStyles.search}
            />
          </div>
        </div>
      )}

      {error && <p className={userTableStyles.error}>{error}</p>}

      <div className={userTableStyles.tableContainer} style={{maxHeight}}>
        {loading ? (
          <div className={userTableStyles.loadingContainer}>
            <p className={userTableStyles.loadingText}>Loading users...</p>
          </div>
        ) : displayUsers.length === 0 ? (
          <div className={userTableStyles.emptyContainer}>
            <p className={userTableStyles.emptyMessage}>{emptyMessage}</p>
          </div>
        ) : (
          <table className={userTableStyles.table}>
            <thead className={userTableStyles.tableHead}>
              <tr>
                {selectionMode !== 'none' && (
                  <th className={userTableStyles.th}>
                    {selectionMode === 'multiple' && displayUsers.length > 0 ? (
                      <div className={userTableStyles.selectAllHeader}>
                        <input
                          type="checkbox"
                          checked={areAllCurrentPageSelected}
                          ref={(input) => {
                            if (input) input.indeterminate = areSomeCurrentPageSelected && !areAllCurrentPageSelected;
                          }}
                          onChange={handleSelectAllToggle}
                          className={userTableStyles.selectAllCheckbox}
                        />
                        <span className={userTableStyles.selectLabel}>Select</span>
                      </div>
                    ) : (
                      'Select'
                    )}
                  </th>
                )}
                <th className={userTableStyles.th}>ID</th>
                <th className={userTableStyles.th}>Email</th>
                <th className={userTableStyles.th}>Full Name</th>
                <th className={userTableStyles.th}>Date of Birth</th>
                <th className={userTableStyles.th}>User Type</th>
                {showActions && <th className={userTableStyles.th}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {displayUsers.map((user) => {
                const isSelected = selectedUsers.includes(user.id);
                return (
                  <tr 
                    key={user.id}
                    className={`${userTableStyles.tr} ${isSelected ? userTableStyles.trSelected : ''} ${selectionMode !== 'none' ? userTableStyles.trClickable : ''}`}
                    onClick={() => handleUserClick(user)}
                  >
                    {selectionMode !== 'none' && (
                      <td className={userTableStyles.td}>
                        <input
                          type={selectionMode === 'single' ? 'radio' : 'checkbox'}
                          checked={isSelected}
                          onChange={() => {}} // Handled by row click
                          className={userTableStyles.selectionInput}
                        />
                      </td>
                    )}
                    <td className={userTableStyles.td}>
                      <span className={userTableStyles.idCell}>{user.id}</span>
                    </td>
                    <td className={userTableStyles.td}>
                      <div className={userTableStyles.userEmail}>{user.email || 'N/A'}</div>
                    </td>
                    <td className={userTableStyles.td}>
                      <div className={userTableStyles.userName}>{user.fullName || '-'}</div>
                    </td>
                    <td className={userTableStyles.td}>
                      <div className={userTableStyles.dateOfBirth}>
                        {user.dateOfBirth 
                          ? new Date(user.dateOfBirth).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'N/A'
                        }
                      </div>
                    </td>
                    <td className={userTableStyles.td}>
                      <div className={userTableStyles.userTypeContainer}>
                        {user.hasCredential ? (
                          <span className={userTableStyles.userBadge}>User</span>
                        ) : (
                          <span className={userTableStyles.examTakerBadge}>Exam Taker</span>
                        )}
                      </div>
                    </td>
                    {showActions && (
                      <td className={userTableStyles.td}>
                        <div className={userTableStyles.actionContainer}>
                          {user.hasCredential && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onUserAction?.('manageRoles', user);
                              }} 
                              className={userTableStyles.actionButtonSecondary}
                            >
                              Roles
                            </button>
                          )}
                          {user.hasCredential && isAdmin && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onUserAction?.('resetPassword', user);
                              }} 
                              className={userTableStyles.actionButton}
                            >
                              Reset
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onUserAction?.('delete', user);
                            }} 
                            className={userTableStyles.actionButtonDanger}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {enablePagination && (
        <div className={userTableStyles.pagination}>
          <div className={userTableStyles.pageSizeContainer}>
            <label className={userTableStyles.pageSizeLabel}>Items per page:</label>
            <select 
              value={pageSize} 
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className={userTableStyles.pageSizeSelect}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className={userTableStyles.paginationControls}>
            <button 
              onClick={handlePrevious} 
              disabled={currentPage === 1} 
              className={userTableStyles.paginationButton}
            >
              ◀ Previous
            </button>
            <span className={userTableStyles.pageInfo}>
              Page {currentPage} of {totalPages} ({filteredUsers.length} users)
            </span>
            <button 
              onClick={handleNext} 
              disabled={currentPage === totalPages} 
              className={userTableStyles.paginationButton}
            >
              Next ▶
            </button>
          </div>
          <div className={userTableStyles.paginationSpacer}></div>
        </div>
      )}
    </div>
  );
};

export default UserTable;
