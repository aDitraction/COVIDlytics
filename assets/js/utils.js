/**
 * Utility functions for data processing and formatting
 */

// Format large numbers with commas
export const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(num)) {
        return '0';
    }
    return new Intl.NumberFormat('en-US').format(Math.round(num));
};

// Calculate growth rate
export const calculateGrowthRate = (data) => {
    if (!data || data.length === 0) return 0;
    
    const totalCases = data.reduce((sum, curr) => sum + curr.cases, 0);
    const totalNewCases = data.reduce((sum, curr) => sum + curr.newCases, 0);
    
    return totalCases > 0 ? (totalNewCases / totalCases) * 100 : 0;
};

// Calculate percentage
export const calculatePercentage = (value, total) => {
    return total > 0 ? (value / total) * 100 : 0;
};

// Calculate per capita value
export const calculatePerCapita = (value, population, factor = 1000000) => {
    return population > 0 ? (value / population) * factor : 0;
};

// Format date string to local date
export const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
};

// Calculate moving average
export const calculateMovingAverage = (data, days = 7) => {
    return data.map((item, index, array) => {
        const start = Math.max(0, index - days + 1);
        const values = array.slice(start, index + 1).map(d => d.value);
        const average = values.reduce((a, b) => a + b, 0) / values.length;
        return {
            date: item.date,
            value: average
        };
    });
};

// Get trend data for a specific metric
export const getTrendData = (data, metric) => {
    return data.map(item => ({
        date: item.date,
        value: parseInt(item[metric] || 0)
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
};

// Sort data by metric
export const sortByMetric = (data, metric, ascending = false) => {
    return [...data].sort((a, b) => {
        const aValue = a[metric] || 0;
        const bValue = b[metric] || 0;
        return ascending ? aValue - bValue : bValue - aValue;
    });
};

// Calculate totals
export const calculateTotals = (data) => {
    return data.reduce((acc, curr) => ({
        cases: acc.cases + (curr.cases || 0),
        deaths: acc.deaths + (curr.deaths || 0),
        recovered: acc.recovered + (curr.recovered || 0),
        active: acc.active + (curr.active || 0),
        newCases: acc.newCases + (curr.newCases || 0),
        newDeaths: acc.newDeaths + (curr.newDeaths || 0)
    }), {
        cases: 0,
        deaths: 0,
        recovered: 0,
        active: 0,
        newCases: 0,
        newDeaths: 0
    });
};

// Calculate data completeness
export const calculateCompleteness = (data) => {
    if (!data || data.length === 0) return {};
    
    const totalRecords = data.length;
    const metrics = ['cases', 'deaths', 'recovered', 'active'];
    
    return metrics.reduce((acc, metric) => {
        const missingCount = data.filter(d => !d[metric]).length;
        acc[metric] = ((1 - missingCount / totalRecords) * 100).toFixed(2);
        return acc;
    }, {});
};

// Validate data
export const validateData = (data) => {
    if (!data || !Array.isArray(data)) return false;
    
    const requiredFields = ['country', 'cases', 'deaths', 'recovered', 'active'];
    return data.every(item => 
        requiredFields.every(field => item.hasOwnProperty(field)) &&
        Object.values(item).every(val => val !== undefined && val !== null)
    );
};

// Calculate statistics
export const calculateStatistics = (data) => {
    if (!data || !Array.isArray(data)) return {};
    
    return {
        cases: data.reduce((sum, curr) => sum + (curr.cases || 0), 0),
        deaths: data.reduce((sum, curr) => sum + (curr.deaths || 0), 0),
        recovered: data.reduce((sum, curr) => sum + (curr.recovered || 0), 0),
        active: data.reduce((sum, curr) => sum + (curr.active || 0), 0)
    };
};

// Calculate trend
export const calculateTrend = (data, metric) => {
    if (!data || data.length === 0) return 0;
    
    const values = data.map(d => d[metric] || 0);
    const current = values[values.length - 1];
    const previous = values[0];
    
    return previous ? ((current - previous) / previous) * 100 : 0;
};

// Safe number formatting
const safeFormatNumber = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0';
    return new Intl.NumberFormat().format(Math.round(value));
};

// Safe percentage formatting
const safeFormatPercentage = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0.0%';
    return value.toFixed(1) + '%';
};

// Calculate percentage change
const calculatePercentageChange = (current, previous) => {
    if (!previous) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
};

// Calculate recovery rate
const calculateRecoveryRate = (recovered, totalCases) => {
    if (!totalCases) return 0;
    return ((recovered / totalCases) * 100).toFixed(1);
};

// Get date range for filtering
const getDateRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return { start, end };
};

