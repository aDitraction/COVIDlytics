/**
 * Main application logic
 */

import { formatNumber, calculateGrowthRate, calculatePercentage, calculatePerCapita } from './utils.js';
import { initializeCharts, updateCharts, updateChartsTheme } from './charts.js';
import AdvancedAnalysis from './advanced-analysis.js';
import { countriesData } from './countries-data.js';

// Global state
let globalData = null;
let selectedCountry = '';
let selectedMetric = 'cases';
let selectedDateRange = '7';
let isTransitioning = false;

// Store processed data
let processedData = null;

// DOM Elements
const uploadSection = document.getElementById('upload-section');
const dashboardContent = document.getElementById('dashboard-content');
const loadingSpinner = document.getElementById('loading-spinner');
const fileInput = document.getElementById('csv-file');
const countrySelect = document.getElementById('country-select');
const regionSelect = document.getElementById('region-select');
const metricSelect = document.getElementById('metric-select');
const themeToggle = document.getElementById('theme-toggle');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

// Initialize application
function initializeApp() {
    setupSelect2();
    setupTooltips();
    // Initialize charts after DOM is fully loaded
    setTimeout(() => {
        initializeCharts();
    }, 0);
}

// Setup Select2 for enhanced dropdowns
function setupSelect2() {
    $('#country-select').select2({
        theme: 'bootstrap-5',
        placeholder: 'Select a country',
        allowClear: true,
        width: '100%'
    });

    $('#region-select').select2({
        theme: 'bootstrap-5',
        placeholder: 'Select a region',
        allowClear: true,
        width: '100%'
    });

    $('#metric-select').select2({
        theme: 'bootstrap-5',
        minimumResultsForSearch: Infinity,
        width: '100%'
    });
}

// Setup tooltips
function setupTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
}

// Handle file upload with animation
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Show loading animation
    loadingSpinner.classList.remove('d-none');
    uploadSection.style.opacity = '0.5';

    try {
        const csvData = await readCSVFile(file);
        
        if (!csvData || csvData.length === 0) {
            throw new Error('No data found in the CSV file');
        }

        // Process the data
        if (processData(csvData)) {
            // Initialize advanced features
            initializeAdvancedFeatures(globalData);
            
            // Smooth transition from upload to dashboard
            uploadSection.style.opacity = '0';
            setTimeout(() => {
                uploadSection.classList.add('d-none');
                dashboardContent.classList.remove('d-none');
                setTimeout(() => {
                    dashboardContent.style.opacity = '1';
                    updateDashboard();
                }, 100);
            }, 500);
        }
    } catch (error) {
        console.error('Error processing file:', error);
        showErrorMessage(`Error: ${error.message}`);
    } finally {
        loadingSpinner.classList.add('d-none');
        uploadSection.style.opacity = '1';
    }
}

// Read CSV file
function readCSVFile(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            complete: result => resolve(result.data),
            error: error => reject(error)
        });
    });
}

// Process CSV data
function processData(csvData) {
    if (!Array.isArray(csvData)) {
        console.error('Invalid CSV data format');
        return;
    }

    try {
        globalData = csvData
            .filter(row => row['Country/Region'] && row['Confirmed'])
            .map(row => ({
                country: row['Country/Region'],
                cases: parseInt(row['Confirmed']) || 0,
                deaths: parseInt(row['Deaths']) || 0,
                recovered: parseInt(row['Recovered']) || 0,
                active: parseInt(row['Active']) || 0,
                region: row['WHO Region'] || 'Unknown',
                newCases: parseInt(row['New cases']) || 0,
                newDeaths: parseInt(row['New deaths']) || 0,
                weekChange: parseFloat(row['1 week % increase']) || 0
            }))
            .filter(row => row.cases > 0);

        if (globalData.length === 0) {
            throw new Error('No valid data found in CSV');
        }

        // Populate country select
        const countries = [...new Set(globalData.map(d => d.country))].sort();
        countrySelect.innerHTML = '<option value="">Global Statistics</option>' +
            countries.map(country => `<option value="${country}">${country}</option>`).join('');

        // Populate region select
        const regions = [...new Set(globalData.map(d => d.region))].sort();
        regionSelect.innerHTML = '<option value="">All Regions</option>' +
            regions.map(region => `<option value="${region}">${region}</option>`).join('');

        // Update metric select
        metricSelect.innerHTML = `
            <option value="cases">Total Cases</option>
            <option value="deaths">Deaths</option>
            <option value="recovered">Recovered</option>
            <option value="active">Active Cases</option>
        `;

        // Initialize Select2 after populating options
        $(countrySelect).trigger('change');
        $(regionSelect).trigger('change');
        $(metricSelect).trigger('change');

        return true;
    } catch (error) {
        console.error('Error processing data:', error);
        throw error;
    }
}

