import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
import numpy as np
from analytics_utils import (
    perform_trend_analysis,
    calculate_regional_metrics,
    analyze_vaccination_impact
)

def create_global_cases_timeline(data):
    """
    Create an interactive timeline of global COVID-19 cases
    """
    fig = go.Figure()
    
    # Add traces for confirmed, deaths, and recovered cases
    fig.add_trace(go.Scatter(
        x=data.index,
        y=data['Confirmed'],
        name='Confirmed Cases',
        mode='lines',
        line=dict(color='#FF9F1C'),
        hovertemplate='Date: %{x}<br>Confirmed Cases: %{y:,.0f}<extra></extra>'
    ))
    
    fig.add_trace(go.Scatter(
        x=data.index,
        y=data['Deaths'],
        name='Deaths',
        mode='lines',
        line=dict(color='#E71D36'),
        hovertemplate='Date: %{x}<br>Deaths: %{y:,.0f}<extra></extra>'
    ))
    
    fig.add_trace(go.Scatter(
        x=data.index,
        y=data['Recovered'],
        name='Recovered',
        mode='lines',
        line=dict(color='#2EC4B6'),
        hovertemplate='Date: %{x}<br>Recovered: %{y:,.0f}<extra></extra>'
    ))
    
    # Update layout
    fig.update_layout(
        title='Global COVID-19 Cases Timeline',
        xaxis_title='Date',
        yaxis_title='Number of Cases',
        hovermode='x unified',
        template='plotly_white',
        legend=dict(
            yanchor="top",
            y=0.99,
            xanchor="left",
            x=0.01
        )
    )
    
    return fig

def create_regional_comparison(data):
    """
    Create interactive regional comparison visualizations
    """
    regional_metrics = calculate_regional_metrics(data)
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=(
            'Total Confirmed Cases by Region',
            'Case Fatality Rate by Region',
            'Recovery Rate by Region',
            'Active Cases by Region'
        )
    )
    
    # Add bar charts for each metric
    regions = list(regional_metrics['Confirmed']['sum'].keys())
    
    # Confirmed cases
    fig.add_trace(
        go.Bar(
            x=regions,
            y=[regional_metrics['Confirmed']['sum'][region] for region in regions],
            name='Confirmed Cases',
            marker_color='#FF9F1C'
        ),
        row=1, col=1
    )
    
    # Case Fatality Rate
    fig.add_trace(
        go.Bar(
            x=regions,
            y=[regional_metrics['Additional']['CFR'][region] for region in regions],
            name='CFR (%)',
            marker_color='#E71D36'
        ),
        row=1, col=2
    )
    
    # Recovery Rate
    fig.add_trace(
        go.Bar(
            x=regions,
            y=[regional_metrics['Additional']['Recovery Rate'][region] for region in regions],
            name='Recovery Rate (%)',
            marker_color='#2EC4B6'
        ),
        row=2, col=1
    )
    
    # Active Cases
    fig.add_trace(
        go.Bar(
            x=regions,
            y=[regional_metrics['Active']['sum'][region] for region in regions],
            name='Active Cases',
            marker_color='#011627'
        ),
        row=2, col=2
    )
    
    # Update layout
    fig.update_layout(
        height=800,
        showlegend=False,
        title_text="Regional COVID-19 Statistics Comparison",
        template='plotly_white'
    )
    
    return fig

def create_vaccination_impact_dashboard(data):
    """
    Create an interactive dashboard showing vaccination impact
    """
    vax_impact = analyze_vaccination_impact(data)
    
    if not vax_impact:
        return None
    
    # Create figure with secondary y-axis
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=(
            'Vaccination Rate vs New Cases',
            'Vaccination Rate vs Deaths',
            'Cases by Vaccination Rate Quartile',
            'Deaths by Vaccination Rate Quartile'
        )
    )
    
    # Scatter plot for vaccination rate vs new cases
    fig.add_trace(
        go.Scatter(
            x=data['Vaccination Rate'],
            y=data['New cases'],
            mode='markers',
            name='New Cases',
            marker=dict(
                color='#FF9F1C',
                size=8,
                opacity=0.6
            ),
            hovertemplate='Vaccination Rate: %{x:.1f}%<br>New Cases: %{y:,.0f}<extra></extra>'
        ),
        row=1, col=1
    )
    
    # Scatter plot for vaccination rate vs deaths
    fig.add_trace(
        go.Scatter(
            x=data['Vaccination Rate'],
            y=data['Deaths'],
            mode='markers',
            name='Deaths',
            marker=dict(
                color='#E71D36',
                size=8,
                opacity=0.6
            ),
            hovertemplate='Vaccination Rate: %{x:.1f}%<br>Deaths: %{y:,.0f}<extra></extra>'
        ),
        row=1, col=2
    )
    
    # Bar charts for quartile analysis
    quartile_stats = pd.DataFrame(vax_impact['quartile_statistics'])
    
    # Cases by quartile
    fig.add_trace(
        go.Bar(
            x=quartile_stats.index,
            y=quartile_stats['New cases'],
            name='Avg New Cases',
            marker_color='#FF9F1C'
        ),
        row=2, col=1
    )
    
    # Deaths by quartile
    fig.add_trace(
        go.Bar(
            x=quartile_stats.index,
            y=quartile_stats['Deaths'],
            name='Avg Deaths',
            marker_color='#E71D36'
        ),
        row=2, col=2
    )
    
    # Update layout
    fig.update_layout(
        height=800,
        title_text="Impact of Vaccination on COVID-19 Metrics",
        template='plotly_white',
        showlegend=False
    )
    
    return fig

