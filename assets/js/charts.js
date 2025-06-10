/**
 * Chart.js configurations and setup
 */

import { formatNumber } from './utils.js';

// Default Chart.js configuration
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.scale.grid.color = 'rgba(0, 0, 0, 0.05)';
Chart.defaults.scale.grid.zeroLineColor = 'rgba(0, 0, 0, 0.1)';
Chart.defaults.scale.beginAtZero = true;

// Add global animation configuration
Chart.defaults.animation = {
    duration: 800,
    easing: 'easeOutQuart'
};

// Store chart instances
let trendChart = null;
let distributionChart = null;
let correlationChart = null;
let boxPlotChart = null;
let heatmapChart = null;

// Initialize charts
const initializeCharts = () => {
    // Clean up existing charts
    if (trendChart) {
        trendChart.destroy();
        trendChart = null;
    }
    if (distributionChart) {
        distributionChart.destroy();
        distributionChart = null;
    }

    const trendCtx = document.getElementById('trend-chart');
    const distributionCtx = document.getElementById('distribution-chart');
    
    if (!trendCtx || !distributionCtx) {
        console.error('Chart contexts not found');
        return;
    }

    // Trend Chart
    trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Cases',
                data: [],
                borderColor: 'rgba(72, 149, 239, 1)',
                backgroundColor: 'rgba(72, 149, 239, 0.1)',
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: 'rgba(72, 149, 239, 1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    padding: 10,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'white',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatNumber(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        color: '#666'
                    }
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        color: '#666',
                        callback: function(value) {
                            return formatNumber(value);
                        }
                    }
                }
            }
        }
    });
    
    // Distribution Chart
    distributionChart = new Chart(distributionCtx, {
        type: 'doughnut',
        data: {
            labels: ['Active', 'Recovered', 'Deaths'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    'rgba(72, 149, 239, 0.8)',
                    'rgba(76, 201, 240, 0.8)',
                    'rgba(247, 37, 133, 0.8)'
                ],
                borderColor: [
                    'rgba(72, 149, 239, 1)',
                    'rgba(76, 201, 240, 1)',
                    'rgba(247, 37, 133, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                            return `${label}: ${formatNumber(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
};

// Update charts with new data
const updateCharts = (data, metric) => {
    if (!data || !Array.isArray(data) || !metric) {
        console.error('Invalid data or metric provided to updateCharts');
        return;
    }

    try {
        // Update trend chart
        if (trendChart) {
            const sortedData = [...data]
                .sort((a, b) => b[metric] - a[metric])
                .slice(0, 10);

            const labels = sortedData.map(d => d.country || 'Unknown');
            const values = sortedData.map(d => d[metric] || 0);

            trendChart.data.labels = labels;
            trendChart.data.datasets[0].label = metric.charAt(0).toUpperCase() + metric.slice(1);
            trendChart.data.datasets[0].data = values;
            trendChart.update();
        }

        // Update distribution chart
        if (distributionChart) {
            // Calculate totals
            const totalActive = data.reduce((sum, d) => sum + (d.active || 0), 0);
            const totalRecovered = data.reduce((sum, d) => sum + (d.recovered || 0), 0);
            const totalDeaths = data.reduce((sum, d) => sum + (d.deaths || 0), 0);

            // Update chart data
            distributionChart.data.datasets[0].data = [
                totalActive,
                totalRecovered,
                totalDeaths
            ];

            // Update chart
            distributionChart.update();

            // Log the values for debugging
            console.log('Distribution Chart Data:', {
                active: totalActive,
                recovered: totalRecovered,
                deaths: totalDeaths
            });
        }
    } catch (error) {
        console.error('Error updating charts:', error);
        throw error;
    }
};

// Update chart theme
const updateChartsTheme = (isDarkMode) => {
    const textColor = isDarkMode ? '#f7fafc' : '#2d3748';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    if (trendChart) {
        trendChart.options.scales.x.ticks.color = textColor;
        trendChart.options.scales.y.ticks.color = textColor;
        trendChart.options.scales.x.grid.color = gridColor;
        trendChart.options.scales.y.grid.color = gridColor;
        trendChart.update('none');
    }
    
    if (distributionChart) {
        distributionChart.options.plugins.legend.labels.color = textColor;
        distributionChart.update('none');
    }
};

// Helper function to get metric color
const getMetricColor = (metric, alpha = 1) => {
    const colors = {
        cases: `rgba(72, 149, 239, ${alpha})`,
        deaths: `rgba(247, 37, 133, ${alpha})`,
        recovered: `rgba(76, 201, 240, ${alpha})`,
        active: `rgba(72, 149, 239, ${alpha})`
    };
    return colors[metric] || colors.cases;
};

// Initialize advanced charts
const initializeAdvancedCharts = () => {
    // Scatter plot for correlation analysis
    correlationChart = new Chart(document.getElementById('correlation-chart'), {
        type: 'scatter',
        data: {
            datasets: [{
                data: [],
                backgroundColor: 'rgba(67, 97, 238, 0.5)',
                borderColor: 'rgba(67, 97, 238, 1)',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Correlation Analysis'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const point = context.raw;
                            return `${point.x}: ${formatNumber(point.x)}, ${point.y}: ${formatNumber(point.y)}`;
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
                        text: 'Cases'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Deaths'
                    }
                }
            }
        }
    });

    // Box plot for distribution analysis
    boxPlotChart = new Chart(document.getElementById('boxplot-chart'), {
        type: 'boxplot',
        data: {
            labels: ['Cases', 'Deaths', 'Recovered', 'Active'],
            datasets: [{
                data: [],
                backgroundColor: 'rgba(67, 97, 238, 0.5)',
                borderColor: 'rgba(67, 97, 238, 1)',
                borderWidth: 1,
                outlierColor: '#666',
                padding: 10,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution Analysis'
                },
                legend: {
                    display: false
                }
            }
        }
    });

    // Heatmap for regional analysis
    heatmapChart = new Chart(document.getElementById('heatmap-chart'), {
        type: 'matrix',
        data: {
            datasets: [{
                data: [],
                backgroundColor(context) {
                    const value = context.dataset.data[context.dataIndex].v;
                    const alpha = value / context.dataset.max;
                    return `rgba(67, 97, 238, ${alpha})`;
                },
                borderColor: 'white',
                borderWidth: 1,
                width: ({ chart }) => (chart.chartArea || {}).width / 7,
                height: ({ chart }) => (chart.chartArea || {}).height / 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Regional Heat Map'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const v = context.dataset.data[context.dataIndex];
                            return `${v.x}: ${v.y}: ${formatNumber(v.v)}`;
                        }
                    }
                }
            }
        }
    });
};

