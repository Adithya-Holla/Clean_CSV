"""
FastAPI backend for CSV Data Cleaner
"""

import os
import sys
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import tempfile
import uuid
import asyncio
import time
from typing import Optional, Iterator
import json
import io
import re
from scipy import stats
import warnings

# Suppress pandas warnings for cleaner output
warnings.filterwarnings('ignore', category=FutureWarning)

# Embedded cleaning functions - copied from Clean_CSV.cleaner module
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
    all_outlier_indices = set()  # Track all outlier indices for removal strategy
    
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
        outlier_indices_list = df[outliers].index.tolist()
        summary[column] = {
            'total_outliers': outlier_count,
            'z_score_count': z_outliers.sum(),
            'iqr_count': iqr_outliers.sum(),
            'outlier_indices': outlier_indices_list
        }
        
        if outlier_count > 0:
            print(f"  {column}: {outlier_count} outliers found "
                  f"(Z-score: {z_outliers.sum()}, IQR: {iqr_outliers.sum()})")
            
            # For remove strategy, collect all outlier indices
            if strategy == 'remove':
                all_outlier_indices.update(outlier_indices_list)
                print(f"    → Marked {outlier_count} rows for removal")
                
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
    
    # Remove all outlier rows at once if using remove strategy
    if strategy == 'remove' and all_outlier_indices:
        rows_before = len(df)
        df = df.drop(index=list(all_outlier_indices))
        df = df.reset_index(drop=True)  # Reset index after removal
        rows_removed = rows_before - len(df)
        print(f"\n    → Removed {rows_removed} rows total containing outliers")
        
        # Update summary with actual removal info
        summary['removal_summary'] = {
            'rows_before': rows_before,
            'rows_after': len(df),
            'rows_removed': rows_removed,
            'unique_outlier_rows': len(all_outlier_indices)
        }
    
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
        tuple: (pandas DataFrame with cleaned data, encoding_keymap)
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
        
        total_outliers = sum(info['total_outliers'] for info in outlier_summary.values() 
                            if isinstance(info, dict) and 'total_outliers' in info)
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
    categorical_columns = df.select_dtypes(include=['object', 'bool']).columns.tolist()
    
    # Also check for columns that contain boolean-like string values
    for col in df.columns:
        if df[col].dtype not in ['object', 'bool']:
            continue
        if df[col].dtype == 'object':
            # Check if column contains boolean-like values
            unique_vals = df[col].dropna().astype(str).str.upper().unique()
            if len(unique_vals) <= 10:  # Only check small categorical sets
                bool_like_values = {'TRUE', 'FALSE', 'T', 'F', 'YES', 'NO', 'Y', 'N', '1', '0'}
                if any(val in bool_like_values for val in unique_vals):
                    if col not in categorical_columns:
                        categorical_columns.append(col)
                        print(f"  Detected boolean-like values in '{col}': {list(unique_vals)}")
    
    date_columns = [col for col in categorical_columns 
                   if any(word in col.lower() for word in ['date', 'time', 'created', 'updated'])]
    
    # Parse date columns
    if date_columns:
        print(f"\nParsing date columns: {date_columns}")
        for col in date_columns:
            df[col] = parse_datetime_column(df[col], col)
    
    # Encode remaining categorical columns
    remaining_categorical = [col for col in categorical_columns if col not in date_columns]
    encoding_keymap = {}
    
    if remaining_categorical:
        print(f"\nEncoding categorical columns: {remaining_categorical}")
        for col in remaining_categorical:
            # Convert to string and clean the column
            df[col] = df[col].astype(str).str.strip()
            
            # Handle common boolean representations
            df[col] = df[col].str.upper()  # Convert to uppercase for consistency
            boolean_mapping = {
                'TRUE': 'True', 'FALSE': 'False',
                'T': 'True', 'F': 'False', 
                'YES': 'True', 'NO': 'False',
                'Y': 'True', 'N': 'False',
                '1': 'True', '0': 'False'
            }
            df[col] = df[col].replace(boolean_mapping)
            
            # Create categorical with explicit categories to track mapping
            categorical_data = pd.Categorical(df[col])
            
            # Store the mapping from code to category
            encoding_keymap[col] = {
                code: category for code, category in enumerate(categorical_data.categories)
            }
            
            # Apply the encoding
            df[col] = categorical_data.codes
            
            print(f"  {col}: {len(categorical_data.categories)} unique values encoded")
            if col in [c for c in df.columns if any(val in df[c].astype(str).str.upper().unique() for val in ['TRUE', 'FALSE', 'T', 'F', 'YES', 'NO', 'Y', 'N'])]:
                print(f"    Boolean-like encoding: {dict(list(encoding_keymap[col].items())[:5])}")  # Show first 5 mappings

    print(f"\nFinal data shape: {df.shape}")
    print("\nCleaned data preview:")
    print(df.head())
    
    # Return both the dataframe and the encoding keymap
    return df, encoding_keymap

