from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from prophet import Prophet
import plotly.express as px
import json
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Global variable to store the data
covid_data = None

def load_and_process_data(data):
    """Load and process the CSV data"""
    df = pd.DataFrame(data)
    
    # Convert columns to numeric
    numeric_columns = ['Confirmed', 'Deaths', 'Recovered', 'Active', 
                      'New cases', 'New deaths', 'New recovered']
    for col in numeric_columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    
    return df

@app.route('/api/analyze', methods=['POST'])
def analyze_data():
    """Analyze uploaded COVID-19 data"""
    global covid_data
    
    data = request.json
    df = load_and_process_data(data)
    covid_data = df
    
    # Basic statistics
    stats = {
        'total_cases': int(df['Confirmed'].sum()),
        'total_deaths': int(df['Deaths'].sum()),
        'total_recovered': int(df['Recovered'].sum()),
        'total_active': int(df['Active'].sum()),
        'mortality_rate': float((df['Deaths'].sum() / df['Confirmed'].sum()) * 100),
        'recovery_rate': float((df['Recovered'].sum() / df['Confirmed'].sum()) * 100)
    }
    
    # Country rankings
    top_countries = df.nlargest(10, 'Confirmed')[['Country/Region', 'Confirmed', 'Deaths', 'Recovered']]
    rankings = top_countries.to_dict('records')
    
    # Regional analysis
    regional_stats = df.groupby('WHO Region').agg({
        'Confirmed': 'sum',
        'Deaths': 'sum',
        'Recovered': 'sum',
        'Active': 'sum'
    }).to_dict('index')
    
    return jsonify({
        'statistics': stats,
        'rankings': rankings,
        'regional_analysis': regional_stats
    })

@app.route('/api/forecast', methods=['POST'])
def forecast_cases():
    """Generate forecasts using Prophet"""
    country = request.json.get('country')
    days = int(request.json.get('days', 30))
    
    if covid_data is None:
        return jsonify({'error': 'No data available'})
    
    # Filter data for the country
    country_data = covid_data[covid_data['Country/Region'] == country]
    
    # Prepare data for Prophet
    df_prophet = pd.DataFrame({
        'ds': pd.date_range(start=datetime.now(), periods=len(country_data)),
        'y': country_data['Confirmed'].values
    })
    
    # Create and fit Prophet model
    model = Prophet(yearly_seasonality=True, weekly_seasonality=True)
    model.fit(df_prophet)
    
    # Make future predictions
    future = model.make_future_dataframe(periods=days)
    forecast = model.predict(future)
    
    # Prepare response
    forecast_data = {
        'dates': forecast['ds'].tail(days).dt.strftime('%Y-%m-%d').tolist(),
        'predictions': forecast['yhat'].tail(days).round().astype(int).tolist(),
        'lower_bound': forecast['yhat_lower'].tail(days).round().astype(int).tolist(),
        'upper_bound': forecast['yhat_upper'].tail(days).round().astype(int).tolist()
    }
    
    return jsonify(forecast_data)

@app.route('/api/cluster', methods=['POST'])
def cluster_analysis():
    """Perform clustering analysis on countries"""
    if covid_data is None:
        return jsonify({'error': 'No data available'})
    
    # Prepare features for clustering
    features = ['Confirmed', 'Deaths', 'Recovered', 'Active']
    X = covid_data[features].values
    
    # Normalize the features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Perform K-means clustering
    n_clusters = 5
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    clusters = kmeans.fit_predict(X_scaled)
    
    # Prepare results
    covid_data['Cluster'] = clusters
    cluster_stats = covid_data.groupby('Cluster').agg({
        'Country/Region': 'count',
        'Confirmed': 'mean',
        'Deaths': 'mean',
        'Recovered': 'mean',
        'Active': 'mean'
    }).round(2).to_dict('index')
    
    # Get representative countries for each cluster
    cluster_representatives = {}
    for i in range(n_clusters):
        cluster_countries = covid_data[covid_data['Cluster'] == i]['Country/Region'].tolist()
        cluster_representatives[i] = cluster_countries[:5]  # Top 5 countries per cluster
    
    return jsonify({
        'cluster_statistics': cluster_stats,
        'cluster_representatives': cluster_representatives
    })

@app.route('/api/trends', methods=['POST'])
def analyze_trends():
    """Analyze trends and patterns in the data"""
    if covid_data is None:
        return jsonify({'error': 'No data available'})
    
    # Calculate growth rates
    growth_rates = covid_data.groupby('Country/Region').agg({
        'New cases': 'sum',
        'Confirmed': 'last'
    })
    growth_rates['Growth Rate'] = (growth_rates['New cases'] / growth_rates['Confirmed'] * 100).round(2)
    
    # Identify hotspots (countries with highest growth rates)
    hotspots = growth_rates.nlargest(10, 'Growth Rate').to_dict('index')
    
    # Calculate recovery vs death ratio
    recovery_death_ratio = covid_data.groupby('WHO Region').agg({
        'Recovered': 'sum',
        'Deaths': 'sum'
    })
    recovery_death_ratio['Ratio'] = (recovery_death_ratio['Recovered'] / recovery_death_ratio['Deaths']).round(2)
    
    # Regional progression
    regional_progression = covid_data.groupby('WHO Region').agg({
        'New cases': 'sum',
        'New deaths': 'sum',
        'New recovered': 'sum'
    }).to_dict('index')
    
    return jsonify({
        'hotspots': hotspots,
        'recovery_death_ratio': recovery_death_ratio.to_dict('index'),
        'regional_progression': regional_progression
    })

@app.route('/api/correlations', methods=['POST'])
def analyze_correlations():
    """Analyze correlations between different metrics"""
    if covid_data is None:
        return jsonify({'error': 'No data available'})
    
    # Calculate correlations between metrics
    correlation_metrics = ['Confirmed', 'Deaths', 'Recovered', 'Active', 'New cases']
    correlations = covid_data[correlation_metrics].corr().round(3).to_dict()
    
    # Analyze relationship between population density and spread
    # (assuming we have population density data)
    if 'Population Density' in covid_data.columns:
        density_correlation = covid_data['Confirmed'].corr(covid_data['Population Density']).round(3)
    else:
        density_correlation = None
    
    return jsonify({
        'metric_correlations': correlations,
        'density_correlation': density_correlation
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000) 