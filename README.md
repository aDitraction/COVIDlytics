# COVID-19 Dashboard Visualization

A modern, interactive COVID-19 dashboard built with Chart.js and TailwindCSS that provides comprehensive insights into global pandemic data.

## Features

- **Global Timeline**: Interactive line chart showing the progression of confirmed cases, deaths, and recoveries over time
- **Regional Comparison**: Bar charts comparing confirmed cases and case fatality rates across different regions
- **Vaccination Impact Analysis**: Scatter plots demonstrating the relationship between vaccination rates and COVID-19 metrics
- **Top Affected Countries**: Detailed table with key statistics for the most impacted nations

## Technology Stack

- **Frontend Framework**: Vanilla JavaScript with Chart.js for visualizations
- **Styling**: TailwindCSS for modern, responsive design
- **Data Formatting**: Moment.js for date handling
- **Backend Integration**: RESTful API endpoints for data retrieval

## Visualization Components

### 1. Global Timeline Chart
- Type: Line Chart
- Features:
  - Area fill for better trend visibility
  - Interactive tooltips showing exact values
  - Synchronized hover effects across all metrics
  - Automatic number formatting for large values

### 2. Regional Comparison Charts
- Type: Bar Charts
- Features:
  - Clear comparison of cases across regions
  - Percentage-based metrics for fatality rates
  - Consistent color coding for different metrics
  - Responsive design for various screen sizes

### 3. Vaccination Impact Analysis
- Type: Scatter Plots
- Features:
  - Correlation visualization between vaccination rates and cases/deaths
  - Interactive point hover with detailed information
  - Axis labels and formatting for clear interpretation
  - Automatic scale adjustment based on data range

### 4. Countries Table
- Features:
  - Sortable columns
  - Formatted numbers with thousands separators
  - Percentage calculations for rates
  - Responsive design with horizontal scrolling on mobile

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd covid19-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Data Structure

The visualization components expect data in the following format:

```javascript
{
  timeline: {
    dates: [...],
    confirmed: [...],
    deaths: [...],
    recovered: [...]
  },
  regional: {
    regions: [...],
    cases: [...],
    cfr: [...]
  },
  vaccination: {
    casesData: [{x: vaccRate, y: cases}, ...],
    deathsData: [{x: vaccRate, y: deaths}, ...]
  },
  countries: [
    {
      name: "Country",
      confirmed: number,
      active: number,
      recovered: number,
      deaths: number,
      recoveryRate: number,
      deathRate: number
    },
    ...
  ]
}
```

## Best Practices Implemented

1. **Accessibility**
   - ARIA labels for interactive elements
   - Color contrast compliance
   - Keyboard navigation support

2. **Performance**
   - Efficient data updates
   - Debounced resize handlers
   - Optimized rendering

3. **User Experience**
   - Consistent color scheme
   - Clear loading states
   - Error handling
   - Responsive design

4. **Code Quality**
   - Modular component structure
   - Clear documentation
   - Consistent formatting
   - Error boundary implementation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 