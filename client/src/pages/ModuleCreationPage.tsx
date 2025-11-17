import { useNavigate } from "react-router-dom";
import { ModuleForm } from "../components/AssessmentModuleForm/ModuleForm";
import { AssessmentModuleDto } from "../models/assessment-module";

const ModuleCreationPage = () => {
  const navigate = useNavigate();

  const handleBackToModules = () => {
    window.location.href = '/admin#assessments';
  };

  const handleSuccess = (newModule: AssessmentModuleDto) => {
    // Navigate to the module builder with the new module ID
    navigate(`/module/build?moduleId=${newModule.id}`);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.heading}>Create Assessment Module</h1>
        <ModuleForm 
          onSuccess={handleSuccess}
          onBackToModules={handleBackToModules}
        />
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f9fafb", // gray-50
    padding: "3rem 1rem",
  },
  container: {
    maxWidth: "1024px",
    margin: "0 auto",
  },
  heading: {
    fontSize: "2.25rem",
    fontWeight: 700,
    color: "#111827", // gray-900
    marginBottom: "2.5rem",
    textAlign: "center" as const,
    letterSpacing: "-0.025em",
    lineHeight: "1.1",
    background: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
} as const;

export default ModuleCreationPage;
