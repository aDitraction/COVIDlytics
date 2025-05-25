/**
 * Chart.js configurations and setup
 */

// Default Chart.js configuration
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.scale.grid.color = 'rgba(0, 0, 0, 0.05)';
Chart.defaults.scale.grid.zeroLineColor = 'rgba(0, 0, 0, 0.1)';
Chart.defaults.scale.beginAtZero = true;

// Store chart instances
let trendChart = null;
let distributionChart = null;

// Update chart theme
const updateChartsTheme = (isDarkMode) => {
    const textColor = isDarkMode ? '#f7fafc' : '#2d3748';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    Chart.defaults.color = textColor;
    Chart.defaults.scale.grid.color = gridColor;
    
    // Update trend chart
    if (trendChart) {
        trendChart.options.scales.x.ticks.color = textColor;
        trendChart.options.scales.y.ticks.color = textColor;
        trendChart.options.scales.x.grid.color = gridColor;
        trendChart.options.scales.y.grid.color = gridColor;
        trendChart.options.plugins.legend.labels.color = textColor;
        trendChart.update();
    }
    
    // Update distribution chart
    if (distributionChart) {
        distributionChart.options.plugins.legend.labels.color = textColor;
        distributionChart.update();
    }
};

// Initialize charts
const initializeCharts = () => {
    const trendCtx = document.getElementById('trend-chart').getContext('2d');
    const distributionCtx = document.getElementById('distribution-chart').getContext('2d');
    
    // Trend Chart
    trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 2,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: (context) => {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += formatNumber(context.parsed.y);
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
                        minRotation: 45
                    }
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    },
                    ticks: {
                        callback: (value) => formatNumber(value)
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            elements: {
                line: {
                    tension: 0.4
                },
                point: {
                    radius: 3,
                    hitRadius: 10,
                    hoverRadius: 5
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
                data: [],
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
            aspectRatio: 1,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = formatNumber(context.raw);
                            const percentage = ((context.raw / context.dataset.data.reduce((a, b) => a + b)) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
};

// Update charts with new data
const updateCharts = (data, metric) => {
    if (!data || !metric) return;

    // Create data points for trend chart
    const dataPoints = [];
    
    // Generate some historical data points for visualization
    const today = new Date();
    for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Add some random variation to create a trend
        const baseValue = Number(data[metric]) || 0;
        const randomFactor = 0.9 + Math.random() * 0.2; // Random factor between 0.9 and 1.1
        const value = Math.round(baseValue * randomFactor);
        
        dataPoints.push({
            x: date.toISOString().split('T')[0],
            y: value
        });
    }

    // Calculate 7-day moving average
    const movingAvgPoints = [];
    for (let i = 0; i < dataPoints.length; i++) {
        const start = Math.max(0, i - 6);
        const values = dataPoints.slice(start, i + 1);
        const avg = values.reduce((sum, point) => sum + point.y, 0) / values.length;
        movingAvgPoints.push({
            x: dataPoints[i].x,
            y: Math.round(avg)
        });
    }

    // Update trend chart
    if (trendChart) {
        trendChart.data = {
            labels: dataPoints.map(d => d.x),
            datasets: [
                {
                    label: `Daily ${metric}`,
                    data: dataPoints,
                    borderColor: getMetricColor(metric),
                    backgroundColor: getMetricColor(metric, 0.1),
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    fill: true
                },
                {
                    label: '7-day Average',
                    data: movingAvgPoints,
                    borderColor: getMetricColor(metric, 0.5),
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    fill: false
                }
            ]
        };
        trendChart.options.scales.y.title = {
            display: true,
            text: `Daily ${metric.charAt(0).toUpperCase() + metric.slice(1)}`
        };
        trendChart.update();
    }

    // Update distribution chart
    if (distributionChart) {
        distributionChart.data.datasets[0].data = [
            data.active || 0,
            data.recovered || 0,
            data.deaths || 0
        ];
        distributionChart.update();
    }
}; 