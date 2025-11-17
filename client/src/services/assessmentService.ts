import { AssessmentModuleDto, AssessmentModuleVersionDto } from "../models/assessment-module";
import { AssessmentModuleCreateDto, AssessmentModuleVersionCreateDto } from "../models/assessment-modules-create";
import { GenericOperationStatuses } from "../models/GenericOperationStatuses";
import { ResponseWithData } from "../models/responseWithData";
import { Response } from "../models/response";
import { StaticFileDto } from "../models/static-file";
import { AssessmentModuleVersionUpdateDto, AssessmentModuleVersionUpdatePublishedDto } from "../models/assessment-modules-update";
import { FileUploadRequest } from "../models/file-upload-request";
import { AssessmentModuleFilter } from "../models/assessment-module-filter";
import axios from "../api/axios";
import { PaginatedResponse } from "../models/paginatedResponse";

export const assessmentService = {

  createModule: async (module: AssessmentModuleCreateDto): Promise<ResponseWithData<AssessmentModuleDto, GenericOperationStatuses>> => {
    const response = await axios.post<ResponseWithData<AssessmentModuleDto, GenericOperationStatuses>>('assessmentModules', module);
    return response.data;
  },

  fetchModule: async (moduleId: string): Promise<ResponseWithData<AssessmentModuleDto, GenericOperationStatuses>> => {
    // Use filter endpoint with id parameter
    const response = await axios.get<ResponseWithData<AssessmentModuleDto, GenericOperationStatuses>>('assessmentModules/filter', { 
      params: { id: moduleId } 
    });
    return response.data;
  },

  fetchModuleByFilter: async (filter: AssessmentModuleFilter): Promise<ResponseWithData<AssessmentModuleDto, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<AssessmentModuleDto, GenericOperationStatuses>>('assessmentModules/filter', { params: filter });
    return response.data;
  },

  fetchAllModules: async (pageNumber: number, pageSize: number): Promise<ResponseWithData<PaginatedResponse<AssessmentModuleDto>, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<PaginatedResponse<AssessmentModuleDto>, GenericOperationStatuses>>('assessmentModules/all', { params: { pageNumber, pageSize } });
    return response.data;
  },

  fetchAllModulesByTitle: async (title: string, pageNumber: number, pageSize: number): Promise<ResponseWithData<PaginatedResponse<AssessmentModuleDto>, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<PaginatedResponse<AssessmentModuleDto>, GenericOperationStatuses>>('assessmentModules', { params: { title, pageNumber, pageSize } });
    return response.data;
  },

  fetchModuleLatestVersion: async (versionId: string): Promise<ResponseWithData<AssessmentModuleVersionDto, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<AssessmentModuleVersionDto, GenericOperationStatuses>>(`assessmentModules/versions/${versionId}`);
    return response.data;
  },

  fetchLatestPublishedModules: async (pageNumber: number, pageSize: number): Promise<ResponseWithData<PaginatedResponse<AssessmentModuleVersionDto>, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<PaginatedResponse<AssessmentModuleVersionDto>, GenericOperationStatuses>>('assessmentModules/versions/latest/all', { params: { pageNumber, pageSize } });
    return response.data;
  },

  fetchLatestPublishedModulesByTitle: async (title: string, pageNumber: number, pageSize: number): Promise<ResponseWithData<PaginatedResponse<AssessmentModuleVersionDto>, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<PaginatedResponse<AssessmentModuleVersionDto>, GenericOperationStatuses>>('assessmentModules/versions/latest', { params: { title, pageNumber, pageSize } });
    return response.data;
  },

  createNewModuleVersion: async (newVersion: AssessmentModuleVersionCreateDto): Promise<ResponseWithData<AssessmentModuleDto, GenericOperationStatuses>> => {
    const response = await axios.post<ResponseWithData<AssessmentModuleDto, GenericOperationStatuses>>('assessmentModules/versions', newVersion);
    return response.data;
  },

  updateNotPublishedModuleVersion: async (version: AssessmentModuleVersionUpdateDto): Promise<ResponseWithData<AssessmentModuleVersionDto, GenericOperationStatuses>> => {
    const response = await axios.patch<ResponseWithData<AssessmentModuleVersionDto, GenericOperationStatuses>>('assessmentModules/versions/draft', version);
    return response.data;
  },

  updatePublishedModuleVersion: async (version: AssessmentModuleVersionUpdatePublishedDto): Promise<ResponseWithData<AssessmentModuleVersionDto, GenericOperationStatuses>> => {
    const response = await axios.patch<ResponseWithData<AssessmentModuleVersionDto, GenericOperationStatuses>>('assessmentModules/versions/published', version);
    return response.data;
  },

  publishModuleVersion: async (versionId: string): Promise<Response> => {
    const response = await axios.patch<Response>(`assessmentModules/versions/${versionId}/publish`);
    return response.data;
  },

  getTotalModules: async (): Promise<number> => {
    const response = await axios.get<ResponseWithData<number, GenericOperationStatuses>>('assessmentModules/total');
    return response.data.data;
  },

  uploadFile: async (
    filetoUpload: FileUploadRequest
  ): Promise<ResponseWithData<StaticFileDto, GenericOperationStatuses>> => {

    const formData = new FormData();
    formData.append("moduleId", filetoUpload.moduleId);
    formData.append("isModuleLevelFile", String(filetoUpload.isModuleLevelFile ?? false));
    if (filetoUpload.file) {
      formData.append("file", filetoUpload.file);
    }
    const response = await axios.post<ResponseWithData<StaticFileDto, GenericOperationStatuses>>(
      "assessmentModules/files",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    );

    return response.data;
  },

  deleteModule: async (moduleId: string): Promise<Response<GenericOperationStatuses>> => {
    const response = await axios.delete<Response<GenericOperationStatuses>>(`assessmentModules/${moduleId}`);
    return response.data;
  }
};