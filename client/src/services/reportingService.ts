import axios from "../api/axios";
import { GenericOperationStatuses } from "../models/GenericOperationStatuses";
import { IndividualUserReport } from "../models/individual-user-report";
import { PaginatedResponse } from "../models/paginatedResponse";
import { AssignmentReport, AssignmentSummaryReport, ExamTakerReport } from "../models/reporting";
import { ResponseWithData } from "../models/responseWithData";

const reportingService = {
  getExamTakerReport: async (examTakerId: string) : Promise<ResponseWithData<ExamTakerReport, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<ExamTakerReport, GenericOperationStatuses>>(`/reports/exam-takers/${examTakerId}`);
    return response.data;
  },

  getExamTakerReportByAssignment: async (examTakerId: string, assignmentId: string) : Promise<ResponseWithData<ExamTakerReport, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<ExamTakerReport, GenericOperationStatuses>>(`/reports/exam-takers/${examTakerId}/assignments/${assignmentId}`);
    return response.data;
  },

  getExamTakerReports: async (examTakerIds: string[], assignmentId?: string) : Promise<ResponseWithData<ExamTakerReport[], GenericOperationStatuses>> => {
    const response = await axios.post<ResponseWithData<ExamTakerReport[], GenericOperationStatuses>>(`/reports/exam-takers`, {
      examTakerIds,
      assignmentId
    });
    return response.data;
  },

  getAllAssignmentsReport: async (pageNumber: number, pageSize: number) : Promise<ResponseWithData<PaginatedResponse<AssignmentSummaryReport>, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<PaginatedResponse<AssignmentSummaryReport>, GenericOperationStatuses>>(`/reports/assignments`, {
      params: {
        pageNumber,
        pageSize
      }
    });
    return response.data;
  },

  getAllExamTakerReports: async (pageNumber: number, pageSize: number, idFilter?: string, nameFilter?: string) : Promise<ResponseWithData<PaginatedResponse<IndividualUserReport>, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<PaginatedResponse<IndividualUserReport>, GenericOperationStatuses>>(`/reports/exam-takers`, {
      params: {
        idFilter,
        nameFilter,
        pageNumber,
        pageSize
      }
    });
    return response.data;
  },

  getAssignmentSummaryReport: async (assignmentId: string) : Promise<ResponseWithData<AssignmentSummaryReport, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<AssignmentSummaryReport, GenericOperationStatuses>>(`/reports/assignments/${assignmentId}/summary`);
    return response.data;
  },

  getAssignmentReport: async (assignmentId: string) : Promise<ResponseWithData<AssignmentReport, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<AssignmentReport, GenericOperationStatuses>>(`/reports/assignments/${assignmentId}`);
    return response.data;
  }
};

export { reportingService };