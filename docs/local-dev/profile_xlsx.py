import pandas as pd
import sys

def profile_xlsx(file_path):
    try:
        # Read all sheets
        xl = pd.ExcelFile(file_path)
        print(f"File: {file_path}")
        print(f"Number of sheets: {len(xl.sheet_names)}")
        print(f"Sheet names: {xl.sheet_names}")

        for sheet in xl.sheet_names:
            df = xl.parse(sheet)
            print(f"\nSheet: {sheet}")
            print(f"Shape: {df.shape}")
            print(f"Columns: {list(df.columns)}")
            print(f"Data types:\n{df.dtypes}")
            print(f"First 5 rows:\n{df.head()}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        profile_xlsx(sys.argv[1])
    else:
        print("Usage: python profile_xlsx.py <xlsx_file>")