/**
 * Main application logic
 */

// Global state
let globalData = [];
let selectedCountry = '';
let selectedMetric = 'cases';
let selectedDateRange = '7';

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
    initTheme();
    setupEventListeners();
    updateMetricOptions();
    initializeCharts();
    
    // Initialize Select2 for country dropdown
    $(countrySelect).select2({
        theme: 'bootstrap-5',
        placeholder: 'Select or search a country',
        allowClear: true,
        width: '100%'
    }).on('select2:select', function(e) {
        handleCountryChange(e);
    }).on('select2:clear', function() {
        selectedCountry = '';
        const data = getFilteredData();
        updateDashboard(data);
    });
});

// Setup event listeners
const setupEventListeners = () => {
    // File upload handlers
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    uploadSection.addEventListener('dragover', handleDragOver);
    uploadSection.addEventListener('dragleave', handleDragLeave);
    uploadSection.addEventListener('drop', handleDrop);
    
    // Filter handlers
    regionSelect.addEventListener('change', handleRegionChange);
    metricSelect.addEventListener('change', handleMetricChange);
    
    // Theme toggle
    themeToggle.addEventListener('click', () => {
        toggleTheme();
        updateChartsTheme(document.body.classList.contains('dark-mode'));
        
        // Update Select2 theme
        const isDarkMode = document.body.classList.contains('dark-mode');
        $(countrySelect).select2({
            theme: isDarkMode ? 'bootstrap-5-dark' : 'bootstrap-5'
        });
    });
};

// Handle file upload
const handleFile = (file) => {
    if (!file || !file.name.endsWith('.csv')) {
        alert('Please upload a valid CSV file');
        return;
    }
    
    showLoading();
    
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimiter: ',',
        complete: handleParseComplete,
        error: (error) => {
            hideLoading();
            alert('Error parsing CSV file: ' + error.message);
        },
        beforeFirstChunk: function(chunk) {
            // Log the first chunk to help debug
            console.log('First chunk:', chunk);
            return chunk;
        }
    });
};

// Handle successful CSV parse
const handleParseComplete = (results) => {
    console.log('Parse results:', results);
    
    if (results.errors.length > 0) {
        hideLoading();
        const errorMessage = results.errors.map(err => `${err.message} (row: ${err.row})`).join('\n');
        alert('Error parsing CSV file:\n' + errorMessage);
        return;
    }
    
    try {
        // Map the CSV columns to our expected format
        globalData = results.data
            .filter(row => row['Country/Region'] && row['Confirmed']) // Filter out rows without country and confirmed cases
            .map(row => ({
                date: new Date().toISOString().split('T')[0], // Current date since it's not in CSV
                country: row['Country/Region'],
                cases: Number(row['Confirmed']) || 0,
                deaths: Number(row['Deaths']) || 0,
                recovered: Number(row['Recovered']) || 0,
                active: Number(row['Active']) || 0,
                // Additional data
                newCases: Number(row['New cases']) || 0,
                newDeaths: Number(row['New deaths']) || 0,
                newRecovered: Number(row['New recovered']) || 0,
                deathRate: (Number(row['Deaths']) / Number(row['Confirmed'])) * 100 || 0,
                recoveryRate: (Number(row['Recovered']) / Number(row['Confirmed'])) * 100 || 0,
                deathRecoveryRate: Number(row['Deaths']) && Number(row['Recovered']) ? 
                    (Number(row['Deaths']) / Number(row['Recovered'])) * 100 : 0,
                lastWeekCases: Number(row['Confirmed last week']) || 0,
                weekChange: Number(row['1 week change']) || 0,
                weekPercentIncrease: Number(row['1 week % increase']) || 0,
                region: row['WHO Region'] || ''
            }));
        
        if (globalData.length === 0) {
            throw new Error('No valid data rows found in the CSV file');
        }
        
        console.log('Sample processed data:', globalData.slice(0, 2));
        
        // Populate filters
        populateCountrySelect();
        populateRegionSelect();
        
        // Get initial filtered data
        const filteredData = getFilteredData();
        console.log('Initial filtered data:', filteredData);
        
        // Update UI
        updateDashboard(filteredData);
        
        // Show dashboard
        uploadSection.classList.add('d-none');
        dashboardContent.classList.remove('d-none');
        
    } catch (error) {
        console.error('Error processing data:', error);
        hideLoading();
        alert('Error processing data: ' + error.message);
        return;
    }
    
    hideLoading();
};

