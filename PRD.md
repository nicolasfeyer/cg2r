# Planning Guide

A professional election results viewer displaying statistical data and detailed results for the Conseil Général de Fribourg elections, featuring sortable tables and party comparisons with a clean, government-appropriate aesthetic.

**Experience Qualities**:
1. **Professional** - The interface should feel authoritative and trustworthy, appropriate for official government election data
2. **Clear** - Data presentation should be immediately understandable with strong visual hierarchy and organized layouts
3. **Efficient** - Users should be able to quickly navigate between summary and detailed views, sort data, and find specific information

**Complexity Level**: Light Application (multiple features with basic state)
This is a data visualization application with multiple views (summary and detailed results), filtering capabilities (year and party selection), and sortable tables, but doesn't require complex state management or authentication.

## Essential Features

**Election Summary Display**
- Functionality: Shows overall election results with total seats and party distribution
- Purpose: Provides quick overview of election outcomes and seat allocation
- Trigger: Automatically loads on page mount
- Progression: API call → Parse data → Display cards with party info and seat counts → Visual emphasis on seat distribution
- Success criteria: All parties visible with correct vote counts and seat allocations

**Data Visualization Charts**
- Functionality: Interactive pie charts showing seat and vote distribution, plus bar chart showing historical trends
- Purpose: Provides visual understanding of election results and historical patterns across years
- Trigger: Automatically loads with election summary data
- Progression: Data loads → Charts render with interactive tooltips → User can hover over segments for detailed breakdowns
- Success criteria: Charts display accurately, tooltips show party names and percentages, responsive on all screen sizes

**Year Selection**
- Functionality: Dropdown to select election year (2026, 2021, 2016)
- Purpose: Allows users to view historical election data
- Trigger: User clicks year selector dropdown
- Progression: Click dropdown → Select year → API calls refresh with new year parameter → Results update
- Success criteria: Data updates correctly when year changes, current year is clearly indicated

**Party/List Selection**
- Functionality: Dropdown to select specific political party list
- Purpose: Enables detailed candidate-level view for chosen party
- Trigger: User selects party from dropdown
- Progression: Click dropdown → Select party → API fetches detailed results → Table displays candidate votes
- Progression: Table renders with all vote columns → User can sort by any column
- Success criteria: Candidate data displays correctly with all vote distributions

**Sortable Results Table**
- Functionality: Multi-column table with click-to-sort on any column header
- Purpose: Allows users to analyze data by different metrics (total votes, specific list votes, etc.)
- Trigger: User clicks column header
- Progression: Click header → Sort direction toggles → Table rows reorder → Visual indicator shows sort state
- Success criteria: All columns sortable, sort direction clear, data accurately ordered

**Candidate Comparison by District**
- Functionality: Select multiple candidates (2-6) from a list and compare their performance across different electoral districts with a bar chart visualization
- Purpose: Enables detailed analysis of how individual candidates performed in different geographic areas
- Trigger: User selects candidates via checkboxes in results table, then clicks "Comparer par district" button
- Progression: User selects year and list → Candidate table loads → User checks 2-6 candidates → Clicks compare button → Bar chart appears showing district-by-district vote breakdown for selected candidates
- Success criteria: Checkboxes functional, selection counter accurate, comparison chart displays correctly with district names and candidate vote totals, limit of 6 candidates enforced

**Cross-Year and Cross-List Candidate Comparison**
- Functionality: Build a global comparison pool by adding candidates from different years and/or different party lists, then visualize their district-level performance in a unified bar chart
- Purpose: Enables comprehensive analysis comparing candidates across election cycles and political affiliations to identify voting patterns and performance trends
- Trigger: User selects candidates from any year/list combination and clicks "Ajouter à la comparaison globale" button
- Progression: User selects year and list → Candidate table loads → User checks candidates → Clicks "Ajouter à la comparaison globale" → Candidates added to comparison pool (shown in card grid) → User can repeat with different years/lists → Global comparison chart displays all selected candidates with color-coded bars → User can remove individual candidates or clear all
- Success criteria: Can add candidates from multiple years and lists (max 6 total), comparison pool persists when navigating between years/lists, chart clearly differentiates candidates with colors and labels showing name/list/year, individual and bulk removal functions work correctly

## Edge Case Handling
- **API Failures**: Display error toast with retry option, maintain previous data if available
- **Empty Results**: Show meaningful empty state message when no data exists for selected filters
- **Missing Data Fields**: Handle undefined/null values gracefully with fallback display (e.g., "—" for missing votes)
- **Long Party Names**: Truncate with ellipsis and show full name on hover
- **Invalid Year/List Combinations**: Validate selections and show appropriate message if combination doesn't exist

## Design Direction
The design should evoke institutional trust and civic duty - reminiscent of official government portals with Swiss design principles of clarity, precision, and restraint. The aesthetic should feel authoritative yet accessible, with the blue from Fribourg's coat of arms providing a subtle civic connection without overwhelming the data-focused interface.

## Color Selection
A predominantly monochromatic palette with Fribourg's civic blue as the primary action color, creating a professional government portal aesthetic.

