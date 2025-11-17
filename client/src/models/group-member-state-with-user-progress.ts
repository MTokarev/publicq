import { GroupMember } from "./group-member";
import { ModuleStatus } from "./module-status";

export interface GroupMemberStateWithUserProgress extends GroupMember {
  id: string;
  name: string;
  status: ModuleStatus | string; // Backend sends string representation of enum
  questionCount: number;
  answerCount: number;
}