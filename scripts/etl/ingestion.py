"""
ETL Data Ingestion Module (ingestion.py)

Handles clean Pandas CSV reads, schema sanitization, logging, and row drop metrics for MBIE and Stats NZ datasets.
"""

import os
import logging
import pandas as pd

logger = logging.getLogger(__name__)

def load_csv_dataset(filepath: str) -> pd.DataFrame:
    """Reads a CSV dataset with path validation."""
    if not os.path.exists(filepath):
        logger.error(f"Dataset file not found at path: {filepath}")
        raise FileNotFoundError(f"Dataset file not found at: {filepath}")
    logger.info(f"Loading CSV dataset: {filepath}")
    return pd.read_csv(filepath)


def load_clean_monthly_series(filepath: str) -> pd.DataFrame:
    """Loads and cleans MBIE Jobs Online monthly series CSV with logging."""
    df = load_csv_dataset(filepath)
    initial_count = len(df)
    df['ACTUAL_DATE'] = pd.to_datetime(df['ACTUAL_DATE'], format='%d/%m/%Y', errors='coerce')
    clean_df = df.dropna(subset=['ACTUAL_DATE']).sort_values('ACTUAL_DATE').reset_index(drop=True)
    dropped_count = initial_count - len(clean_df)
    if dropped_count > 0:
        logger.warning(f"Monthly series {filepath}: dropped {dropped_count} invalid date rows out of {initial_count}")
    return clean_df


def load_clean_quarterly_series(filepath: str) -> pd.DataFrame:
    """Loads and cleans MBIE Jobs Online consolidated quarterly series CSV with logging."""
    df = load_csv_dataset(filepath)
    initial_count = len(df)
    df['ACTUAL_DATE'] = pd.to_datetime(df['ACTUAL_DATE'], format='%d/%m/%Y', errors='coerce')
    clean_df = df.dropna(subset=['ACTUAL_DATE']).sort_values('ACTUAL_DATE').reset_index(drop=True)
    dropped_count = initial_count - len(clean_df)
    if dropped_count > 0:
        logger.warning(f"Quarterly series {filepath}: dropped {dropped_count} invalid date rows out of {initial_count}")
    return clean_df