// Populate country select dropdown
const populateCountrySelect = () => {
    const countries = [...new Set(globalData.map(row => row.country))].sort();
    
    // Store current selection
    const currentSelection = $(countrySelect).val();
    
    // Update options
    countrySelect.innerHTML = '<option value="">Select or search a country</option>';
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countrySelect.appendChild(option);
    });
    
    // Restore selection if it still exists in the new options
    if (currentSelection && countries.includes(currentSelection)) {
        $(countrySelect).val(currentSelection);
    }
    
    // Trigger Select2 to update
    $(countrySelect).trigger('change');
};

// Populate WHO region select
const populateRegionSelect = () => {
    const regions = [...new Set(globalData.map(row => row.region))].sort();
    
    regionSelect.innerHTML = '<option value="">All Regions</option>';
    regions.forEach(region => {
        if (region) { // Only add non-empty regions
            const option = document.createElement('option');
            option.value = region;
            option.textContent = region;
            regionSelect.appendChild(option);
        }
    });
};

// Event Handlers
const handleCountryChange = (e) => {
    selectedCountry = e.target.value;
    
    // Log the selection for debugging
    console.log('Country selected:', selectedCountry);
    
    // Get filtered data based on selection
    const data = getFilteredData();
    console.log('Filtered data:', data);
    
    // Update dashboard with new data
    updateDashboard(data);
};

const handleRegionChange = (e) => {
    const selectedRegion = e.target.value;
    console.log('Region selected:', selectedRegion);
    
    // Filter countries by region
    if (selectedRegion) {
        const countriesInRegion = globalData
            .filter(row => row.region === selectedRegion)
            .map(row => row.country);
        
        const uniqueCountries = [...new Set(countriesInRegion)].sort();
        
        // Update country select options
        countrySelect.innerHTML = '<option value="">Select or search a country</option>';
        uniqueCountries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countrySelect.appendChild(option);
        });
    } else {
        populateCountrySelect();
    }
    
    // Reset country selection
    selectedCountry = '';
    if ($(countrySelect).data('select2')) {
        $(countrySelect).val('').trigger('change');
    }
    
    // Update dashboard with new data
    const data = getFilteredData();
    updateDashboard(data);
};

const handleMetricChange = (e) => {
    selectedMetric = e.target.value;
    console.log('Metric selected:', selectedMetric);
    
    // Get current filtered data
    const data = getFilteredData();
    
    // Update charts with new metric
    updateCharts(data, selectedMetric);
};

// Update dashboard with current data
const updateDashboard = (data) => {
    console.log('Updating dashboard with data:', data);
    
    if (!data) {
        data = getFilteredData(); // Get filtered data if no data is provided
    }
    
    if (!data) return;
    
    // Update stat cards with safe formatting
    document.getElementById('total-cases-count').textContent = safeFormatNumber(data.cases);
    document.getElementById('active-cases-count').textContent = safeFormatNumber(data.active);
    document.getElementById('recovered-count').textContent = safeFormatNumber(data.recovered);
    document.getElementById('deaths-count').textContent = safeFormatNumber(data.deaths);
    
    // Update trends and rates
    document.getElementById('cases-trend').textContent = safeFormatPercentage(data.weekPercentIncrease);
    document.getElementById('new-cases-count').textContent = safeFormatNumber(data.newCases);
    document.getElementById('recovery-rate').textContent = safeFormatPercentage(data.recoveryRate);
    document.getElementById('death-rate').textContent = safeFormatPercentage(data.deathRate);
    
    // Update trend classes
    updateTrendClasses('cases-trend', data.weekPercentIncrease);
    updateTrendClasses('new-cases-count', data.newCases);
    updateTrendClasses('recovery-rate', data.recoveryRate);
    updateTrendClasses('death-rate', data.deathRate);
    
    // Update top countries table
    updateTopCountriesTable(globalData);
    
    // Update charts
    updateCharts(data, selectedMetric);
};

// Get filtered data based on current selections
const getFilteredData = () => {
    if (!globalData || globalData.length === 0) {
        console.warn('No global data available');
        return null;
    }

    let data = [...globalData];
    
    // Filter by WHO region if selected
    const selectedRegion = regionSelect.value;
    if (selectedRegion) {
        data = data.filter(row => row.region === selectedRegion);
    }
    
    // Filter by country if selected
    if (selectedCountry) {
        data = data.filter(row => row.country === selectedCountry);
        if (data.length > 0) {
            return data[0]; // Return the first matching country data
        }
        return null;
    }
    
    // Calculate and return global totals
    const totals = {
        date: new Date().toISOString().split('T')[0],
        cases: 0,
        deaths: 0,
        recovered: 0,
        active: 0,
        newCases: 0,
        newDeaths: 0,
        newRecovered: 0,
        deathRate: 0,
        recoveryRate: 0,
        weekChange: 0,
        weekPercentIncrease: 0
    };

    // Sum up all numeric values
    data.forEach(row => {
        totals.cases += Number(row.cases) || 0;
        totals.deaths += Number(row.deaths) || 0;
        totals.recovered += Number(row.recovered) || 0;
        totals.active += Number(row.active) || 0;
        totals.newCases += Number(row.newCases) || 0;
        totals.newDeaths += Number(row.newDeaths) || 0;
        totals.newRecovered += Number(row.newRecovered) || 0;
        totals.weekChange += Number(row.weekChange) || 0;
    });

    // Calculate rates
    if (totals.cases > 0) {
        totals.deathRate = (totals.deaths / totals.cases) * 100;
        totals.recoveryRate = (totals.recovered / totals.cases) * 100;
    }

    // Calculate week percent increase
    totals.weekPercentIncrease = totals.weekChange > 0 ? 
        (totals.weekChange / (totals.cases - totals.weekChange)) * 100 : 0;

    console.log('Calculated totals:', totals);
    return totals;
};

