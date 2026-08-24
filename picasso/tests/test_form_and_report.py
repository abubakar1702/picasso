# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe
from frappe.tests import IntegrationTestCase


class TestQueryReport(IntegrationTestCase):
	"""Tests for picasso.query_report — get_script."""

	def test_get_script_falls_through_to_frappe(self):
		"""get_script should return at minimum the stock Frappe response."""
		if not frappe.db.exists("Report", "Permitted Documents For User"):
			self.skipTest("No stock report to test against")

		from picasso.query_report import get_script

		result = get_script(report_name="Permitted Documents For User")
		self.assertIsInstance(result, dict)
		# Frappe's get_script always returns 'script' key.
		self.assertIn("script", result)
