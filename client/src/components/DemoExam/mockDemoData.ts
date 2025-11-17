import { ExamTakerModuleVersion } from '../../models/exam-taker-module-version';
import { QuestionType } from '../../models/question-types';
import { Assignment } from '../../models/assignment';
import { User } from '../../models/user';

/**
 * Mock Demo Assessment Module
 * 
 * Features showcased:
 * - SingleChoice and MultipleChoice questions
 * - Text and image-based questions
 * - Various difficulty levels
 * - Timer functionality
 * - Navigation and progress tracking
 * 
 * Note: This contains CORRECT answers for scoring purposes.
 * We'll filter them out before showing to users.
 */

// Correct answers map for scoring (hidden from exam takers)
export const DEMO_CORRECT_ANSWERS: Record<string, string[]> = {
  'q1-pattern': ['q1-a4'], // shapes-a-t.png (triangle with dot)
  'q2-listening': ['q2-a1'], // A shipment of rare local honey
  'q3-science': ['q3-a2'], // Jupiter (from planets.png)
  'q4-video': ['q4-a2'], // Eiffel Tower
  'q5-season': ['q5-a1', 'q5-a2', 'q5-a3', 'q5-a4', 'q5-a5'], // summer variants
  'q6-scavenger': ['q6-a1', 'q6-a2', 'q6-a4', 'q6-a5', 'q6-a7'], // Apple, Banana, Grapes, Orange, Pineapple (NOT Carrot or Rock)
  'q7-math': ['q7-a3'], // 8 workers
  'q8-logic': ['q8-a2'], // Some roses may fade quickly
  'q9-vocabulary': ['q9-a2'], // Precise
  'q10-grammar': ['q10-a1', 'q10-a3'] // Multiple correct
};