// Update top countries table with animation
function updateTopCountriesTable(data) {
    const tbody = document.getElementById('top-countries');
    if (!tbody) return;

    // Sort countries by total cases
    const topCountries = [...data]
        .sort((a, b) => b.cases - a.cases)
        .slice(0, 10);

    // Create table rows with animation
    tbody.innerHTML = topCountries.map((country, index) => {
        const recoveryRate = calculatePercentage(country.recovered, country.cases);
        const deathRate = calculatePercentage(country.deaths, country.cases);
        const weeklyChange = country['1 week % increase'] || 0;

        return `
            <tr style="opacity: 0; animation: fadeIn 0.5s forwards ${index * 0.1}s">
                <td>${country.country}</td>
                <td class="text-end">${formatNumber(country.cases)}</td>
                <td class="text-end">${formatNumber(country.active)}</td>
                <td class="text-end">${formatNumber(country.recovered)}</td>
                <td class="text-end">${formatNumber(country.deaths)}</td>
                <td class="text-end">${recoveryRate.toFixed(1)}%</td>
                <td class="text-end">${deathRate.toFixed(1)}%</td>
                <td class="text-end">
                    <span class="badge ${weeklyChange > 0 ? 'bg-danger' : 'bg-success'}">
                        ${weeklyChange > 0 ? '+' : ''}${weeklyChange.toFixed(1)}%
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

// Update dashboard with smooth transitions
function updateDashboard() {
    if (!globalData || isTransitioning) return;
    
    isTransitioning = true;
    
    try {
        const country = countrySelect.value;
        const region = regionSelect.value;
        const metric = metricSelect.value;

        // Filter data based on selection
        let filteredData = [...globalData];
        
        if (country) {
            filteredData = filteredData.filter(d => d.country === country);
        } else if (region) {
            filteredData = filteredData.filter(d => d.region === region);
        }

        if (filteredData.length === 0) {
            throw new Error('No data available for the selected filters');
        }

        // Update statistics
        updateStatistics(filteredData);
        
        // Update charts
        updateCharts(filteredData, metric);
        
        // Update top countries table
        updateTopCountriesTable(filteredData);

        // Update advanced features
        AdvancedAnalysis.init(filteredData);

    } catch (error) {
        console.error('Error updating dashboard:', error);
        showErrorMessage(`Error: ${error.message}`);
    } finally {
        isTransitioning = false;
    }
}

// Update statistics
function updateStatistics(data) {
    try {
        // Calculate totals
        const totalCases = data.reduce((sum, d) => sum + (d.cases || 0), 0);
        const activeCases = data.reduce((sum, d) => sum + (d.active || 0), 0);
        const recoveredCases = data.reduce((sum, d) => sum + (d.recovered || 0), 0);
        const totalDeaths = data.reduce((sum, d) => sum + (d.deaths || 0), 0);
        
        // Calculate rates
        const recoveryRate = totalCases > 0 ? (recoveredCases / totalCases) * 100 : 0;
        const deathRate = totalCases > 0 ? (totalDeaths / totalCases) * 100 : 0;
        
        // Calculate weekly changes
        const weeklyNewCases = data.reduce((sum, d) => sum + (d.newCases || 0), 0);
        const weeklyNewDeaths = data.reduce((sum, d) => sum + (d.newDeaths || 0), 0);
        
        // Update statistics cards
        updateStatCard('total-cases-count', totalCases);
        updateStatCard('active-cases-count', activeCases);
        updateStatCard('recovered-count', recoveredCases);
        updateStatCard('deaths-count', totalDeaths);
        
        // Update rates
        updateStatCard('recovery-rate', recoveryRate.toFixed(2) + '%');
        updateStatCard('death-rate', deathRate.toFixed(2) + '%');
        
        // Update trends
        updateStatCard('cases-trend', weeklyNewCases > 0 ? `+${formatNumber(weeklyNewCases)}` : formatNumber(weeklyNewCases));
        updateStatCard('new-cases-count', formatNumber(weeklyNewCases));

        // Update chart data
        updateCharts(data, metricSelect.value);
    } catch (error) {
        console.error('Error updating statistics:', error);
        throw error;
    }
}

// Helper function to update stat cards with animation
function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const startValue = parseInt(element.textContent.replace(/[^0-9.-]+/g, '')) || 0;
    const endValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    
    animateNumber(element, startValue, endValue);
}

// Animate number changes
function animateNumber(element, start, end) {
    const duration = 1000; // Animation duration in milliseconds
    const startTime = performance.now();
    const isPercentage = element.textContent.includes('%');
    
    const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuad = t => t * (2 - t);
        const easedProgress = easeOutQuad(progress);
        
        const current = start + (end - start) * easedProgress;
        element.textContent = isPercentage ? 
            formatNumber(current) + '%' : 
            formatNumber(current);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    
    requestAnimationFrame(animate);
}

// formatNumber is imported from utils.js

// Show error message
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show';
    errorDiv.role = 'alert';
    errorDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Remove any existing error messages
    document.querySelectorAll('.alert-danger').forEach(alert => alert.remove());
    
    // Add the new error message at the top of the content
    const container = dashboardContent.classList.contains('d-none') ? 
        uploadSection : dashboardContent;
    container.insertBefore(errorDiv, container.firstChild);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Setup event listeners
function setupEventListeners() {
    // File upload
    fileInput.addEventListener('change', handleFileUpload);

    // Form submission
    const filterForm = document.getElementById('filter-form');
    filterForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const updateButton = document.getElementById('update-dashboard-btn');
        updateButton.disabled = true;
        updateButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';
        
        try {
            updateDashboard();
        } finally {
            setTimeout(() => {
                updateButton.disabled = false;
                updateButton.innerHTML = '<i class="bx bx-refresh me-2"></i>Update Dashboard';
            }, 500);
        }
    });

    // Add change event listeners to update button state
    [countrySelect, regionSelect, metricSelect].forEach(select => {
        select.addEventListener('change', function() {
            const updateButton = document.getElementById('update-dashboard-btn');
            updateButton.classList.add('btn-pulse');
            setTimeout(() => updateButton.classList.remove('btn-pulse'), 500);
        });
    });

    // Theme toggle
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeMediaQuery.addListener((e) => {
        updateChartsTheme(e.matches);
    });
}

// Update data quality report
function updateDataQualityReport() {
    if (!globalData) return;

    const metrics = document.getElementById('quality-metrics');
    const recommendations = document.getElementById('quality-recommendations');

    // Calculate data quality metrics
    const totalRecords = globalData.length;
    const missingData = {
        cases: globalData.filter(d => !d.cases).length,
        deaths: globalData.filter(d => !d.deaths).length,
        recovered: globalData.filter(d => !d.recovered).length,
        active: globalData.filter(d => !d.active).length
    };

    const completeness = {
        cases: ((1 - missingData.cases / totalRecords) * 100).toFixed(2),
        deaths: ((1 - missingData.deaths / totalRecords) * 100).toFixed(2),
        recovered: ((1 - missingData.recovered / totalRecords) * 100).toFixed(2),
        active: ((1 - missingData.active / totalRecords) * 100).toFixed(2)
    };

    // Generate quality metrics HTML
    metrics.innerHTML = `
        <div class="quality-item">
            <h5>Data Completeness</h5>
            <ul>
                <li>Cases: ${completeness.cases}%</li>
                <li>Deaths: ${completeness.deaths}%</li>
                <li>Recovered: ${completeness.recovered}%</li>
                <li>Active Cases: ${completeness.active}%</li>
            </ul>
        </div>
        <div class="quality-item">
            <h5>Total Records</h5>
            <p>${totalRecords} countries/regions</p>
        </div>
    `;

    // Generate recommendations
    const recommendationsList = [];
    if (missingData.cases > 0) recommendationsList.push('Some countries are missing case data');
    if (missingData.deaths > 0) recommendationsList.push('Death counts are incomplete for some regions');
    if (missingData.recovered > 0) recommendationsList.push('Recovery data needs improvement');
    if (missingData.active > 0) recommendationsList.push('Active cases tracking could be enhanced');

    recommendations.innerHTML = `
        <ul class="recommendations-list">
            ${recommendationsList.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    `;
}

// Update advanced features
function updateAdvancedFeatures() {
    if (!globalData) return;

    // Calculate rolling averages
    const rollingAverages = document.getElementById('rolling-averages');
    const avgNewCases = globalData.reduce((sum, curr) => sum + curr.newCases, 0) / globalData.length;
    const avgNewDeaths = globalData.reduce((sum, curr) => sum + curr.newDeaths, 0) / globalData.length;

    rollingAverages.innerHTML = `
        <div class="metric-item">
            <h6>7-Day Averages</h6>
            <ul>
                <li>New Cases: ${formatNumber(avgNewCases)}</li>
                <li>New Deaths: ${formatNumber(avgNewDeaths)}</li>
            </ul>
        </div>
    `;

    // Calculate growth metrics
    const growthMetrics = document.getElementById('growth-metrics');
    const avgWeeklyGrowth = globalData.reduce((sum, curr) => sum + curr.weekChange, 0) / globalData.length;

    growthMetrics.innerHTML = `
        <div class="metric-item">
            <h6>Growth Indicators</h6>
            <ul>
                <li>Average Weekly Growth: ${avgWeeklyGrowth.toFixed(2)}%</li>
                <li>Growth Rate: ${calculateGrowthRate(globalData).toFixed(2)}%</li>
            </ul>
        </div>
    `;

    // Calculate per capita metrics
    const perCapitaMetrics = document.getElementById('per-capita-metrics');
    const totalPopulation = globalData.reduce((sum, curr) => sum + (curr.population || 0), 0);
    const casesPerMillion = (globalData.reduce((sum, curr) => sum + curr.cases, 0) / totalPopulation) * 1000000;
    const deathsPerMillion = (globalData.reduce((sum, curr) => sum + curr.deaths, 0) / totalPopulation) * 1000000;

    perCapitaMetrics.innerHTML = `
        <div class="metric-item">
            <h6>Per Million People</h6>
            <ul>
                <li>Cases: ${formatNumber(casesPerMillion)}</li>
                <li>Deaths: ${formatNumber(deathsPerMillion)}</li>
            </ul>
        </div>
    `;
}

// Initialize theme toggle
function initializeThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle.querySelector('i');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Set initial theme based on system preference
    if (prefersDarkScheme.matches) {
        document.body.classList.add('dark-mode');
        icon.classList.remove('bx-moon');
        icon.classList.add('bx-sun');
    }
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        icon.classList.toggle('bx-moon');
        icon.classList.toggle('bx-sun');
    });
}

// Add this after processData function
function initializeAdvancedFeatures(data) {
    if (!data || !Array.isArray(data)) return;
    
    try {
        // Initialize advanced analysis
        AdvancedAnalysis.init(data);
    } catch (error) {
        console.error('Error initializing advanced features:', error);
        showErrorMessage('Error initializing advanced features. Please check the console for details.');
    }
}

// Export functions
export {
    initializeApp,
    updateDashboard,
    processData
};

// Add this CSS to the existing styles
const style = document.createElement('style');
style.textContent = `
    .btn-pulse {
        animation: pulse 0.5s;
    }

    @keyframes pulse {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.05);
        }
        100% {
            transform: scale(1);
        }
    }

    #update-dashboard-btn {
        transition: all 0.3s ease;
    }

    #update-dashboard-btn:disabled {
        cursor: not-allowed;
        opacity: 0.7;
    }

    .filter-card {
        margin-bottom: 0;
    }
`;
document.head.appendChild(style); 