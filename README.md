# Elections du Conseil général de Fribourg

A visual data exploration application for analyzing election results of the Fribourg City General Council from 2016 to 2026.

## Features

- **Election Overview**: View aggregated results by party with seat distribution and vote counts
- **Visual Analytics**: Interactive charts showing party distribution, historical trends, and vote patterns
- **Detailed Results**: Drill down into specific election years and party lists to see individual candidate performance
- **Candidate Comparison**: Compare up to 6 candidates across districts with interactive visualizations
- **Cross-Year Analysis**: Compare candidates from different years and parties in a unified view

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd spark-template
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npm run dev
```

The application will start and be available at `http://localhost:5173` (or another port if 5173 is in use).

## Available Scripts

- `npm run dev` - Start the development server with hot reload
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check code quality

## Project Structure

```
src/
├── components/
│   ├── ui/              # Shadcn UI components
│   └── charts/          # Custom chart components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and mock data
├── styles/              # CSS and theme files
├── App.tsx              # Main application component
└── index.css            # Global styles and theme variables
```

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first styling
- **Shadcn UI** - Component library
- **D3.js** - Data visualization
- **Recharts** - Chart components
- **Framer Motion** - Animations
- **Phosphor Icons** - Icon library

## Usage

1. **Browse Election Results**: The home page displays an overview of the 2026 election results
2. **Explore Visualizations**: Scroll to view charts showing seat distribution, vote counts, and historical trends
3. **Select Year & Party**: Use the dropdowns to choose a specific election year and party list
4. **View Candidates**: See detailed results for all candidates in the selected list
5. **Compare Candidates**: Select 2-6 candidates and click "Comparer par district" to see district-by-district comparison
6. **Cross-Comparison**: Add candidates from different years/parties to the global comparison view

## Customization

### Theming

The application uses CSS variables for theming. Modify colors in `src/index.css`:

```css
:root {
  --primary: oklch(0.45 0.15 250);
  --secondary: oklch(0.95 0.005 250);
  --accent: oklch(0.55 0.18 250);
  /* ... more variables */
}
```

### Typography

Fonts are loaded from Google Fonts (defined in `index.html`):
- **Space Grotesk** - Headings
- **Inter** - Body text

## Development Notes

- The app uses mock data located in `src/lib/mockData.ts`
- State management uses React hooks (useState, useEffect)
- The application is fully responsive and mobile-friendly
- All interactive elements include keyboard navigation support

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

This project is part of the Spark template ecosystem.