export const DEMO_MODULE: ExamTakerModuleVersion = {
  id: 'demo-module-12345',
  assessmentModuleId: 'demo-parent-module',
  title: 'Professional Skills Demo Assessment',
  description: 'A comprehensive demo showcasing various question types, visual content, and platform capabilities. Test your logical reasoning, language skills, and general knowledge!',
  version: 1,
  isPublished: true,
  passingScorePercentage: 30,
  durationInMinutes: 20,
  createdAtUtc: new Date().toISOString(),
  createdByUserId: 'demo-admin',
  questions: [
    // SECTION 1: MEDIA QUESTIONS (Images, Audio, Video) - All media first!
    {
      id: 'q1-pattern',
      text: 'Examine the 3x3 grid in the image above. One shape is missing, indicated by the "?". Determine which of the following four options correctly completes the pattern, following the rule that each row and each column must contain exactly one Red, one Blue, and one Green shape, and one Circle, one Square, and one Triangle.',
      type: QuestionType.SingleChoice,
      staticFileUrls: ['/images/demo/shapes-q.png'],
      answers: [
        { id: 'q1-a1', text: '', staticFileUrls: ['/images/demo/shapes-a-c.png'] },
        { id: 'q1-a2', text: '', staticFileUrls: ['/images/demo/shapes-a-s-b.png'] },
        { id: 'q1-a3', text: '', staticFileUrls: ['/images/demo/shapes-a-s-r.png'] },
        { id: 'q1-a4', text: '', staticFileUrls: ['/images/demo/shapes-a-t.png'] }
      ]
    },
    {
      id: 'q2-listening',
      text: 'Listen to the following story and answer the question.\n\nWhat special item did Oliver learn had arrived at the market?',
      type: QuestionType.SingleChoice,
      staticFileUrls: ['/media/demo/audio/oliver-story.mp3'],
      answers: [
        { id: 'q2-a1', text: 'A shipment of rare local honey', staticFileUrls: [] },
        { id: 'q2-a2', text: 'Fresh strawberries from a nearby farm', staticFileUrls: [] },
        { id: 'q2-a3', text: 'A new type of artisan cheese', staticFileUrls: [] },
        { id: 'q2-a4', text: 'A batch of imported coffee beans', staticFileUrls: [] }
      ]
    },
    {
      id: 'q3-science',
      text: 'Which planet in our solar system is the largest?',
      type: QuestionType.SingleChoice,
      staticFileUrls: ['/images/demo/planets.png'],
      answers: [
        { id: 'q3-a1', text: 'Saturn', staticFileUrls: [] },
        { id: 'q3-a2', text: 'Jupiter', staticFileUrls: [] },
        { id: 'q3-a3', text: 'Neptune', staticFileUrls: [] },
        { id: 'q3-a4', text: 'Mars', staticFileUrls: [] }
      ]
    },
    {
      id: 'q4-video',
      text: 'Watch the video and identify the landmark shown:',
      type: QuestionType.SingleChoice,
      staticFileUrls: ['/media/demo/video/tower.mp4'],
      answers: [
        { id: 'q4-a1', text: 'Big Ben', staticFileUrls: [] },
        { id: 'q4-a2', text: 'Eiffel Tower', staticFileUrls: [] },
        { id: 'q4-a3', text: 'Tokyo Tower', staticFileUrls: [] },
        { id: 'q4-a4', text: 'Maiden Tower', staticFileUrls: [] }
      ]
    },
    {
      id: 'q5-season',
      text: 'Look at the image above. What season is depicted? (Answer in one word)',
      type: QuestionType.FreeText,
      staticFileUrls: ['/images/demo/summer.jpg'],
      answers: [
        { id: 'q5-a1', text: 'summer', staticFileUrls: [] },
        { id: 'q5-a2', text: 'Summer', staticFileUrls: [] },
        { id: 'q5-a3', text: 'SUMMER', staticFileUrls: [] },
        { id: 'q5-a4', text: 'sammer', staticFileUrls: [] },
        { id: 'q5-a5', text: 'sumer', staticFileUrls: [] }
      ]
    },
    {
      id: 'q6-scavenger',
      text: 'Look carefully at the image (click to enlarge). Select ALL the fruits you can find:',
      type: QuestionType.MultipleChoice,
      staticFileUrls: ['/images/demo/scavenger.png'],
      answers: [
        { id: 'q6-a1', text: 'Apple', staticFileUrls: [] },
        { id: 'q6-a2', text: 'Banana', staticFileUrls: [] },
        { id: 'q6-a3', text: 'Carrot', staticFileUrls: [] },
        { id: 'q6-a4', text: 'Grapes', staticFileUrls: [] },
        { id: 'q6-a5', text: 'Orange', staticFileUrls: [] },
        { id: 'q6-a6', text: 'Rock', staticFileUrls: [] },
        { id: 'q6-a7', text: 'Pineapple', staticFileUrls: [] }
      ]
    },

    // SECTION 2: LOGICAL REASONING
    {
      id: 'q7-math',
      text: 'If 5 workers can complete a project in 8 hours, how many workers are needed to complete the same project in 5 hours? (Assume all workers work at the same rate)',
      type: QuestionType.SingleChoice,
      staticFileUrls: [],
      answers: [
        { id: 'q7-a1', text: '6 workers', staticFileUrls: [] },
        { id: 'q7-a2', text: '7 workers', staticFileUrls: [] },
        { id: 'q7-a3', text: '8 workers', staticFileUrls: [] },
        { id: 'q7-a4', text: '10 workers', staticFileUrls: [] }
      ]
    },
    {
      id: 'q8-logic',
      text: 'Logic Problem: All roses are flowers. Some flowers fade quickly. Therefore, which statement must be true?',
      type: QuestionType.SingleChoice,
      staticFileUrls: [],
      answers: [
        { id: 'q8-a1', text: 'All roses fade quickly', staticFileUrls: [] },
        { id: 'q8-a2', text: 'Some roses may fade quickly', staticFileUrls: [] },
        { id: 'q8-a3', text: 'No roses fade quickly', staticFileUrls: [] },
        { id: 'q8-a4', text: 'All flowers are roses', staticFileUrls: [] }
      ]
    },

    // SECTION 3: LANGUAGE & COMMUNICATION
    {
      id: 'q9-vocabulary',
      text: 'Which word is closest in meaning to "meticulous"?',
      type: QuestionType.SingleChoice,
      staticFileUrls: [],
      answers: [
        { id: 'q9-a1', text: 'Careless', staticFileUrls: [] },
        { id: 'q9-a2', text: 'Precise', staticFileUrls: [] },
        { id: 'q9-a3', text: 'Quick', staticFileUrls: [] },
        { id: 'q9-a4', text: 'Lazy', staticFileUrls: [] }
      ]
    },
    {
      id: 'q10-grammar',
      text: 'Select ALL grammatically correct sentences:',
      type: QuestionType.MultipleChoice,
      staticFileUrls: [],
      answers: [
        { id: 'q10-a1', text: 'She and I are going to the store.', staticFileUrls: [] },
        { id: 'q10-a2', text: 'Between you and I, this is difficult.', staticFileUrls: [] },
        { id: 'q10-a3', text: 'The team has completed their project.', staticFileUrls: [] },
        { id: 'q10-a4', text: 'Each of the students have their own desk.', staticFileUrls: [] }
      ]
    }
  ]
};

export const DEMO_ASSIGNMENT: Assignment = {
  id: 'demo-assignment-12345',
  title: 'Professional Skills Demo Assessment',
  description: 'Try our platform with this comprehensive demo assessment. Your answers are not saved - feel free to retake as many times as you like!',
  startDateUtc: new Date(Date.now() - 86400000).toISOString(), // Started yesterday
  endDateUtc: new Date(Date.now() + 86400000 * 365).toISOString(), // Ends in a year
  showResultsImmediately: true,
  randomizeQuestions: false,
  randomizeAnswers: false,
  groupId: 'demo-group-123',
  groupTitle: 'Demo Group',
  isPublished: true,
  createdByUserId: 'demo-admin',
  createdByUser: 'Demo Admin',
  updatedByUserId: 'demo-admin',
  createdAtUtc: new Date().toISOString()
};

export const DEMO_USER: User = {
  id: 'demo-user-12345',
  email: 'demo@example.com',
  hasCredential: false,
  fullName: 'Demo User'
};