- **Primary Color**: Fribourg Blue (oklch(0.45 0.15 250)) - Deep civic blue from the city's coat of arms, used for primary actions and key data points, communicates authority and trustworthiness
- **Secondary Colors**: Cool Gray (oklch(0.95 0.005 250)) - Light grayish-blue for secondary surfaces like cards and alternating table rows, maintains cohesion with blue theme
- **Accent Color**: Fribourg Blue Bright (oklch(0.55 0.18 250)) - Brighter blue for hover states and interactive elements, draws attention while staying professional
- **Foreground/Background Pairings**: 
  - Primary (Fribourg Blue oklch(0.45 0.15 250)): White text (oklch(1 0 0)) - Ratio 7.2:1 ✓
  - Accent (Bright Blue oklch(0.55 0.18 250)): White text (oklch(1 0 0)) - Ratio 5.1:1 ✓
  - Background (White oklch(1 0 0)): Dark Gray text (oklch(0.25 0 0)) - Ratio 12.6:1 ✓
  - Secondary (Cool Gray oklch(0.95 0.005 250)): Dark Gray text (oklch(0.25 0 0)) - Ratio 11.8:1 ✓

## Font Selection
Swiss-inspired typography emphasizing clarity and institutional authority, using a geometric sans-serif for headings and a highly legible humanist sans for data-heavy tables.

- **Typographic Hierarchy**:
  - H1 (Page Title): Space Grotesk Bold/32px/tight letter-spacing (-0.02em), strong institutional presence
  - H2 (Section Headers): Space Grotesk SemiBold/24px/normal letter-spacing, clear sectioning
  - H3 (Card Titles): Space Grotesk Medium/18px/normal letter-spacing, organized data grouping
  - Body Text (Descriptions): Inter Regular/16px/line-height 1.6, comfortable reading
  - Table Headers: Inter SemiBold/14px/uppercase/letter-spacing 0.03em, clear column identification
  - Table Data: Inter Regular/14px/tabular-nums, precise number alignment
  - Small Text (Metadata): Inter Regular/12px/text-muted-foreground, supporting information

## Animations
Animations should be minimal and purposeful, reinforcing the professional government portal aesthetic with subtle transitions that guide attention without distraction.

Use gentle fade-ins (200ms) when data loads to avoid jarring content swaps. Apply smooth sort transitions (150ms) on table reordering to maintain spatial awareness. Hover states on interactive elements should have quick color transitions (100ms) for immediate feedback. Dropdown menus expand with subtle scale-up animations (200ms) to feel natural and responsive.

## Component Selection
- **Components**: 
  - Card: Display party summary data with vote counts and seats won, plus candidate comparison pool display
  - Select: Year and party list dropdowns with clear labels
  - Table: Sortable candidate results with hover states and alternating row colors
  - Checkbox: Candidate selection for comparison features
  - Button: Actions for comparing candidates, adding to global comparison, clearing selections, and removing candidates
  - Badge: Display seat counts and list numbers as prominent tags
  - Separator: Divide summary section from detailed results and comparison sections
  - Skeleton: Loading states for API calls
  - Toaster (Sonner): Error notifications for API failures and success confirmations
  - Recharts: Pie charts for vote/seat distribution, bar chart for historical trends, bar chart for candidate district comparison, and bar chart for cross-year/cross-list comparison
  
- **Customizations**: 
  - Custom table header with sort indicators (arrows) using Phosphor icons (CaretUp/CaretDown)
  - Party cards with larger text for seat counts to emphasize key metric
  - Sticky table header on scroll for long candidate lists
  - Custom chart tooltips with party names, vote counts, and percentages
  - Color-coordinated charts using shades of Fribourg blue for consistency
  - Checkbox column in candidate table for selection
  - Selection counter showing number of selected candidates
  - Comparison button appears when 2+ candidates selected
  - "Add to global comparison" button appears when any candidates selected
  - Selected rows highlighted with accent color background
  - Comparison pool displayed as grid of removable cards with candidate details
  - Cross-comparison chart with up to 6 different colored bars per district
  
- **States**: 
  - Select components: Light gray background in default, blue border on focus, darker background on hover
  - Table rows: White/light gray alternating, subtle blue tint on hover, accent background when candidate selected
  - Checkboxes: Disabled when 6 candidates already selected (max limit for within-list comparison) or when adding to global comparison would exceed 6 total
  - Comparison buttons: "Comparer par district" enabled when 2-6 selected, "Ajouter à la comparaison globale" enabled when any candidates selected and total won't exceed 6
  - Sort headers: Cursor pointer, blue text when active sort column, arrow icon indicates direction
  - Cards: Subtle shadow, slightly elevated appearance, blue accent border on primary party
  - Chart segments: Hover highlights segment and shows detailed tooltip
  - Remove buttons: Ghost variant on comparison cards, destructive variant for "clear all"
  
- **Icon Selection**: 
  - CaretUp/CaretDown (Phosphor): Sort direction indicators
  - Funnel (Phosphor): Filter/selection icons for dropdowns
  - ChartBar (Phosphor): Statistics section icon
  - ArrowsLeftRight (Phosphor): Within-list comparison feature icon
  - Plus (Phosphor): Add to global comparison icon
  - Trash (Phosphor): Remove individual candidates and clear all comparisons
  - Warning (Phosphor): Error states
  
- **Spacing**: 
  - Page padding: px-6 py-8
  - Card gap: gap-4 for grid layout
  - Card internal: p-6
  - Table cell padding: px-4 py-3
  - Section spacing: space-y-8 between major sections
  - Button/Select spacing: gap-3 in filter row
  - Chart section: space-y-6 with gap-6 between side-by-side charts
  
- **Mobile**: 
  - Stack filters vertically on mobile (flex-col on small screens, flex-row on md+)
  - Cards stack in single column below md breakpoint
  - Charts stack vertically on mobile, side-by-side on large screens
  - Table becomes horizontally scrollable with sticky first column
  - Reduce padding to px-4 py-6 on mobile
  - Font sizes scale down slightly: H1 to 24px, body to 14px
  - Chart heights remain consistent for readability
