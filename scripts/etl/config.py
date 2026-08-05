import os
import json
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

DATASET_DIR = os.path.join(BASE_DIR, "Dataset")
ACTIVE_DATA_DIR = os.path.join(DATASET_DIR, "active")
ARCHIVE_OTHER_DIR = os.path.join(DATASET_DIR, "archive_other")

if not os.path.exists(ACTIVE_DATA_DIR):
    ACTIVE_DATA_DIR = os.path.join(BASE_DIR, "datasets", "active")
if not os.path.exists(ACTIVE_DATA_DIR):
    ACTIVE_DATA_DIR = DATASET_DIR

PUBLIC_DATA_DIR = os.path.join(BASE_DIR, "public", "data")
CONFIG_DIR = os.path.join(BASE_DIR, "scripts", "config")

def load_config():
    config_file = os.path.join(CONFIG_DIR, "benchmarks.json")
    with open(config_file, 'r', encoding='utf-8') as f:
        return json.load(f)

CONFIG = load_config()
CITY_REGION_MAPPING = CONFIG.get("city_region_mapping", {})
INDUSTRY_BENCHMARKS = CONFIG.get("industry_salaries", {})

def ensure_directories():
    os.makedirs(PUBLIC_DATA_DIR, exist_ok=True)
