"""
Unit Tests for Immigration NZ Green List & Sector Agreement Mappings (test_green_list.py)

Validates:
- Integrity of scripts/config/green_list_anzsco.json
- Accurate resolution of Tier 1 (Straight to Residence)
- Accurate resolution of Tier 2 (Work to Residence)
- Accurate resolution of Sector Agreements
- Verification of previously missing occupations (Teachers, Surgeons, Plumbers, Electricians)
"""

import os
import sys
import json
import unittest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CONFIG_PATH = os.path.join(BASE_DIR, "scripts", "config", "green_list_anzsco.json")


class TestGreenListMapping(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.assertTrue(os.path.exists(CONFIG_PATH), f"Config file not found at {CONFIG_PATH}")
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            cls.config = json.load(f)

    def test_schema_structure(self):
        """Ensure metadata, tier_definitions, and occupations exist in config."""
        self.assertIn("metadata", self.config)
        self.assertIn("tier_definitions", self.config)
        self.assertIn("occupations", self.config)
        self.assertGreater(len(self.config["occupations"]), 50)

    def test_tier_definitions(self):
        """Verify tier definition labels."""
        tiers = self.config["tier_definitions"]
        self.assertEqual(tiers["tier_1"]["label"], "Tier 1 (Straight to Residence)")
        self.assertEqual(tiers["tier_2"]["label"], "Tier 2 (Work to Residence)")
        self.assertEqual(tiers["sector_agreement"]["label"], "Sector Agreement (Work to Residence)")

    def test_vital_tier1_occupations(self):
        """Ensure critical occupations are correctly mapped to Tier 1."""
        occupations = self.config["occupations"]
        # Software Engineer (2613)
        self.assertEqual(occupations.get("2613", {}).get("tier"), "Tier 1 (Straight to Residence)")
        # Registered Nurse (2544)
        self.assertEqual(occupations.get("2544", {}).get("tier"), "Tier 1 (Straight to Residence)")
        # Primary School Teacher (2412) - previously missing
        self.assertEqual(occupations.get("2412", {}).get("tier"), "Tier 1 (Straight to Residence)")
        # Secondary School Teacher (2414) - previously missing
        self.assertEqual(occupations.get("2414", {}).get("tier"), "Tier 1 (Straight to Residence)")
        # Construction Manager (1331) - previously missing
        self.assertEqual(occupations.get("1331", {}).get("tier"), "Tier 1 (Straight to Residence)")
        # Surgeon (2535) - previously missing
        self.assertEqual(occupations.get("2535", {}).get("tier"), "Tier 1 (Straight to Residence)")
        # Civil Engineer (2332)
        self.assertEqual(occupations.get("2332", {}).get("tier"), "Tier 1 (Straight to Residence)")

    def test_vital_tier2_occupations(self):
        """Ensure critical trade occupations are correctly mapped to Tier 2."""
        occupations = self.config["occupations"]
        # Electrician (3411) - previously 0 matches
        self.assertEqual(occupations.get("3411", {}).get("tier"), "Tier 2 (Work to Residence)")
        # Plumber (3341) - previously 0 matches
        self.assertEqual(occupations.get("3341", {}).get("tier"), "Tier 2 (Work to Residence)")
        # Motor Mechanic (3212) - previously 0 matches
        self.assertEqual(occupations.get("3212", {}).get("tier"), "Tier 2 (Work to Residence)")
        # Carpenter (3312) - previously missing
        self.assertEqual(occupations.get("3312", {}).get("tier"), "Tier 2 (Work to Residence)")
        # Dairy Cattle Farmer (1213)
        self.assertEqual(occupations.get("1213", {}).get("tier"), "Tier 2 (Work to Residence)")

    def test_sector_agreement_occupations(self):
        """Ensure care and transport sector roles are mapped."""
        occupations = self.config["occupations"]
        # Aged and Disabled Carers (4231)
        self.assertEqual(occupations.get("4231", {}).get("tier"), "Sector Agreement (Work to Residence)")
        # Bus and Coach Drivers (7312)
        self.assertEqual(occupations.get("7312", {}).get("tier"), "Sector Agreement (Work to Residence)")

    def test_unlisted_occupation(self):
        """Ensure standard occupations do not get misclassified."""
        occupations = self.config["occupations"]
        # 5311: General Clerks
        self.assertNotIn("5311", occupations)
        # 6211: Sales Assistants
        self.assertNotIn("6211", occupations)


if __name__ == "__main__":
    unittest.main()
