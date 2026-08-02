"""
ETL Income Pipeline Module (income.py)

Processes Stats NZ Regional Household Income Census, rent, and IRD Individual Tax Return datasets.
"""

import os
import json
import logging
import zipfile
import xml.etree.ElementTree as ET
import pandas as pd
from typing import Dict, List, Any
from scripts.etl.ingestion import load_csv_dataset
from scripts.etl.calculators import (
    sanitize_val,
    calculate_hourly_wage,
    calculate_annualized_income,
    calculate_vacancies_per_100k,
    calculate_net_discretionary_income,
    calculate_purchasing_power_index,
    calculate_opportunity_score
)

logger = logging.getLogger(__name__)

def load_population_data(active_data_dir: str) -> Dict[str, Dict[str, int]]:
    """Parses Census Population CSV dataset and calculates working-age (Ages 15-64) population."""
    filepath = os.path.join(active_data_dir, "Census_Population_by_age_by_Regional_Council_2001_2006_2013.csv")
    logger.info(f"Processing Working-Age Population Dataset: {filepath}")
    
    df = load_csv_dataset(filepath)
    latest_year = df['Census Year'].max()
    
    df_work = df[
        (df['Census Year'] == latest_year) & 
        (df['Age group'] == '15-64')
    ].drop_duplicates(subset=['Region']).copy()
    
    raw_work_pop = {}
    for row in df_work.itertuples():
        reg_name = str(row.Region).strip()
        val = int(row.Value)
        raw_work_pop[reg_name] = val

    df_total = df[
        (df['Census Year'] == latest_year) & 
        (df['Age group'] == 'Total people')
    ].drop_duplicates(subset=['Region']).copy()
    
    raw_total_pop = {}
    for row in df_total.itertuples():
        reg_name = str(row.Region).strip()
        val = int(row.Value)
        raw_total_pop[reg_name] = val
        
    mbie_pop_map = {
        "Auckland": { "working_age": raw_work_pop["Auckland"], "total": raw_total_pop["Auckland"] },
        "Waikato": { "working_age": raw_work_pop["Waikato"], "total": raw_total_pop["Waikato"] },
        "Bay of Plenty": { "working_age": raw_work_pop["Bay of Plenty"], "total": raw_total_pop["Bay of Plenty"] },
        "Northland": { "working_age": raw_work_pop["Northland"], "total": raw_total_pop["Northland"] },
        "Gisborne/Hawkes Bay": { "working_age": raw_work_pop["Gisborne"] + raw_work_pop["Hawke's Bay"], "total": raw_total_pop["Gisborne"] + raw_total_pop["Hawke's Bay"] },
        "Manawatu-Whanganui/Taranaki": { "working_age": raw_work_pop["Manawatū-Whanganui"] + raw_work_pop["Taranaki"], "total": raw_total_pop["Manawatū-Whanganui"] + raw_total_pop["Taranaki"] },
        "Wellington": { "working_age": raw_work_pop["Wellington"], "total": raw_total_pop["Wellington"] },
        "Tasman/Nelson/Marlborough/West Coast": { "working_age": raw_work_pop["Tasman"] + raw_work_pop["Nelson"] + raw_work_pop["Marlborough"] + raw_work_pop["West Coast"], "total": raw_total_pop["Tasman"] + raw_total_pop["Nelson"] + raw_total_pop["Marlborough"] + raw_total_pop["West Coast"] },
        "Canterbury": { "working_age": raw_work_pop["Canterbury"], "total": raw_total_pop["Canterbury"] },
        "Otago/Southland": { "working_age": raw_work_pop["Otago"] + raw_work_pop["Southland"], "total": raw_total_pop["Otago"] + raw_total_pop["Southland"] }
    }
    
    return mbie_pop_map


def load_regional_rent_data(active_data_dir: str) -> Dict[str, float]:
    """Parses Stats NZ / MBIE Tenancy Services mean weekly rent CSV dataset."""
    filepath = os.path.join(active_data_dir, "mean_weekly_rent.csv")
    logger.info(f"Processing Regional Rent Dataset: {filepath}")
    
    if not os.path.exists(filepath):
        logger.warning(f"Rent dataset file not found at {filepath}, using baseline rent estimates.")
        return {
            "Auckland": 618.50, "Wellington": 553.00, "Canterbury": 519.00,
            "Waikato": 520.00, "Bay of Plenty": 545.00, "Otago/Southland": 495.00,
            "Manawatu-Whanganui/Taranaki": 450.00, "Northland": 480.00,
            "Gisborne/Hawkes Bay": 490.00, "Tasman/Nelson/Marlborough/West Coast": 465.00
        }

    df = load_csv_dataset(filepath)
    latest_year = df['Year'].max()
    df_latest = df[df['Year'] == latest_year]
    
    rent_map = {}
    for row in df_latest.itertuples():
        reg = str(row.Region).strip()
        rent_map[reg] = float(row.Mean_Weekly_Rent)
        
    return rent_map
