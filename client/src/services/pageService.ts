import axios from "../api/axios";
import { ContactPageDto } from "../models/contact-page-dto";
import { GenericOperationStatuses } from "../models/GenericOperationStatuses";
import { PageDto } from "../models/page-dto";
import { PageType } from "../models/page-type";
import { ResponseWithData } from "../models/responseWithData";
import { config } from "../config";

export const PageService = {
  setPageContent: async (page: PageDto): Promise<ResponseWithData<PageDto, GenericOperationStatuses>> => {
    const response = await axios.post<ResponseWithData<PageDto, GenericOperationStatuses>>('pages', page);
    return response.data;
  },
  
  getContactPage: async (): Promise<ResponseWithData<ContactPageDto, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<ContactPageDto, GenericOperationStatuses>>('pages/contact');
    return response.data;
  },

  getPageFromFile: async (pageType: PageType): Promise<PageDto> => {
    const pageTypeName = PageType[pageType].toLowerCase();
    const response = await fetch(`${config.staticPagesPath}/${pageTypeName}.json`);
    if (!response.ok) {
      throw new Error(`Page not found: ${pageTypeName}`);
    }
    const data = await response.json();
    return data;
  }
};