"""
Unit Tests for Stats NZ Auto-Collection Pipeline (test_auto_collect.py)

Verifies:
1. Parsing of transposed Stats NZ CSV tables with both Unix (\n) and Windows (\r\n) line breaks.
2. Prevention of duplicate quarter insertions (idempotency).
3. Trailing newline safety (preventing row concatenation bugs).
4. Validation against column count mismatches and malformed headings.
"""

import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from scripts.auto_collect_data import update_csv_from_transposed


class TestAutoCollect(unittest.TestCase):

    def setUp(self):
        # Create a temporary directory and temporary CSV file for testing
        self.test_dir = tempfile.TemporaryDirectory()
        self.csv_path = os.path.join(self.test_dir.name, "test_unemployment.csv")
        with open(self.csv_path, "w", encoding="utf-8", newline="\n") as f:
            f.write('"Quarter","Men","Women","Total"\n')
            f.write('"Jun-26",5.7,5.5,5.6\n')

    def tearDown(self):
        self.test_dir.cleanup()

    def test_update_with_unix_newlines(self):
        """Tests that Stats NZ CSV delimited by \\n is parsed cleanly."""
        transposed_data = (
            "Quarter,Jun-26,Sept-26\n"
            "Men,5.7,5.6\n"
            "Women,5.5,5.7\n"
            "Total,5.6,5.7\n"
        )
        updated = update_csv_from_transposed(transposed_data, self.csv_path, "Unemployment")
        self.assertTrue(updated)

        with open(self.csv_path, "r", encoding="utf-8") as f:
            lines = [l.strip() for l in f if l.strip()]

        self.assertEqual(len(lines), 3)
        self.assertEqual(lines[-1], '"Sept-26",5.6,5.7,5.7')

    def test_update_with_windows_crlf(self):
        """Tests that Stats NZ CSV delimited by \\r\\n is parsed cleanly."""
        transposed_data = (
            "Quarter,Jun-26,Sept-26\r\n"
            "Men,5.7,5.6\r\n"
            "Women,5.5,5.7\r\n"
            "Total,5.6,5.7\r\n"
        )
        updated = update_csv_from_transposed(transposed_data, self.csv_path, "Unemployment")
        self.assertTrue(updated)

        with open(self.csv_path, "r", encoding="utf-8") as f:
            lines = [l.strip() for l in f if l.strip()]

        self.assertEqual(len(lines), 3)
        self.assertEqual(lines[-1], '"Sept-26",5.6,5.7,5.7')

    def test_idempotent_duplicate_prevention(self):
        """Tests that running the collection twice does not insert duplicate rows."""
        transposed_data = (
            "Quarter,Jun-26,Sept-26\n"
            "Men,5.7,5.6\n"
            "Women,5.5,5.7\n"
            "Total,5.6,5.7\n"
        )
        # First execution appends Sept-26
        first_run = update_csv_from_transposed(transposed_data, self.csv_path, "Unemployment")
        self.assertTrue(first_run)

        # Second execution detects Sept-26 already exists
        second_run = update_csv_from_transposed(transposed_data, self.csv_path, "Unemployment")
        self.assertFalse(second_run)

        with open(self.csv_path, "r", encoding="utf-8") as f:
            lines = [l.strip() for l in f if l.strip()]

        self.assertEqual(len(lines), 3)

    def test_trailing_newline_concatenation_safety(self):
        """Tests that a file lacking a trailing newline is not corrupted by row concatenation."""
        # Overwrite file WITHOUT trailing newline
        with open(self.csv_path, "w", encoding="utf-8") as f:
            f.write('"Quarter","Men","Women","Total"\n"Jun-26",5.7,5.5,5.6')

        transposed_data = (
            "Quarter,Jun-26,Sept-26\n"
            "Men,5.7,5.6\n"
            "Women,5.5,5.7\n"
            "Total,5.6,5.7\n"
        )
        updated = update_csv_from_transposed(transposed_data, self.csv_path, "Unemployment")
        self.assertTrue(updated)

        with open(self.csv_path, "r", encoding="utf-8") as f:
            lines = [l.strip() for l in f if l.strip()]

        # Should be exactly 3 distinct rows without corrupt concatenated lines
        self.assertEqual(len(lines), 3)
        self.assertEqual(lines[1], '"Jun-26",5.7,5.5,5.6')
        self.assertEqual(lines[2], '"Sept-26",5.6,5.7,5.7')

    def test_column_mismatch_rejection(self):
        """Tests that transposed CSV with uneven columns is safely skipped."""
        transposed_data = (
            "Quarter,Jun-26,Sept-26\n"
            "Men,5.7\n"  # missing Sept-26 value
            "Women,5.5,5.7\n"
            "Total,5.6,5.7\n"
        )
        updated = update_csv_from_transposed(transposed_data, self.csv_path, "Unemployment")
        self.assertFalse(updated)


if __name__ == '__main__':
    unittest.main()
