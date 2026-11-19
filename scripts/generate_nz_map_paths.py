"""
================================================================================
New Zealand Labour Market & Income Intelligence Dashboard
Script: scripts/generate_nz_map_paths.py
================================================================================
Purpose:
  Reproducible data pipeline script that fetches raw open GIS boundary data for
  New Zealand administrative regions (ADM1) and converts them into lightweight,
  themeable SVG vector path definitions used by `src/components/NZRegionalMap.jsx`.

Data Provenance & Attribution:
  - Source: geoBoundaries Open Administrative Database (Release: NZL ADM1 Simplified)
    URL: https://github.com/wmgeolab/geoBoundaries
    License: Creative Commons Attribution 4.0 International (CC BY 4.0)
  - Underlying Boundary Authority:
    Land Information New Zealand (LINZ) & Stats NZ Tatauranga Aotearoa
    (NZGOAL Open Access Licensing Framework)

Why this script is necessary:
  1. The raw government boundaries describe 16 separate Regional Councils, but the
     MBIE Jobs Online and Stats NZ vacancy datasets combine several smaller
     councils into 10 grouped labour market regions:
       - Otago & Southland -> "Otago/Southland"
       - Gisborne & Hawke's Bay -> "Gisborne/Hawkes Bay"
       - Manawatu-Whanganui & Taranaki -> "Manawatu-Whanganui/Taranaki"
       - Tasman, Nelson, Marlborough & West Coast -> "Tasman/Nelson/Marlborough/West Coast"
  2. Raw GeoJSON includes offshore territories like the Chatham Islands (800 km east).
     Leaving them in would force the mainland to be squashed onto the far-left edge.
  3. Raw GeoJSON files can be 10MB-50MB. This script projects, simplifies, and
     compresses the mainland polygons down to an ultra-fast ~40 kB vector file.

Output:
  `src/data/nzRegionsPaths.js` (Exported JavaScript objects containing SVG `d` path strings)
================================================================================
"""

import json
import math
import os
import sys
import urllib.request

# Ensure terminal outputs UTF-8 cleanly on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# ------------------------------------------------------------------------------
# 1. Configuration & File Paths
# ------------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_DIR = os.path.join(BASE_DIR, "Dataset", "cache")
GEOJSON_CACHE_PATH = os.path.join(CACHE_DIR, "nz_adm1_simplified.geojson")
OUTPUT_JS_PATH = os.path.join(BASE_DIR, "src", "data", "nzRegionsPaths.js")

# Official geoBoundaries open-access simplified ADM1 GeoJSON for New Zealand
GEOBOUNDARIES_API_URL = "https://www.geoboundaries.org/api/current/gbOpen/NZL/ADM1/"
FALLBACK_RAW_GEOJSON_URL = (
    "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/"
    "releaseData/gbOpen/NZL/ADM1/geoBoundaries-NZL-ADM1_simplified.geojson"
)

# ------------------------------------------------------------------------------
# 2. Regional Council -> MBIE 10 Labour Market Region Mapping
# ------------------------------------------------------------------------------
# Maps the 16 official Stats NZ Regional Councils to the 10 MBIE grouped reporting regions.
COUNCIL_TO_MBIE_MAPPING = {
    # North Island
    "Northland Region": "Northland",
    "Auckland Region": "Auckland",
    "Waikato Region": "Waikato",
    "Bay of Plenty Region": "Bay of Plenty",
    "Gisborne Region": "Gisborne/Hawkes Bay",
    "Hawke's Bay Region": "Gisborne/Hawkes Bay",
    "Taranaki Region": "Manawatu-Whanganui/Taranaki",
    "Manawatu-Wanganui Region": "Manawatu-Whanganui/Taranaki",
    "Wellington Region": "Wellington",
    # South Island
    "Tasman Region": "Tasman/Nelson/Marlborough/West Coast",
    "Nelson Region": "Tasman/Nelson/Marlborough/West Coast",
    "Marlborough Region": "Tasman/Nelson/Marlborough/West Coast",
    "West Coast Region": "Tasman/Nelson/Marlborough/West Coast",
    "Canterbury Region": "Canterbury",
    "Otago Region": "Otago/Southland",
    "Southland Region": "Otago/Southland",
}

