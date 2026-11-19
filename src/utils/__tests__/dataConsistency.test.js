import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeNationalSummary } from '../mapHelpers.js';
import { NZ_REGION_PATHS } from '../../data/nzRegionsPaths.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const regionalPath = path.resolve(__dirname, '../../../public/data/regional_summary.json');
const regionalData = JSON.parse(fs.readFileSync(regionalPath, 'utf-8'));

describe('Dashboard cross-view consistency tests', () => {
  it('map national summary median matches KPI metadata national_median_weekly and formatted display string', () => {
    const kpiNationalWeekly = regionalData?.metadata?.national_median_weekly || 1380;
    const kpiFormatted = `$${kpiNationalWeekly.toLocaleString()} / wk`;

    const summary = computeNationalSummary(
      regionalData.regions,
      'vacancies_per_100k',
      regionalData.metadata
    );
    const mapFormatted = `$${Math.round(summary.nationalMedianWeekly).toLocaleString()} / wk`;

    assert.equal(Math.round(summary.nationalMedianWeekly), Math.round(kpiNationalWeekly));
    assert.equal(mapFormatted, kpiFormatted);
  });

  it('every region in regional_summary.json has an SVG path in NZ_REGION_PATHS', () => {
    for (const region of regionalData.regions) {
      assert.ok(
        NZ_REGION_PATHS[region.region_name]?.d,
        `Missing SVG path for ${region.region_name}`
      );
    }
  });
});
