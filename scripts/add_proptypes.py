import os
import re

base_dir = r"E:\Personal Project\NZ Labour Market Intelligence Dashboard"
components = {
    "HistoricalChartModal.jsx": {
        "name": "HistoricalChartModal",
        "props": """HistoricalChartModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  modalMetric: PropTypes.string,
  extraData: PropTypes.object,
  monthlyData: PropTypes.object,
  regionalData: PropTypes.object
};"""
    },
    "RegionalLeaderboard.jsx": {
        "name": "RegionalLeaderboard",
        "props": """RegionalLeaderboard.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    region_name: PropTypes.string,
    opportunity_score: PropTypes.number,
    vacancies_per_100k: PropTypes.number,
    median_weekly_income: PropTypes.number
  })).isRequired
};"""
    },
    "CityIndustryTable.jsx": {
        "name": "CityIndustryTable",
        "props": """CityIndustryTable.propTypes = {
  cityIndustryMatrix: PropTypes.array,
  allIndustries: PropTypes.array,
  openHistoricalChart: PropTypes.func.isRequired
};"""
    },
    "Header.jsx": {
        "name": "Header",
        "props": """Header.propTypes = {
  activeTab: PropTypes.string,
  setActiveTab: PropTypes.func,
  toggleTheme: PropTypes.func
};"""
    },
    "ErrorBoundary.jsx": {
        "name": "ErrorBoundary",
        "props": """ErrorBoundary.propTypes = {
  children: PropTypes.node
};"""
    },
    "DownloadCSVButton.jsx": {
        "name": "DownloadCSVButton",
        "props": """DownloadCSVButton.propTypes = {
  data: PropTypes.array,
  filename: PropTypes.string,
  label: PropTypes.string
};"""
    }
}

for filename, config in components.items():
    filepath = os.path.join(base_dir, "src", "components", filename)
    if not os.path.exists(filepath):
        print(f"Skipping {filename} - not found")
        continue
        
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        
    if "import PropTypes" not in content:
        content = "import PropTypes from 'prop-types';\n" + content
        
    if config["props"] not in content:
        content += "\n" + config["props"] + "\n"
        
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
        print(f"Added prop-types to {filename}")

