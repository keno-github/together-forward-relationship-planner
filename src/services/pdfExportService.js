import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { callClaude } from './claudeAPI';

/**
 * AI-Powered PDF Export Service
 *
 * Creates beautiful, narrative PDF reports using Claude AI
 * to analyze user's dreams, milestones, and progress
 */

// TwogetherForward Brand Colors
const COLORS = {
  copper: '#c49a6c',
  copperLight: '#d4b08a',
  copperDark: '#a88352',
  charcoal: '#2d2926',
  charcoalLight: '#6b635b',
  sage: '#7d8c75',
  cream: '#faf8f5',
  creamWarm: '#f5f2ed',
  white: '#FFFFFF',
};

/**
 * Generate AI-powered PDF report
 */
export const generateAIPoweredPDF = async (userData) => {
  try {
    const { user, dreams, user_profile } = userData;

    // Step 1: Analyze data with Claude AI
    console.log('📊 Analyzing data with Claude AI...');
    const analysis = await analyzeUserDataWithClaude({
      user,
      dreams,
      user_profile,
    });

    // Step 2: Create PDF with beautiful styling
    console.log('📄 Generating PDF...');
    const pdf = createBrandedPDF(user, dreams, analysis, user_profile);

    // Step 3: Download PDF
    const fileName = `TwogetherForward-Journey-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    console.log('✅ PDF generated successfully!');
    return { success: true, fileName };
  } catch (error) {
    console.error('❌ PDF generation error:', error);
    throw error;
  }
};

/**
 * Call Claude API to analyze user's journey
 */
const analyzeUserDataWithClaude = async ({ user, dreams, user_profile }) => {
  const totalDreams = dreams?.length || 0;
  const activeDreams = dreams?.filter(d => !d.completed).length || 0;
  const completedDreams = dreams?.filter(d => d.completed).length || 0;

  // Calculate overall progress
  const totalMilestones = dreams?.reduce((sum, d) => sum + (d.total_milestones || 0), 0) || 0;
  const completedMilestones = dreams?.reduce((sum, d) => sum + (d.completed_milestones || 0), 0) || 0;
  const overallProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  // Build dreams summary
  const dreamsSummary = dreams?.map(d => ({
    title: d.title,
    description: d.description,
    status: d.completed ? 'Completed' : 'In Progress',
    progress: d.total_milestones > 0
      ? Math.round((d.completed_milestones / d.total_milestones) * 100)
      : 0,
    milestones: `${d.completed_milestones}/${d.total_milestones}`,
  })) || [];

  const prompt = `You are analyzing a couple's life planning journey on TwogetherForward, a platform where couples plan their future together.

**User Information:**
- Email: ${user?.email || 'N/A'}
- Full Name: ${user_profile?.full_name || 'User'}
- Account Created: ${user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}

**Journey Overview:**
- Total Dreams: ${totalDreams}
- Active Dreams: ${activeDreams}
- Completed Dreams: ${completedDreams}
- Overall Progress: ${overallProgress}%
- Total Milestones: ${totalMilestones}
- Completed Milestones: ${completedMilestones}

**Dreams Breakdown:**
${dreamsSummary.length > 0 ? dreamsSummary.map((d, i) => `
${i + 1}. "${d.title}" (${d.status})
   Progress: ${d.progress}% (${d.milestones} milestones)
   Description: ${d.description || 'No description'}
`).join('\n') : 'No dreams created yet.'}

**Task:**
Create a warm, encouraging, and insightful summary report for this couple's journey. Write in a professional yet personal tone, as if you're a life planning coach celebrating their progress and guiding them forward.

**Your response should include 4 sections:**

1. **EXECUTIVE_SUMMARY** (2-3 paragraphs): A warm overview of their journey so far, highlighting their commitment to planning together and any notable achievements.

2. **KEY_INSIGHTS** (3-5 bullet points): Specific observations about their progress, patterns, strengths, or areas of focus. Be specific and reference their actual dreams/milestones.

3. **PROGRESS_ANALYSIS** (1-2 paragraphs): Analyze their overall progress percentage. Is it strong? What does it say about their momentum? Be encouraging but honest.

4. **RECOMMENDATIONS** (3-5 bullet points): Actionable next steps to maintain or accelerate their progress. Be specific and practical.

**Format your response EXACTLY like this:**

EXECUTIVE_SUMMARY:
[Your 2-3 paragraph summary here]

KEY_INSIGHTS:
- [Insight 1]
- [Insight 2]
- [Insight 3]

PROGRESS_ANALYSIS:
[Your 1-2 paragraph analysis here]

RECOMMENDATIONS:
- [Recommendation 1]
- [Recommendation 2]
- [Recommendation 3]

Remember: Be warm, encouraging, and specific. Reference their actual dreams by name. Make them feel proud of their progress while inspiring them to continue.`;

  try {
    const response = await callClaude(
      [{ role: 'user', content: prompt }],
      { temperature: 0.7, max_tokens: 1500 }
    );

    // Parse the response
    const sections = parseClaudeAnalysis(response);
    return sections;
  } catch (error) {
    console.error('Claude API error:', error);
    // Fallback to basic analysis
    return {
      executiveSummary: `Thank you for using TwogetherForward to plan your future together. You've created ${totalDreams} dream${totalDreams !== 1 ? 's' : ''} and completed ${completedMilestones} out of ${totalMilestones} milestones, achieving ${overallProgress}% overall progress. Keep building your future together!`,
      keyInsights: [
        `You have ${activeDreams} active dream${activeDreams !== 1 ? 's' : ''} in progress`,
        `${overallProgress}% of your milestones are complete`,
        completedDreams > 0 ? `You've successfully completed ${completedDreams} dream${completedDreams !== 1 ? 's' : ''}!` : 'Keep working towards your first completed dream',
      ],
      progressAnalysis: `Your current progress of ${overallProgress}% shows ${overallProgress >= 50 ? 'strong momentum' : 'steady growth'}. Every milestone you complete brings you closer to your shared vision.`,
      recommendations: [
        'Review your active dreams and prioritize the next milestone',
        'Celebrate your completed milestones together',
        'Set a weekly planning session to maintain momentum',
      ],
    };
  }
};

