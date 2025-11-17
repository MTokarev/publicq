import { GenericOperationStatuses } from "./GenericOperationStatuses";

export interface Response<TStatus = GenericOperationStatuses> {
  status: TStatus;
  message: string;
  errors: string[];
  isSuccess: boolean;
  isFailed: boolean;
}