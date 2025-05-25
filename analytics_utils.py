import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
from scipy import stats

def calculate_infection_rate(cases, population):
    """Calculate infection rate per 100,000 people"""
    return (cases / population) * 100000 if population > 0 else 0

def calculate_doubling_time(cases_series):
    """Calculate case doubling time in days"""
    if len(cases_series) < 2:
        return None
    
    growth_rate = np.log(2) / np.log(cases_series.iloc[-1] / cases_series.iloc[0])
    return growth_rate * len(cases_series)

def detect_outliers(data, column, threshold=3):
    """Detect outliers using Z-score method"""
    z_scores = stats.zscore(data[column])
    outliers = data[abs(z_scores) > threshold]
    return outliers

def calculate_risk_score(row):
    """Calculate risk score based on multiple factors"""
    weights = {
        'cases_weight': 0.4,
        'deaths_weight': 0.3,
        'recovery_weight': -0.2,
        'growth_weight': 0.1
    }
    
    normalized_cases = row['Confirmed'] / row['Confirmed'].max()
    normalized_deaths = row['Deaths'] / row['Deaths'].max()
    recovery_rate = row['Recovered'] / row['Confirmed'] if row['Confirmed'] > 0 else 0
    growth_rate = row['New cases'] / row['Confirmed'] if row['Confirmed'] > 0 else 0
    
    risk_score = (
        weights['cases_weight'] * normalized_cases +
        weights['deaths_weight'] * normalized_deaths -
        weights['recovery_weight'] * recovery_rate +
        weights['growth_weight'] * growth_rate
    )
    
    return min(max(risk_score * 100, 0), 100)  # Scale to 0-100

def analyze_vaccination_impact(data):
    """Analyze the impact of vaccination rates on cases and deaths"""
    if 'Vaccination Rate' not in data.columns:
        return None
    
    # Calculate correlation between vaccination rate and new cases
    vax_case_corr = data['Vaccination Rate'].corr(data['New cases'])
    
    # Calculate correlation between vaccination rate and deaths
    vax_death_corr = data['Vaccination Rate'].corr(data['Deaths'])
    
    # Group countries by vaccination rate quartiles
    data['Vax_Quartile'] = pd.qcut(data['Vaccination Rate'], q=4, labels=['Low', 'Medium-Low', 'Medium-High', 'High'])
    
    # Calculate average metrics by quartile
    quartile_stats = data.groupby('Vax_Quartile').agg({
        'New cases': 'mean',
        'Deaths': 'mean',
        'Recovery Rate': 'mean'
    }).round(2)
    
    return {
        'vaccination_case_correlation': vax_case_corr,
        'vaccination_death_correlation': vax_death_corr,
        'quartile_statistics': quartile_stats.to_dict()
    }

def perform_trend_analysis(data, window=7):
    """Perform trend analysis using moving averages"""
    trends = {}
    
    for metric in ['Confirmed', 'Deaths', 'Recovered']:
        # Calculate moving average
        ma = data[metric].rolling(window=window).mean()
        
        # Calculate rate of change
        roc = data[metric].pct_change(periods=window)
        
        # Determine trend direction
        current_trend = 'Increasing' if roc.iloc[-1] > 0.05 else 'Decreasing' if roc.iloc[-1] < -0.05 else 'Stable'
        
        trends[metric] = {
            'current_value': int(data[metric].iloc[-1]),
            'moving_average': float(ma.iloc[-1]),
            'change_rate': float(roc.iloc[-1] * 100),
            'trend_direction': current_trend
        }
    
    return trends

def calculate_regional_metrics(data):
    """Calculate advanced metrics by region"""
    regional_metrics = data.groupby('WHO Region').agg({
        'Confirmed': ['sum', 'mean', 'std'],
        'Deaths': ['sum', 'mean', 'std'],
        'Recovered': ['sum', 'mean', 'std'],
        'Active': ['sum', 'mean', 'std']
    }).round(2)
    
    # Calculate additional metrics
    for region in regional_metrics.index:
        region_data = data[data['WHO Region'] == region]
        
        # Calculate case fatality rate
        cfr = (region_data['Deaths'].sum() / region_data['Confirmed'].sum()) * 100
        
        # Calculate recovery rate
        recovery_rate = (region_data['Recovered'].sum() / region_data['Confirmed'].sum()) * 100
        
        # Add to metrics
        regional_metrics.loc[region, ('Additional', 'CFR')] = round(cfr, 2)
        regional_metrics.loc[region, ('Additional', 'Recovery Rate')] = round(recovery_rate, 2)
    
    return regional_metrics.to_dict()

