"""
ETL Data Ingestion Module (ingestion.py)

Handles clean Pandas CSV reads and schema sanitization for MBIE and Stats NZ datasets.
"""

import os
import pandas as pd
from typing import Dict, Any


def load_csv_dataset(filepath: str) -> pd.DataFrame:
    """Reads a CSV dataset with path validation."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Dataset file not found at: {filepath}")
    return pd.read_csv(filepath)


def load_clean_monthly_series(filepath: str) -> pd.DataFrame:
    """Loads and cleans MBIE Jobs Online monthly series CSV."""
    df = load_csv_dataset(filepath)
    df['ACTUAL_DATE'] = pd.to_datetime(df['ACTUAL_DATE'], format='%d/%m/%Y', errors='coerce')
    df = df.dropna(subset=['ACTUAL_DATE']).sort_values('ACTUAL_DATE').reset_index(drop=True)
    return df


def load_clean_quarterly_series(filepath: str) -> pd.DataFrame:
    """Loads and cleans MBIE Jobs Online consolidated quarterly series CSV."""
    df = load_csv_dataset(filepath)
    df['ACTUAL_DATE'] = pd.to_datetime(df['ACTUAL_DATE'], format='%d/%m/%Y', errors='coerce')
    df = df.dropna(subset=['ACTUAL_DATE']).sort_values('ACTUAL_DATE').reset_index(drop=True)
    return df
