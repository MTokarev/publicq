export const config = {
  // API base URL, if not provided use the same host and protocol as the frontend assuming
  // the API is served from the same origin
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL ?? `${window.location.protocol}//${window.location.host}/api/`,
  
  // Static pages path
  staticPagesPath: '/static/pages',
  
  // UI Configuration
  ui: {
    // Maximum number of modules to show in the add module dropdown in group management
    maxModulesInDropdown: 20,
  },
};