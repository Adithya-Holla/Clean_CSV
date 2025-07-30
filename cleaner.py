"""
CSV Data Cleaner

A tool for cleaning messy CSV data files. Handles missing values, 
outlier detection, and data type conversions.
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import re
from scipy import stats
import warnings

# Suppress pandas warnings for cleaner output
warnings.filterwarnings('ignore', category=FutureWarning)

def is_outlier_zscore(data, threshold=3.0):
    """
    Identify outliers using the Z-score method.
    
    Args:
        data: pandas Series with numeric data
        threshold: Z-score threshold (default: 3.0)
    
    Returns:
        Boolean mask where True indicates an outlier
    """
    if len(data.dropna()) < 2:
        return pd.Series([False] * len(data), index=data.index)
    
    z_scores = np.abs(stats.zscore(data, nan_policy='omit'))
    return z_scores > threshold


def is_outlier_iqr(data, multiplier=1.5):
    """
    Identify outliers using the Interquartile Range (IQR) method.
    
    Args:
        data: pandas Series with numeric data  
        multiplier: IQR multiplier (default: 1.5)
    
    Returns:
        Boolean mask where True indicates an outlier
    """
    if len(data.dropna()) < 4:  # Need at least 4 points for quartiles
        return pd.Series([False] * len(data), index=data.index)
    
    q1 = data.quantile(0.25)
    q3 = data.quantile(0.75)
    iqr = q3 - q1
    
    lower_fence = q1 - multiplier * iqr
    upper_fence = q3 + multiplier * iqr
    
    return (data < lower_fence) | (data > upper_fence)

def process_outliers(dataframe, columns, strategy='cap', z_threshold=3.0, iqr_multiplier=1.5):
    """
    Detect and handle outliers in numeric columns.
    
    Args:
        dataframe: pandas DataFrame
        columns: list of column names to process
        strategy: how to handle outliers ('cap', 'remove', 'transform')
        z_threshold: Z-score threshold for outlier detection
        iqr_multiplier: IQR multiplier for outlier detection
    
    Returns:
        tuple: (processed_dataframe, outlier_summary)
    """
    df = dataframe.copy()
    summary = {}
    
    for column in columns:
        if column not in df.columns:
            continue
            
        # Skip if column has too few valid values
        valid_count = df[column].count()
        if valid_count < 4:
            continue
            
        # Detect outliers using both methods
        z_outliers = is_outlier_zscore(df[column], z_threshold)
        iqr_outliers = is_outlier_iqr(df[column], iqr_multiplier)
        
        # Combine results - mark as outlier if detected by either method
        outliers = z_outliers | iqr_outliers
        outlier_count = outliers.sum()
        
        # Store summary information
        summary[column] = {
            'total_outliers': outlier_count,
            'z_score_count': z_outliers.sum(),
            'iqr_count': iqr_outliers.sum(),
            'outlier_indices': df[outliers].index.tolist()
        }
        
        if outlier_count > 0:
            print(f"  {column}: {outlier_count} outliers found "
                  f"(Z-score: {z_outliers.sum()}, IQR: {iqr_outliers.sum()})")
            
            # Apply the chosen strategy
            if strategy == 'remove':
                df = df[~outliers]
                print(f"    → Removed {outlier_count} rows")
                
            elif strategy == 'cap':
                # Cap to 5th and 95th percentiles
                lower_bound = df[column].quantile(0.05)
                upper_bound = df[column].quantile(0.95)
                
                df.loc[outliers & (df[column] < lower_bound), column] = lower_bound
                df.loc[outliers & (df[column] > upper_bound), column] = upper_bound
                
                print(f"    → Capped to range [{lower_bound:.1f}, {upper_bound:.1f}]")
                
            elif strategy == 'transform':
                # Apply log transformation if all values are positive
                if (df[column] > 0).all():
                    df[column] = np.log1p(df[column])
                    print(f"    → Applied log transformation")
                else:
                    print(f"    → Skipped transformation (non-positive values present)")
    
    return df, summary

def parse_datetime_column(series, column_name='date'):
    """
    Parse datetime column with multiple format attempts.
    
    Args:
        series: pandas Series containing date strings
        column_name: name of the column (for logging)
    
    Returns:
        pandas Series with parsed datetime values
    """
    def try_parse_date(date_str):
        if pd.isna(date_str):
            return pd.NaT
        
        # Common date formats to try in order of preference
        formats = [
            '%Y-%m-%d',     # ISO format first
            '%Y/%m/%d',     # Year first variants
            '%m/%d/%Y',     # US format
            '%d/%m/%Y',     # European format  
            '%d-%m-%Y',     # European with dashes
            '%m-%d-%Y',     # US with dashes
        ]
        
        # Try specific formats first
        for fmt in formats:
            try:
                return pd.to_datetime(date_str, format=fmt, errors='raise')
            except:
                continue
        
        # Try auto-detection with dayfirst=True for European formats
        try:
            return pd.to_datetime(date_str, dayfirst=True, errors='raise')
        except:
            # Final attempt with dayfirst=False for US formats
            try:
                return pd.to_datetime(date_str, dayfirst=False, errors='raise')
            except:
                return pd.NaT
    
    result = series.apply(try_parse_date)
    success_rate = result.notna().sum() / len(result) * 100
    print(f"  {column_name}: {result.notna().sum()}/{len(result)} dates parsed ({success_rate:.1f}%)")
    
    return result


def clean_csv_data(file_path, outlier_strategy='cap', z_score_threshold=3.0, iqr_multiplier=1.5, standardize=True):
    """
    Clean and preprocess CSV data with comprehensive data quality improvements.
    
    Args:
        file_path: path to the CSV file
        outlier_strategy: how to handle outliers ('cap', 'remove', 'transform')
        z_score_threshold: threshold for Z-score outlier detection
        iqr_multiplier: multiplier for IQR outlier detection
        standardize: whether to standardize numeric columns (default: True)
    
    Returns:
        pandas DataFrame with cleaned data
    """
    print("Loading and cleaning CSV data...")
    print("=" * 40)
    
    # Read CSV with error handling
    try:
        df = pd.read_csv(file_path, skipinitialspace=True)
    except pd.errors.ParserError:
        print("Warning: CSV parsing issues detected. Trying alternate method...")
        try:
            df = pd.read_csv(file_path, on_bad_lines='skip', skipinitialspace=True)
        except:
            df = pd.read_csv(file_path, quotechar='"', skipinitialspace=True)

    print(f"Original data shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    print("First few rows:")
    print(df.head())
    
    # Remove completely empty columns
    empty_cols = df.columns[df.isnull().all()].tolist()
    if empty_cols:
        df = df.drop(columns=empty_cols)
        print(f"\nRemoved empty columns: {empty_cols}")

    # Convert obvious numeric columns
    for col in df.columns:
        if col.lower() in ['age', 'income', 'salary', 'price', 'amount', 'score']:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    print(f"\nData types after conversion:")
    print(df.dtypes)

    # Handle missing values
    print("\nHandling missing values...")
    missing_summary = df.isnull().sum()
    if missing_summary.sum() > 0:
        print("Missing values per column:")
        for col, count in missing_summary[missing_summary > 0].items():
            print(f"  {col}: {count} missing")
        
        for col in df.columns:
            if df[col].dtype == 'object':
                # For categorical data, use most frequent value
                mode_val = df[col].mode()
                fill_val = mode_val[0] if len(mode_val) > 0 else "Unknown"
                df[col] = df[col].fillna(fill_val)
            else:
                # For numeric data, use median
                df[col] = df[col].fillna(df[col].median())

    # Handle outliers
    numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
    if numeric_columns:
        print(f"\nProcessing outliers in numeric columns: {numeric_columns}")
        df, outlier_summary = process_outliers(df, numeric_columns, outlier_strategy, 
                                             z_score_threshold, iqr_multiplier)
        
        total_outliers = sum(info['total_outliers'] for info in outlier_summary.values())
        if total_outliers > 0:
            print(f"Total outliers processed: {total_outliers}")
        else:
            print("No outliers detected")

    # Normalize numeric data (optional)
    if numeric_columns and standardize:
        print("Standardizing numeric columns...")
        scaler = StandardScaler()
        df[numeric_columns] = scaler.fit_transform(df[numeric_columns])
        print(f"Standardized: {numeric_columns}")
        print("Note: Values are now centered around 0 with standard deviation of 1")
    elif numeric_columns and not standardize:
        print("Skipping standardization - keeping original numeric values")
        print(f"Numeric columns preserved: {numeric_columns}")
    else:
        print("No numeric columns found to standardize")

    # Handle categorical encoding
    categorical_columns = df.select_dtypes(include=['object']).columns.tolist()
    date_columns = [col for col in categorical_columns 
                   if any(word in col.lower() for word in ['date', 'time', 'created', 'updated'])]
    
    # Parse date columns
    if date_columns:
        print(f"\nParsing date columns: {date_columns}")
        for col in date_columns:
            df[col] = parse_datetime_column(df[col], col)
    
    # Encode remaining categorical columns
    remaining_categorical = [col for col in categorical_columns if col not in date_columns]
    if remaining_categorical:
        print(f"\nEncoding categorical columns: {remaining_categorical}")
        for col in remaining_categorical:
            df[col] = df[col].astype(str).str.strip()
            df[col] = pd.Categorical(df[col]).codes

    print(f"\nFinal data shape: {df.shape}")
    print("\nCleaned data preview:")
    print(df.head())
    
    # Save results
    output_file = "cleaned_data.csv"
    df.to_csv(output_file, index=False)
    print(f"\nCleaned data saved to: {output_file}")
    
    return df


# Maintain backward compatibility
def clean_csv(path, outlier_method='cap', z_threshold=3, iqr_multiplier=1.5, standardize=True):
    """Legacy function name for backward compatibility."""
    return clean_csv_data(path, outlier_method, z_threshold, iqr_multiplier, standardize)
