import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';
import { reportingService } from '../../services/reportingService';
import { AssignmentReport } from '../../models/reporting';
import { ModuleStatus } from '../../models/module-status';
import { formatDateToLocal } from '../../utils/dateUtils';

interface AssignmentFullReportProps {
  assignmentId: string;
  assignmentTitle: string;
  onBack: () => void;
}

const AssignmentFullReport: React.FC<AssignmentFullReportProps> = ({
  assignmentId,
  assignmentTitle,
  onBack
}) => {
  const [assignmentReport, setAssignmentReport] = useState<AssignmentReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  // Fetch full assignment report
  const fetchAssignmentReport = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await reportingService.getAssignmentReport(assignmentId);
      
      if (response.isSuccess) {
        setAssignmentReport(response.data);
      } else {
        setError(response.message || 'Failed to load assignment report');
      }
    } catch (error) {
      setError('Failed to load assignment report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentReport();
  }, [assignmentId]);

  // Add mobile responsive styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        .assignment-full-report-header {
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 16px !important;
          text-align: center !important;
        }
        .assignment-full-report-header-left {
          display: none !important;
        }
        .assignment-full-report-title-section {
          order: 1 !important;
        }
        .assignment-full-report-header-buttons {
          order: 2 !important;
          display: flex !important;
          flex-direction: row !important;
          gap: 8px !important;
          justify-content: center !important;
        }
        .assignment-full-report-button {
          flex: 1 !important;
          max-width: 110px !important;
          font-size: 10px !important;
          padding: 6px 4px !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          line-height: 1.2 !important;
          text-align: center !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .mobile-back-button {
          display: flex !important;
        }
      }
      @media (min-width: 769px) {
        .mobile-back-button {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Handle PDF export - Single long page approach
  const handleExportPDF = async () => {
    try {
      // Get the content to export
      const element = document.getElementById('full-report-content');
      if (!element) {
        alert('Unable to find content to export');
        return;
      }

      // Show loading indicator
      const exportButton = document.querySelector('[data-export-button]') as HTMLButtonElement;
      if (exportButton) {
        exportButton.textContent = 'Generating PDF...';
        exportButton.disabled = true;
      }

      // Render element to canvas with balanced quality and file size
      const canvas = await html2canvas(element, { 
        scale: 1.2, // Moderate scale for good quality without huge file size
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        height: element.scrollHeight,
        width: element.scrollWidth
      });
      
      // Convert to high quality JPEG for smaller file size
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      
      // Calculate dimensions to fit standard width
      const standardWidth = 210; // A4 width in mm
      const imgWidth = standardWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF with custom height to fit all content
      const totalHeight = imgHeight + 60; // Add padding for header
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [standardWidth, totalHeight] // Custom page size
      });

      // Add title header
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${assignmentTitle} - Full Report`, standardWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, standardWidth / 2, 30, { align: 'center' });

      // Add the entire content as one image with JPEG format
      pdf.addImage(imgData, 'JPEG', 0, 40, imgWidth, imgHeight);

      // Save the PDF
      const filename = `${assignmentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_full_report.pdf`;
      pdf.save(filename);

      // Reset button
      if (exportButton) {
        exportButton.innerHTML = '<img src="/images/icons/save.svg" alt="" style="width: 16px; height: 16px; margin-right: 6px; vertical-align: middle;" />Export PDF';
        exportButton.disabled = false;
      }

    } catch (error) {
      alert('Failed to generate PDF. Please try again.');
      
      const exportButton = document.querySelector('[data-export-button]') as HTMLButtonElement;
      if (exportButton) {
        exportButton.innerHTML = '<img src="/images/icons/save.svg" alt="" style="width: 16px; height: 16px; margin-right: 6px; vertical-align: middle;" />Export PDF';
        exportButton.disabled = false;
      }
    }
  };

  // Generate student performance scatter plot data
  const generateStudentPerformanceData = () => {
    if (!assignmentReport?.examTakerReports) return [];
    
    return assignmentReport.examTakerReports.map(student => ({
      name: student.displayName,
      score: student.overallAverageScore || 0,
      timeSpent: student.totalTimeSpentMinutes,
      completedAssignments: student.completedAssignments,
      totalAssignments: student.totalAssignments,
      completionRate: student.totalAssignments > 0 ? (student.completedAssignments / student.totalAssignments) * 100 : 0
    }));
  };

  // Generate time distribution chart data
  const generateTimeDistributionData = () => {
    if (!assignmentReport?.examTakerReports) return [];
    
    const timeRanges = [
      { min: 0, max: 30, label: '0-30 min' },
      { min: 31, max: 60, label: '31-60 min' },
      { min: 61, max: 120, label: '1-2 hours' },
      { min: 121, max: 180, label: '2-3 hours' },
      { min: 181, max: Infinity, label: '3+ hours' }
    ];

    return timeRanges.map(range => {
      const count = assignmentReport.examTakerReports.filter(student => 
        student.totalTimeSpentMinutes >= range.min && student.totalTimeSpentMinutes <= range.max
      ).length;
      
      return {
        timeRange: range.label,
        students: count,
        percentage: assignmentReport.examTakerReports.length > 0 
          ? (count / assignmentReport.examTakerReports.length) * 100 
          : 0
      };
    });
  };

  // Generate score distribution chart data
  const generateScoreDistributionData = () => {
    if (!assignmentReport?.examTakerReports) return [];
    
    const scoreRanges = [
      { min: 0, max: 50, label: '0-50%', color: '#ef4444' },
      { min: 51, max: 70, label: '51-70%', color: '#f59e0b' },
      { min: 71, max: 85, label: '71-85%', color: '#eab308' },
      { min: 86, max: 100, label: '86-100%', color: '#10b981' }
    ];

    return scoreRanges.map(range => {
      const studentsInRange = assignmentReport.examTakerReports.filter(student => {
        const score = student.overallAverageScore || 0;
        return score >= range.min && score <= range.max;
      });
      
      return {
        scoreRange: range.label,
        students: studentsInRange.length,
        percentage: assignmentReport.examTakerReports.length > 0 
          ? (studentsInRange.length / assignmentReport.examTakerReports.length) * 100 
          : 0,
        color: range.color
      };
    });
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={styles.tooltip}>
          <p style={styles.tooltipLabel}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color, margin: '4px 0' }}>
              {`${entry.dataKey}: ${entry.value}${entry.dataKey.includes('Rate') || entry.dataKey.includes('Score') || entry.dataKey.includes('percentage') ? '%' : ''}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Generate individual student module progress chart data
  const generateStudentModuleProgressData = (student: any) => {
    const moduleProgress = getModuleProgress(student);
    return moduleProgress.moduleReports.map((module: any) => ({
      name: module.moduleTitle.length > 15 ? module.moduleTitle.substring(0, 15) + '...' : module.moduleTitle,
      score: module.score || 0,
      passingScore: module.passingScore || 0,
      status: module.status,
      passed: module.passed
    }));
  };

  // Generate individual student performance summary for pie chart
  const generateStudentPerformanceSummary = (student: any) => {
    const moduleProgress = getModuleProgress(student);
    const completed = moduleProgress.completedModules;
    const inProgress = moduleProgress.moduleReports.filter((m: any) => 
      m.status === 'InProgress' || m.status === ModuleStatus.InProgress
    ).length;
    const notStarted = moduleProgress.totalModules - completed - inProgress;

    return [
      { name: 'Completed', value: completed, color: '#84cc97' },
      { name: 'In Progress', value: inProgress, color: '#f4b76a' },
      { name: 'Not Started', value: notStarted, color: '#e5e7eb' }
    ].filter(item => item.value > 0);
  };

  // Toggle student details expansion
  const toggleStudentDetails = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  // Get module progress for the current assignment
  const getModuleProgress = (student: any) => {
    // Find the assignment progress for the current assignment being viewed
    const currentAssignmentProgress = student.assignmentProgress.find(
      (ap: any) => ap.assignmentId === assignmentId
    );
    
    if (currentAssignmentProgress) {
      return {
        completedModules: currentAssignmentProgress.completedModules,
        totalModules: currentAssignmentProgress.totalModules,
        moduleReports: currentAssignmentProgress.moduleReports
      };
    }
    
    // Fallback: if no specific assignment found, aggregate all modules
    const totalCompleted = student.assignmentProgress.reduce((sum: number, ap: any) => sum + ap.completedModules, 0);
    const totalModules = student.assignmentProgress.reduce((sum: number, ap: any) => sum + ap.totalModules, 0);
    const allModules = student.assignmentProgress.flatMap((ap: any) => ap.moduleReports);
    
    return {
      completedModules: totalCompleted,
      totalModules: totalModules,
      moduleReports: allModules
    };
  };

  // Get status color for modules
  // Helper function to determine if a module status should show as green
  const isModuleStatusGreen = (status: any): boolean => {
    // Handle both enum values and string values
    return status === ModuleStatus.Completed || 
           status === 'Completed' ||
           status === ModuleStatus.WaitForModuleDurationToElapse || 
           status === 'WaitForModuleDurationToElapse' ||
           status === ModuleStatus.InProgress ||
           status === 'InProgress';
  };

  const getModuleStatusColor = (completed: number, inProgress: number, total: number) => {
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    if (completionRate === 100) return '#10b981'; // Green
    if (completionRate >= 50) return '#10b981'; // Green (changed from orange)
    if (inProgress > 0) return '#3b82f6'; // Blue
    return '#ef4444'; // Red
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading full assignment report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <h2 style={styles.errorTitle}>Error Loading Report</h2>
          <p style={styles.errorText}>{error}</p>
          <button onClick={onBack} style={styles.backButton}>
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  if (!assignmentReport) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <h2 style={styles.errorTitle}>Report Not Found</h2>
          <p style={styles.errorText}>The assignment report could not be loaded.</p>
          <button onClick={onBack} style={styles.backButton}>
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  const studentPerformanceData = generateStudentPerformanceData();
  const timeDistributionData = generateTimeDistributionData();
  const scoreDistributionData = generateScoreDistributionData();

  return (
    <div style={styles.wrapper}>
    <div style={styles.container} id="full-report-content">
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Enhanced PDF page break controls */
          @media print {
            .student-card {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              margin-bottom: 20px;
            }
            
            .chart-card {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              margin-bottom: 20px;
            }
            
            .overview-card {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              margin-bottom: 20px;
            }
            
            .assignment-card {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              margin-bottom: 15px;
            }
            
            .module-item {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            
            .student-charts-container {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            
            .section-break {
              page-break-before: auto;
              margin-top: 30px;
            }
          }
          
          /* PDF-friendly spacing and sizing */
          .pdf-section {
            margin-bottom: 30px;
            padding: 20px 0;
          }
          
          .pdf-page-break {
            page-break-before: always;
          }
        `}
      </style>
      {/* Header */}
      <div style={styles.header} className="assignment-full-report-header">
        <div style={styles.headerLeft} className="assignment-full-report-header-left">
          <button onClick={onBack} style={styles.backButton} className="assignment-full-report-button">
            ← Back to Reports
          </button>
        </div>
        <div style={styles.titleSection} className="assignment-full-report-title-section">
          <h1 style={styles.title}>Full Assignment Report</h1>
          <h2 style={styles.subtitle}>{assignmentReport.assignmentTitle}</h2>
        </div>
        <div style={styles.headerButtons} className="assignment-full-report-header-buttons">
          <button 
            onClick={onBack}
            style={styles.backButton}
            className="assignment-full-report-button mobile-back-button"
          >
            ← Back
          </button>
          <button 
            onClick={handleExportPDF}
            style={styles.exportButton}
            className="assignment-full-report-button"
            data-export-button
          >
            <img src="/images/icons/save.svg" alt="" style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle'}} />Export PDF
          </button>
          <button 
            onClick={() => fetchAssignmentReport()}
            style={styles.refreshButton}
            className="assignment-full-report-button"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Assignment Overview */}
      <div style={styles.overviewSection} className="pdf-section" data-summary="true">
        <h3 style={styles.sectionTitle}>Assignment Overview</h3>
        <div style={styles.overviewGrid}>
          <div style={styles.overviewCard} className="overview-card">
            <h4 style={styles.cardTitle}>Basic Information</h4>
            <div style={styles.cardContent}>
              <p style={styles.cardContentP}><strong>Description:</strong> {assignmentReport.assignmentDescription || 'No description provided'}</p>
              <p><strong>Start Date:</strong> {formatDateToLocal(assignmentReport.startDateUtc)}</p>
              <p><strong>End Date:</strong> {formatDateToLocal(assignmentReport.endDateUtc)}</p>
              <p><strong>Status:</strong> <span style={{
                ...styles.statusBadge,
                backgroundColor: assignmentReport.isActive ? '#dcfce7' : '#dcfce7',
                color: assignmentReport.isActive ? '#166534' : '#166534'
              }}>
                {assignmentReport.isActive ? 'Active' : 'Inactive'}
              </span></p>
            </div>
          </div>

          <div style={styles.overviewCard} className="overview-card">
            <h4 style={styles.cardTitle}>Student Statistics</h4>
            <div style={styles.statsGrid}>
              <div style={styles.statItem}>
                <span style={styles.statNumber}>{assignmentReport.totalStudents}</span>
                <span style={styles.statLabel}>Total Students</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statNumber}>{assignmentReport.completedStudents}</span>
                <span style={styles.statLabel}>Completed</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statNumber}>{assignmentReport.inProgressStudents}</span>
                <span style={styles.statLabel}>In Progress</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statNumber}>{assignmentReport.notStartedStudents}</span>
                <span style={styles.statLabel}>Not Started</span>
              </div>
            </div>
          </div>

          <div style={styles.overviewCard} className="overview-card">
            <h4 style={styles.cardTitle}>Performance Metrics</h4>
            <div style={styles.cardContent}>
              <p><strong>Completion Rate:</strong> {assignmentReport.completionRate.toFixed(1)}%</p>
              <p><strong>Average Score:</strong> {assignmentReport.averageScore?.toFixed(1) ?? 'N/A'}%</p>
              <p><strong>Average Completion Time:</strong> {
                assignmentReport.averageCompletionTimeMinutes 
                  ? `${Math.round(assignmentReport.averageCompletionTimeMinutes)} minutes`
                  : 'N/A'
              }</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div style={styles.chartsSection} className="pdf-section section-break" data-summary="true">
        <h3 style={styles.sectionTitle}>Performance Analytics</h3>
        
        <div style={styles.chartsGrid}>
          {/* Score Distribution */}
          <div style={styles.chartCard} className="chart-card">
            <h4 style={styles.chartTitle}>Score Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="scoreRange" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="students" name="Students" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Time Distribution */}
          <div style={styles.chartCard} className="chart-card">
            <h4 style={styles.chartTitle}>Time Spent Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={timeDistributionData.filter(d => d.students > 0)}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="students"
                  label={(entry: any) => `${entry.timeRange}: ${entry.students}`}
                >
                  {timeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#22c55e" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Student Performance Scatter */}
          <div style={styles.fullWidthChartCard} className="chart-card">
            <h4 style={styles.chartTitle}>Student Performance Overview (Score vs Time Spent)</h4>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart data={studentPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timeSpent" 
                  name="Time Spent (minutes)" 
                  label={{ value: 'Time Spent (minutes)', position: 'insideBottom', offset: -10 }}
                />
                <YAxis 
                  dataKey="score" 
                  name="Average Score (%)" 
                  label={{ value: 'Average Score (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={styles.tooltip}>
                          <p style={styles.tooltipLabel}>{data.name}</p>
                          <p>Score: {data.score.toFixed(1)}%</p>
                          <p>Time Spent: {data.timeSpent} min</p>
                          <p>Completion: {data.completedAssignments}/{data.totalAssignments}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Students" dataKey="score" fill="#3b82f6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Individual Reports */}
      <div style={styles.studentsSection} className="pdf-section section-break">
        <h3 style={styles.sectionTitle}>Individual Reports</h3>
        
        <div style={styles.studentsCardsContainer}>
          {assignmentReport.examTakerReports.map((student) => {
            const moduleProgress = getModuleProgress(student);
            const inProgressModules = moduleProgress.moduleReports.filter((m: any) => 
              m.status === ModuleStatus.InProgress || m.status === 'InProgress'
            ).length;
            
            // Consider student as in progress if they have any in-progress modules OR
            // they have started but not completed all modules
            const isStudentInProgress = inProgressModules > 0 || 
              (moduleProgress.completedModules > 0 && moduleProgress.completedModules < moduleProgress.totalModules);
            
            return (
              <div key={student.studentId} style={styles.studentCard} className="student-card" data-student-card={student.studentId}>
                {/* Student Card Header */}
                <div style={styles.studentCardHeader}>
                  <div style={styles.studentHeaderInfo}>
                    <div style={styles.studentHeaderMain}>
                      <h4 style={styles.studentCardName}>{student.displayName}</h4>
                      <span style={styles.studentCardId}>ID: {student.studentId}</span>
                    </div>
                    
                    <div style={styles.studentHeaderStats}>
                      <div style={styles.studentStatItem}>
                        <span style={styles.studentStatLabel}>Progress:</span>
                        <span style={styles.studentStatValue}>
                          {moduleProgress.completedModules}/{moduleProgress.totalModules} modules
                        </span>
                      </div>
                      
                      <div style={styles.studentStatItem}>
                        <span style={styles.studentStatLabel}>Time:</span>
                        <span style={styles.studentStatValue}>
                          {student.totalTimeSpentMinutes > 60 
                            ? `${Math.floor(student.totalTimeSpentMinutes / 60)}h ${student.totalTimeSpentMinutes % 60}m`
                            : `${student.totalTimeSpentMinutes}m`
                          }
                        </span>
                      </div>
                      
                      <div style={styles.studentStatItem}>
                        <span style={styles.studentStatLabel}>Status:</span>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: (moduleProgress.completedModules === moduleProgress.totalModules && moduleProgress.totalModules > 0) ? '#dcfce7' : 
                            isStudentInProgress ? '#dcfce7' : '#fef3c7',
                          color: (moduleProgress.completedModules === moduleProgress.totalModules && moduleProgress.totalModules > 0) ? '#166534' : 
                            isStudentInProgress ? '#166534' : '#92400e'
                        }}>
                          {(moduleProgress.completedModules === moduleProgress.totalModules && moduleProgress.totalModules > 0) ? 'Completed' : 
                            isStudentInProgress ? 'In Progress' : 'Not Started'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={styles.studentProgressBar}>
                  <div 
                    style={{
                      ...styles.studentProgressFill,
                      width: `${moduleProgress.totalModules > 0 ? (moduleProgress.completedModules / moduleProgress.totalModules) * 100 : 0}%`,
                      backgroundColor: getModuleStatusColor(moduleProgress.completedModules, inProgressModules, moduleProgress.totalModules)
                    }}
                  />
                </div>
                {/* Student Details - Always Expanded */}
                <div style={styles.studentDetailsExpanded}>
                  {/* Check if student has started the assignment */}
                  {(moduleProgress.completedModules === moduleProgress.totalModules && moduleProgress.totalModules > 0) || isStudentInProgress ? (
                    <>
                      <h5 style={styles.detailsTitle}>Individual Performance Analytics</h5>
                      
                      {/* Student Charts Section */}
                      <div style={styles.studentChartsContainer}>
                        {/* Module Progress Overview */}
                        <div style={styles.studentChartCard}>
                          <h6 style={styles.studentChartTitle}>Module Progress Overview</h6>
                          <div style={styles.chartContainer}>
                            <ResponsiveContainer width="100%" height={200}>
                              <PieChart>
                                <Pie
                                  data={generateStudentPerformanceSummary(student)}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={60}
                                  dataKey="value"
                                  label={({ name, value }) => (value && Number(value) > 0) ? `${name}: ${value}` : ''}
                                >
                                  {generateStudentPerformanceSummary(student).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Module Scores Chart */}
                        <div style={styles.studentChartCard}>
                          <h6 style={styles.studentChartTitle}>Module Scores</h6>
                          <div style={styles.chartLegend}>
                            <div style={styles.legendItem}>
                              <div style={{...styles.legendColor, backgroundColor: '#3b82f6'}}></div>
                              <span style={styles.legendText}>Student Score</span>
                            </div>
                            <div style={styles.legendItem}>
                              <div style={{...styles.legendColor, backgroundColor: '#6b7280'}}></div>
                              <span style={styles.legendText}>Passing Score</span>
                            </div>
                          </div>
                          <div style={styles.chartContainer}>
                            <ResponsiveContainer width="100%" height={200}>
                              <BarChart data={generateStudentModuleProgressData(student)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                  dataKey="name" 
                                  angle={-45}
                                  textAnchor="end"
                                  height={60}
                                  fontSize={10}
                                />
                                <YAxis domain={[0, 100]} />
                                <Tooltip 
                                  formatter={(value, name) => [
                                    `${value}%`, 
                                    name === 'score' ? 'Score' : name === 'passingScore' ? 'Passing Score' : name
                                  ]}
                                />
                                <Bar dataKey="score" fill="#3b82f6" name="Score" />
                                <Bar dataKey="passingScore" fill="#6b7280" name="Passing Score" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      <h5 style={styles.detailsTitle}>Assignment Progress Details</h5>
                      <div style={styles.assignmentsList}>
                        {student.assignmentProgress.map((assignment) => (
                          <div key={assignment.assignmentId} style={styles.assignmentCard} className="assignment-card">
                            {assignment.moduleReports.length > 0 && (
                              <div style={styles.modulesList}>
                                <p><strong>Module Details:</strong></p>
                                {assignment.moduleReports.map((module) => (
                                  <div key={module.moduleId} style={styles.moduleItem}>
                                    <div style={styles.moduleName}>{module.moduleTitle}</div>
                                    <div style={styles.moduleDetails}>
                                      {(String(module.status) !== 'NotStarted' && 
                                        String(module.status) !== 'Locked' && 
                                        String(module.status) !== 'Scheduled') && (
                                        <>
                                          {module.passingScore !== null && module.passingScore !== undefined && (
                                            <div style={styles.moduleDetailRow}>
                                              <span><strong>Passing Score:</strong> {module.passingScore.toFixed(1)}%</span>
                                            </div>
                                          )}
                                          <div style={styles.moduleDetailRow}>
                                            <span><strong>Score:</strong> {module.score?.toFixed(1) ?? 'N/A'}%</span>
                                            {(module.score !== null && module.score !== undefined) && (
                                              <span style={{
                                                marginLeft: '8px',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '0.8em',
                                                backgroundColor: module.passed ? '#dcfce7' : '#fef3c7',
                                                color: module.passed ? '#166534' : '#92400e'
                                              }}>
                                                {module.passed ? 'Passed' : 'Failed'}
                                              </span>
                                            )}
                                          </div>
                                          <div style={styles.moduleDetailRow}>
                                            <span><strong>Questions:</strong> {module.answeredQuestions ?? 0}/{module.totalQuestions ?? 0}</span>
                                          </div>
                                        </>
                                      )}
                                      <div style={styles.moduleDetailRow}>
                                        <span><strong>Status:</strong></span>
                                        <span style={{
                                          ...styles.moduleStatus,
                                          backgroundColor: isModuleStatusGreen(module.status) ? '#dcfce7' : '#fef3c7',
                                          color: isModuleStatusGreen(module.status) ? '#166534' : '#92400e',
                                          marginLeft: '8px'
                                        }}>
                                          {module.status}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={styles.notStartedMessage}>
                      <h5 style={styles.detailsTitle}>Individual Performance Analytics</h5>
                      <div style={styles.notStartedContent}>
                        <p style={styles.notStartedText}>
                          <img src="/images/icons/chart.svg" alt="" style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle'}} />Individual Performance Analytics will be available once the student launches this assignment.
                        </p>
                        <p style={styles.notStartedSubtext}>
                          Performance metrics, charts, and detailed progress reports will appear here after the student begins their first module.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    padding: '20px',
    backgroundColor: '#f9fafb',
    minHeight: '100vh',
  },
  container: {
    padding: '0',
    maxWidth: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  headerLeft: {
    flex: '0 0 auto',
  },
  titleSection: {
    flex: 1,
    textAlign: 'center',
  },
  exportButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#7c3aed',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerButtons: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flex: '0 0 auto',
  },
  refreshButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#10b981',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.3)',
  },
  backButton: {
    padding: '12px 20px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    transition: 'all 0.2s ease-in-out',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    margin: '0',
    color: '#111827',
    letterSpacing: '-0.025em',
  },
  subtitle: {
    fontSize: '20px',
    fontWeight: 500,
    margin: '4px 0 0 0',
    color: '#6b7280',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: '16px',
  },
  errorContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#ef4444',
    marginBottom: '16px',
  },
  errorText: {
    color: '#6b7280',
    marginBottom: '24px',
  },
  overviewSection: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '20px',
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '20px',
    margin: '0 0 20px 0',
  },
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  overviewCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: '#f9fafb',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '12px',
    margin: '0 0 12px 0',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cardContentP: {
    margin: '0',
    whiteSpace: 'pre-wrap',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  statItem: {
    textAlign: 'center',
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
  },
  statNumber: {
    display: 'block',
    fontSize: '20px',
    fontWeight: 700,
    color: '#1f2937',
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
  },
  chartsSection: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '20px',
    marginBottom: '30px',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
  },
  chartCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: '#f9fafb',
  },
  fullWidthChartCard: {
    gridColumn: '1 / -1',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: '#f9fafb',
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '16px',
    margin: '0 0 16px 0',
  },
  tooltip: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '8px 12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  tooltipLabel: {
    fontWeight: 600,
    marginBottom: '4px',
    color: '#1f2937',
  },
  studentsSection: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '20px',
  },
  studentsTable: {
    display: 'flex',
    flexDirection: 'column',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
    gap: '16px',
    padding: '12px 16px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px 8px 0 0',
    fontWeight: 600,
    color: '#374151',
  },
  tableHeaderCell: {
    fontSize: '14px',
  },
  studentRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
    gap: '16px',
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
    alignItems: 'center',
    gridColumn: '1 / -1',
  },
  studentInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  studentId: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  studentIdText: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '2px 6px',
    borderRadius: '4px',
    display: 'inline-block',
  },
  studentName: {
    fontSize: '14px',
    color: '#6b7280',
  },
  progressInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  progressText: {
    fontSize: '12px',
    color: '#6b7280',
  },
  progressBar: {
    width: '100%',
    height: '6px',
    backgroundColor: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  scoreInfo: {
    fontWeight: 500,
    color: '#1f2937',
  },
  timeInfo: {
    color: '#6b7280',
  },
  statusInfo: {
    display: 'flex',
  },
  actionsInfo: {
    display: 'flex',
  },
  detailsButton: {
    padding: '4px 8px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    color: '#374151',
    transition: 'all 0.2s ease-in-out',
  },
  studentDetails: {
    gridColumn: '1 / -1',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    marginTop: '8px',
  },
  detailsTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '12px',
    margin: '0 0 12px 0',
  },
  assignmentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  assignmentCard: {
    backgroundColor: 'white',
    borderRadius: '6px',
    padding: '12px',
    border: '1px solid #e5e7eb',
  },
  assignmentTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '8px',
    margin: '0 0 8px 0',
  },
  assignmentStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  modulesList: {
    fontSize: '12px',
  },
  moduleItem: {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '8px',
    gap: '6px',
  },
  moduleName: {
    fontWeight: 'bold',
    color: '#374151',
    fontSize: '14px',
    marginBottom: '4px',
  },
  moduleDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  moduleDetailRow: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    color: '#6b7280',
  },
  moduleScore: {
    color: '#6b7280',
    minWidth: 'fit-content',
  },
  moduleStatus: {
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 500,
    minWidth: 'fit-content',
  },
  studentChartsContainer: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
  },
  studentChartCard: {
    flex: '1',
    minWidth: '300px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
  },
  studentChartTitle: {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '12px',
    color: '#1f2937',
  },
  chartLegend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '10px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  legendColor: {
    width: '12px',
    height: '12px',
    borderRadius: '2px',
  },
  legendText: {
    fontSize: '12px',
    color: '#666',
  },
  notStartedMessage: {
    padding: '24px',
    textAlign: 'center',
  },
  notStartedContent: {
    backgroundColor: '#f8fafc',
    border: '2px dashed #cbd5e1',
    borderRadius: '8px',
    padding: '32px 24px',
    margin: '16px 0',
  },
  notStartedText: {
    fontSize: '16px',
    color: '#475569',
    margin: '0 0 12px 0',
    fontWeight: '500',
  },
  notStartedSubtext: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0',
    lineHeight: '1.5',
  },
  chartContainer: {
    height: '200px',
  },
  studentsCardsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  studentCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
    transition: 'box-shadow 0.2s ease',
  },
  studentCardHeader: {
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentHeaderInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  studentHeaderMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  studentCardName: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#1f2937',
  },
  studentCardId: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: 500,
  },
  studentHeaderStats: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap' as const,
  },
  studentStatItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  studentStatLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: 500,
  },
  studentStatValue: {
    fontSize: '14px',
    color: '#1f2937',
    fontWeight: 600,
  },
  expandIcon: {
    fontSize: '16px',
    color: '#6b7280',
    marginLeft: '16px',
  },
  studentProgressBar: {
    height: '4px',
    backgroundColor: '#f3f4f6',
    width: '100%',
  },
  studentProgressFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  studentDetailsExpanded: {
    padding: '20px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  },
};

export default AssignmentFullReport;