// Update advanced visualizations
const updateAdvancedCharts = (data) => {
    // Update correlation chart
    if (correlationChart) {
        const correlationData = data.map(row => ({
            x: row.cases,
            y: row.deaths
        }));
        correlationChart.data.datasets[0].data = correlationData;
        correlationChart.update();
    }

    // Update box plot
    if (boxPlotChart) {
        const boxPlotData = {
            cases: data.map(row => row.cases),
            deaths: data.map(row => row.deaths),
            recovered: data.map(row => row.recovered),
            active: data.map(row => row.active)
        };
        boxPlotChart.data.datasets[0].data = Object.values(boxPlotData);
        boxPlotChart.update();
    }

    // Update heatmap
    if (heatmapChart) {
        const regions = [...new Set(data.map(row => row.region))];
        const metrics = ['cases', 'deaths', 'recovered', 'active'];
        const heatmapData = [];
        
        regions.forEach((region, i) => {
            metrics.forEach((metric, j) => {
                const value = data
                    .filter(row => row.region === region)
                    .reduce((sum, row) => sum + (row[metric] || 0), 0);
                
                heatmapData.push({
                    x: region,
                    y: metric,
                    v: value
                });
            });
        });
        
        heatmapChart.data.datasets[0].data = heatmapData;
        heatmapChart.data.datasets[0].max = Math.max(...heatmapData.map(d => d.v));
        heatmapChart.update();
    }
};

// Export functions
export {
    initializeCharts,
    updateCharts,
    updateChartsTheme
}; 