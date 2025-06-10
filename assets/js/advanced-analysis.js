// Advanced Analysis Module
const AdvancedAnalysis = {
    // Store processed data
    data: null,
    maps: {},
    charts: {},

    // Initialize the module
    init(data) {
        if (!data || !Array.isArray(data)) return;
        this.data = data;
        this.setupCorrelationAnalysis();
        this.setupDistributionAnalysis();
        this.setupRegionalAnalysis();
        this.setupOutlierDetection();
        this.initializeEventListeners();
    },

    // Helper Methods
    calculateCorrelations(metrics) {
        if (!metrics || !Array.isArray(metrics) || !this.data) return [];
        
        return metrics.map(m1 => 
            metrics.map(m2 => this.calculatePearsonCorrelation(
                this.data.map(d => d[m1] || 0),
                this.data.map(d => d[m2] || 0)
            ))
        );
    },

    calculatePearsonCorrelation(x, y) {
        if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length || x.length === 0) {
            return 0;
        }

        try {
            const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
            const xMean = mean(x);
            const yMean = mean(y);

            const numerator = x.reduce((sum, xi, i) => 
                sum + (xi - xMean) * (y[i] - yMean), 0);

            const xDev = Math.sqrt(x.reduce((sum, xi) => 
                sum + Math.pow(xi - xMean, 2), 0));
            const yDev = Math.sqrt(y.reduce((sum, yi) => 
                sum + Math.pow(yi - yMean, 2), 0));

            if (xDev === 0 || yDev === 0) return 0;
            return numerator / (xDev * yDev);
        } catch (error) {
            console.error('Error calculating correlation:', error);
            return 0;
        }
    },

    // Correlation Analysis
    setupCorrelationAnalysis() {
        const ctx = document.getElementById('correlation-chart')?.getContext('2d');
        const statsDiv = document.getElementById('correlation-values');
        if (!ctx || !statsDiv || !this.data) return;

        try {
            const metrics = ['cases', 'deaths', 'recovered', 'active'];
            const correlationData = this.calculateCorrelations(metrics);

            // Create scatter plot data for cases vs deaths
            const scatterData = this.data.map(d => ({
                x: d.cases || 0,
                y: d.deaths || 0
            }));

            // Destroy existing chart if it exists
            if (this.charts.correlation) {
                this.charts.correlation.destroy();
            }

            // Create new chart
            this.charts.correlation = new Chart(ctx, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Cases vs Deaths',
                        data: scatterData,
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        pointRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'COVID-19 Cases vs Deaths Correlation'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Cases: ${context.parsed.x.toLocaleString()}, Deaths: ${context.parsed.y.toLocaleString()}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom',
                            title: {
                                display: true,
                                text: 'Total Cases'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value.toLocaleString();
                                }
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Total Deaths'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });

            // Update correlation statistics
            statsDiv.innerHTML = this.generateCorrelationStats(correlationData);
        } catch (error) {
            console.error('Error setting up correlation analysis:', error);
            statsDiv.innerHTML = '<div class="alert alert-danger">Error setting up correlation analysis</div>';
        }
    },

    // Distribution Analysis
    setupDistributionAnalysis() {
        const ctx = document.getElementById('boxplot-chart')?.getContext('2d');
        const statsDiv = document.getElementById('distribution-values');
        if (!ctx || !statsDiv || !this.data) return;

        try {
            const data = this.calculateDistributionData();

            // Destroy existing chart if it exists
            if (this.charts.distribution) {
                this.charts.distribution.destroy();
            }

            // Create new chart
            this.charts.distribution = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Cases', 'Deaths', 'Recovered', 'Active'],
                    datasets: [{
                        label: 'Average',
                        data: data.map(d => d.mean),
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Distribution of COVID-19 Metrics'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Value'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });

            // Update distribution statistics
            statsDiv.innerHTML = this.generateDistributionStats(data);
        } catch (error) {
            console.error('Error setting up distribution analysis:', error);
            statsDiv.innerHTML = '<div class="alert alert-danger">Error setting up distribution analysis</div>';
        }
    },

    // Regional Analysis
    setupRegionalAnalysis() {
        const mapContainer = document.getElementById('heatmap-chart');
        const statsDiv = document.getElementById('regional-values');
        if (!mapContainer || !statsDiv || !this.data) return;

        // Initialize Leaflet map
        const map = L.map(mapContainer).setView([20, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        this.maps.regional = map;

        // Add markers for each country
        this.data.forEach(country => {
            if (country.cases > 0) {
                const radius = Math.sqrt(country.cases) / 100;
                L.circleMarker([0, 0], {
                    radius: Math.max(5, Math.min(20, radius)),
                    fillColor: '#ff7800',
                    color: '#000',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(map)
                .bindPopup(`
                    <strong>${country.country}</strong><br>
                    Cases: ${country.cases.toLocaleString()}<br>
                    Deaths: ${country.deaths.toLocaleString()}<br>
                    Recovered: ${country.recovered.toLocaleString()}
                `);
            }
        });

        // Update regional statistics
        statsDiv.innerHTML = this.generateRegionalStats();
    },

    // Outlier Detection
    setupOutlierDetection() {
        const outlierTableBody = document.getElementById('outliers-table');
        const outlierSummaryDiv = document.getElementById('outlier-values');
        if (!outlierTableBody || !outlierSummaryDiv || !this.data) return;

        const outliers = this.detectOutliers();
        this.updateOutliersTable(outliers, outlierTableBody);
        this.updateOutlierSummary(outliers, outlierSummaryDiv);
    },

    detectOutliers() {
        if (!this.data || !this.data.length) return [];

        const metrics = ['cases', 'deaths', 'recovered', 'active'];
        const outliers = [];

        metrics.forEach(metric => {
            const values = this.data.map(d => d[metric] || 0);
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const std = Math.sqrt(
                values.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / values.length
            ) || 1; // Use 1 as fallback if std is 0

            this.data.forEach(d => {
                const value = d[metric] || 0;
                const zScore = (value - mean) / std;
                if (Math.abs(zScore) > 2) {
                    outliers.push({
                        country: d.country || 'Unknown',
                        metric,
                        value,
                        zScore,
                        status: Math.abs(zScore) > 3 ? 'Extreme' : 'Moderate'
                    });
                }
            });
        });

        return outliers;
    },

    updateOutliersTable(outliers, tableBody) {
        if (!tableBody || !Array.isArray(outliers)) return;

        tableBody.innerHTML = outliers.map(o => `
            <tr>
                <td>${o.country}</td>
                <td>${o.metric.charAt(0).toUpperCase() + o.metric.slice(1)}</td>
                <td>${o.value.toLocaleString()}</td>
                <td>${o.zScore.toFixed(2)}</td>
                <td>
                    <span class="badge ${o.status === 'Extreme' ? 'bg-danger' : 'bg-warning'}">
                        ${o.status}
                    </span>
                </td>
            </tr>
        `).join('');
    },

    updateOutlierSummary(outliers, summaryDiv) {
        if (!summaryDiv || !Array.isArray(outliers)) return;

        const totalOutliers = outliers.length;
        const extremeOutliers = outliers.filter(o => o.status === 'Extreme').length;
        const metrics = [...new Set(outliers.map(o => o.metric))];
        
        summaryDiv.innerHTML = `
            <div class="alert alert-info">
                <div class="row">
                    <div class="col-md-4">
                        <strong>Total Outliers:</strong> ${totalOutliers}
                    </div>
                    <div class="col-md-4">
                        <strong>Extreme Outliers:</strong> ${extremeOutliers}
                    </div>
                    <div class="col-md-4">
                        <strong>Affected Metrics:</strong> ${metrics.map(m => 
                            m.charAt(0).toUpperCase() + m.slice(1)
                        ).join(', ')}
                    </div>
                </div>
            </div>
        `;
    },

    calculateDistributionData() {
        const metrics = ['cases', 'deaths', 'recovered', 'active'];
        return metrics.map(metric => {
            const values = this.data.map(d => d[metric] || 0);
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const sorted = [...values].sort((a, b) => a - b);
            return {
                metric,
                mean,
                median: sorted[Math.floor(sorted.length / 2)] || 0,
                min: sorted[0] || 0,
                max: sorted[sorted.length - 1] || 0
            };
        });
    },

    generateCorrelationStats(correlationData) {
        const metrics = ['Cases', 'Deaths', 'Recovered', 'Active'];
        return correlationData.map((row, i) => 
            row.map((val, j) => 
                i < j ? `
                    <div class="stats-item">
                        <strong>${metrics[i]} vs ${metrics[j]}:</strong>
                        <span>${val.toFixed(3)}</span>
                    </div>
                ` : ''
            ).join('')
        ).join('');
    },

    generateDistributionStats(data) {
        return data.map(d => `
            <div class="stats-item">
                <strong>${d.metric.charAt(0).toUpperCase() + d.metric.slice(1)}:</strong>
                <ul>
                    <li>Mean: ${d.mean.toLocaleString()}</li>
                    <li>Median: ${d.median.toLocaleString()}</li>
                    <li>Range: ${d.min.toLocaleString()} - ${d.max.toLocaleString()}</li>
                </ul>
            </div>
        `).join('');
    },

    generateRegionalStats() {
        if (!this.data) return '';
        
        const regions = [...new Set(this.data.map(d => d.region))];
        return regions.map(region => {
            const regionData = this.data.filter(d => d.region === region);
            const totalCases = regionData.reduce((sum, d) => sum + (d.cases || 0), 0);
            const totalDeaths = regionData.reduce((sum, d) => sum + (d.deaths || 0), 0);
            return `
                <div class="stats-item">
                    <strong>${region || 'Unknown'}:</strong>
                    <ul>
                        <li>Total Cases: ${totalCases.toLocaleString()}</li>
                        <li>Total Deaths: ${totalDeaths.toLocaleString()}</li>
                        <li>Countries: ${regionData.length}</li>
                    </ul>
                </div>
            `;
        }).join('');
    },

    initializeEventListeners() {
        // Add event listeners for tab changes
        const tabs = document.querySelectorAll('a[data-bs-toggle="tab"]');
        tabs.forEach(tab => {
            tab.addEventListener('shown.bs.tab', (event) => {
                if (event.target.id === 'regional-tab' && this.maps.regional) {
                    this.maps.regional.invalidateSize();
                }
            });
        });
    }
};

// Export the module
export default AdvancedAnalysis; 