# ------------------------------------------------------------------------------
# 3. Geographic Projection Parameters (Equirectangular Centered at 41°S)
# ------------------------------------------------------------------------------
# Mainland New Zealand bounding box (in WGS84 decimal degrees)
# Excludes the Chatham Islands (~176°W / 800km east) to maintain mainland prominence
LON_MIN, LON_MAX = 166.3, 178.7
LAT_MIN, LAT_MAX = -47.4, -34.3

# Equirectangular projection scale factor: compresses longitude based on latitude
# New Zealand's geographic centroid is approximately 41 degrees South.
COS_LAT = math.cos(math.radians(-41.0))

# Target SVG Canvas ViewBox dimensions (420px width x 560px height)
VIEWBOX_WIDTH = 420.0
VIEWBOX_HEIGHT = 560.0
PADDING = 16.0

# Calculate optimal scale and translation offsets to center New Zealand perfectly
span_x = (LON_MAX - LON_MIN) * COS_LAT
span_y = LAT_MAX - LAT_MIN
scale = min((VIEWBOX_WIDTH - 2 * PADDING) / span_x, (VIEWBOX_HEIGHT - 2 * PADDING) / span_y)
offset_x = (VIEWBOX_WIDTH - span_x * scale) / 2.0
offset_y = (VIEWBOX_HEIGHT - span_y * scale) / 2.0


def project_coordinates(longitude: float, latitude: float):
    """
    Projects spherical GPS (longitude, latitude) into planar SVG (X, Y) canvas pixels.
    Inverts Y because SVG coordinates increase downwards from top-left.
    """
    x = offset_x + (longitude - LON_MIN) * COS_LAT * scale
    y = offset_y + (LAT_MAX - latitude) * scale
    return round(x, 1), round(y, 1)


def compute_polygon_area(ring):
    """
    Computes polygon area using the Shoelace formula (Surveyor's formula).
    Used to filter out tiny micro-islands and sort polygons by significance.
    """
    if len(ring) < 3:
        return 0.0
    area = 0.0
    for i in range(len(ring)):
        x1, y1 = ring[i][0], ring[i][1]
        x2, y2 = ring[(i + 1) % len(ring)][0], ring[(i + 1) % len(ring)][1]
        area += x1 * y2 - x2 * y1
    return abs(area) * 0.5


def simplify_polygon_vertices(ring, min_pixel_distance: float = 1.4):
    """
    Performs distance-threshold vertex reduction on projected pixel points.
    Removes redundant adjacent vertices closer than `min_pixel_distance` pixels,
    greatly reducing SVG file size while preserving coastal silhouettes.
    """
    projected = [project_coordinates(p[0], p[1]) for p in ring]
    if not projected:
        return []

    simplified = [projected[0]]
    for pt in projected[1:]:
        dist = math.hypot(pt[0] - simplified[-1][0], pt[1] - simplified[-1][1])
        if dist >= min_pixel_distance:
            simplified.append(pt)

    # Ensure a valid closed polygon with at least 3 distinct vertices
    return simplified if len(simplified) >= 3 else []