def find_similar_countries(data, target_country, n_neighbors=5):
    """Find countries with similar COVID-19 patterns"""
    if target_country not in data['Country/Region'].values:
        return None
    
    # Select features for comparison
    features = ['Confirmed', 'Deaths', 'Recovered', 'Active', 'New cases']
    
    # Normalize features
    scaler = StandardScaler()
    features_normalized = scaler.fit_transform(data[features])
    
    # Create DataFrame with normalized features
    df_normalized = pd.DataFrame(features_normalized, columns=features, index=data.index)
    
    # Get target country vector
    target_vector = df_normalized[data['Country/Region'] == target_country].iloc[0]
    
    # Calculate distances to all other countries
    distances = []
    for idx, row in df_normalized.iterrows():
        if data.loc[idx, 'Country/Region'] != target_country:
            distance = np.linalg.norm(row - target_vector)
            distances.append((data.loc[idx, 'Country/Region'], distance))
    
    # Sort by distance and get top N similar countries
    similar_countries = sorted(distances, key=lambda x: x[1])[:n_neighbors]
    
    return {
        'similar_countries': [country for country, _ in similar_countries],
        'similarity_scores': [1 - (dist / max(d for _, d in distances)) for _, dist in similar_countries]
    }

def detect_outliers_zscore(data, columns, threshold=3):
    """
    Detect outliers using Z-score method for multiple columns
    Returns DataFrame with outlier flags and summary
    """
    outliers = {}
    for column in columns:
        if column not in data.columns:
            continue
            
        # Calculate z-scores
        z_scores = np.abs(stats.zscore(data[column].fillna(data[column].mean())))
        outliers[column] = z_scores > threshold
        
    # Create outlier summary
    outlier_summary = {
        'total_outliers': sum(outliers[col].sum() for col in outliers),
        'outliers_by_column': {col: outliers[col].sum() for col in outliers},
        'percentage_by_column': {col: (outliers[col].sum() / len(data) * 100) for col in outliers}
    }
    
    return outliers, outlier_summary

def validate_data_quality(data):
    """
    Comprehensive data quality validation
    Returns validation report with issues and recommendations
    """
    quality_report = {
        'missing_values': {},
        'data_types': {},
        'value_ranges': {},
        'consistency_checks': [],
        'recommendations': []
    }
    
    # Check missing values
    missing = data.isnull().sum()
    quality_report['missing_values'] = missing[missing > 0].to_dict()
    
    # Check data types
    quality_report['data_types'] = data.dtypes.to_dict()
    
    # Check value ranges for numeric columns
    numeric_columns = data.select_dtypes(include=[np.number]).columns
    for col in numeric_columns:
        quality_report['value_ranges'][col] = {
            'min': data[col].min(),
            'max': data[col].max(),
            'mean': data[col].mean(),
            'median': data[col].median()
        }
    
    # Consistency checks
    if 'Confirmed' in data.columns and 'Active' in data.columns:
        invalid_active = data[data['Active'] > data['Confirmed']].shape[0]
        if invalid_active > 0:
            quality_report['consistency_checks'].append(
                f'Found {invalid_active} rows where Active cases exceed Confirmed cases'
            )
    
    # Generate recommendations
    for col, missing_count in quality_report['missing_values'].items():
        if missing_count / len(data) > 0.1:
            quality_report['recommendations'].append(
                f'High missing values ({missing_count}) in {col}. Consider imputation or removal.'
            )
    
    return quality_report

def advanced_feature_engineering(data):
    """
    Advanced feature engineering for COVID-19 data analysis
    """
    engineered_data = data.copy()
    
    # Calculate rolling averages
    if 'New cases' in data.columns:
        engineered_data['7_day_avg_cases'] = data['New cases'].rolling(window=7).mean()
        engineered_data['14_day_avg_cases'] = data['New cases'].rolling(window=14).mean()
    
    # Calculate acceleration/deceleration
    if 'New cases' in data.columns:
        engineered_data['case_acceleration'] = data['New cases'].diff()
    
    # Calculate per capita metrics (assuming population data exists)
    if 'Population' in data.columns:
        for metric in ['Confirmed', 'Deaths', 'Active']:
            if metric in data.columns:
                engineered_data[f'{metric}_per_100k'] = (
                    data[metric] / data['Population'] * 100000
                )
    
    # Calculate complex ratios
    if all(col in data.columns for col in ['Confirmed', 'Tests']):
        engineered_data['positivity_rate'] = (
            data['Confirmed'] / data['Tests'] * 100
        )
    
    # Calculate growth factors
    if 'New cases' in data.columns:
        engineered_data['growth_factor'] = (
            data['New cases'] / data['New cases'].shift(1)
        )
    
    return engineered_data

def generate_statistical_insights(data):
    """
    Generate comprehensive statistical insights from the data
    """
    insights = {
        'summary_stats': {},
        'correlations': {},
        'trend_analysis': {},
        'distribution_analysis': {}
    }
    
    # Basic summary statistics
    numeric_columns = data.select_dtypes(include=[np.number]).columns
    insights['summary_stats'] = data[numeric_columns].describe().to_dict()
    
    # Correlation analysis
    insights['correlations'] = data[numeric_columns].corr().to_dict()
    
    # Trend analysis
    for col in ['Confirmed', 'Deaths', 'Recovered', 'Active']:
        if col in data.columns:
            trends = perform_trend_analysis(data, col)
            insights['trend_analysis'][col] = trends
    
    # Distribution analysis
    for col in numeric_columns:
        distribution = {
            'skewness': float(stats.skew(data[col].dropna())),
            'kurtosis': float(stats.kurtosis(data[col].dropna())),
            'normality_test': stats.normaltest(data[col].dropna())[1]
        }
        insights['distribution_analysis'][col] = distribution
    
    return insights 