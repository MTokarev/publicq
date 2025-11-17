import { QuestionType } from "./question-types";

export interface AssessmentModuleDto {
  id: string; // Guid
  hasPublishedVersions: boolean;
  createdByUserId: string;
  createdByUser: string;
  createdAtUtc: string; // ISO date string
  latestVersion: AssessmentModuleVersionDto;
}

export interface AssessmentModuleVersionDto {
  id: string; // Guid
  assessmentModuleId: string; // Guid
  version: number;
  title: string; /** @maxLength 200 characters (aligned with backend constraint) */
  description: string; /** @maxLength 5000 characters (aligned with backend constraint) */
  isPublished: boolean;
  passingScorePercentage: number;
  durationInMinutes: number;
  createdAtUtc: string; // ISO date string
  createdByUserId: string;
  createdByUser: string;
  updatedByUser?: string;
  staticFileIds?: string[];
  staticFileUrls?: string[];
  questions: QuestionDto[];
}

export interface QuestionDto {
  id: string; // Guid
  order?: number;
  moduleId: string; // Guid
  moduleVersionId: string; // Guid
  text?: string; /** @maxLength 5000 characters (aligned with backend constraint) - optional if attachments exist */
  staticFileUrls?: string[];
  staticFileIds?: string[]; // Guid
  type: QuestionType;
  answers: PossibleAnswerDto[];
}

export interface PossibleAnswerDto {
  id: string; // Guid
  order?: number;
  text: string; /** @maxLength 1000 characters (aligned with backend constraint) */
  staticFileUrls?: string[];
  staticFileIds?: string[];
  isCorrect: boolean;
}