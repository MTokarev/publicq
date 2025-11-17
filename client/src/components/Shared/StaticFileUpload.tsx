import { FilePreview } from "./FilePreview";
import FilePicker from "./FilePicker";
import { StaticFileDto } from "../../models/static-file";

type PreviewFile = File | StaticFileDto;

interface Props {
  files: PreviewFile[];
  onFilesChange: (files: PreviewFile[]) => void;
}

const StaticFileUpload = ({ files, onFilesChange }: Props) => {
  const handleFilesSelected = (fileList: FileList) => {
    const newFiles = Array.from(fileList);
    onFilesChange([...files, ...newFiles]);
  };

  const handleFilesChange = (updatedFiles: PreviewFile[]) => {
    onFilesChange(updatedFiles);
  };

  return (
    <div style={styles.moduleSection}>
      <h3 style={styles.moduleSectionTitle}>Static Files</h3>
      <FilePicker
        accept=".jpg,.jpeg,.png,.mp3,.mp4"
        multiple
        onFilesSelected={handleFilesSelected}
      />
      <FilePreview files={files} onFilesChange={handleFilesChange} />
    </div>
  );
};

export default StaticFileUpload;

const styles = {
  moduleSection: {
    marginTop: 20,
  },
  moduleSectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#444",
    marginBottom: 8,
  },
};