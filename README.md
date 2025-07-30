# CSV Data Cleaner

A simple Python tool for cleaning messy CSV files. Handles missing values, outliers, and data formatting issues automatically.

## What it does

This tool takes messy CSV data and cleans it up for analysis or machine learning. It's designed to handle the most common data quality problems you'll encounter with real-world datasets.

## Features

- **Missing values**: Fills in gaps with reasonable estimates (median for numbers, most common for text)
- **Outlier detection**: Finds and handles extreme values using Z-score and IQR methods
- **Data formatting**: Converts text to proper data types (numbers, dates, etc.)
- **Date parsing**: Recognizes various date formats and standardizes them
- **Standardization**: Optional scaling for machine learning algorithms
- **Simple interface**: Just run the script and choose your options

## Quick Start

1. **Install dependencies**:
   ```bash
   pip install pandas numpy scikit-learn scipy
   ```

2. **Run the cleaner**:
   ```bash
   python test_cleaner.py
   ```

3. **Follow the prompts** to choose your cleaning options

## What gets cleaned

### Sample messy data:
```csv
Name,Age,Gender,Income,JoinDate
Alice,25,Female,50000,2021-05-01
Bob,,Male,,2022/01/10
,35,,65000,10-03-2020
David,22,Male,47000,03-15-2019
Eve,28,Female,abc,April 4, 2021
Frank,180,Male,52000,2020-12-15
Sarah,29,Female,-5000,2021-11-20
```

### After cleaning:
```csv
Name,Age,Gender,Income,JoinDate
0,25.0,0,50000.0,2021-05-01
1,28.5,1,50000.0,2022-01-10
0,35.0,0,61100.0,2020-03-10
2,22.0,1,47000.0,2019-03-15
3,28.0,0,50000.0,2021-04-04
4,136.5,1,52000.0,2020-12-15
5,29.0,0,10600.0,2021-11-20
```

## Usage Options

### Interactive Mode (Recommended)
```bash
python test_cleaner.py
```
The script will ask you:
- Do you want standardized output? (for ML vs business reports)
- How to handle outliers? (cap vs remove)

### Programmatic Usage
```python
from cleaner import clean_csv_data

# Basic cleaning with original values
data = clean_csv_data('your_file.csv', standardize=False)

# For machine learning (standardized)
data = clean_csv_data('your_file.csv', standardize=True)

# Remove outliers instead of capping
data = clean_csv_data('your_file.csv', outlier_strategy='remove')

# Custom outlier sensitivity
data = clean_csv_data('your_file.csv', z_score_threshold=2.5)
```

## Cleaning Process

1. **Load CSV** - Handles parsing errors gracefully
2. **Type conversion** - Converts obvious numeric columns (age, income, etc.)
3. **Missing values** - Fills with median (numbers) or mode (text)
4. **Outlier detection** - Uses both Z-score and IQR methods
5. **Outlier handling** - Cap to reasonable bounds or remove rows
6. **Date parsing** - Recognizes multiple date formats
7. **Categorical encoding** - Converts text to numbers
8. **Standardization** - Optional scaling for ML (centers around 0)

## When to use standardization

### Choose **YES** for:
- Machine learning models
- Neural networks
- Algorithms that care about scale (SVM, KNN, etc.)
- When you want all features on the same scale

### Choose **NO** for:
- Business reports
- Data analysis where original values matter
- When you need to interpret actual numbers
- Visualization dashboards

## Outlier handling strategies

### CAP (Recommended)
- Limits extreme values to reasonable bounds
- Keeps all your data
- Good for most use cases

### REMOVE
- Deletes rows with outliers
- Cleaner data but lose information
- Use when data quality is more important than quantity

## Output

The tool creates:
- `cleaned_data.csv` - Your cleaned dataset
- Console output showing what was changed
- Summary of outliers found and handled

## Common issues

**Q: Getting parsing errors?**  
A: The tool tries multiple CSV reading methods automatically

**Q: Dates not parsing correctly?**  
A: Make sure date columns have 'date', 'time', 'created', or 'updated' in the name

**Q: Wrong data types?**  
A: Rename columns to common names like 'age', 'income', 'price' for auto-detection

**Q: Too many outliers detected?**  
A: Adjust sensitivity with `z_score_threshold=2.5` (lower = less sensitive)

## Files in this project

- `cleaner.py` - Main cleaning functions
- `test_cleaner.py` - Interactive script to run
- `sample_messy.csv` - Example data to test with
- `requirements.txt` - Dependencies needed
- `README.md` - This file

## Requirements

- Python 3.6+
- pandas 1.3.0+
- numpy 1.20.0+
- scikit-learn 1.0.0+
- scipy 1.7.0+