app = FastAPI(title="CSV Data Cleaner API", version="1.0.0")

# Start the background cleanup task
@app.on_event("startup")
async def startup_event():
    """Start the periodic cleanup task when the app starts"""
    # Clean any old files from previous sessions on startup
    cleanup_old_files()
    asyncio.create_task(periodic_cleanup())
    print("Background file cleanup task started (15-minute expiration)")

# Increase file upload size limits
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "https://csv-cleaner-frontend.onrender.com",
        "https://*.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)

# Store for temporary files
TEMP_DIR = "temp_files"
os.makedirs(TEMP_DIR, exist_ok=True)

# File expiration time in seconds (15 minutes)
FILE_EXPIRATION_TIME = 15 * 60  # 15 minutes

def cleanup_old_files():
    """
    Remove files older than FILE_EXPIRATION_TIME from the temp directory
    """
    try:
        if not os.path.exists(TEMP_DIR):
            return
        
        current_time = time.time()
        files_deleted = 0
        
        for filename in os.listdir(TEMP_DIR):
            file_path = os.path.join(TEMP_DIR, filename)
            if os.path.isfile(file_path):
                file_age = current_time - os.path.getmtime(file_path)
                if file_age > FILE_EXPIRATION_TIME:
                    try:
                        os.remove(file_path)
                        files_deleted += 1
                        print(f"Deleted expired file: {filename} (age: {file_age/60:.1f} minutes)")
                    except Exception as e:
                        print(f"Error deleting file {filename}: {e}")
        
        if files_deleted > 0:
            print(f"Cleanup completed: {files_deleted} files deleted")
    except Exception as e:
        print(f"Error during cleanup: {e}")

async def periodic_cleanup():
    """
    Background task that runs cleanup every 5 minutes
    """
    while True:
        cleanup_old_files()
        await asyncio.sleep(300)  # Wait 5 minutes before next cleanup

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "CSV Data Cleaner API is running!", "status": "healthy", "timestamp": pd.Timestamp.now().isoformat()}

@app.get("/api/health")
async def health_check():
    """Detailed health check for keep-alive"""
    return {
        "status": "healthy", 
        "timestamp": pd.Timestamp.now().isoformat(),
        "temp_files": len(os.listdir(TEMP_DIR)) if os.path.exists(TEMP_DIR) else 0
    }