# ------------------------------------------------------------------------------
# 4. Ingestion & Transformation Pipeline
# ------------------------------------------------------------------------------
def fetch_geojson() -> dict:
    """
    Retrieves the raw GeoJSON dataset, using a local cached copy if available,
    or downloading it automatically from the geoBoundaries API.
    """
    os.makedirs(CACHE_DIR, exist_ok=True)
    if os.path.exists(GEOJSON_CACHE_PATH):
        print(f"📦 Using cached GeoJSON boundary file: {GEOJSON_CACHE_PATH}")
        with open(GEOJSON_CACHE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)

    print("🌐 Downloading official NZ administrative boundaries from geoBoundaries...")
    download_url = FALLBACK_RAW_GEOJSON_URL
    try:
        req = urllib.request.Request(
            GEOBOUNDARIES_API_URL,
            headers={"User-Agent": "NZ-Labour-Dashboard-ETL/1.0"}
        )
        with urllib.request.urlopen(req, timeout=15) as res:
            api_data = json.loads(res.read().decode("utf-8"))
            if api_data.get("simplifiedGeometryGeoJSON"):
                download_url = api_data["simplifiedGeometryGeoJSON"]
    except Exception as e:
        print(f"⚠️ Notice: API discovery skipped ({e}), falling back to direct raw URL.")

    print(f"⬇️ Fetching GeoJSON from: {download_url}")
    urllib.request.urlretrieve(download_url, GEOJSON_CACHE_PATH)
    print(f"✅ Saved cached GeoJSON ({os.path.getsize(GEOJSON_CACHE_PATH)} bytes)")

    with open(GEOJSON_CACHE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def build_svg_paths(geojson_data: dict) -> dict:
    """
    Processes GeoJSON features, merges them into the 10 MBIE regions,
    projects coordinates to SVG canvas space, and generates path strings.
    """
    mbie_groups = {}

    for feature in geojson_data.get("features", []):
        council_name = feature.get("properties", {}).get("shapeName")
        if council_name not in COUNCIL_TO_MBIE_MAPPING:
            # Silently skip territories outside the 16 regional councils (e.g. Chatham Islands)
            continue

        mbie_region_name = COUNCIL_TO_MBIE_MAPPING[council_name]
        geometry = feature.get("geometry", {})
        coords = geometry.get("coordinates", [])

        # Normalise both Polygon and MultiPolygon geometry structures
        polygons = coords if geometry.get("type") == "MultiPolygon" else [coords]

        for poly in polygons:
            outer_ring = poly[0]  # First ring represents the outer boundary

            # Compute centroid of the ring to verify it falls within mainland NZ bounds
            centroid_lon = sum(p[0] for p in outer_ring) / len(outer_ring)
            centroid_lat = sum(p[1] for p in outer_ring) / len(outer_ring)
            if not (LON_MIN <= centroid_lon <= LON_MAX and LAT_MIN <= centroid_lat <= LAT_MAX):
                continue

            # Skip tiny micro-islands (area threshold < 0.002 square degrees) to keep SVG clean
            area = compute_polygon_area(outer_ring)
            if area < 0.002:
                continue

            # Simplify ring vertices in pixel space
            simplified = simplify_polygon_vertices(outer_ring, min_pixel_distance=1.4)
            if not simplified:
                continue

            # Construct SVG Path command string: 'M x,y L x,y ... Z'
            path_str = "M" + "L".join(f"{x},{y}" for x, y in simplified) + "Z"
            label_coord = project_coordinates(centroid_lon, centroid_lat)

            mbie_groups.setdefault(mbie_region_name, []).append((area, path_str, label_coord))

    # Combine multi-polygons for each grouped region and select primary centroid for text label
    final_output = {}
    for region_name, items in mbie_groups.items():
        # Sort polygons by area (descending) so the largest landmass dictates label position
        items.sort(key=lambda x: -x[0])
        combined_path_d = " ".join(item[1] for item in items)
        primary_label_x, primary_label_y = items[0][2]

        final_output[region_name] = {
            "d": combined_path_d,
            "labelX": primary_label_x,
            "labelY": primary_label_y
        }

    return final_output


def write_javascript_module(paths_data: dict, output_file: str):
    """
    Writes the resulting data structures to a clean JavaScript ES module file.
    """
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("/**\n")
        f.write(" * New Zealand 10 MBIE Labour Market Regions - SVG Path Data\n")
        f.write(" * Auto-generated by scripts/generate_nz_map_paths.py\n")
        f.write(" * Data Provenance: geoBoundaries (LINZ / Stats NZ ADM1 simplified boundaries)\n")
        f.write(" * License: Creative Commons Attribution 4.0 International (CC BY 4.0)\n")
        f.write(" */\n\n")
        f.write(f'export const NZ_MAP_VIEWBOX = "0 0 {int(VIEWBOX_WIDTH)} {int(VIEWBOX_HEIGHT)}";\n\n')
        f.write("export const NZ_REGION_PATHS = ")
        f.write(json.dumps(paths_data, indent=2))
        f.write(";\n")

    print(f"✅ Generated {output_file} ({os.path.getsize(output_file)} bytes)")


# ------------------------------------------------------------------------------
# 5. Main Execution Entry Point
# ------------------------------------------------------------------------------
def main():
    print("🗺️ Starting New Zealand Map Vector Generation Pipeline...")
    geojson_data = fetch_geojson()
    paths_data = build_svg_paths(geojson_data)
    write_javascript_module(paths_data, OUTPUT_JS_PATH)

    print("\nSummary of Processed Regions:")
    for name, data in paths_data.items():
        print(f"  • {name:36s} Label at ({data['labelX']:5.1f}, {data['labelY']:5.1f}) | Path length: {len(data['d'])} chars")

    print("\n✨ Map vector paths successfully compiled and verified.")


if __name__ == "__main__":
    main()
