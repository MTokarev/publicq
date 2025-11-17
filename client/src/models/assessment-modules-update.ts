import { AssessmentModuleVersionDto } from "./assessment-module";

export interface AssessmentModuleVersionUpdateDto {
  id: string;
  title: string; /** @maxLength 200 characters (aligned with backend constraint) */
  description: string; /** @maxLength 5000 characters (aligned with backend constraint) */
  staticFileIds?: string[];
  passingScorePercentage: number;
  durationInMinutes: number;
}

export interface AssessmentModuleVersionUpdatePublishedDto {
  id: string;
  title: string; /** @maxLength 200 characters (aligned with backend constraint) */
  description: string; /** @maxLength 5000 characters (aligned with backend constraint) */
  staticFileIds?: string[];
  durationInMinutes: number;
}

export const assessmentDtoToUpdatePublishedDto = (dto: AssessmentModuleVersionDto): AssessmentModuleVersionUpdatePublishedDto => {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    staticFileIds: dto.staticFileIds,
    durationInMinutes: dto.durationInMinutes
  };
};

export const assessmentDtoToUpdateDto = (dto: AssessmentModuleVersionDto): AssessmentModuleVersionUpdateDto => {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    staticFileIds: dto.staticFileIds,
    durationInMinutes: dto.durationInMinutes,
    passingScorePercentage: dto.passingScorePercentage
  };
};