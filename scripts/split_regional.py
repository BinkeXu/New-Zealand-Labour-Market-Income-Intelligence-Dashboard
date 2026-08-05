import os
import re

base_dir = r"E:\Personal Project\NZ Labour Market Intelligence Dashboard"
regional_path = os.path.join(base_dir, "src", "components", "RegionalMatrix.jsx")
leaderboard_path = os.path.join(base_dir, "src", "components", "RegionalLeaderboard.jsx")
city_table_path = os.path.join(base_dir, "src", "components", "CityIndustryTable.jsx")

with open(regional_path, "r", encoding="utf-8") as f:
    content = f.read()

# Extract RegionalLeaderboard
leaderboard_match = re.search(r'(<section className="glass-card section-card"[^>]*aria-labelledby="opp-leaderboard-title">[\s\S]*?</section>)', content)
if leaderboard_match:
    leaderboard_jsx = leaderboard_match.group(1)
    
    leaderboard_component = f"""import React from 'react';
import {{ Award }} from 'lucide-react';

export default function RegionalLeaderboard({{ data }}) {{
  return (
    {leaderboard_jsx.replace('topOpportunityLeaderboard', 'data')}
  );
}}
"""
    with open(leaderboard_path, "w", encoding="utf-8") as f:
        f.write(leaderboard_component)
    
    content = content.replace(leaderboard_jsx, "<RegionalLeaderboard data={topOpportunityLeaderboard} />")

# Extract CityIndustryTable
city_match = re.search(r'(<section className="glass-card section-card"[^>]*aria-labelledby="city-industry-matrix-title">[\s\S]*?</section>)', content)
if city_match:
    city_jsx = city_match.group(1)
    
    city_component = f"""import React, {{ useState }} from 'react';
import {{ Building2 }} from 'lucide-react';

export default function CityIndustryTable({{ cityIndustryMatrix, allIndustries, openHistoricalChart }}) {{
  const [cityPage, setCityPage] = useState(1);
  const rowsPerPage = 15;
  const totalCityPages = Math.ceil((cityIndustryMatrix?.length || 0) / rowsPerPage);
  const paginatedCityMatrix = (cityIndustryMatrix || []).slice((cityPage - 1) * rowsPerPage, cityPage * rowsPerPage);

  return (
    {city_jsx}
  );
}}
"""
    with open(city_table_path, "w", encoding="utf-8") as f:
        f.write(city_component)
    
    # We must remove the pagination state from RegionalMatrix.jsx since it's now inside CityIndustryTable
    content = re.sub(r'const \[cityPage, setCityPage\] = useState\(1\);\n\s+const rowsPerPage = 15;\n\s+const totalCityPages = Math\.ceil\(\(cityIndustryMatrix\?\.length \|\| 0\) \/ rowsPerPage\);\n\s+const paginatedCityMatrix = \(cityIndustryMatrix \|\| \[\]\)\.slice\(\(cityPage - 1\) \* rowsPerPage, cityPage \* rowsPerPage\);\n', '', content)
    
    content = content.replace(city_jsx, "<CityIndustryTable cityIndustryMatrix={cityIndustryMatrix} allIndustries={allIndustries} openHistoricalChart={openHistoricalChart} />")


# Add imports to RegionalMatrix.jsx
imports = "import RegionalLeaderboard from './RegionalLeaderboard';\nimport CityIndustryTable from './CityIndustryTable';\n"
content = re.sub(r'(import .*?;)', imports + r'\1', content, count=1)

with open(regional_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done splitting RegionalMatrix.jsx")
