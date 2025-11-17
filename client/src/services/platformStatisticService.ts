import axios from "../api/axios";
import { GenericOperationStatuses } from "../models/GenericOperationStatuses";
import { PlatformStatistic } from "../models/platform-statistic";
import { ResponseWithData } from "../models/responseWithData";

export const PlatformStatisticService = {
  async getPlatformStatistics(): Promise<ResponseWithData<PlatformStatistic, GenericOperationStatuses>> {
    const response = await axios.get<ResponseWithData<PlatformStatistic, GenericOperationStatuses>>('platform-statistics');
    return response.data;
  }
}