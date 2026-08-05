import os

base_dir = r"E:\Personal Project\NZ Labour Market Intelligence Dashboard"
process_data_path = os.path.join(base_dir, "scripts", "process_data.py")
income_path = os.path.join(base_dir, "scripts", "etl", "income.py")
vacancies_path = os.path.join(base_dir, "scripts", "etl", "vacancies.py")
workforce_path = os.path.join(base_dir, "scripts", "etl", "workforce.py")

with open(process_data_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

def get_lines(start, end):
    return "".join(lines[start-1:end]) + "\n\n"

income_additions = (
    get_lines(289, 426) +  # extract_national_income_distribution
    get_lines(429, 573) +  # process_regional_income
    get_lines(900, 1071)   # process_ird_income_distributions
)

vacancies_additions = (
    get_lines(576, 663) +  # process_city_industry_breakdown
    get_lines(666, 736) +  # process_industry_matrix
    get_lines(739, 833) +  # process_detailed_occupations
    get_lines(836, 897)    # generate_career_pathfinder_rules (belongs with vacancies/occupations)
)

workforce_additions = (
    get_lines(1074, 1172)  # process_level_industry_benchmarks
)

with open(income_path, "a", encoding="utf-8") as f:
    f.write("\n" + income_additions)

with open(vacancies_path, "a", encoding="utf-8") as f:
    f.write("\n" + vacancies_additions)

with open(workforce_path, "a", encoding="utf-8") as f:
    f.write("\n" + workforce_additions)

print("Done appending functions to ETL modules.")