## Installation

```bash
# Clone or download the project
cd ai_csv_cleaner

# Install dependencies
pip install -r requirements.txt

# Run the cleaner
python test_cleaner.py
```

## Examples

### Basic usage
```python
from cleaner import clean_csv_data
clean_data = clean_csv_data('messy_data.csv')
```

### For business reporting
```python
clean_data = clean_csv_data('sales_data.csv', standardize=False)
```

### Strict outlier removal
```python
clean_data = clean_csv_data('survey_data.csv', outlier_strategy='remove')
```

### Custom settings
```python
clean_data = clean_csv_data(
    'data.csv',
    outlier_strategy='cap',
    z_score_threshold=2.0,
    standardize=True
)
```

## Contributing

This is a simple utility tool. Feel free to modify it for your specific needs!

## License

Free to use and modify as needed.

### Basic Usage

```python
from cleaner import clean_csv_data

# Clean a CSV file with default settings
cleaned_data = clean_csv_data("your_data.csv")
```

### Custom Outlier Handling

```python
# Remove rows containing outliers
clean_csv_data("data.csv", outlier_strategy='remove')

# Cap outliers to reasonable bounds
clean_csv_data("data.csv", outlier_strategy='cap')

# Apply log transformation to reduce outlier impact
clean_csv_data("data.csv", outlier_strategy='transform')
```

### Standardization Options

```python
# Standardize values for machine learning (default)
clean_csv_data("data.csv", standardize=True)

# Keep original values for business reporting
clean_csv_data("data.csv", standardize=False)

# Combine options
clean_csv_data("data.csv", outlier_strategy='remove', standardize=False)
```

### Adjusting Sensitivity

```python
# More sensitive outlier detection
clean_csv_data("data.csv", z_score_threshold=2.0, iqr_multiplier=1.0)

# Less sensitive (catches only extreme outliers)
clean_csv_data("data.csv", z_score_threshold=4.0, iqr_multiplier=2.0)
```

## Function Parameters

- `file_path` (str): Path to the input CSV file
- `outlier_strategy` (str): How to handle outliers - 'cap', 'remove', or 'transform'
- `z_score_threshold` (float): Standard deviations for Z-score outlier detection (default: 3.0)
- `iqr_multiplier` (float): Multiplier for IQR-based outlier detection (default: 1.5)
- `standardize` (bool): Whether to standardize numeric values (default: True)

## Outlier Detection Methods

### Z-Score Method
Identifies values that are more than N standard deviations away from the mean. Good for normally distributed data.

### IQR Method  
Uses the interquartile range to identify values outside the "whiskers" of a box plot. More robust to non-normal distributions.

### Combined Approach
The tool uses both methods and flags data points identified by either technique, providing comprehensive outlier detection.

## Standardization Options

### When to Standardize (standardize=True)
- **Machine Learning**: Preparing data for algorithms sensitive to scale
- **Multi-scale Data**: When columns have vastly different ranges (age vs income)
- **Neural Networks**: Required for proper training
- **Comparative Analysis**: When you need to compare variables on equal footing

### When to Keep Original Values (standardize=False)
- **Business Reporting**: When stakeholders need actual values
- **Interpretability**: When results must be explained in original units
- **Tree-based Models**: Decision trees don't require standardization
- **Domain Requirements**: When specific value ranges are meaningful

## Installation Requirements

```bash
pip install pandas numpy scikit-learn scipy
```

## Example Output

```
Loading and cleaning CSV data...
========================================
Original data shape: (5, 5)
Columns: ['Name', 'Age', 'Gender', 'Income', 'JoinDate']

Processing outliers in numeric columns: ['Age', 'Income']
  Age: 1 outliers found (Z-score: 0, IQR: 1)
    → Capped to range [22.6, 33.6]
  Income: 2 outliers found (Z-score: 0, IQR: 2)  
    → Capped to range [47600.0, 62000.0]

Normalizing numeric columns...
Normalized: ['Age', 'Income']

Parsing date columns: ['JoinDate']
  JoinDate: 5/5 dates parsed (100.0%)

Final data shape: (5, 5)
Cleaned data saved to: cleaned_data.csv
```

## Files in This Project

- `cleaner.py` - Main cleaning module with all functionality
- `test_cleaner.py` - Test script with comprehensive examples and demos
- `sample_messy.csv` - Sample dataset with common data quality issues
- `requirements.txt` - Required Python packages
- `SETUP.md` - Quick setup instructions

## Contributing

Feel free to submit issues or pull requests if you encounter bugs or have ideas for improvements. The code is designed to be readable and extensible.

## License

This project is open source and available under the MIT License.