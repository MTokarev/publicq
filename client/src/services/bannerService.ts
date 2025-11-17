import axios from "../api/axios";
import { BannerResponse } from "../models/banner-response";
import { GenericOperationStatuses } from "../models/GenericOperationStatuses";
import { ResponseWithData } from "../models/responseWithData";

export const BannerService = {

  getAllBanners: async (): Promise<ResponseWithData<BannerResponse[], GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<BannerResponse[], GenericOperationStatuses>>('/banners');
    return response.data;
  },

  getActiveBanners: async (): Promise<ResponseWithData<BannerResponse[], GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<BannerResponse[], GenericOperationStatuses>>('/banners/active');
    return response.data;
  },
  
  createBanner: async (banner: BannerResponse): Promise<ResponseWithData<BannerResponse, GenericOperationStatuses>> => {
    const response = await axios.post<ResponseWithData<BannerResponse, GenericOperationStatuses>>('/banners', banner);
    return response.data;
  },
  
  updateBanner: async (bannerId: string, banner: BannerResponse): Promise<ResponseWithData<BannerResponse, GenericOperationStatuses>> => {
    const response = await axios.patch<ResponseWithData<BannerResponse, GenericOperationStatuses>>(`/banners/${bannerId}`, banner);
    return response.data;
  },
  
  deleteBanner: async (bannerId: string): Promise<ResponseWithData<null, GenericOperationStatuses>> => {
    const response = await axios.delete<ResponseWithData<null, GenericOperationStatuses>>(`/banners/${bannerId}`);
    return response.data;
  }
};
