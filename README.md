# CovidLytics - Advanced COVID-19 Analytics Dashboard

An advanced analytics dashboard for COVID-19 data visualization and analysis, combining a modern web interface with powerful Python-based analytics.

## Features

### Frontend Dashboard
- Interactive data visualization with Chart.js
- Real-time data filtering and updates
- Responsive design with dark/light theme
- Searchable country selection
- Regional data analysis
- Trend visualization

### Advanced Analytics (Python Backend)
1. **Predictive Analytics**
   - Time series forecasting using Facebook Prophet
   - Case progression prediction
   - Trend analysis with confidence intervals

2. **Clustering Analysis**
   - K-means clustering of countries
   - Similar country identification
   - Pattern recognition
   - Regional grouping

3. **Statistical Analysis**
   - Growth rate calculations
   - Doubling time analysis
   - Outlier detection
   - Correlation analysis
   - Risk score computation

4. **Regional Analysis**
   - WHO region-based analysis
   - Regional comparison
   - Statistical aggregations
   - Recovery vs death ratio analysis

5. **Trend Analysis**
   - Moving averages
   - Growth rate tracking
   - Pattern detection
   - Hotspot identification

## Setup

### Prerequisites
- Python 3.8+
- Node.js 14+
- Modern web browser

### Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Start the Python backend:
```bash
python app.py
```

3. Open the dashboard in your web browser:
```
http://localhost:5000
```

## API Endpoints

### 1. /api/analyze
- Performs basic data analysis
- Returns statistics, rankings, and regional analysis

### 2. /api/forecast
- Generates time series forecasts
- Provides predictions with confidence intervals

### 3. /api/cluster
- Performs country clustering
- Returns cluster statistics and representatives

### 4. /api/trends
- Analyzes trends and patterns
- Identifies hotspots and growth rates

### 5. /api/correlations
- Calculates metric correlations
- Analyzes relationships between variables

## Data Format
The dashboard accepts CSV files with the following columns:
- Country/Region
- Confirmed
- Deaths
- Recovered
- Active
- New cases
- New deaths
- New recovered
- WHO Region

## Advanced Analytics Features

### Risk Assessment
- Composite risk scoring
- Multi-factor analysis
- Regional risk patterns
- Trend-based risk evaluation

### Pattern Recognition
- Similar country identification
- Outbreak pattern matching
- Regional behavior analysis
- Trend similarity detection

### Statistical Modeling
- Time series analysis
- Growth rate modeling
- Recovery rate analysis
- Death rate prediction

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the LICENSE file for details. 