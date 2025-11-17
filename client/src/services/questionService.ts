import { QuestionDto } from "../models/assessment-module";
import { QuestionCreateDto, QuestionUpdateDto } from "../models/assessment-modules-create";
import { GenericOperationStatuses } from "../models/GenericOperationStatuses";
import { ResponseWithData } from "../models/responseWithData";
import { Response } from "../models/response";
import axios from "../api/axios";

export const questionService = {
    createQuestion: async (question: QuestionCreateDto): Promise<ResponseWithData<QuestionDto, GenericOperationStatuses>> => {
        const response = await axios.post<ResponseWithData<QuestionDto, GenericOperationStatuses>>('/assessmentQuestions', question);
        return response.data;
    },

    updateQuestion: async (question: QuestionUpdateDto): Promise<ResponseWithData<QuestionDto, GenericOperationStatuses>> => {
        const response = await axios.put<ResponseWithData<QuestionDto, GenericOperationStatuses>>(`/assessmentQuestions`, question);
        return response.data;
    },

    deleteQuestion: async (questionId: string): Promise<Response> => {
        const response = await axios.delete<Response>(`/assessmentQuestions/${questionId}`);
        return response.data;
    },

  getTotalQuestions: async (): Promise<number> => {
    var response = await axios.get<ResponseWithData<number, GenericOperationStatuses>>('/assessmentQuestions/total');
    return response.data.data;
  }
};
