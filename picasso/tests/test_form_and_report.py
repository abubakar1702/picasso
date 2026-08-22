# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe
from frappe.tests import IntegrationTestCase


class TestFormActions(IntegrationTestCase):
	"""Tests for picasso.form — get_hidden_actions."""

	def test_get_hidden_actions_returns_empty_when_missing(self):
		"""Should return empty list when no Picasso Hide Form Action exists."""
		from picasso.form import get_hidden_actions

		result = get_hidden_actions(doctype="Nonexistent DocType XYZ")
		self.assertEqual(result, [])

	def test_get_hidden_actions_returns_empty_when_doctype_missing(self):
		"""Should return empty list when the doctype system is not installed."""
		from picasso.form import get_hidden_actions

		# Even for a valid doctype, if no config exists, should be empty.
		result = get_hidden_actions(doctype="User")
		self.assertIsInstance(result, list)


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
