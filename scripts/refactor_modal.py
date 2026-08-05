import os
import re

base_dir = r"E:\Personal Project\NZ Labour Market Intelligence Dashboard"
modal_path = os.path.join(base_dir, "src", "components", "HistoricalChartModal.jsx")

with open(modal_path, "r", encoding="utf-8") as f:
    content = f.read()

# Extract the entire useMemo body
match = re.search(r'(const chartConfig = useMemo\(\(\) => \{\n\s+if \(!modalMetric\) return null;\n\n\s+const hlfs = .*?;\n\n)([\s\S]*?)(\s+return null;\n\s+\}, \[.*?\]\);)', content)

if not match:
    print("Could not find chartConfig block")
    exit(1)

prefix = match.group(1)
body = match.group(2)
suffix = match.group(3)

# We will write a new file `src/config/chartStrategies.js` and replace the switch inside HistoricalChartModal.jsx
strategies_code = """export const CHART_CONFIG_STRATEGIES = {
  opportunity_score: (monthlyData, regionalData, extraData, hlfs) => {
""" + re.search(r"if \(modalMetric === 'opportunity_score'\) \{([\s\S]*?)\}\n\n\s+// --- VACANCY ---", body).group(1) + """  },

  vacancy: (monthlyData, regionalData, extraData, hlfs) => {
""" + re.search(r"if \(modalMetric === 'vacancy'\) \{([\s\S]*?)\}\n\n\s+// --- INCOME ---", body).group(1) + """  },

  income: (monthlyData, regionalData, extraData, hlfs) => {
""" + re.search(r"if \(modalMetric === 'income'\) \{([\s\S]*?)\}\n\n\s+// --- UNEMPLOYMENT ---", body).group(1) + """  },

  unemployment: (monthlyData, regionalData, extraData, hlfs) => {
""" + re.search(r"if \(modalMetric === 'unemployment'\) \{([\s\S]*?)\}\n\n\s+// --- UNDERUTILISATION ---", body).group(1) + """  },

  underutilisation: (monthlyData, regionalData, extraData, hlfs) => {
""" + re.search(r"if \(modalMetric === 'underutilisation'\) \{([\s\S]*?)\}\n\n\s+// --- INCOME SOURCE", body).group(1) + """  },

  income_source: (monthlyData, regionalData, extraData, hlfs) => {
    if (!extraData) return null;
""" + re.search(r"if \(modalMetric === 'income_source' && extraData\) \{([\s\S]*?)\}\n\n\s+// --- ANZSCO OCCUPATION ---", body).group(1) + """  },

  anzsco: (monthlyData, regionalData, extraData, hlfs) => {
    if (!extraData) return null;
""" + re.search(r"if \(modalMetric === 'anzsco' && extraData\) \{([\s\S]*?)\}$", body.strip()).group(1) + """  }
};
"""

strategies_path = os.path.join(base_dir, "src", "config", "chartStrategies.js")
os.makedirs(os.path.dirname(strategies_path), exist_ok=True)

with open(strategies_path, "w", encoding="utf-8") as f:
    f.write(strategies_code)

new_use_memo = """
  const chartConfig = useMemo(() => {
    if (!modalMetric || !CHART_CONFIG_STRATEGIES[modalMetric]) return null;
    const hlfs = monthlyData?.metadata?.hlfs_labor_metrics || {};
    return CHART_CONFIG_STRATEGIES[modalMetric](monthlyData, regionalData, extraData, hlfs);
  }, [modalMetric, monthlyData, regionalData, extraData]);
"""

new_content = content[:match.start()] + new_use_memo + content[match.end():]
new_content = "import { CHART_CONFIG_STRATEGIES } from '../config/chartStrategies';\n" + new_content

with open(modal_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Done refactoring HistoricalChartModal")
