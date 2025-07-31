#!/usr/bin/env python3
"""
Test script for the CSV data cleaner.

This script allows you to interactively clean CSV data with options for 
standardization and outlier handling.
"""

from cleaner import clean_csv_data

def get_user_choice_standardization():
    """Ask user if they want standardized output."""
    print("\nOutput Format Options:")
    print("-" * 22)
    print("1. STANDARDIZED values (for Machine Learning)")
    print("   - Numbers centered around 0 with standard deviation of 1")
    print("   - Example: Age 25 becomes -0.48")
    print()
    print("2. ORIGINAL values (for Business Reports)")
    print("   - Keep original scale and meaning")
    print("   - Example: Age 25 stays as 25")
    
    while True:
        choice = input("\nDo you want standardized output? (y/n): ").strip().lower()
        if choice in ['y', 'yes']:
            print("Selected: Standardized output")
            return True
        elif choice in ['n', 'no']:
            print("Selected: Original values")
            return False
        else:
            print("Please enter 'y' for standardized or 'n' for original values.")

def get_user_choice_outliers():
    """Ask user how they want to handle outliers."""
    print("\nOutlier Handling Options:")
    print("-" * 24)
    print("1. CAP - Limit outliers to reasonable bounds (recommended)")
    print("2. REMOVE - Delete rows with outliers (loses data)")
    
    strategies = {
        '1': 'cap',
        '2': 'remove'
    }
    
    while True:
        choice = input("\nChoose outlier strategy (1/2): ").strip()
        if choice in strategies:
            strategy = strategies[choice]
            print(f"Selected: {strategy.upper()} strategy")
            return strategy
        else:
            print("Please enter 1 or 2.")

def main():
    """Run the data cleaning with user-selected options."""
    input_file = "sample_messy.csv"
    
    print("CSV Data Cleaner")
    print("=" * 16)
    
    try:
        # Get user preferences
        standardize = get_user_choice_standardization()
        outlier_strategy = get_user_choice_outliers()
        
        # Clean the data with user preferences
        print(f"\nProcessing data with your preferences:")
        print("-" * 37)
        print(f"Standardization: {'YES' if standardize else 'NO'}")
        print(f"Outlier strategy: {outlier_strategy.upper()}")
        print()
        
        cleaned_data = clean_csv_data(
            input_file, 
            standardize=standardize,
            outlier_strategy=outlier_strategy
        )
        
        print(f"\nSuccess! Processed {len(cleaned_data)} rows")
        
    except FileNotFoundError:
        print(f"Error: Could not find '{input_file}'")
        print("Please ensure the sample data file exists in the current directory.")
        
    except Exception as e:
        print(f"Error during processing: {e}")


if __name__ == "__main__":
    main()