/**
 * Parse Claude's response into structured sections
 */
const parseClaudeAnalysis = (response) => {
  const text = response.content || response;

  const sections = {
    executiveSummary: '',
    keyInsights: [],
    progressAnalysis: '',
    recommendations: [],
  };

  // Extract sections using regex
  const execMatch = text.match(/EXECUTIVE_SUMMARY:\s*([\s\S]*?)(?=KEY_INSIGHTS:|$)/i);
  if (execMatch) sections.executiveSummary = execMatch[1].trim();

  const insightsMatch = text.match(/KEY_INSIGHTS:\s*([\s\S]*?)(?=PROGRESS_ANALYSIS:|$)/i);
  if (insightsMatch) {
    sections.keyInsights = insightsMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim());
  }

  const progressMatch = text.match(/PROGRESS_ANALYSIS:\s*([\s\S]*?)(?=RECOMMENDATIONS:|$)/i);
  if (progressMatch) sections.progressAnalysis = progressMatch[1].trim();

  const recMatch = text.match(/RECOMMENDATIONS:\s*([\s\S]*?)$/i);
  if (recMatch) {
    sections.recommendations = recMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim());
  }

  return sections;
};

/**
 * Create beautifully branded PDF
 */
const createBrandedPDF = (user, dreams, analysis, user_profile) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let currentY = 0;

  // Helper: Add page header with branding
  const addPageHeader = (pageNum) => {
    // Top copper accent bar
    pdf.setFillColor(hexToRgb(COLORS.copper).r, hexToRgb(COLORS.copper).g, hexToRgb(COLORS.copper).b);
    pdf.rect(0, 0, pageWidth, 3, 'F');

    // Footer with page number
    pdf.setFontSize(8);
    pdf.setTextColor(hexToRgb(COLORS.charcoalLight).r, hexToRgb(COLORS.charcoalLight).g, hexToRgb(COLORS.charcoalLight).b);
    pdf.text(`Page ${pageNum}`, pageWidth - 20, pageHeight - 10);
  };

  // ========================================
  // PAGE 1: COVER PAGE
  // ========================================
  currentY = 60;

  // Brand name
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(hexToRgb(COLORS.copper).r, hexToRgb(COLORS.copper).g, hexToRgb(COLORS.copper).b);
  pdf.text('TwogetherForward', pageWidth / 2, currentY, { align: 'center' });

  currentY += 15;
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(hexToRgb(COLORS.charcoalLight).r, hexToRgb(COLORS.charcoalLight).g, hexToRgb(COLORS.charcoalLight).b);
  pdf.text('Your Journey Report', pageWidth / 2, currentY, { align: 'center' });

  currentY += 40;
  // User name
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(hexToRgb(COLORS.charcoal).r, hexToRgb(COLORS.charcoal).g, hexToRgb(COLORS.charcoal).b);
  const userName = user_profile?.full_name || user?.email?.split('@')[0] || 'Your';
  pdf.text(`${userName}'s Journey`, pageWidth / 2, currentY, { align: 'center' });

  currentY += 20;
  // Date
  pdf.setFontSize(12);
  pdf.setTextColor(hexToRgb(COLORS.charcoalLight).r, hexToRgb(COLORS.charcoalLight).g, hexToRgb(COLORS.charcoalLight).b);
  pdf.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth / 2, currentY, { align: 'center' });

  // Decorative line
  currentY += 30;
  pdf.setDrawColor(hexToRgb(COLORS.copper).r, hexToRgb(COLORS.copper).g, hexToRgb(COLORS.copper).b);
  pdf.setLineWidth(0.5);
  pdf.line(40, currentY, pageWidth - 40, currentY);

  // Stats box
  currentY += 20;
  const totalDreams = dreams?.length || 0;
  const completedDreams = dreams?.filter(d => d.completed).length || 0;
  const totalMilestones = dreams?.reduce((sum, d) => sum + (d.total_milestones || 0), 0) || 0;
  const completedMilestones = dreams?.reduce((sum, d) => sum + (d.completed_milestones || 0), 0) || 0;

  pdf.setFontSize(11);
  pdf.setTextColor(hexToRgb(COLORS.charcoal).r, hexToRgb(COLORS.charcoal).g, hexToRgb(COLORS.charcoal).b);

  const stats = [
    `Dreams Created: ${totalDreams}`,
    `Dreams Completed: ${completedDreams}`,
    `Milestones Completed: ${completedMilestones}/${totalMilestones}`,
    `Overall Progress: ${totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0}%`,
  ];

  stats.forEach((stat, i) => {
    pdf.text(stat, pageWidth / 2, currentY + (i * 8), { align: 'center' });
  });

  addPageHeader(1);

  // ========================================
  // PAGE 2: EXECUTIVE SUMMARY
  // ========================================
  pdf.addPage();
  currentY = 25;
  addPageHeader(2);

  // Section title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(hexToRgb(COLORS.copper).r, hexToRgb(COLORS.copper).g, hexToRgb(COLORS.copper).b);
  pdf.text('Executive Summary', 20, currentY);

  currentY += 10;
  pdf.setDrawColor(hexToRgb(COLORS.copper).r, hexToRgb(COLORS.copper).g, hexToRgb(COLORS.copper).b);
  pdf.setLineWidth(0.3);
  pdf.line(20, currentY, 80, currentY);

  currentY += 8;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(hexToRgb(COLORS.charcoal).r, hexToRgb(COLORS.charcoal).g, hexToRgb(COLORS.charcoal).b);

  const summaryLines = pdf.splitTextToSize(analysis.executiveSummary, pageWidth - 40);
  pdf.text(summaryLines, 20, currentY);
  currentY += summaryLines.length * 5 + 10;

  // Key Insights
  currentY += 5;
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(hexToRgb(COLORS.copper).r, hexToRgb(COLORS.copper).g, hexToRgb(COLORS.copper).b);
  pdf.text('Key Insights', 20, currentY);

  currentY += 10;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(hexToRgb(COLORS.charcoal).r, hexToRgb(COLORS.charcoal).g, hexToRgb(COLORS.charcoal).b);

  analysis.keyInsights.forEach((insight, i) => {
    // Bullet point
    pdf.setFillColor(hexToRgb(COLORS.copper).r, hexToRgb(COLORS.copper).g, hexToRgb(COLORS.copper).b);
    pdf.circle(23, currentY - 1.5, 1, 'F');

    const insightLines = pdf.splitTextToSize(insight, pageWidth - 50);
    pdf.text(insightLines, 28, currentY);
    currentY += insightLines.length * 5 + 3;
  });

  // Progress Analysis
  currentY += 5;
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(hexToRgb(COLORS.copper).r, hexToRgb(COLORS.copper).g, hexToRgb(COLORS.copper).b);
  pdf.text('Progress Analysis', 20, currentY);

  currentY += 10;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(hexToRgb(COLORS.charcoal).r, hexToRgb(COLORS.charcoal).g, hexToRgb(COLORS.charcoal).b);

  const analysisLines = pdf.splitTextToSize(analysis.progressAnalysis, pageWidth - 40);
  pdf.text(analysisLines, 20, currentY);
  currentY += analysisLines.length * 5 + 10;

  // ========================================
  // PAGE 3: DREAMS OVERVIEW
  // ========================================
  pdf.addPage();
  currentY = 25;
  addPageHeader(3);

  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(hexToRgb(COLORS.copper).r, hexToRgb(COLORS.copper).g, hexToRgb(COLORS.copper).b);
  pdf.text('Your Dreams', 20, currentY);

  currentY += 10;
  pdf.setDrawColor(hexToRgb(COLORS.copper).r, hexToRgb(COLORS.copper).g, hexToRgb(COLORS.copper).b);
  pdf.setLineWidth(0.3);
  pdf.line(20, currentY, 80, currentY);

  currentY += 8;

  if (dreams && dreams.length > 0) {
    const tableData = dreams.map(d => [
      d.title,
      d.completed ? 'Completed' : 'In Progress',
      `${d.completed_milestones}/${d.total_milestones}`,
      d.total_milestones > 0 ? `${Math.round((d.completed_milestones / d.total_milestones) * 100)}%` : '0%',
    ]);

    pdf.autoTable({
      startY: currentY,
      head: [['Dream', 'Status', 'Milestones', 'Progress']],
      body: tableData,
      theme: 'plain',
      headStyles: {
        fillColor: hexToRgb(COLORS.copper),
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
      },
      bodyStyles: {
        textColor: hexToRgb(COLORS.charcoal),
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: hexToRgb(COLORS.creamWarm),
      },
      margin: { left: 20, right: 20 },
    });

    currentY = pdf.lastAutoTable.finalY + 15;
  } else {
    pdf.setFontSize(11);
    pdf.setTextColor(hexToRgb(COLORS.charcoalLight).r, hexToRgb(COLORS.charcoalLight).g, hexToRgb(COLORS.charcoalLight).b);
    pdf.text('No dreams created yet. Start your journey today!', 20, currentY);
  }

  // ========================================
  // PAGE 4: RECOMMENDATIONS
  // ========================================
  pdf.addPage();
  currentY = 25;
  addPageHeader(4);

  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(hexToRgb(COLORS.copper).r, hexToRgb(COLORS.copper).g, hexToRgb(COLORS.copper).b);
  pdf.text('Next Steps & Recommendations', 20, currentY);

  currentY += 10;
  pdf.setDrawColor(hexToRgb(COLORS.copper).r, hexToRgb(COLORS.copper).g, hexToRgb(COLORS.copper).b);
  pdf.setLineWidth(0.3);
  pdf.line(20, currentY, 120, currentY);

  currentY += 10;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(hexToRgb(COLORS.charcoal).r, hexToRgb(COLORS.charcoal).g, hexToRgb(COLORS.charcoal).b);

  analysis.recommendations.forEach((rec, i) => {
    // Number badge
    pdf.setFillColor(hexToRgb(COLORS.copper).r, hexToRgb(COLORS.copper).g, hexToRgb(COLORS.copper).b);
    pdf.circle(23, currentY - 1.5, 2.5, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${i + 1}`, 23, currentY, { align: 'center', baseline: 'middle' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(hexToRgb(COLORS.charcoal).r, hexToRgb(COLORS.charcoal).g, hexToRgb(COLORS.charcoal).b);

    const recLines = pdf.splitTextToSize(rec, pageWidth - 50);
    pdf.text(recLines, 30, currentY);
    currentY += recLines.length * 5 + 5;
  });

  // Closing message
  currentY += 15;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(hexToRgb(COLORS.copper).r, hexToRgb(COLORS.copper).g, hexToRgb(COLORS.copper).b);
  const closingText = pdf.splitTextToSize(
    'Thank you for using TwogetherForward to build your future together. Every step forward is progress. Keep dreaming, keep planning, keep building.',
    pageWidth - 40
  );
  pdf.text(closingText, pageWidth / 2, currentY, { align: 'center' });

  // Footer branding
  currentY = pageHeight - 20;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(hexToRgb(COLORS.copper).r, hexToRgb(COLORS.copper).g, hexToRgb(COLORS.copper).b);
  pdf.text('TwogetherForward', pageWidth / 2, currentY, { align: 'center' });
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Building your life together', pageWidth / 2, currentY + 4, { align: 'center' });

  return pdf;
};

/**
 * Convert hex color to RGB
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

export default {
  generateAIPoweredPDF,
};