def create_trend_analysis_dashboard(data):
    """
    Create an interactive dashboard for trend analysis
    """
    trends = perform_trend_analysis(data)
    
    # Create figure with secondary y-axis
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=(
            'Daily New Cases Trend',
            'Case Fatality Rate Trend',
            'Recovery Rate Trend',
            'Active Cases Trend'
        )
    )
    
    # Add 7-day moving averages
    fig.add_trace(
        go.Scatter(
            x=data.index,
            y=data['New cases'].rolling(window=7).mean(),
            name='7-day MA (New Cases)',
            line=dict(color='#FF9F1C')
        ),
        row=1, col=1
    )
    
    # Add CFR trend
    cfr = (data['Deaths'] / data['Confirmed'] * 100).rolling(window=7).mean()
    fig.add_trace(
        go.Scatter(
            x=data.index,
            y=cfr,
            name='Case Fatality Rate',
            line=dict(color='#E71D36')
        ),
        row=1, col=2
    )
    
    # Add recovery rate trend
    recovery_rate = (data['Recovered'] / data['Confirmed'] * 100).rolling(window=7).mean()
    fig.add_trace(
        go.Scatter(
            x=data.index,
            y=recovery_rate,
            name='Recovery Rate',
            line=dict(color='#2EC4B6')
        ),
        row=2, col=1
    )
    
    # Add active cases trend
    fig.add_trace(
        go.Scatter(
            x=data.index,
            y=data['Active'].rolling(window=7).mean(),
            name='Active Cases',
            line=dict(color='#011627')
        ),
        row=2, col=2
    )
    
    # Update layout
    fig.update_layout(
        height=800,
        title_text="COVID-19 Trend Analysis Dashboard",
        template='plotly_white'
    )
    
    return fig

def create_top_affected_countries_table(data):
    """
    Create an interactive table showing top affected countries with key metrics
    """
    # Calculate metrics for each country
    country_metrics = data.groupby('Country/Region').agg({
        'Confirmed': 'sum',
        'Active': 'sum',
        'Recovered': 'sum',
        'Deaths': 'sum'
    }).reset_index()
    
    # Calculate recovery and death rates
    country_metrics['Recovery Rate'] = (country_metrics['Recovered'] / country_metrics['Confirmed'] * 100).round(1)
    country_metrics['Death Rate'] = (country_metrics['Deaths'] / country_metrics['Confirmed'] * 100).round(1)
    
    # Calculate weekly change
    previous_week = data.groupby('Country/Region')['Confirmed'].shift(7)
    weekly_change = ((data['Confirmed'] - previous_week) / previous_week * 100).round(1)
    country_metrics['Weekly Change'] = weekly_change.groupby('Country/Region').last()
    
    # Sort by total cases descending
    country_metrics = country_metrics.sort_values('Confirmed', ascending=False)
    
    # Create the table visualization
    fig = go.Figure(data=[go.Table(
        header=dict(
            values=['Country', 'Total Cases', 'Active Cases', 'Recovered', 'Deaths', 
                   'Recovery Rate', 'Death Rate', 'Weekly Change'],
            font=dict(size=12, color='rgb(156, 163, 175)'),  # Gray text color
            fill_color='rgb(31, 41, 55)',  # Dark background
            align=['left', 'right', 'right', 'right', 'right', 'right', 'right', 'right'],
            height=40
        ),
        cells=dict(
            values=[
                country_metrics['Country/Region'],
                country_metrics['Confirmed'].apply(lambda x: f"{x:,.0f}"),
                country_metrics['Active'].apply(lambda x: f"{x:,.0f}"),
                country_metrics['Recovered'].apply(lambda x: f"{x:,.0f}"),
                country_metrics['Deaths'].apply(lambda x: f"{x:,.0f}"),
                country_metrics['Recovery Rate'].apply(lambda x: f"{x:.1f}%"),
                country_metrics['Death Rate'].apply(lambda x: f"{x:.1f}%"),
                country_metrics['Weekly Change'].apply(lambda x: f"{x:+.1f}%" if pd.notnull(x) else "0.0%")
            ],
            font=dict(size=11),
            fill_color='rgb(17, 24, 39)',  # Darker background
            align=['left', 'right', 'right', 'right', 'right', 'right', 'right', 'right'],
            height=35,
            font_color='white'  # White text for better contrast
        )
    )])
    
    # Update layout
    fig.update_layout(
        title=dict(
            text='Top Affected Countries',
            font=dict(size=16, color='white'),
            x=0,
            y=0.95
        ),
        margin=dict(t=40, l=0, r=0, b=0),
        height=400,
        paper_bgcolor='rgb(17, 24, 39)',  # Dark background
        plot_bgcolor='rgb(17, 24, 39)'    # Dark background
    )
    
    return fig

def save_visualizations(figs, output_dir='visualizations'):
    """
    Save all visualizations as interactive HTML files
    """
    import os
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Save each figure
    for name, fig in figs.items():
        if fig is not None:
            fig.write_html(os.path.join(output_dir, f"{name}.html")) 