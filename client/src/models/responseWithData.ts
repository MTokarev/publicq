import { GenericOperationStatuses } from "./GenericOperationStatuses";
import { Response } from "./response";

export interface ResponseWithData<TData, TStatus = GenericOperationStatuses> extends Response<TStatus> {
  data: TData;
}
