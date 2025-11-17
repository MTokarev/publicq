import { MessageProvider } from "./MessageProvider";

export interface EmailOption {
  enabled: boolean;
  messageProvider: MessageProvider;
  sendFrom: string;
}
