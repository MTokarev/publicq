import { Group, GroupCreate, GroupUpdate } from "../models/group"
import { PaginatedResponse } from "../models/paginatedResponse";
import { ResponseWithData } from "../models/responseWithData";
import { GenericOperationStatuses } from "../models/GenericOperationStatuses";
import { SwapGroupMembersOrder } from "../models/swap-group-members-order";
import { GroupMemberCreate } from "../models/group-member";
import axios from "../api/axios";
import { Assignment } from "../models/assignment-base";

export const groupService = {

  getGroup: async (id: string): Promise<Group> => {
    var response = await axios.get<ResponseWithData<Group, GenericOperationStatuses>>(`/groups/${id}`);
    return response.data.data;
  },

  getGroups: async (pageNumber: number, pageSize: number): Promise<PaginatedResponse<Group>> => {
    var response = await axios.get<ResponseWithData<PaginatedResponse<Group>, GenericOperationStatuses>>("/groups", {
      params: {
        pageNumber,
        pageSize
      }
    });
    return response.data.data;
  },

  createGroup: async (group: GroupCreate): Promise<Group> => {
    var response = await axios.post<Group>("/groups", group);
    return response.data;
  },

  addGroupMember: async (id: string, member: GroupMemberCreate): Promise<Group> => {
    var response = await axios.post<ResponseWithData<Group, GenericOperationStatuses>>(`/groups/${id}/member`, member);
    return response.data.data;
  },

  updateGroup: async (group: GroupUpdate): Promise<Group> => {
    var response = await axios.patch<Group>(`/groups`, group);
    return response.data;
  },

  deleteGroup: async (id: string): Promise<void> => {
    await axios.delete(`/groups/${id}`);
  },

  removeGroupMember: async (memberId: string): Promise<Group> => {
    var response = await axios.delete<ResponseWithData<Group, GenericOperationStatuses>>(`/groups/member/${memberId}`);
    return response.data.data;
  },

  swapGroupMembersOrder: async (swapRequest: SwapGroupMembersOrder): Promise<Group> => {
    var response = await axios.patch<ResponseWithData<Group, GenericOperationStatuses>>('/groups/members/swap-order', swapRequest);
    return response.data.data;
  },

  getTotalGroups: async (): Promise<number> => {
    var response = await axios.get<ResponseWithData<number, GenericOperationStatuses>>('/groups/total');
    return response.data.data;
  },

  getGroupAssignments: async (groupId: string): Promise<ResponseWithData<Assignment[], GenericOperationStatuses>> => {
    var response = await axios.get<ResponseWithData<Assignment[], GenericOperationStatuses>>(`/groups/${groupId}/assignments`);
    return response.data;
  }
};
