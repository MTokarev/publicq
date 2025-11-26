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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { reportingService } from '../../services/reportingService';
import { AssignmentSummaryReport } from '../../models/reporting';
import { formatDateToLocal } from '../../utils/dateUtils';
import AssignmentFullReport from '../AssignmentFullReport/AssignmentFullReport';
import cssStyles from './ReportsSummary.module.css';

// Utility function for conditional class names
const cn = (...classes: (string | undefined | false)[]): string => 
  classes.filter(Boolean).join(' ');

interface ReportsSummaryProps {
  // No props needed for now, but keeping the pattern consistent
}

const ReportsSummary: React.FC<ReportsSummaryProps> = () => {
  const [assignments, setAssignments] = useState<AssignmentSummaryReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentSummaryReport | null>(null);
  const [showFullReport, setShowFullReport] = useState(false);
  const [loadingSummaryAssignmentId, setLoadingSummaryAssignmentId] = useState<string | null>(null);
  const [loadingFullReportAssignmentId, setLoadingFullReportAssignmentId] = useState<string | null>(null);

  const pageSize = 10;

  // Fetch assignments data
  const fetchAssignments = async (page: number = 1) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await reportingService.getAllAssignmentsReport(page, pageSize);
      
      if (response.isSuccess) {
        const assignmentsData = response.data?.data || [];
        setAssignments(assignmentsData);
        setCurrentPage(page);
        setTotalPages(response.data?.totalPages || 1);
      } else {
        // Handle API failure
        setError('Failed to load assignment reports. Please try again.');
        setAssignments([]);
        setTotalPages(1);
      }
    } catch (error: any) {
      // Handle 404 specifically - API returns 404 when no assignments exist for reporting
      if (error.response?.status === 404) {
        setAssignments([]);
        setTotalPages(1);
        // Don't set error for 404 when no assignments exist, just show empty state
      } else {
        // For other errors, show error message
        setError('Failed to load assignment reports. Please try again.');
        setAssignments([]);
        setTotalPages(1);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchAssignments(1);
  }, []);

  // Add mobile responsive styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        .reports-summary-table-container {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
          margin: 0 -20px !important;
          padding: 0 20px !important;
        }
        .reports-summary-table {
          min-width: 800px !important;
        }
        .reports-summary-pagination {
          flex-direction: column !important;
          gap: 16px !important;
          align-items: center !important;
        }
        .reports-summary-pagination-button {
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
        .reports-summary-header-buttons {
          flex-direction: column !important;
          gap: 12px !important;
          align-items: stretch !important;
        }
        .reports-summary-header-button {
          width: 100% !important;
          max-width: 300px !important;
          margin: 0 auto !important;
          font-size: 14px !important;
          padding: 12px 16px !important;
          white-space: nowrap !important;
        }
        .reports-summary-details-header-buttons {
          flex-direction: row !important;
          gap: 8px !important;
          align-items: stretch !important;
          justify-content: center !important;
        }
        .reports-summary-details-header-button {
          flex: 1 !important;
          max-width: 110px !important;
          margin: 0 !important;
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
      }
      @media (max-width: 480px) {
        .reports-summary-table-container {
          margin: 0 -16px !important;
          padding: 0 16px !important;
        }
        .reports-summary-table {
          min-width: 700px !important;
        }
        .reports-summary-pagination-button {
          min-width: 70px !important;
          font-size: 12px !important;
          padding: 8px 12px !important;
        }
        .reports-summary-header-button {
          max-width: 280px !important;
          font-size: 13px !important;
          padding: 10px 14px !important;
        }
        .reports-summary-details-header-button {
          max-width: 90px !important;
          font-size: 9px !important;
          padding: 4px 2px !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchAssignments(page);
    }
  };

  // Handle assignment detail view
  const handleViewDetails = (assignment: AssignmentSummaryReport) => {
    setLoadingSummaryAssignmentId(assignment.assignmentId);
    // Small delay to show loading feedback before state change
    setTimeout(() => {
      setSelectedAssignment(assignment);
      setLoadingSummaryAssignmentId(null);
    }, 100);
  };

  // Handle back to list
  const handleBackToList = () => {
    setSelectedAssignment(null);
    setShowFullReport(false);
  };

  // Handle view full report directly from list
  const handleViewFullReportFromList = (assignment: AssignmentSummaryReport) => {
    setLoadingFullReportAssignmentId(assignment.assignmentId);
    // Small delay to show loading feedback before state change
    setTimeout(() => {
      setSelectedAssignment(assignment);
      setShowFullReport(true);
      setLoadingFullReportAssignmentId(null);
    }, 100);
  };

  // Handle view full report
  const handleViewFullReport = () => {
    setShowFullReport(true);
  };

  // Handle PDF export
  const handleExportPDF = async () => {
    try {
      // Get the content to export
      const element = document.getElementById('reports-content');
      if (!element) {
        alert('Unable to find content to export');
        return;
      }

      // Show loading indicator
      const originalText = 'Export PDF';
      const exportButton = document.querySelector('[data-export-button]') as HTMLButtonElement;
      if (exportButton) {
        exportButton.textContent = 'Generating PDF...';
        exportButton.disabled = true;
      }

      // Configure html2canvas options for lightweight files
      const canvas = await html2canvas(element, {
        scale: 1, // Reduced scale for lighter files
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      // Create PDF with compressed image
      const imgData = canvas.toDataURL('image/jpeg', 0.85); // Use JPEG with good quality
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Calculate dimensions to fit content
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate scaling to fit content
      const ratio = Math.min(pdfWidth / (imgWidth * 0.264583), pdfHeight / (imgHeight * 0.264583));
      const scaledWidth = imgWidth * 0.264583 * ratio;
      const scaledHeight = imgHeight * 0.264583 * ratio;

      // Add title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const title = selectedAssignment ? 
        `${selectedAssignment.assignmentTitle} - Report` : 
        'Reports & Analytics Summary';
      
      pdf.text(title, pdfWidth / 2, 15, { align: 'center' });
      
      // Add date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const exportDate = new Date().toLocaleString();
      pdf.text(`Generated on: ${exportDate}`, pdfWidth / 2, 25, { align: 'center' });

      // Add the content image - Always fit on single page to prevent duplicates
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
      const filename = selectedAssignment ? 
        `${selectedAssignment.assignmentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf` :
        `reports_analytics_${new Date().toISOString().split('T')[0]}.pdf`;

      // Save the PDF
      pdf.save(filename);

      // Reset button state
      if (exportButton) {
        exportButton.textContent = originalText;
        exportButton.disabled = false;
      }

    } catch (error) {
      alert('Failed to generate PDF. Please try again.');
      
      // Reset button state
      const exportButton = document.querySelector('[data-export-button]') as HTMLButtonElement;
      if (exportButton) {
        exportButton.textContent = 'Export PDF';
        exportButton.disabled = false;
      }
    }
  };

  // Generate student distribution chart data
  const generateStudentDistributionData = (assignment: AssignmentSummaryReport) => {
    const data = [
      { name: 'Completed', value: assignment.completedStudents, color: '#84cc97' }, // Soft muted green
      { name: 'In Progress', value: assignment.inProgressStudents, color: '#f4b76a' }, // Soft muted orange
      { name: 'Not Started', value: assignment.notStartedStudents, color: '#e5e7eb' } // Very light gray
    ];
    
    const nonZeroData = data.filter(item => item.value > 0);
    
    // If there's only one category, we need to add a tiny invisible segment to make it show as full circle
    if (nonZeroData.length === 1) {
      return [
        ...nonZeroData,
        { name: 'invisible', value: 0.001, color: 'transparent' }
      ];
    }
    
    return nonZeroData;
  };

  // Generate module performance chart data
  const generateModulePerformanceData = (assignment: AssignmentSummaryReport) => {
    if (!assignment.moduleReports || assignment.moduleReports.length === 0) return [];
    
    return assignment.moduleReports.map(module => ({
      name: module.moduleTitle.length > 15 ? 
        module.moduleTitle.substring(0, 15) + '...' : 
        module.moduleTitle,
      completionRate: module.completionRate,
      averageScore: module.averageScore || 0,
      totalQuestions: module.totalQuestions
    }));
  };

  // Generate radar chart data for overall assignment performance
  const generateRadarData = (assignment: AssignmentSummaryReport) => [
    {
      metric: 'Completion Rate',
      value: assignment.completionRate,
      fullMark: 100
    },
    {
      metric: 'Average Score',
      value: assignment.averageScore || 0,
      fullMark: 100
    },
    {
      metric: 'Student Engagement',
      value: Math.min(100, (assignment.totalStudents - assignment.notStartedStudents) / assignment.totalStudents * 100),
      fullMark: 100
    },
    {
      metric: 'Time Efficiency',
      value: assignment.averageCompletionTimeMinutes ? 
        Math.max(0, 100 - Math.min(100, assignment.averageCompletionTimeMinutes / 120 * 100)) : 
        50,
      fullMark: 100
    }
  ];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={cssStyles.tooltip}>
          <p className={cssStyles.tooltipLabel}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color, margin: '4px 0' }}>
              {`${entry.dataKey}: ${entry.value}${entry.dataKey.includes('Rate') || entry.dataKey.includes('Score') ? '%' : ''}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render assignment details view
  const renderAssignmentDetails = () => {
    if (!selectedAssignment) return null;

    // Show full report if requested
    if (showFullReport) {
      return (
        <AssignmentFullReport
          assignmentId={selectedAssignment.assignmentId}
          assignmentTitle={selectedAssignment.assignmentTitle}
          onBack={() => setShowFullReport(false)}
        />
      );
    }

    return (
      <div className={cssStyles.detailsContainer} id="reports-content">
        <div className={cssStyles.detailsHeader}>
          <div className={cn(cssStyles.detailsHeaderButtons, "reports-summary-details-header-buttons")}>
            <button onClick={handleBackToList} className={cn(cssStyles.backButton, "reports-summary-details-header-button")}>
              ← Back to Reports List
            </button>
            <button onClick={handleViewFullReport} className={cn(cssStyles.fullReportButton, "reports-summary-details-header-button")}>
              Full Report
            </button>
            <button 
              onClick={handleExportPDF}
              className={cn(cssStyles.exportButton, "reports-summary-details-header-button")}
              data-export-button
            >
              <img src="/images/icons/save.svg" alt="" style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle'}} />Export PDF
            </button>
          </div>
          <h3 className={cssStyles.detailsTitle}>{selectedAssignment.assignmentTitle}</h3>
        </div>

        <div className={cssStyles.detailsGrid}>
          {/* Assignment Overview */}
          <div className={cssStyles.overviewCard}>
            <h4 className={cssStyles.cardTitle}>Assignment Overview</h4>
            <div className={cssStyles.cardContent}>
              <p className={cssStyles.cardContentP}><strong>Description:</strong> {selectedAssignment.assignmentDescription || 'No description provided'}</p>
              <p><strong>Start Date:</strong> {formatDateToLocal(selectedAssignment.startDateUtc)}</p>
              <p><strong>End Date:</strong> {formatDateToLocal(selectedAssignment.endDateUtc)}</p>
              <p><strong>Status:</strong> <span className={cssStyles.statusBadge} style={{
                backgroundColor: selectedAssignment.isActive ? '#dcfce7' : '#fef3c7',
                color: selectedAssignment.isActive ? '#166534' : '#92400e'
              }}>
                {selectedAssignment.isActive ? 'Active' : 'Inactive'}
              </span></p>
            </div>
          </div>

          {/* Student Statistics */}
          <div className={cssStyles.statsCard}>
            <h4 className={cssStyles.cardTitle}>Exam Taker Statistics</h4>
            <div className={cssStyles.statsGrid}>
              <div className={cssStyles.statItem}>
                <span className={cssStyles.statNumber}>{selectedAssignment.totalStudents}</span>
                <span className={cssStyles.statLabel}>Total Exam Takers</span>
              </div>
              <div className={cssStyles.statItem}>
                <span className={cssStyles.statNumber}>{selectedAssignment.completedStudents}</span>
                <span className={cssStyles.statLabel}>Completed</span>
              </div>
              <div className={cssStyles.statItem}>
                <span className={cssStyles.statNumber}>{selectedAssignment.inProgressStudents}</span>
                <span className={cssStyles.statLabel}>In Progress</span>
              </div>
              <div className={cssStyles.statItem}>
                <span className={cssStyles.statNumber}>{selectedAssignment.notStartedStudents}</span>
                <span className={cssStyles.statLabel}>Not Started</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className={cssStyles.performanceCard}>
            <h4 className={cssStyles.cardTitle}>Performance Metrics</h4>
            <div className={cssStyles.cardContent}>
              <p><strong>Completion Rate:</strong> {selectedAssignment.completionRate.toFixed(1)}%</p>
              <p><strong>Average Score:</strong> {selectedAssignment.averageScore?.toFixed(1) ?? 'N/A'}%</p>
              <p><strong>Average Completion Time:</strong> {
                selectedAssignment.averageCompletionTimeMinutes 
                  ? `${Math.round(selectedAssignment.averageCompletionTimeMinutes)} minutes`
                  : 'N/A'
              }</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className={cssStyles.chartsSection}>
          <h4 className={cssStyles.sectionTitle}>Visual Analytics</h4>
          
          {/* Charts Grid */}
          <div className={cssStyles.chartsGrid}>
            {/* Student Distribution Pie Chart */}
            <div className={cssStyles.chartCard}>
              <h5 className={cssStyles.chartTitle}>Exam Taker Progress Distribution</h5>
              
              {/* Custom Legend */}
              <div className={cssStyles.customLegend}>
                <div className={cssStyles.legendItem}>
                  <div className={cssStyles.legendColor} style={{backgroundColor: '#84cc97'}}></div>
                  <span>Completed: {selectedAssignment.completedStudents} ({((selectedAssignment.completedStudents / selectedAssignment.totalStudents) * 100).toFixed(1)}%)</span>
                </div>
                <div className={cssStyles.legendItem}>
                  <div className={cssStyles.legendColor} style={{backgroundColor: '#f4b76a'}}></div>
                  <span>In Progress: {selectedAssignment.inProgressStudents} ({((selectedAssignment.inProgressStudents / selectedAssignment.totalStudents) * 100).toFixed(1)}%)</span>
                </div>
                <div className={cssStyles.legendItem}>
                  <div className={cssStyles.legendColor} style={{backgroundColor: '#e5e7eb'}}></div>
                  <span>Not Started: {selectedAssignment.notStartedStudents} ({((selectedAssignment.notStartedStudents / selectedAssignment.totalStudents) * 100).toFixed(1)}%)</span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={generateStudentDistributionData(selectedAssignment)}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={30}
                    fill="#8884d8"
                    dataKey="value"
                    startAngle={0}
                    endAngle={360}
                    paddingAngle={0}
                  >
                    {generateStudentDistributionData(selectedAssignment).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke={entry.name === 'invisible' ? 'transparent' : undefined}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: any) => {
                      // Don't show tooltip for invisible segment
                      if (name === 'invisible') return [null, null];
                      return [
                        `${value} exam takers (${((value / selectedAssignment.totalStudents) * 100).toFixed(1)}%)`,
                        name
                      ];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Radar Chart */}
            <div className={cssStyles.chartCard}>
              <h5 className={cssStyles.chartTitle}>Overall Performance Radar</h5>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={generateRadarData(selectedAssignment)}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Radar
                    name="Performance"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip formatter={(value) => [`${value}%`, 'Performance']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Module Performance Bar Chart */}
          {selectedAssignment.moduleReports && selectedAssignment.moduleReports.length > 0 && (
            <div className={cssStyles.fullWidthChartCard}>
              <h5 className={cssStyles.chartTitle}>Module Performance Comparison</h5>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={generateModulePerformanceData(selectedAssignment)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="completionRate" 
                    name="Completion Rate (%)"
                    fill="#84cc97" 
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="averageScore" 
                    name="Average Score (%)"
                    fill="#87ceeb" 
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Module Reports */}
        {selectedAssignment.moduleReports && selectedAssignment.moduleReports.length > 0 && (
          <div className={cssStyles.moduleReportsSection}>
            <h4 className={cssStyles.sectionTitle}>Module Performance</h4>
            <div className={cssStyles.moduleGrid}>
              {selectedAssignment.moduleReports.map((module) => (
                <div key={module.moduleId} className={cssStyles.moduleCard}>
                  <h5 className={cssStyles.moduleTitle}>{module.moduleTitle}</h5>
                  <div className={cssStyles.moduleStats}>
                    <p><strong>Completion Rate:</strong> {module.completionRate.toFixed(1)}%</p>
                    <p><strong>Average Score:</strong> {module.averageScore?.toFixed(1) ?? 'N/A'}%</p>
                    <p><strong>Questions:</strong> {module.totalQuestions}</p>
                    {module.averageCompletionTimeMinutes && (
                      <p><strong>Avg. Time:</strong> {Math.round(module.averageCompletionTimeMinutes)} min</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render assignments list view
  const renderAssignmentsList = () => {
    // Generate overview chart data from all assignments
    const overviewData = assignments.map(assignment => ({
      name: assignment.assignmentTitle.length > 12 ? 
        assignment.assignmentTitle.substring(0, 12) + '...' : 
        assignment.assignmentTitle,
      completionRate: assignment.completionRate,
      averageScore: assignment.averageScore || 0,
      totalStudents: assignment.totalStudents
    }));

    return (
      <div className={cssStyles.container} id="reports-content">
        <div className={cssStyles.header}>
          <h2 className={cssStyles.title} style={{display: 'flex', alignItems: 'center'}}><img src="/images/icons/line-chart.svg" alt="" style={{width: '28px', height: '28px', marginRight: '10px'}} />Reports & Analytics</h2>
          <div className={cn(cssStyles.headerButtons, "reports-summary-header-buttons")}>
            <button 
              onClick={handleExportPDF}
              className={cn(cssStyles.exportButton, "reports-summary-header-button")}
              data-export-button
            >
              <img src="/images/icons/save.svg" alt="" style={{width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle'}} />Export PDF
            </button>
            <button 
              onClick={() => fetchAssignments(currentPage)}
              className={cn(cssStyles.refreshButton, "reports-summary-header-button")}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className={cssStyles.errorContainer}>
            <p className={cssStyles.errorText}>{error}</p>
          </div>
        )}

        {/* Overview Chart */}
        {assignments.length > 0 && (
          <div className={cssStyles.overviewChartContainer}>
            <h3 className={cssStyles.overviewChartTitle}>Assignment Performance Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={overviewData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="completionRate" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="Completion Rate (%)"
                  dot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="averageScore" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Average Score (%)"
                  dot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {loading && assignments.length === 0 ? (
          <div className={cssStyles.loadingContainer}>
            <p className={cssStyles.loadingText}>Loading assignment reports...</p>
          </div>
        ) : (
          <>
            <div className={cn(cssStyles.tableContainer, "reports-summary-table-container")}>
              <table className={cn(cssStyles.table, "reports-summary-table")}>
                <thead className={cssStyles.thead}>
                  <tr>
                    <th className={cssStyles.th}>Assignment</th>
                    <th className={cssStyles.th}>Exam Takers</th>
                    <th className={cssStyles.th}>Completion Rate</th>
                    <th className={cssStyles.th}>Average Score</th>
                    <th className={cssStyles.th}>Status</th>
                    <th className={cssStyles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment.assignmentId} className={cssStyles.tr}>
                      <td className={cssStyles.td}>
                        <div>
                          <strong>{assignment.assignmentTitle}</strong>
                          <div className={cssStyles.assignmentDates}>
                            {formatDateToLocal(assignment.startDateUtc)} - {formatDateToLocal(assignment.endDateUtc)}
                          </div>
                        </div>
                      </td>
                      <td className={cssStyles.td}>
                        <div className={cssStyles.studentStats}>
                          <div>{assignment.totalStudents} total</div>
                          <div className={cssStyles.studentBreakdown}>
                            <span className={cssStyles.badge} style={{backgroundColor: '#dcfce7', color: '#166534'}}>
                              {assignment.completedStudents} done
                            </span>
                            <span className={cssStyles.badge} style={{backgroundColor: '#dcfce7', color: '#166534'}}>
                              {assignment.inProgressStudents} in progress
                            </span>
                            <span className={cssStyles.badge} style={{backgroundColor: '#fef3c7', color: '#92400e'}}>
                              {assignment.notStartedStudents} not started
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className={cssStyles.td}>
                        <div className={cssStyles.progressBar}>
                          <div 
                            className={cssStyles.progressFill}
                            style={{width: `${assignment.completionRate}%`}}
                          />
                        </div>
                        <span className={cssStyles.progressText}>{assignment.completionRate.toFixed(1)}%</span>
                      </td>
                      <td className={cssStyles.td}>
                        {assignment.averageScore?.toFixed(1) ?? 'N/A'}%
                      </td>
                      <td className={cssStyles.td}>
                        <span className={cssStyles.badge} style={{
                          backgroundColor: assignment.isActive ? '#dcfce7' : '#fef3c7',
                          color: assignment.isActive ? '#166534' : '#92400e'
                        }}>
                          {assignment.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className={cssStyles.td}>
                        <div className={cssStyles.actionButtons}>
                          <button 
                            onClick={() => handleViewDetails(assignment)}
                            className={cssStyles.detailsButton}
                            disabled={loadingSummaryAssignmentId === assignment.assignmentId}
                          >
                            {loadingSummaryAssignmentId === assignment.assignmentId ? 'Loading...' : 'View Summary Report'}
                          </button>
                          <button 
                            onClick={() => handleViewFullReportFromList(assignment)}
                            className={cssStyles.fullReportButtonSmall}
                            disabled={loadingFullReportAssignmentId === assignment.assignmentId}
                          >
                            {loadingFullReportAssignmentId === assignment.assignmentId ? 'Loading...' : 'View Full Report'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {assignments.length === 0 && !loading && !error && (
                    <tr>
                      <td colSpan={6} className={cssStyles.td} style={{ textAlign: 'center', fontStyle: 'italic', color: '#6b7280', padding: '40px' }}>
                        No assignments found. Create some assignments to view reports and analytics.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={cn(cssStyles.pagination, "reports-summary-pagination")}>
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className={cn(cssStyles.paginationButton, "reports-summary-pagination-button")}
                  style={{opacity: currentPage === 1 ? 0.5 : 1}}
                >
                  Previous
                </button>
                
                <span className={cssStyles.paginationInfo}>
                  Page {currentPage} of {totalPages}
                </span>
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className={cn(cssStyles.paginationButton, "reports-summary-pagination-button")}
                  style={{opacity: currentPage === totalPages ? 0.5 : 1}}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Main render
  return selectedAssignment ? renderAssignmentDetails() : renderAssignmentsList();
};

export default ReportsSummary;
