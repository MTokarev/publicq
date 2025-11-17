export interface FileUploadMeta {
  name: string;
  url: string;
  type: Blob['type'];
  extension: string;
  id?: string; // For StaticFileDto objects
}
