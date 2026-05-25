import axios from "../api/axios";
import { GenericOperationStatuses } from "../models/GenericOperationStatuses";
import { GroupMemberStateWithUserProgress } from "../models/group-member-state-with-user-progress";
import { ExamTakerModuleVersion } from "../models/exam-taker-module-version";
import { ResponseWithData } from "../models/responseWithData";
import { Response } from "../models/response";
import { ModuleProgress } from "../models/module-progress";
import { GroupState } from "../models/group-state";
import { QuestionResponseOperation } from "../models/question-response-operation";

// Per-key in-flight request map to coalesce concurrent identical calls
// (double-click Launch / Next, React effect double-fire, etc.).
const inflightRequests = new Map<string, Promise<unknown>>();

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
    const key = `create|${userId}|${assignmentId}|${assessmentModuleId}`;
    const existing = inflightRequests.get(key) as Promise<ResponseWithData<ModuleProgress, GenericOperationStatuses>> | undefined;
    if (existing) return existing;
    const promise = (async () => {
      try {
        const response = await axios.post<ResponseWithData<ModuleProgress, GenericOperationStatuses>>(`/sessions/${userId}/assignment/${assignmentId}/module/${assessmentModuleId}/progress`);
        return response.data;
      } finally {
        inflightRequests.delete(key);
      }
    })();
    inflightRequests.set(key, promise);
    return promise;
  },

  submitAnswer: async (userProgressId: string, questionResponse: QuestionResponseOperation): Promise<Response<GenericOperationStatuses>> => {
    const key = `submit|${userProgressId}|${questionResponse.questionId}`;
    const existing = inflightRequests.get(key) as Promise<Response<GenericOperationStatuses>> | undefined;
    if (existing) return existing;
    const promise = (async () => {
      try {
        const response = await axios.post<Response<GenericOperationStatuses>>(`/sessions/progress/${userProgressId}/answer`, questionResponse);
        return response.data;
      } finally {
        inflightRequests.delete(key);
      }
    })();
    inflightRequests.set(key, promise);
    return promise;
  },

  completeModule: async (userProgressId: string): Promise<Response<GenericOperationStatuses>> => {
    const response = await axios.post<Response<GenericOperationStatuses>>(`/sessions/progress/${userProgressId}/complete`);
    return response.data;
  }
}