@app.post("/api/cleanup")
async def manual_cleanup():
    """Manually trigger cleanup of old files"""
    try:
        cleanup_old_files()
        file_count = len(os.listdir(TEMP_DIR)) if os.path.exists(TEMP_DIR) else 0
        return {
            "success": True,
            "message": "Cleanup completed successfully",
            "remaining_files": file_count,
            "timestamp": pd.Timestamp.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during cleanup: {str(e)}")

@app.get("/api/files")
async def list_files():
    """List all files in temp directory"""
    try:
        if not os.path.exists(TEMP_DIR):
            return {"files": [], "message": "Temp directory not found"}
        
        files = []
        for filename in os.listdir(TEMP_DIR):
            file_path = os.path.join(TEMP_DIR, filename)
            if os.path.isfile(file_path):
                size = os.path.getsize(file_path)
                files.append({
                    "name": filename,
                    "size_mb": round(size / (1024 * 1024), 2),
                    "modified": os.path.getmtime(file_path)
                })
        
        # Sort by modification time (newest first)
        files.sort(key=lambda x: x["modified"], reverse=True)
        
        return {"files": files, "count": len(files)}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/upload")
async def upload_csv(file: UploadFile = File(...)):
    """
    Upload and preview CSV file
    """
    # Clean up old files when new files are uploaded
    cleanup_old_files()
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Please upload a CSV file")
    
    # Check file size (limit to 100MB)
    file_content = await file.read()
    file_size_mb = len(file_content) / (1024 * 1024)
    
    if file_size_mb > 100:
        raise HTTPException(status_code=400, detail=f"File size ({file_size_mb:.1f}MB) exceeds maximum limit of 100MB")
    
    try:
        # Generate unique file ID
        file_id = str(uuid.uuid4())
        file_path = os.path.join(TEMP_DIR, f"{file_id}.csv")
        
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        # Read and preview the data with chunking for large files
        try:
            if file_size_mb > 10:
                # For large files, read in chunks and sample
                df = pd.read_csv(file_path, nrows=10000)  # Read first 10k rows for preview
                print(f"Large file detected ({file_size_mb:.1f}MB). Using sample of first 10,000 rows for preview.")
            else:
                df = pd.read_csv(file_path)
        except Exception as e:
            # Try with different encoding if initial read fails
            try:
                df = pd.read_csv(file_path, encoding='latin-1', nrows=10000 if file_size_mb > 10 else None)
            except:
                df = pd.read_csv(file_path, encoding='cp1252', nrows=10000 if file_size_mb > 10 else None)
        
        # Get actual file stats for large files
        if file_size_mb > 10:
            # Read just the header and count lines for accurate stats
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                total_lines = sum(1 for _ in f) - 1  # Subtract header
            actual_shape = (total_lines, df.shape[1])
            is_sample = True
        else:
            actual_shape = df.shape
            is_sample = False
        
        # Replace NaN values with empty strings for JSON compatibility
        df_preview = df.head(10).fillna("")
        
        # Basic info about the dataset
        info = {
            "file_id": file_id,
            "filename": file.filename,
            "shape": actual_shape,
            "columns": df.columns.tolist(),
            "dtypes": df.dtypes.astype(str).to_dict(),
            "missing_values": df.isnull().sum().to_dict(),
            "preview": df_preview.to_dict('records'),
            "file_size_mb": round(file_size_mb, 2),
            "is_sample": is_sample,
            "sample_size": df.shape[0] if is_sample else None
        }
        
        return info
        
    except Exception as e:
        # Clean up file if there was an error
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/api/clean")
async def clean_csv(
    background_tasks: BackgroundTasks,
    file_id: str = Form(...),
    outlier_strategy: str = Form("cap"),
    z_score_threshold: float = Form(3.0),
    iqr_multiplier: float = Form(1.5),
    standardize: bool = Form(True)
):
    """
    Clean the uploaded CSV file with specified parameters
    """
    try:
        # Clean up old files before processing new ones
        cleanup_old_files()
        
        input_path = os.path.join(TEMP_DIR, f"{file_id}.csv")
        if not os.path.exists(input_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Check file size to determine processing strategy
        file_size = os.path.getsize(input_path) / (1024 * 1024)  # Size in MB
        
        print(f"Processing file: {file_size:.1f}MB")
        
        # Clean the data with optimized settings for large files
        if file_size > 50:
            # For very large files, use more conservative settings
            print("Large file detected - using optimized processing")
            
        cleaned_df, encoding_keymap = clean_csv_data(
            input_path,
            outlier_strategy=outlier_strategy,
            z_score_threshold=z_score_threshold,
            iqr_multiplier=iqr_multiplier,
            standardize=standardize
        )
        
        # Read original data for comparison (efficiently)
        if file_size > 10:
            # For large files, just get the row count without loading all data
            with open(input_path, 'r', encoding='utf-8', errors='ignore') as f:
                original_rows = sum(1 for _ in f) - 1  # Subtract header
            original_cols = len(pd.read_csv(input_path, nrows=1).columns)
            original_shape = (original_rows, original_cols)
        else:
            original_df = pd.read_csv(input_path)
            original_shape = original_df.shape
            
        rows_removed = original_shape[0] - cleaned_df.shape[0]
        
        # Save cleaned data
        output_path = os.path.join(TEMP_DIR, f"{file_id}_cleaned.csv")
        cleaned_df.to_csv(output_path, index=False)
        
        # Save processing results for later retrieval
        results_path = os.path.join(TEMP_DIR, f"{file_id}_results.json")
        processing_results = {
            "success": True,
            "original_shape": original_shape,
            "cleaned_shape": cleaned_df.shape,
            "rows_removed": rows_removed,
            "columns_processed": cleaned_df.columns.tolist(),
            "file_size_mb": round(file_size, 2),
            "processing_time": "Processing completed successfully",
            "cleaned_file": f"{file_id}_cleaned.csv",
            "keymap_file": f"{file_id}_keymap.csv" if encoding_keymap else None,
            "timestamp": time.time()
        }
        
        with open(results_path, 'w') as f:
            json.dump(processing_results, f)
        
        # Save encoding keymap as CSV
        keymap_path = os.path.join(TEMP_DIR, f"{file_id}_keymap.csv")
        if encoding_keymap:
            # Convert keymap to a flat CSV format
            keymap_rows = []
            for column, mappings in encoding_keymap.items():
                for code, original_value in mappings.items():
                    keymap_rows.append({
                        'Column': column,
                        'Encoded_Value': code,
                        'Original_Value': original_value
                    })
            
            keymap_df = pd.DataFrame(keymap_rows)
            keymap_df.to_csv(keymap_path, index=False)
        
        # Schedule cleanup check as background task
        background_tasks.add_task(cleanup_old_files)
        
        # Return summary of changes
        # Replace NaN values with empty strings for JSON compatibility
        cleaned_preview = cleaned_df.head(10).fillna("")
        
        summary = {
            "success": True,
            "original_shape": original_shape,
            "cleaned_shape": cleaned_df.shape,
            "rows_removed": rows_removed,
            "columns_processed": cleaned_df.columns.tolist(),
            "download_id": f"{file_id}_cleaned",
            "keymap_download_id": file_id if encoding_keymap else None,
            "preview": cleaned_preview.to_dict('records'),
            "encoding_keymap": encoding_keymap,
            "file_size_mb": round(file_size, 2),
            "processing_time": "Processing completed successfully"
        }
        
        return summary
        
    except Exception as e:
        print(f"Error during cleaning: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error cleaning data: {str(e)}")

@app.get("/api/results")
async def get_latest_results():
    """Get the most recent processing results"""
    try:
        if not os.path.exists(TEMP_DIR):
            raise HTTPException(status_code=404, detail="No results found")
        
        # Find the most recent results file
        results_files = [f for f in os.listdir(TEMP_DIR) if f.endswith('_results.json')]
        
        if not results_files:
            raise HTTPException(status_code=404, detail="No processing results found")
        
        # Get the most recent one
        latest_results_file = max(results_files, key=lambda f: os.path.getmtime(os.path.join(TEMP_DIR, f)))
        results_path = os.path.join(TEMP_DIR, latest_results_file)
        
        with open(results_path, 'r') as f:
            results = json.load(f)
        
        # Add last modified time
        results["last_modified"] = time.ctime(os.path.getmtime(results_path))
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving results: {str(e)}")

@app.get("/api/download/{file_id}")
async def download_file(file_id: str):
    """
    Download the cleaned CSV file with streaming support for large files
    """
    try:
        file_path = os.path.join(TEMP_DIR, f"{file_id}.csv")
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Check file size to determine response method
        file_size = os.path.getsize(file_path)
        
        if file_size > 50 * 1024 * 1024:  # 50MB threshold for streaming
            # Stream large files
            def iter_csv():
                with open(file_path, 'rb') as file:
                    while True:
                        chunk = file.read(8192)  # 8KB chunks
                        if not chunk:
                            break
                        yield chunk
            
            return StreamingResponse(
                iter_csv(),
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=cleaned_data.csv",
                    "Content-Length": str(file_size)
                }
            )
        else:
            # Use FileResponse for smaller files
            return FileResponse(
                path=file_path,
                filename=f"cleaned_data.csv",
                media_type="text/csv"
            )
            
    except Exception as e:
        print(f"Error downloading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error downloading file: {str(e)}")

@app.get("/api/download-keymap/{file_id}")
async def download_keymap(file_id: str):
    """
    Download the encoding keymap as CSV file
    """
    keymap_path = os.path.join(TEMP_DIR, f"{file_id}_keymap.csv")
    
    if not os.path.exists(keymap_path):
        raise HTTPException(status_code=404, detail="Keymap file not found")
    
    return FileResponse(
        path=keymap_path,
        filename=f"encoding_keymap.csv",
        media_type="text/csv"
    )

@app.get("/api/download-latest")
async def download_latest_cleaned():
    """Download the most recently cleaned CSV file"""
    try:
        if not os.path.exists(TEMP_DIR):
            raise HTTPException(status_code=404, detail="No files found")
        
        # Find the most recent cleaned file
        cleaned_files = [f for f in os.listdir(TEMP_DIR) if f.endswith('_cleaned.csv')]
        
        if not cleaned_files:
            raise HTTPException(status_code=404, detail="No cleaned files found")
        
        # Get the most recent one
        latest_file = max(cleaned_files, key=lambda f: os.path.getmtime(os.path.join(TEMP_DIR, f)))
        file_path = os.path.join(TEMP_DIR, latest_file)
        
        return FileResponse(
            path=file_path,
            filename=f"cleaned_data_latest.csv",
            media_type="text/csv"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading file: {str(e)}")

@app.get("/api/analyze/{file_id}")
async def analyze_data(file_id: str):
    """
    Get detailed analysis of the dataset
    """
    try:
        file_path = os.path.join(TEMP_DIR, f"{file_id}.csv")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        df = pd.read_csv(file_path)
        
        # Basic statistics
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
        
        analysis = {
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "numeric_columns": numeric_cols,
            "categorical_columns": categorical_cols,
            "missing_data": df.isnull().sum().to_dict(),
            "duplicate_rows": df.duplicated().sum(),
        }
        
        # Add statistics for numeric columns
        if numeric_cols:
            # Convert NaN values to None for JSON compatibility
            stats_dict = df[numeric_cols].describe().to_dict()
            # Replace NaN values with None
            for col in stats_dict:
                for stat in stats_dict[col]:
                    if pd.isna(stats_dict[col][stat]):
                        stats_dict[col][stat] = None
            analysis["numeric_stats"] = stats_dict
        
        # Add value counts for categorical columns (top 5)
        if categorical_cols:
            analysis["categorical_stats"] = {}
            for col in categorical_cols[:5]:  # Limit to first 5 categorical columns
                analysis["categorical_stats"][col] = df[col].value_counts().head().to_dict()
        
        return analysis
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing data: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