// Get latest statistics for selected data
const getSelectedStats = (data) => {
    if (selectedCountry) {
        return data.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
    }
    return calculateGlobalTotals(data);
};

// Get previous period statistics for comparison
const getPreviousStats = (data) => {
    const days = parseInt(selectedDateRange);
    if (days === 'all') return {};
    
    const previousData = filterByDateRange(data, days * 2).slice(0, -days);
    return selectedCountry
        ? previousData.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b, {})
        : calculateGlobalTotals(previousData);
};

// Update individual stat card
const updateStatCard = (id, current, previous) => {
    const countElement = document.getElementById(`${id}-count`);
    const trendElement = document.getElementById(`${id}-trend`);
    
    // Animate count
    animateCounter(countElement, current);
    
    // Update trend
    const trend = calculatePercentageChange(current, previous);
    trendElement.textContent = `${trend}%`;
    trendElement.className = 'trend ' + (trend > 0 ? 'text-danger' : 'text-success');
};

// Animate counter
const animateCounter = (element, target) => {
    const start = parseInt(element.textContent.replace(/,/g, ''));
    const duration = 1000;
    const steps = 60;
    const increment = (target - start) / steps;
    let current = start;
    let step = 0;
    
    const animate = () => {
        step++;
        current += increment;
        element.textContent = formatNumber(Math.round(current));
        
        if (step < steps) {
            requestAnimationFrame(animate);
        } else {
            element.textContent = formatNumber(target);
        }
    };
    
    requestAnimationFrame(animate);
};

// Update top countries table with safe formatting
const updateTopCountriesTable = (data) => {
    const groupedData = groupByCountry(data);
    const latestStats = Object.entries(groupedData).map(([country, countryData]) => ({
        country,
        ...getSelectedStats(countryData)
    }));
    
    const topCountries = sortCountriesByMetric(latestStats, selectedMetric).slice(0, 5);
    
    const tbody = document.getElementById('top-countries');
    tbody.innerHTML = '';
    
    topCountries.forEach(country => {
        const tr = document.createElement('tr');
        const weekChange = Number(country.weekPercentIncrease) || 0;
        
        tr.innerHTML = `
            <td>${country.country || 'Unknown'}</td>
            <td class="text-end">${safeFormatNumber(country.cases)}</td>
            <td class="text-end">${safeFormatNumber(country.active)}</td>
            <td class="text-end">${safeFormatNumber(country.recovered)}</td>
            <td class="text-end">${safeFormatNumber(country.deaths)}</td>
            <td class="text-end">${safeFormatPercentage(country.recoveryRate)}</td>
            <td class="text-end">${safeFormatPercentage(country.deathRate)}</td>
            <td class="text-end ${weekChange > 0 ? 'text-danger' : 'text-success'}">
                ${safeFormatPercentage(weekChange)}
            </td>
        `;
        tbody.appendChild(tr);
    });
};

// Loading state handlers
const showLoading = () => {
    loadingSpinner.classList.remove('d-none');
};

const hideLoading = () => {
    loadingSpinner.classList.add('d-none');
};

// Update the metric select options to match available data
const updateMetricOptions = () => {
    metricSelect.innerHTML = `
        <option value="cases">Total Cases</option>
        <option value="active">Active Cases</option>
        <option value="recovered">Recovered</option>
        <option value="deaths">Deaths</option>
        <option value="newCases">New Cases</option>
        <option value="newDeaths">New Deaths</option>
        <option value="newRecovered">New Recovered</option>
    `;
};

// Update trend classes based on value
const updateTrendClasses = (elementId, value) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.classList.remove('text-success', 'text-danger', 'text-warning');
    if (value > 0) {
        element.classList.add(elementId.includes('recovery') ? 'text-success' : 'text-danger');
    } else if (value < 0) {
        element.classList.add(elementId.includes('death') ? 'text-success' : 'text-warning');
    }
}; 