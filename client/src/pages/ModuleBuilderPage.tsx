import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AssessmentModuleDto, AssessmentModuleVersionDto } from "../models/assessment-module";
import { assessmentService } from "../services/assessmentService";
import { QuestionList } from "../components/QuestionManager/QuestionList";
import { ModuleEditForm } from "../components/AssessmentModuleForm/ModuleEditForm";
import { ModuleInfoHeader } from "../components/AssessmentModuleForm/ModuleInfoHeader";
import { assessmentDtoToCreateDto, AssessmentModuleVersionCreateDto } from "../models/assessment-modules-create";

const ModuleBuilderPage = () => {
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get('moduleId');

  const [module, setModule] = useState<AssessmentModuleDto>();
  const [showModuleEditForm, setShowModuleEditForm] = useState(false);
  const [isLoadingModule, setIsLoadingModule] = useState(false);

  const handleBackToModules = () => {
    window.location.href = '/admin#assessments';
  };

  // Add mobile responsive styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        .module-builder-container {
          padding: 0 16px !important;
        }
        .module-builder-heading {
          font-size: 1.75rem !important;
          margin-bottom: 1.5rem !important;
          padding: 0 8px !important;
        }
        .module-info-header {
          padding: 16px !important;
          border-radius: 8px !important;
        }
        .module-info-actions {
          flex-direction: column !important;
          gap: 12px !important;
          width: 100% !important;
        }
        .module-info-button {
          width: 100% !important;
          max-width: 280px !important;
          margin: 0 auto !important;
          font-size: 14px !important;
          padding: 12px 16px !important;
        }
        .question-list-container {
          margin: 0 -16px !important;
          padding: 0 16px !important;
        }
        .question-card {
          margin-bottom: 16px !important;
          border-radius: 8px !important;
        }
        .question-actions {
          flex-direction: column !important;
          gap: 8px !important;
        }
        .question-action-button {
          width: 100% !important;
          font-size: 14px !important;
          padding: 10px 12px !important;
        }
      }
      @media (max-width: 480px) {
        .module-builder-container {
          padding: 0 12px !important;
        }
        .module-builder-heading {
          font-size: 1.5rem !important;
          margin-bottom: 1rem !important;
        }
        .module-info-button {
          max-width: 260px !important;
          font-size: 13px !important;
          padding: 10px 14px !important;
        }
        .question-list-container {
          margin: 0 -12px !important;
          padding: 0 12px !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Load module from URL parameter on component mount
  useEffect(() => {
    const loadModule = async () => {
      if (moduleId) {
        setIsLoadingModule(true);
        try {
          // Load existing module for editing
          const moduleFromDbResponse = await assessmentService.fetchModule(moduleId);

          if (moduleFromDbResponse.isFailed) {
            return;
          }
          
          setModule(moduleFromDbResponse.data);
        } catch (error) {
          // Failed to load module
        } finally {
          setIsLoadingModule(false);
        }
      }
    };

    loadModule();
  }, [moduleId]);

  async function handleNewVersion(moduleVersion: AssessmentModuleVersionDto): Promise<void> {
    try {
      const versionToCreate: AssessmentModuleVersionCreateDto = assessmentDtoToCreateDto(module!.id, moduleVersion);
      const response = await assessmentService.createNewModuleVersion(versionToCreate);

      if (response.isFailed) {
        return;
      }

      // Create a new module object with the new version data
      setModule({
        ...module!,
        latestVersion: response.data.latestVersion
      });
      
      setShowModuleEditForm(false);
    } catch (error) {
      // Error creating new module version
    }
  }

  // Show loading state when we have a moduleId but are still loading the module
  if (moduleId && isLoadingModule) {
    return (
      <div style={styles.page}>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
        <div style={styles.container}>
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p style={styles.loadingText}>Loading module...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if no module ID or module couldn't be loaded
  if (!moduleId || !module) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loadingContainer}>
            <p style={styles.loadingText}>Module not found or invalid module ID</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={styles.container} className="module-builder-container">
        <h1 style={styles.heading} className="module-builder-heading">Assessment Module Builder</h1>
        
        <ModuleInfoHeader
          module={module}
          moduleVersion={module.latestVersion}
          questionCount={module.latestVersion.questions?.length || 0}
          onEdit={() => setShowModuleEditForm(true)}
          onBackToModules={handleBackToModules}
          onPublish={() => {
            // Mock publish functionality - only for draft modules
            
            // Update the module state to published
            setModule({
              ...module,
              latestVersion: {
                ...module.latestVersion,
                isPublished: true
              }
            });
          }}
        />
        <div className="question-list-container">
          <QuestionList
            moduleVersionId={module.latestVersion.id}
            moduleId={module.id}
            moduleVersionIsPublished={module.latestVersion.isPublished}
            onQuestionsChange={(questions) => {
            setModule(prev => ({
              ...prev!,
              latestVersion: {
                ...prev!.latestVersion,
                questions: questions
              }
            }));
          }}
          onVersionDataLoaded={(completeVersionData) => {
            // Update the module with complete version data including static files
            setModule(prev => ({
              ...prev!,
              latestVersion: completeVersionData
            }));
          }}
        />
        </div>
      </div>
      
      {/* Module Edit Form Modal */}
      {showModuleEditForm && module && (
        <ModuleEditForm 
          moduleId={module.id}
          moduleVersion={module.latestVersion}
          onModuleUpdate={(updatedModule) => {
            // Update the module in state
            setModule({
              ...module,
              latestVersion: updatedModule
            });
            setShowModuleEditForm(false);
          }}
          onCreateNewVersion={handleNewVersion}
          onClose={() => setShowModuleEditForm(false)}
        />
      )}
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
  loadingContainer: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "4rem 2rem",
    textAlign: "center" as const,
  },
  loadingSpinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e5e7eb",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "1rem",
  },
  loadingText: {
    fontSize: "1.125rem",
    fontWeight: 500,
    color: "#6b7280",
    margin: 0,
  },
} as const;

export default ModuleBuilderPage;
