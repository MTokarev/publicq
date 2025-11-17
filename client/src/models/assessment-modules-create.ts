import { v4 as uuidv4 } from 'uuid';
import { QuestionType } from "./question-types";
import { AssessmentModuleVersionDto, PossibleAnswerDto, QuestionDto } from './assessment-module';

export interface AssessmentModuleCreateDto {
  title: string; /** @maxLength 200 characters (aligned with backend constraint) */
  description: string; /** @maxLength 5000 characters (aligned with backend constraint) */
  passingScorePercentage: number;
  durationInMinutes: number;
  createdByUserId: string;
}

export interface AssessmentModuleVersionCreateDto {
  moduleId: string;
  title: string; /** @maxLength 200 characters (aligned with backend constraint) */
  description: string; /** @maxLength 5000 characters (aligned with backend constraint) */
  passingScorePercentage: number;
  durationInMinutes: number;
  staticFileIds?: string[];
  createdByUserId: string;
}

export interface QuestionCreateDto {
  internalId: string;
  order: number;
  moduleId: string;
  moduleVersionId: string;
  text?: string; /** @maxLength 5000 characters (aligned with backend constraint) - optional if attachments exist */
  staticFileIds: string[];
  type: QuestionType;
  answers: PossibleAnswerCreateDto[];
}

export interface QuestionUpdateDto {
  id: string;
  moduleId: string;
  moduleVersionId: string;
  text?: string; /** @maxLength 5000 characters (aligned with backend constraint) - optional if attachments exist */
  staticFileIds: string[];
  type: QuestionType;
  answers: PossibleAnswerCreateDto[];
}

export interface PossibleAnswerCreateDto {
  text: string; /** @maxLength 1000 characters (aligned with backend constraint) */
  order: number;
  staticFileIds: string[];
  isCorrect: boolean;
}

// Helper function to create a new question with defaults
export function createNewQuestion(moduleId: string, moduleVersionId: string): QuestionCreateDto {
  return {
    internalId: uuidv4(),
    order : 0, // Will be overridden when question is submitted
    moduleId,
    moduleVersionId,
    text: '',
    staticFileIds: [],
    type: QuestionType.SingleChoice,
    answers: [
      { text: '', isCorrect: true, staticFileIds: [], order: 0 },
      { text: '', isCorrect: false, staticFileIds: [], order: 1 }
    ]
  };
}

// Helper function to convert QuestionDto to QuestionCreateDto
export const questionDtoToCreateDto = (questionDto: QuestionDto): QuestionCreateDto => {
  return {
    internalId: questionDto.id || uuidv4(),
    order: questionDto.order || 0,
    moduleId: questionDto.moduleId,
    moduleVersionId: questionDto.moduleVersionId,
    text: questionDto.text || '',
    staticFileIds: questionDto.staticFileIds || [],
    type: questionDto.type || QuestionType.SingleChoice,
    answers: questionDto.answers?.map((a: PossibleAnswerDto) => ({
      text: a.text || '',
      order: a.order || 0,
      isCorrect: a.isCorrect || false,
      staticFileIds: a.staticFileIds || []
    })) || []
  };
};

// Helper function to convert QuestionCreateDto to QuestionUpdateDto
export const questionCreateDtoToUpdateDto = (question: QuestionCreateDto): QuestionUpdateDto => {
  return {
    id: question.internalId,
    moduleId: question.moduleId,
    moduleVersionId: question.moduleVersionId,
    text: question.text,
    staticFileIds: question.staticFileIds,
    type: question.type,
    answers: question.answers
  };
};

// Helper function to convert PossibleAnswerCreateDto to PossibleAnswerDto
export const answerCreateDtoToReturnDto = (answer: PossibleAnswerCreateDto): PossibleAnswerDto => {
  return {
    id: uuidv4(), // Generate a temporary ID if needed
    text: answer.text,
    order: answer.order,
    isCorrect: answer.isCorrect,
    staticFileIds: answer.staticFileIds || [],
    staticFileUrls: [] // URLs should come from backend response
  };
};

// Helper function to convert AssessmentModuleVersionDto to AssessmentModuleVersionCreateDto
export const assessmentDtoToCreateDto = (moduleId: string, dto: AssessmentModuleVersionDto): AssessmentModuleVersionCreateDto => {
  return {
    moduleId,
    staticFileIds: dto.staticFileIds,
    passingScorePercentage: dto.passingScorePercentage,
    durationInMinutes: dto.durationInMinutes,
    createdByUserId: dto.createdByUserId,
    title: dto.title,
    description: dto.description
  };
};