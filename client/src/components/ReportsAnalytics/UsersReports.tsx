import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie} from 'recharts';
import { reportingService } from '../../services/reportingService';
import { IndividualUserReport } from '../../models/individual-user-report';
import { ExamTakerReport, ExamTakerAssignmentReport } from '../../models/reporting';
import { ModuleStatus } from '../../models/module-status';
import { formatDateToLocal, parseUtcDate, isBeforeNow, isAfterNow } from '../../utils/dateUtils';
import styles from './UsersReports.module.css';

interface UsersReportsProps {
  // No props needed for now, but keeping the pattern consistent
}

const UsersReports: React.FC<UsersReportsProps> = () => {
  const [examTakers, setExamTakers] = useState<IndividualUserReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'id' | 'name'>('name');
  const [selectedUserReport, setSelectedUserReport] = useState<{examTaker: IndividualUserReport, report: ExamTakerReport} | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [loadingExamTakerId, setLoadingExamTakerId] = useState<string | null>(null);
  const [selectedAssignmentReport, setSelectedAssignmentReport] = useState<{examTaker: IndividualUserReport, assignment: ExamTakerAssignmentReport} | null>(null);
  const [assignmentReportLoading, setAssignmentReportLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);
  const isInitialMount = useRef(true);

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Handle real-time search with debouncing (like UserTable)
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      setCurrentPage(1);
      loadExamTakers(1, searchTerm);
    }, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, searchType]);

  // Handle page size changes
  useEffect(() => {
    if (!isInitialMount.current) { // Only reload if it's not the initial mount
      loadExamTakers(1, searchTerm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize]);

  // Load exam takers data
  const loadExamTakers = async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      setError('');
      
      const idFilter = searchType === 'id' ? search.trim() : undefined;
      const nameFilter = searchType === 'name' ? search.trim() : undefined;
      
      const response = await reportingService.getAllExamTakerReports(
        page, 
        pageSize, 
        idFilter, 
        nameFilter
      );
      
      setExamTakers(response.data.data || []);
      setCurrentPage(page);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      setError('Failed to load exam takers. Please try again.');
      setExamTakers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Load exam taker report
  const loadExamTakerReport = async (examTaker: IndividualUserReport) => {
    try {
      setReportLoading(true);
      setLoadingExamTakerId(examTaker.examTakerId);
      const response = await reportingService.getExamTakerReport(examTaker.examTakerId);
      
      if (response.data) {
        setSelectedUserReport({ examTaker, report: response.data });
      } else {
        setError('Failed to load exam taker report. Please try again.');
      }
    } catch (error) {
      setError('Failed to load exam taker report. Please try again.');
    } finally {
      setReportLoading(false);
      setLoadingExamTakerId(null);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadExamTakers(1);
    isInitialMount.current = false; // Mark initial mount as complete
  }, []);

  // Add ESC key handler for closing modals
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Close the topmost modal first (assignment modal has priority if both are open)
        if (selectedAssignmentReport) {
          handleCloseAssignmentReport();
        } else if (selectedUserReport) {
          handleCloseReport();
        }
      }
    };

    // Only add the event listener if at least one modal is open
    if (selectedUserReport || selectedAssignmentReport) {
      document.addEventListener('keydown', handleEscKey);
      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [selectedUserReport, selectedAssignmentReport]);

  // Add mobile responsive styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        .users-reports-table-container {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
          margin: 0 -20px !important;
          padding: 0 20px !important;
        }
        .users-reports-table {
          min-width: 600px !important;
        }
        .users-reports-pagination {
          flex-direction: column !important;
          gap: 16px !important;
          align-items: center !important;
        }
        .users-reports-pagination-controls {
          gap: 12px !important;
          justify-content: center !important;
        }
        .users-reports-pagination-button {
          min-height: 44px !important;
          height: 44px !important;
          min-width: 80px !important;
          font-size: 14px !important;
          padding: 10px 16px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
          white-space: nowrap !important;
        }
        .users-reports-page-size {
          justify-content: center !important;
          gap: 8px !important;
        }
        .users-reports-assignments-table {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }
        .users-reports-modules-table {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }
        .users-reports-header-buttons {
          flex-direction: column !important;
          gap: 12px !important;
          align-items: stretch !important;
        }
        .users-reports-header-button {
          width: 100% !important;
          max-width: 300px !important;
          margin: 0 auto !important;
          font-size: 14px !important;
          padding: 12px 16px !important;
          white-space: nowrap !important;
        }
        .users-reports-modal-header-buttons {
          display: flex !important;
          justify-content: flex-start !important;
          align-items: center !important;
          gap: 8px !important;
          position: relative !important;
          padding-right: 40px !important;
        }
        .users-reports-modal-header-button {
          flex: none !important;
          font-size: 14px !important;
          padding: 10px 16px !important;
          white-space: nowrap !important;
        }
        .users-reports-close-button {
          position: absolute !important;
          top: 50% !important;
          right: 0 !important;
          transform: translateY(-50%) !important;
          width: 32px !important;
          height: 32px !important;
          padding: 0 !important;
          font-size: 18px !important;
          line-height: 1 !important;
          border-radius: 50% !important;
          z-index: 10 !important;
        }
      }
      @media (max-width: 480px) {
        .users-reports-table-container {
          margin: 0 -16px !important;
          padding: 0 16px !important;
        }
        .users-reports-table {
          min-width: 500px !important;
        }
        .users-reports-pagination-button {
          min-width: 70px !important;
          font-size: 12px !important;
          padding: 8px 12px !important;
        }
        .users-reports-header-button {
          max-width: 280px !important;
          font-size: 13px !important;
          padding: 10px 14px !important;
        }
        .users-reports-modal-header-button {
          max-width: 280px !important;
          font-size: 13px !important;
          padding: 10px 14px !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Handle PDF export
  const handleExportPDF = async () => {
    try {
      // Get the content to export - prioritize modal content if modal is open
      let element: HTMLElement | null = null;
      let isModalExport = false;
      
      if (selectedUserReport || selectedAssignmentReport) {
        // If modal is open, capture just the modal body content
        // Prioritize assignment detailed report if it's open
        if (selectedAssignmentReport) {
          element = document.querySelector('.assignment-modal-report-content') as HTMLElement;
        } else {
          element = document.querySelector('.user-modal-report-content') as HTMLElement;
        }
        isModalExport = true;
      }
      
      if (!element) {
        // Fallback to main content
        element = document.getElementById('users-reports-content');
      }
      
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

      // For modal exports, we need to handle them differently
      let canvas;
      if (isModalExport) {
        // Create a temporary container with the modal content for better capture
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.top = '-9999px';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '1200px';
        tempContainer.style.backgroundColor = '#ffffff';
        tempContainer.style.padding = '20px';
        tempContainer.style.fontFamily = 'Arial, sans-serif';
        
        // Clone the modal content
        const clonedContent = element.cloneNode(true) as HTMLElement;
        
        // Apply print-friendly styles to the cloned content
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
          * { 
            box-sizing: border-box !important; 
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .recharts-wrapper { 
            background: white !important; 
          }
          svg { 
            background: white !important;
            overflow: visible !important;
          }
        `;
        tempContainer.appendChild(styleSheet);
        tempContainer.appendChild(clonedContent);
        document.body.appendChild(tempContainer);

        try {
          // Configure html2canvas for the temporary container with lightweight settings
          canvas = await html2canvas(tempContainer, {
            scale: 1, // Reduced scale for lighter files
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: 1200,
            height: tempContainer.scrollHeight,
            logging: false,
            onclone: (clonedDoc) => {
              // Ensure all styles are properly applied in the clone
              const clonedContainer = clonedDoc.querySelector('div') as HTMLElement;
              if (clonedContainer) {
                clonedContainer.style.position = 'static';
                clonedContainer.style.top = 'auto';
                clonedContainer.style.left = 'auto';
              }
            }
          });
        } finally {
          // Clean up the temporary container
          document.body.removeChild(tempContainer);
        }
      } else {
        // Configure html2canvas options for regular content with lightweight settings
        canvas = await html2canvas(element, {
          scale: 1, // Reduced scale for lighter files
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: element.scrollWidth,
          height: element.scrollHeight,
          logging: false
        });
      }

      // Create PDF with compressed image
      const imgData = canvas.toDataURL('image/jpeg', 0.85); // Use JPEG with good quality
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Calculate dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = Math.min(pdfWidth / (imgWidth * 0.264583), pdfHeight / (imgHeight * 0.264583));
      const scaledWidth = imgWidth * 0.264583 * ratio;
      const scaledHeight = imgHeight * 0.264583 * ratio;

      // Add title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      let title = 'Exam Takers & Reports Summary';
      
      if (selectedAssignmentReport) {
        title = `${selectedAssignmentReport.examTaker.examTakerDisplayName} - ${selectedAssignmentReport.assignment.assignmentTitle} Details`;
      } else if (selectedUserReport) {
        title = `${selectedUserReport.examTaker.examTakerDisplayName} - User Report`;
      }
      
      pdf.text(title, pdfWidth / 2, 15, { align: 'center' });
      
      // Add date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, pdfWidth / 2, 25, { align: 'center' });

      // Add content - Always fit on single page to prevent duplicates
      let yPosition = 35;
      
      // Calculate available space and ensure content fits on one page
      const availableHeight = pdfHeight - yPosition - 10;
      
      // Always scale to fit on one page to prevent duplicate pages
      const scaleFactorForFit = Math.min(1, availableHeight / scaledHeight);
      
      const finalWidth = scaledWidth * scaleFactorForFit;
      const finalHeight = scaledHeight * scaleFactorForFit;
      
      // Center the content
      const xPosition = (pdfWidth - finalWidth) / 2;
      
      pdf.addImage(
        imgData,
        'JPEG', // Use JPEG for lighter files
        xPosition,
        yPosition,
        finalWidth,
        finalHeight
      );
      
      // Add a note if we had to scale down significantly
      if (scaleFactorForFit < 0.8) {
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.text(
          'Note: Content was scaled to fit on one page for better readability',
          pdfWidth / 2,
          pdfHeight - 10,
          { align: 'center' }
        );
      }

      // Generate filename
      let filename = `exam_takers_reports_${new Date().toISOString().split('T')[0]}.pdf`;
      
      if (selectedAssignmentReport) {
        filename = `${selectedAssignmentReport.examTaker.examTakerDisplayName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${selectedAssignmentReport.assignment.assignmentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_detailed_report.pdf`;
      } else if (selectedUserReport) {
        filename = `${selectedUserReport.examTaker.examTakerDisplayName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_exam_taker_report.pdf`;
      }

      // Save PDF
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

  // Handle page change
  const handlePageChange = (page: number) => {
    loadExamTakers(page, searchTerm);
  };

  // Handle search change (real-time like UserTable)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle search type change
  const handleSearchTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchType(e.target.value as 'id' | 'name');
    setSearchTerm(''); // Clear search when changing type
  };

  // Load assignment detailed report
  const loadAssignmentDetailedReport = async (examTaker: IndividualUserReport, assignment: ExamTakerAssignmentReport) => {
    try {
      setAssignmentReportLoading(true);
      const response = await reportingService.getExamTakerReportByAssignment(examTaker.examTakerId, assignment.assignmentId);
      
      if (response.data) {
        setSelectedAssignmentReport({ examTaker, assignment });
      } else {
        setError('Failed to load assignment report. Please try again.');
      }
    } catch (error) {
      setError('Failed to load assignment report. Please try again.');
    } finally {
      setAssignmentReportLoading(false);
    }
  };

  // Close report modal
  const handleCloseReport = () => {
    setSelectedUserReport(null);
  };

  // Close assignment report modal
  const handleCloseAssignmentReport = () => {
    setSelectedAssignmentReport(null);
  };

  // Render user report modal
  const renderUserReport = () => {
    if (!selectedUserReport) return null;

    const { examTaker, report } = selectedUserReport;

    return (
      <div className={`${styles.modalOverlay} modal-overlay`} onClick={handleCloseReport}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3 className={styles.modalTitle}>Report for {examTaker.examTakerDisplayName}</h3>
            <div className={`${styles.modalHeaderButtons} users-reports-modal-header-buttons`}>
              <button 
                onClick={handleExportPDF}
                className={`${styles.exportButtonSmall} users-reports-modal-header-button`}
                data-export-button
              >
                <img src="/images/icons/save.svg" alt="" style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle'}} />Export PDF
              </button>
              <button onClick={handleCloseReport} className={`${styles.closeButton} users-reports-modal-header-button users-reports-close-button`}>×</button>
            </div>
          </div>
          
          <div className={styles.modalBody}>
            {reportLoading ? (
              <div className={styles.loadingContainer}>
                <p className={styles.loadingText}>Loading exam taker report...</p>
              </div>
            ) : (
              <div className={`${styles.reportContent} user-modal-report-content`}>
                {/* User Info Section */}
                <div className={styles.userInfoSection}>
                  <h4 className={styles.sectionTitle}>Exam Taker Information</h4>
                  <div className={styles.userInfoGrid}>
                    <div className={styles.infoItem}>
                      <strong>Name:</strong> {report.displayName || 'N/A'}
                    </div>
                    <div className={styles.infoItem}>
                      <strong>Exam Taker ID:</strong> {examTaker.examTakerId}
                    </div>
                  </div>
                </div>

                {/* Summary Statistics */}
                <div className={styles.summarySection}>
                  <h4 className={styles.sectionTitle}>Assignment Summary</h4>
                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <div className={styles.statNumber}>{report.totalAssignments}</div>
                      <div className={styles.statLabel}>Total Assignments</div>
                    </div>
                    {/* Calculate enhanced status counts */}
                    {(() => {
                      const statusCounts = {
                        completed: 0,
                        completedLate: 0,
                        inProgress: 0,
                        incompleteExpired: 0,
                        scheduled: 0,
                        notSubmitted: 0,
                        notStarted: 0
                      };
                      
                      if (report.assignmentProgress) {
                        report.assignmentProgress.forEach(assignment => {
                          const status = getAssignmentStatus(assignment).toLowerCase();
                          switch (status) {
                            case 'completed': statusCounts.completed++; break;
                            case 'completed late': statusCounts.completedLate++; break;
                            case 'in progress': statusCounts.inProgress++; break;
                            case 'incomplete (expired)': statusCounts.incompleteExpired++; break;
                            case 'scheduled': statusCounts.scheduled++; break;
                            case 'not submitted': statusCounts.notSubmitted++; break;
                            case 'not started': statusCounts.notStarted++; break;
                          }
                        });
                      }
                      
                      return (
                        <>
                          <div className={`${styles.statCard} ${styles.statCardSuccess}`}>
                            <div className={styles.statNumber}>{statusCounts.completed}</div>
                            <div className={styles.statLabel}>Completed</div>
                          </div>
                          {statusCounts.completedLate > 0 && (
                            <div className={`${styles.statCard} ${styles.statCardWarning}`}>
                              <div className={styles.statNumber}>{statusCounts.completedLate}</div>
                              <div className={styles.statLabel}>Completed Late</div>
                            </div>
                          )}
                          {statusCounts.inProgress > 0 && (
                            <div className={`${styles.statCard} ${styles.statCardInProgress}`}>
                              <div className={styles.statNumber}>{statusCounts.inProgress}</div>
                              <div className={styles.statLabel}>In Progress</div>
                            </div>
                          )}
                          {statusCounts.incompleteExpired > 0 && (
                            <div className={`${styles.statCard} ${styles.statCardDanger}`}>
                              <div className={styles.statNumber}>{statusCounts.incompleteExpired}</div>
                              <div className={styles.statLabel}>Incomplete (Expired)</div>
                            </div>
                          )}
                          {statusCounts.scheduled > 0 && (
                            <div className={`${styles.statCard} ${styles.statCardScheduled}`}>
                              <div className={styles.statNumber}>{statusCounts.scheduled}</div>
                              <div className={styles.statLabel}>Scheduled</div>
                            </div>
                          )}
                          {statusCounts.notSubmitted > 0 && (
                            <div className={`${styles.statCard} ${styles.statCardDanger}`}>
                              <div className={styles.statNumber}>{statusCounts.notSubmitted}</div>
                              <div className={styles.statLabel}>Not Submitted</div>
                            </div>
                          )}
                          {statusCounts.notStarted > 0 && (
                            <div className={`${styles.statCard} ${styles.statCardNeutral}`}>
                              <div className={styles.statNumber}>{statusCounts.notStarted}</div>
                              <div className={styles.statLabel}>Not Started</div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className={styles.performanceSection}>
                  <h4 className={styles.sectionTitle}>Performance Metrics</h4>
                  <div className={styles.performanceGrid}>
                    <div className={styles.performanceItem}>
                      <strong>Overall Average Score:</strong> {report.overallAverageScore?.toFixed(1) ?? 'N/A'}%
                    </div>
                    <div className={styles.performanceItem}>
                      <strong>Total Time Spent:</strong> {Math.round(report.totalTimeSpentMinutes)} minutes
                    </div>
                    <div className={styles.performanceItem}>
                      <strong>Completion Rate:</strong> {((report.completedAssignments / report.totalAssignments) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Assignment Progress */}
                {report.assignmentProgress && report.assignmentProgress.length > 0 && (
                  <div className={styles.assignmentsSection}>
                    <h4 className={styles.sectionTitle}>Assignment Progress</h4>
                    
                    {/* Status Legend Info Box */}
                    <div className={styles.statusLegendBox}>
                      <h5 className={styles.statusLegendTitle}><img src="/images/icons/chart.svg" alt="" style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle'}} />Assignment Status Guide</h5>
                      <div className={styles.statusLegendGrid}>
                        <div className={`${styles.statusLegendItem} ${hoveredStatus === 'completed' ? styles.statusLegendItemHighlighted : ''}`}>
                          <span className={styles.statusLegendBadge} style={{backgroundColor: '#dcfce7', color: '#166534'}}>Completed</span>
                          <span className={styles.statusLegendText}>All modules finished within deadline</span>
                        </div>
                        <div className={`${styles.statusLegendItem} ${hoveredStatus === 'completed late' ? styles.statusLegendItemHighlighted : ''}`}>
                          <span className={styles.statusLegendBadge} style={{backgroundColor: '#fed7aa', color: '#ea580c'}}>Completed Late</span>
                          <span className={styles.statusLegendText}>Finished after assignment end date</span>
                        </div>
                        <div className={`${styles.statusLegendItem} ${hoveredStatus === 'in progress' ? styles.statusLegendItemHighlighted : ''}`}>
                          <span className={styles.statusLegendBadge} style={{backgroundColor: '#fef3c7', color: '#92400e'}}>In Progress</span>
                          <span className={styles.statusLegendText}>Currently working within deadline</span>
                        </div>
                        <div className={`${styles.statusLegendItem} ${hoveredStatus === 'incomplete (expired)' ? styles.statusLegendItemHighlighted : ''}`}>
                          <span className={styles.statusLegendBadge} style={{backgroundColor: '#fecaca', color: '#dc2626'}}>Incomplete (Expired)</span>
                          <span className={styles.statusLegendText}>Started but not finished before deadline</span>
                        </div>
                        <div className={`${styles.statusLegendItem} ${hoveredStatus === 'scheduled' ? styles.statusLegendItemHighlighted : ''}`}>
                          <span className={styles.statusLegendBadge} style={{backgroundColor: '#e0e7ff', color: '#3730a3'}}>Scheduled</span>
                          <span className={styles.statusLegendText}>Assignment starts in the future</span>
                        </div>
                        <div className={`${styles.statusLegendItem} ${hoveredStatus === 'not submitted' ? styles.statusLegendItemHighlighted : ''}`}>
                          <span className={styles.statusLegendBadge} style={{backgroundColor: '#fef2f2', color: '#dc2626'}}>Not Submitted</span>
                          <span className={styles.statusLegendText}>Deadline passed, never started</span>
                        </div>
                        <div className={`${styles.statusLegendItem} ${hoveredStatus === 'not started' ? styles.statusLegendItemHighlighted : ''}`}>
                          <span className={styles.statusLegendBadge} style={{backgroundColor: '#f3f4f6', color: '#374151'}}>Not Started</span>
                          <span className={styles.statusLegendText}>Available but not yet started</span>
                        </div>
                      </div>
                    </div>

                    <div className={`${styles.assignmentsTable} users-reports-assignments-table`}>
                      <div className={styles.tableHeader}>
                        <div className={styles.tableHeaderCell}>Assignment</div>
                        <div className={styles.tableHeaderCell}>Assignment Start</div>
                        <div className={styles.tableHeaderCell}>Assignment End</div>
                        <div className={styles.tableHeaderCell}>User Started</div>
                        <div className={styles.tableHeaderCell}>Last Module Done</div>
                        <div className={styles.tableHeaderCell}>Time Spent</div>
                        <div className={styles.tableHeaderCell}>Status</div>
                        <div className={styles.tableHeaderCell}>Actions</div>
                      </div>
                      {report.assignmentProgress
                        .sort((a, b) => {
                          // First sort by start time
                          const aStartTime = a.startedAtUtc ? new Date(a.startedAtUtc).getTime() : 0;
                          const bStartTime = b.startedAtUtc ? new Date(b.startedAtUtc).getTime() : 0;
                          
                          if (aStartTime !== bStartTime) {
                            return aStartTime - bStartTime;
                          }
                          
                          // If start times are equal (or both null), sort by complete time
                          const aCompleteTime = a.completedAtUtc ? new Date(a.completedAtUtc).getTime() : 0;
                          const bCompleteTime = b.completedAtUtc ? new Date(b.completedAtUtc).getTime() : 0;
                          
                          return aCompleteTime - bCompleteTime;
                        })
                        .map((assignment, index) => (
                        <div key={index} className={styles.tableRow}>
                          <div className={styles.tableCell}>{assignment.assignmentTitle}</div>
                          <div className={styles.tableCell}>
                            {assignment.assignmentStartDateUtc ? formatDateToLocal(assignment.assignmentStartDateUtc) : 'N/A'}
                          </div>
                          <div className={styles.tableCell}>
                            {assignment.assignmentEndDateUtc ? formatDateToLocal(assignment.assignmentEndDateUtc) : 'N/A'}
                          </div>
                          <div className={styles.tableCell}>
                            {assignment.startedAtUtc ? formatDateToLocal(assignment.startedAtUtc) : 'N/A'}
                          </div>
                          <div className={styles.tableCell}>
                            {assignment.completedAtUtc ? formatDateToLocal(assignment.completedAtUtc) : 'N/A'}
                          </div>
                          <div className={styles.tableCell}>
                            {assignment.timeSpentMinutes != null ? 
                              (assignment.timeSpentMinutes < 1 ? 
                                'less than minute' : 
                                `${Math.round(assignment.timeSpentMinutes)} min`) : 
                              (getAssignmentStatus(assignment) === 'Completed' ? 'less than minute' : 'N/A')}
                          </div>
                          <div className={styles.tableCell}>
                            <span 
                              className={styles.statusBadge}
                              style={{
                                backgroundColor: getAssignmentStatusColor(assignment),
                                color: getAssignmentStatusTextColor(assignment),
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                transform: hoveredStatus === getAssignmentStatus(assignment).toLowerCase() ? 'scale(1.05)' : 'scale(1)',
                              }}
                              onMouseEnter={() => setHoveredStatus(getAssignmentStatus(assignment).toLowerCase())}
                              onMouseLeave={() => setHoveredStatus(null)}
                            >
                              {getAssignmentStatus(assignment)}
                            </span>
                          </div>
                          <div className={styles.tableCell}>
                            <button 
                              onClick={() => loadAssignmentDetailedReport(selectedUserReport.examTaker, assignment)}
                              className={styles.detailedReportButton}
                              disabled={assignmentReportLoading}
                            >
                              {assignmentReportLoading ? 'Loading...' : 'View Details'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render assignment detailed report modal
  const renderAssignmentDetailedReport = () => {
    if (!selectedAssignmentReport) return null;

    const { examTaker, assignment } = selectedAssignmentReport;

    return (
      <div className={`${styles.modalOverlay} modal-overlay`} onClick={handleCloseAssignmentReport}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3 className={styles.modalTitle}>
              Assignment Details: {assignment.assignmentTitle}
            </h3>
            <div className={`${styles.modalHeaderButtons} users-reports-modal-header-buttons`}>
              <button 
                onClick={handleExportPDF}
                className={`${styles.exportButtonSmall} users-reports-modal-header-button`}
                data-export-button
              >
                <img src="/images/icons/save.svg" alt="" style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle'}} />Export PDF
              </button>
              <button onClick={handleCloseAssignmentReport} className={`${styles.closeButton} users-reports-modal-header-button users-reports-close-button`}>×</button>
            </div>
          </div>
          
          <div className={styles.modalBody}>
            {assignmentReportLoading ? (
              <div className={styles.loadingContainer}>
                <p className={styles.loadingText}>Loading assignment details...</p>
              </div>
            ) : (
              <div className={`${styles.reportContent} assignment-modal-report-content`}>
                {/* Assignment Info Section */}
                <div className={styles.userInfoSection}>
                  <h4 className={styles.sectionTitle}>Assignment Information</h4>
                  <div className={styles.userInfoGrid}>
                    <div className={styles.infoItem}>
                      <strong>Exam Taker:</strong> {examTaker.examTakerDisplayName}
                    </div>
                    <div className={styles.infoItem}>
                      <strong>Assignment:</strong> {assignment.assignmentTitle}
                    </div>
                    <div className={styles.infoItem}>
                      <strong>Status:</strong> {getAssignmentStatus(assignment)}
                    </div>
                    <div className={styles.infoItem}>
                      <strong>Overall Score:</strong> {getAssignmentScore(assignment)}
                    </div>
                  </div>
                </div>

                {/* Time Information */}
                <div className={styles.summarySection}>
                  <h4 className={styles.sectionTitle}>Time Information</h4>
                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <div className={styles.statNumber}>
                        {assignment.startedAtUtc ? new Date(assignment.startedAtUtc).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className={styles.statLabel}>Started Date</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statNumber}>
                        {assignment.completedAtUtc ? new Date(assignment.completedAtUtc).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className={styles.statLabel}>Completed Date</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statNumber}>
                        {Math.round(assignment.timeSpentMinutes)} min
                      </div>
                      <div className={styles.statLabel}>Time Spent</div>
                    </div>
                  </div>
                </div>

                {/* Module Progress */}
                <div className={styles.performanceSection}>
                  <h4 className={styles.sectionTitle}>Module Progress</h4>
                  <div className={styles.performanceGrid}>
                    <div className={styles.performanceItem}>
                      <strong>Completed Modules:</strong> {assignment.completedModules} / {assignment.totalModules}
                    </div>
                    <div className={styles.performanceItem}>
                      <strong>Completion Rate:</strong> {((assignment.completedModules / assignment.totalModules) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Visual Analytics Section */}
                {assignment.moduleReports && assignment.moduleReports.length > 0 && (
                  <div className={styles.visualAnalyticsSection}>
                    <h4 className={styles.sectionTitle}>Visual Analytics</h4>
                    <div className={styles.chartsGrid}>
                      
                      {/* Spider/Radar Chart - Module Knowledge Strength (only show if 3+ modules) */}
                      {assignment.moduleReports.length >= 3 && (
                        <div className={styles.chartCard}>
                          <h5 className={styles.chartTitle}>Knowledge Strength by Module (Spider Chart)</h5>
                          <ResponsiveContainer width="100%" height={350}>
                            <RadarChart data={getModuleRadarData(assignment)} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
                              <PolarGrid stroke="#e5e7eb" />
                              <PolarAngleAxis dataKey="module" tick={{ fontSize: 11, fill: '#374151' }} />
                              <PolarRadiusAxis 
                                angle={90} 
                                domain={[0, 100]} 
                                tick={{ fontSize: 10, fill: '#6b7280' }}
                                tickFormatter={(value) => `${value}%`}
                                tickCount={6}
                              />
                              <Radar
                                name="Knowledge Score"
                                dataKey="score"
                                stroke="#3b82f6"
                                fill="#3b82f6"
                                fillOpacity={0.25}
                                strokeWidth={3}
                                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                              />
                              <Tooltip 
                                formatter={(value, name) => [`${value}%`, name]} 
                                labelFormatter={(label) => `Module: ${label}`}
                                contentStyle={{ 
                                  backgroundColor: 'white', 
                                  border: '1px solid #e5e7eb', 
                                  borderRadius: '6px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Notice for few modules */}
                      {assignment.moduleReports.length < 3 && (
                        <div className={styles.chartCard}>
                          <h5 className={styles.chartTitle}>Knowledge Strength Analysis</h5>
                          <div className={styles.fewModulesNotice}>
                            <div className={styles.noticeIcon}><img src="/images/icons/chart.svg" alt="" style={{width: '24px', height: '24px'}} /></div>
                            <div className={styles.noticeText}>
                              <p><strong>Spider Chart Available with 3+ Modules</strong></p>
                              <p>The knowledge strength spider chart provides the best insights when there are 3 or more modules to compare. Currently, this assignment has {assignment.moduleReports.length} module{assignment.moduleReports.length === 1 ? '' : 's'}.</p>
                              <p>You can view detailed module performance in the next card.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Bar Chart - Module Performance Comparison */}
                      <div className={styles.chartCard}>
                        <h5 className={styles.chartTitle}>Module Performance Comparison</h5>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={getModuleBarData(assignment)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="module" 
                              angle={-45}
                              textAnchor="end"
                              height={80}
                              interval={0}
                              tick={{ fontSize: 10 }}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="score" name="Score %" fill="#3b82f6" />
                            <Bar dataKey="timeSpent" name="Time (min)" fill="#22c55e" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Pie Chart - Module Status Distribution */}
                      <div className={styles.chartCard}>
                        <h5 className={styles.chartTitle}>Module Status Distribution</h5>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={getModuleStatusPieData(assignment)}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              dataKey="value"
                              label={(entry: any) => `${entry.name} ${((entry.value / assignment.moduleReports.length) * 100).toFixed(0)}%`}
                            >
                              {getModuleStatusPieData(assignment).map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* Module Details */}
                {assignment.moduleReports && assignment.moduleReports.length > 0 && (
                  <div className={styles.assignmentsSection}>
                    <h4 className={styles.sectionTitle}>Module Details</h4>
                    <div className={`${styles.assignmentsTable} users-reports-modules-table`}>
                      <div className={styles.moduleTableHeader}>
                        <div className={styles.tableHeaderCell}>Module</div>
                        <div className={styles.tableHeaderCell}>Status</div>
                        <div className={styles.tableHeaderCell}>Passing Score</div>
                        <div className={styles.tableHeaderCell}>Score</div>
                        <div className={styles.tableHeaderCell}>Questions</div>
                        <div className={styles.tableHeaderCell}>Time</div>
                        <div className={styles.tableHeaderCell}>Passed</div>
                      </div>
                      {assignment.moduleReports.map((module, index) => {
                        // Parse status once at the beginning
                        const statusStr = String(module.status);
                        const parsedStatus = statusStr as keyof typeof ModuleStatus;
                        const statusEnum = ModuleStatus[parsedStatus] as ModuleStatus;
                        const isNotStartedModule = statusEnum === ModuleStatus.NotStarted || 
                                                   statusEnum === ModuleStatus.Locked || 
                                                   statusEnum === ModuleStatus.Scheduled;
                        
                        return (
                        <div key={index} className={styles.moduleTableRow}>
                          <div className={styles.tableCell}>{module.moduleTitle}</div>
                          <div className={styles.tableCell}>
                            <span className={styles.statusBadge} style={{
                              backgroundColor: getModuleStatusColor(module.status),
                              color: getModuleStatusTextColor(module.status)
                            }}>
                              {getModuleStatusDisplayText(module.status)}
                            </span>
                          </div>
                          <div className={styles.tableCell}>
                            {module.passingScore !== null && module.passingScore !== undefined 
                              ? `${module.passingScore.toFixed(1)}%` : 'N/A'}
                          </div>
                          <div className={styles.tableCell}>
                            {isNotStartedModule ? 'N/A' : 
                             (module.score !== undefined ? `${module.score.toFixed(1)}%` : 'N/A')}
                          </div>
                          <div className={styles.tableCell}>
                            {(isNotStartedModule || (module.answeredQuestions === 0 && module.totalQuestions === 0)) 
                              ? 'N/A' : `${module.answeredQuestions} / ${module.totalQuestions}`}
                          </div>
                          <div className={styles.tableCell}>
                            {isNotStartedModule ? 'N/A' : 
                             (Math.round(module.timeSpentMinutes) === 0 ? 'less than minute' : `${Math.round(module.timeSpentMinutes)} min`)}
                          </div>
                          <div className={styles.tableCell}>
                            {isNotStartedModule ? (
                              <span className={styles.statusBadge} style={{
                                backgroundColor: '#f3f4f6',
                                color: '#6b7280'
                              }}>
                                N/A
                              </span>
                            ) : (
                              <span className={styles.statusBadge} style={{
                                backgroundColor: module.passed ? '#dcfce7' : '#fef2f2',
                                color: module.passed ? '#166534' : '#dc2626'
                              }}>
                                {module.passed ? 'Yes' : 'No'}
                              </span>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Get assignment status based on completion and timeline
  const getAssignmentStatus = (assignment: ExamTakerAssignmentReport) => {
    const now = new Date();
    const hasStartDate = assignment.assignmentStartDateUtc;
    const hasEndDate = assignment.assignmentEndDateUtc;
    
    // Determine if assignment is within its scheduled timeline
    const isBeforeStart = hasStartDate && isBeforeNow(assignment.assignmentStartDateUtc, now);
    const isAfterEnd = hasEndDate && isAfterNow(assignment.assignmentEndDateUtc, now);
    const isWithinPeriod = hasStartDate && hasEndDate && 
                          !isBeforeNow(assignment.assignmentStartDateUtc, now) && 
                          !isAfterNow(assignment.assignmentEndDateUtc, now);

    // Check module completion status
    let moduleCompletionStatus = 'not-started';
    if (assignment.moduleReports && assignment.moduleReports.length > 0) {
      const hasInProgressModules = assignment.moduleReports.some((module: any) => {
        const statusStr = String(module.status);
        const moduleStatus = ModuleStatus[statusStr as keyof typeof ModuleStatus];
        return moduleStatus === ModuleStatus.InProgress;
      });
      
      const hasCompletedModules = assignment.moduleReports.some((module: any) => {
        const statusStr = String(module.status);
        const moduleStatus = ModuleStatus[statusStr as keyof typeof ModuleStatus];
        return moduleStatus === ModuleStatus.Completed || 
               moduleStatus === ModuleStatus.WaitForModuleDurationToElapse;
      });
      
      const allModulesCompleted = assignment.moduleReports.every((module: any) => {
        const statusStr = String(module.status);
        const moduleStatus = ModuleStatus[statusStr as keyof typeof ModuleStatus];
        return moduleStatus === ModuleStatus.Completed || 
               moduleStatus === ModuleStatus.WaitForModuleDurationToElapse;
      });

      if (allModulesCompleted) {
        moduleCompletionStatus = 'completed';
      } else if (hasInProgressModules || hasCompletedModules) {
        moduleCompletionStatus = 'in-progress';
      } else {
        moduleCompletionStatus = 'not-started';
      }
    } else {
      // Fallback to timestamp-based logic if no module reports
      if (assignment.completedAtUtc) {
        moduleCompletionStatus = 'completed';
      } else if (assignment.startedAtUtc) {
        moduleCompletionStatus = 'in-progress';
      }
    }

    // Determine status based on timeline and completion
    if (moduleCompletionStatus === 'completed') {
      if (hasEndDate && isAfterEnd) {
        return 'Completed Late';
      } else {
        return 'Completed';
      }
    }
    
    if (moduleCompletionStatus === 'in-progress') {
      if (hasEndDate && isAfterEnd) {
        return 'Incomplete (Expired)';
      } else {
        return 'In Progress';
      }
    }
    
    // Not started cases
    if (hasStartDate && isBeforeStart) {
      return 'Scheduled';
    } else if (hasEndDate && isAfterEnd) {
      return 'Not Submitted';
    } else {
      return 'Not Started';
    }
  };

  // Get assignment score (calculated from modules)
  const getAssignmentScore = (assignment: ExamTakerAssignmentReport) => {
    if (assignment.moduleReports && assignment.moduleReports.length > 0) {
      const totalScore = assignment.moduleReports.reduce((sum: number, module: any) => sum + (module.score || 0), 0);
      const averageScore = totalScore / assignment.moduleReports.length;
      return `${averageScore.toFixed(1)}%`;
    }
    return 'N/A';
  };

  // Get status color for assignment badges
  const getAssignmentStatusColor = (assignment: ExamTakerAssignmentReport) => {
    const status = getAssignmentStatus(assignment);
    switch (status.toLowerCase()) {
      case 'completed': return '#dcfce7'; // Green - successful completion
      case 'completed late': return '#fed7aa'; // Orange - completed but late
      case 'in progress': return '#fef3c7'; // Yellow - actively working
      case 'incomplete (expired)': return '#fecaca'; // Light red - time expired but work started
      case 'scheduled': return '#e0e7ff'; // Light blue - future assignment
      case 'not submitted': return '#fef2f2'; // Red - missed deadline
      case 'not started': return '#f3f4f6'; // Gray - available but not started
      default: return '#f3f4f6';
    }
  };

  const getAssignmentStatusTextColor = (assignment: ExamTakerAssignmentReport) => {
    const status = getAssignmentStatus(assignment);
    switch (status.toLowerCase()) {
      case 'completed': return '#166534'; // Dark green
      case 'completed late': return '#ea580c'; // Dark orange
      case 'in progress': return '#92400e'; // Dark yellow/amber
      case 'incomplete (expired)': return '#dc2626'; // Dark red
      case 'scheduled': return '#3730a3'; // Dark blue
      case 'not submitted': return '#dc2626'; // Dark red
      case 'not started': return '#374151'; // Dark gray
      default: return '#374151';
    }
  };

  // Get status color for badges
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return '#dcfce7';
      case 'in progress': return '#fef3c7';
      case 'not started': return '#fef2f2';
      default: return '#f3f4f6';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return '#166534';
      case 'in progress': return '#92400e';
      case 'not started': return '#dc2626';
      default: return '#374151';
    }
  };

  // Get module status colors
  const getModuleStatusColor = (status: any) => {
    const statusString = typeof status === 'string' ? status : status.toString();
    switch (statusString.toLowerCase()) {
      case 'completed':
      case '5': return '#22c55e'; // Medium green
      case 'inprogress':
      case 'in progress':
      case '4': return '#f59e0b'; // Medium amber
      case 'notstarted':
      case 'not started':
      case '3': return '#fb923c'; // Yellowish orange
      case 'locked':
      case '0': return '#9ca3af'; // Medium gray
      case 'scheduled':
      case '2': return '#3b82f6'; // Medium blue
      case 'timeelapsed':
      case 'time elapsed':
      case '6': return '#a16207'; // Medium brown
      default: return '#9ca3af'; // Medium gray
    }
  };

  const getModuleStatusTextColor = (status: any) => {
    const statusString = typeof status === 'string' ? status : status.toString();
    switch (statusString.toLowerCase()) {
      case 'completed':
      case '5': return '#ffffff'; // White text on medium green
      case 'inprogress':
      case 'in progress':
      case '4': return '#ffffff'; // White text on medium amber
      case 'notstarted':
      case 'not started':
      case '3': return '#ffffff'; // White text on medium red
      case 'locked':
      case '0': return '#ffffff'; // White text on medium gray
      case 'scheduled':
      case '2': return '#ffffff'; // White text on medium blue
      case 'timeelapsed':
      case 'time elapsed':
      case '6': return '#ffffff'; // White text on medium brown
      default: return '#ffffff'; // White text on medium gray
    }
  };

  const getModuleStatusDisplayText = (status: any) => {
    const statusString = typeof status === 'string' ? status : status.toString();
    switch (statusString) {
      case '0': return 'Locked';
      case '1': return 'Waiting';
      case '2': return 'Scheduled';
      case '3': return 'Not Started';
      case '4': return 'In Progress';
      case '5': return 'Completed';
      case '6': return 'Time Elapsed';
      default: return statusString;
    }
  };

  // Data processing functions for charts
  const getModuleRadarData = (assignment: ExamTakerAssignmentReport) => {
    if (!assignment.moduleReports || assignment.moduleReports.length === 0) {
      return [];
    }
    
    return assignment.moduleReports.map(module => ({
      module: module.moduleTitle.length > 12 ? module.moduleTitle.substring(0, 12) + '...' : module.moduleTitle,
      score: Math.round(module.score || 0),
      fullModuleName: module.moduleTitle,
      // Add some debugging info
      status: module.status,
      questions: `${module.answeredQuestions}/${module.totalQuestions}`
    }));
  };

  const getModuleBarData = (assignment: ExamTakerAssignmentReport) => {
    return assignment.moduleReports.map(module => ({
      module: module.moduleTitle.length > 10 ? module.moduleTitle.substring(0, 10) + '...' : module.moduleTitle,
      score: module.score || 0,
      timeSpent: Math.round(module.timeSpentMinutes),
      fullModuleName: module.moduleTitle
    }));
  };

  const getModuleStatusPieData = (assignment: ExamTakerAssignmentReport) => {
    const statusCounts: { [key: string]: { count: number; color: string } } = {};
    
    assignment.moduleReports.forEach(module => {
      const statusText = getModuleStatusDisplayText(module.status);
      if (!statusCounts[statusText]) {
        statusCounts[statusText] = {
          count: 0,
          color: getModuleStatusColor(module.status)
        };
      }
      statusCounts[statusText].count++;
    });

    return Object.entries(statusCounts).map(([status, data]) => ({
      name: status,
      value: data.count,
      color: data.color
    }));
  };

  return (
    <div className={styles.container} id="users-reports-content">
      <div className={styles.header}>
        <h2 className={styles.title}>Exam Takers & Reports</h2>
        <div className={`${styles.headerButtons} users-reports-header-buttons`}>
          <button 
            onClick={() => loadExamTakers(currentPage, searchTerm)}
            className={`${styles.refreshButton} users-reports-header-button`}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>{error}</p>
        </div>
      )}

      {/* Search Section */}
      <div className={styles.searchSection}>
        <div className={styles.searchWrapper}>
          <select 
            value={searchType} 
            onChange={handleSearchTypeChange} 
            className={styles.searchTypeSelect}
          >
            <option value="name">Name</option>
            <option value="id">ID</option>
          </select>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={searchType === 'name' ? 'Search by name...' : 'Search by exam taker ID...'}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <p className={styles.loadingText}>Loading exam takers...</p>
        </div>
      ) : (
        <div className={`${styles.tableContainer} users-reports-table-container`}>
          {examTakers.length === 0 ? (
            <div className={styles.emptyContainer}>
              <p className={styles.emptyText}>No exam takers found</p>
            </div>
          ) : (
            <table className={`${styles.table} users-reports-table`}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th}>Display Name</th>
                  <th className={styles.th}>Exam Taker ID</th>
                  <th className={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {examTakers.map((examTaker) => (
                  <tr key={examTaker.id} className={styles.tr}>
                    <td className={styles.td}>{examTaker.examTakerDisplayName}</td>
                    <td className={styles.td}>
                      <span className={styles.userIdText}>{examTaker.examTakerId}</span>
                    </td>
                    <td className={styles.td}>
                      <button 
                        onClick={() => loadExamTakerReport(examTaker)}
                        className={styles.reportButton}
                        disabled={loadingExamTakerId === examTaker.examTakerId}
                      >
                        {loadingExamTakerId === examTaker.examTakerId ? 'Loading...' : 'View Report'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

          {/* Pagination */}
          <div className={`${styles.pagination} users-reports-pagination`}>
            <div className={`${styles.pageSizeContainer} users-reports-page-size`}>
              <label className={styles.pageSizeLabel}>Items per page:</label>
              <select 
                value={pageSize} 
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className={styles.pageSizeSelect}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            
            <div className={`${styles.paginationControls} users-reports-pagination-controls`}>
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className={`${styles.paginationButton} users-reports-pagination-button`}
                style={{
                  opacity: currentPage === 1 ? 0.5 : 1,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                ◀ Previous
              </button>
              
              <span className={styles.paginationInfo}>
                Page {currentPage} of {Math.max(totalPages, 1)}
              </span>
              
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages <= 1 || loading}
                className={`${styles.paginationButton} users-reports-pagination-button`}
                style={{
                  opacity: (currentPage === totalPages || totalPages <= 1) ? 0.5 : 1,
                  cursor: (currentPage === totalPages || totalPages <= 1) ? 'not-allowed' : 'pointer',
                }}
              >
                Next ▶
              </button>
            </div>

            {/* Spacer to balance the layout */}
            <div style={{ width: '120px' }}></div>
          </div>

      {/* Report Modal */}
      {renderUserReport()}

      {/* Assignment Detailed Report Modal */}
      {renderAssignmentDetailedReport()}
    </div>
  );
};

export default UsersReports;