// Filter data by date range
const filterByDateRange = (data, days) => {
    if (days === 'all') return data;
    
    const { start } = getDateRange(parseInt(days));
    return data.filter(item => new Date(item.date) >= start);
};

// Group data by country
const groupByCountry = (data) => {
    return data.reduce((acc, row) => {
        if (!acc[row.country]) {
            acc[row.country] = [];
        }
        acc[row.country].push(row);
        return acc;
    }, {});
};

// Calculate average percentage for a metric
const calculateAveragePercentage = (data, metric) => {
    const values = data.map(item => Number(item[metric]) || 0).filter(val => !isNaN(val));
    return values.length > 0 ? values.reduce((a, b) => a + b) / values.length : 0;
};

// Calculate global totals
const calculateGlobalTotals = (data) => {
    return data.reduce((totals, curr) => ({
        cases: (totals.cases || 0) + (Number(curr.cases) || 0),
        deaths: (totals.deaths || 0) + (Number(curr.deaths) || 0),
        recovered: (totals.recovered || 0) + (Number(curr.recovered) || 0),
        active: (totals.active || 0) + (Number(curr.active) || 0),
        newCases: (totals.newCases || 0) + (Number(curr.newCases) || 0),
        newDeaths: (totals.newDeaths || 0) + (Number(curr.newDeaths) || 0),
        newRecovered: (totals.newRecovered || 0) + (Number(curr.newRecovered) || 0),
        weekChange: (totals.weekChange || 0) + (Number(curr.weekChange) || 0)
    }), {});
};

// Get latest stats for data
const getLatestStats = (data) => {
    const totals = calculateGlobalTotals(data);
    return {
        ...totals,
        weekPercentIncrease: calculateAveragePercentage(data, 'weekPercentIncrease'),
        recoveryRate: calculateAveragePercentage(data, 'recoveryRate'),
        deathRate: calculateAveragePercentage(data, 'deathRate')
    };
};

// Sort countries by metric
const sortCountriesByMetric = (data, metric) => {
    return [...data].sort((a, b) => (b[metric] || 0) - (a[metric] || 0));
};

// Format data for Chart.js
const formatChartData = (data, metric) => {
    const trend = getTrendData(data, metric);
    const movingAvg = calculateMovingAverage(trend);
    
    return {
        labels: trend.map(item => formatDate(item.date)),
        datasets: [
            {
                label: `Daily ${metric}`,
                data: trend.map(item => item.value),
                borderColor: getMetricColor(metric),
                backgroundColor: getMetricColor(metric, 0.1),
                borderWidth: 2,
                pointRadius: 0,
                fill: true
            },
            {
                label: `7-day Average`,
                data: movingAvg.map(item => item.value),
                borderColor: getMetricColor(metric, 0.5),
                borderWidth: 2,
                pointRadius: 0,
                fill: false
            }
        ]
    };
};

// Get color for different metrics
const getMetricColor = (metric, alpha = 1) => {
    const colors = {
        cases: `rgba(67, 97, 238, ${alpha})`,
        deaths: `rgba(247, 37, 133, ${alpha})`,
        recovered: `rgba(76, 201, 240, ${alpha})`,
        active: `rgba(72, 149, 239, ${alpha})`
    };
    return colors[metric] || colors.cases;
};

// Theme handling
const initTheme = () => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle').innerHTML = '<i class="bx bx-sun"></i>';
    }
};

const toggleTheme = () => {
    document.body.classList.toggle('dark-mode');
    const themeIcon = document.getElementById('theme-toggle');
    themeIcon.innerHTML = document.body.classList.contains('dark-mode') 
        ? '<i class="bx bx-sun"></i>' 
        : '<i class="bx bx-moon"></i>';
};

// File drag and drop handlers
const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadSection.classList.add('dragover');
};

const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadSection.classList.remove('dragover');
};

const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadSection.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length) {
        handleFile(files[0]);
    }
};

// Filter data by region
export function filterByRegion(data, region) {
    return region ? data.filter(d => d.region === region) : data;
}

// Filter data by country
export function filterByCountry(data, country) {
    return country ? data.filter(d => d.country === country) : data;
} 