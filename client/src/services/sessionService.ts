import axios from "../api/axios";
import { GenericOperationStatuses } from "../models/GenericOperationStatuses";
import { GroupMemberStateWithUserProgress } from "../models/group-member-state-with-user-progress";
import { ExamTakerModuleVersion } from "../models/exam-taker-module-version";
import { ResponseWithData } from "../models/responseWithData";
import { Response } from "../models/response";
import { ModuleProgress } from "../models/module-progress";
import { GroupState } from "../models/group-state";
import { QuestionResponseOperation } from "../models/question-response-operation";

export const sessionService = {
  getGroupState: async (userId: string, examTakerAssignmentId: string): Promise<ResponseWithData<GroupState, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<GroupState, GenericOperationStatuses>>(`/sessions/${userId}/assignment/${examTakerAssignmentId}/group/state`);
    return response.data;
  },

  getGroupMemberStates: async (userId: string, examTakerAssignmentId: string, groupId: string): Promise<ResponseWithData<GroupMemberStateWithUserProgress[], GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<GroupMemberStateWithUserProgress[], GenericOperationStatuses>>(`/sessions/${userId}/assignment/${examTakerAssignmentId}/group/${groupId}/members`);
    return response.data;
  },

  getModuleVersionForExamTaker: async (userId: string, assignmentId: string, assessmentModuleVersionId: string): Promise<ResponseWithData<ExamTakerModuleVersion, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<ExamTakerModuleVersion, GenericOperationStatuses>>(`/sessions/${userId}/assignment/${assignmentId}/module/version/${assessmentModuleVersionId}`);
    return response.data;
  },

  getModuleProgress: async (userId: string, assignmentId: string, assessmentModuleId: string): Promise<ResponseWithData<ModuleProgress, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<ModuleProgress, GenericOperationStatuses>>(`/sessions/${userId}/assignment/${assignmentId}/module/${assessmentModuleId}/progress`);
    return response.data;
  },

  createModuleProgress: async (userId: string, assignmentId: string, assessmentModuleId: string): Promise<ResponseWithData<ModuleProgress, GenericOperationStatuses>> => {
    const response = await axios.post<ResponseWithData<ModuleProgress, GenericOperationStatuses>>(`/sessions/${userId}/assignment/${assignmentId}/module/${assessmentModuleId}/progress`);
    return response.data;
  },

  submitAnswer: async (userProgressId: string, questionResponse: QuestionResponseOperation): Promise<Response<GenericOperationStatuses>> => {
    const response = await axios.post<Response<GenericOperationStatuses>>(`/sessions/progress/${userProgressId}/answer`, questionResponse);
    return response.data;
  },

  completeModule: async (userProgressId: string): Promise<Response<GenericOperationStatuses>> => {
    const response = await axios.post<Response<GenericOperationStatuses>>(`/sessions/progress/${userProgressId}/complete`);
    return response.data;
  }
}