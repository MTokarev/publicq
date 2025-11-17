export const CONSTANTS = {
  TOKEN_VARIABLE_NAME: 'token',
  MODULE_STATE: 'assessment_module_state',
  EXAM_TAKER: 'exam-taker'
};

/**
 * Application route paths
 */
export const ROUTES = {
  HOME: '/',
  REGISTER: '/register',
  RESET_PASSWORD: '/reset-password',
  ADMIN: '/admin',
  LOGIN: '/login',
  MY_ASSIGNMENTS: '/my-assignments',
  ASSIGNMENT: '/assignment/:assignmentId/:userId?',
  QUESTIONS: '/questions',
  MODULE_CREATE: '/module/create',
  MODULE_BUILD: '/module/build',
  AI_CHAT: '/ai-chat',
  DEMO: '/demo',
  CONTACT_US: '/contact',
} as const;

/**
 * Validation constraints that align with backend entity MaxLength attributes
 */
export const VALIDATION_CONSTRAINTS = {
  ASSIGNMENT: {
    TITLE_MAX_LENGTH: 200,
    DESCRIPTION_MAX_LENGTH: 5000
  },
  MODULE: {
    TITLE_MAX_LENGTH: 200,
    DESCRIPTION_MAX_LENGTH: 5000
  },
  QUESTION: {
    TEXT_MAX_LENGTH: 5000
  },
  POSSIBLE_ANSWER: {
    TEXT_MAX_LENGTH: 2000
  },
  GROUP: {
    TITLE_MAX_LENGTH: 200,
    DESCRIPTION_MAX_LENGTH: 5000
  },
  USER: {
    EMAIL_MAX_LENGTH: 254,
    FULL_NAME_MAX_LENGTH: 200,
    PASSWORD_MAX_LENGTH: 100
  },
  EXAM_TAKER: {
    ID_MAX_LENGTH: 50,
    NAME_MAX_LENGTH: 200,
    EMAIL_MAX_LENGTH: 254
  },
  STATIC_FILE: {
    NAME_MAX_LENGTH: 255,
    TYPE_MAX_LENGTH: 100,
    URL_MAX_LENGTH: 2048
  },
  BANNER: {
    TITLE_MAX_LENGTH: 200,
    CONTENT_MAX_LENGTH: 2000
  },
  PAGE: {
    TITLE_MAX_LENGTH: 256,
    BODY_MAX_LENGTH: 20480,
    JSON_DATA_MAX_LENGTH: 20480
  }
};