# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe
from frappe.tests import IntegrationTestCase
from frappe.utils import cint


class TestPicassoAppScreen(IntegrationTestCase):
	def setUp(self):
		if not frappe.db.exists("DocType", "Picasso App Screen"):
			self.skipTest("Picasso App Screen not installed")

	def test_validate_rejects_uninstalled_app(self):
		"""Saving an App Screen for a non-installed app should throw."""
		doc = frappe.get_doc(
			{
				"doctype": "Picasso App Screen",
				"app": "nonexistent_app_xyzzy",
				"title": "Test",
			}
		)
		self.assertRaises(frappe.ValidationError, doc.insert, ignore_permissions=True)

	def test_get_configured_apps_excludes_hidden(self):
		"""Hidden app screens should not appear in the configured apps list."""
		from picasso.apps import get_configured_apps

		# Create a visible and a hidden screen.
		for name in ("frappe", "picasso"):
			if frappe.db.exists("Picasso App Screen", name):
				frappe.delete_doc("Picasso App Screen", name, force=True)

		if "frappe" in frappe.get_installed_apps():
			frappe.get_doc(
				{
					"doctype": "Picasso App Screen",
					"app": "frappe",
					"title": "Frappe Visible",
					"hidden": 0,
					"sort_order": 1,
				}
			).insert(ignore_permissions=True)

			frappe.get_doc(
				{
					"doctype": "Picasso App Screen",
					"app": "frappe",
					"title": "Frappe Hidden",
					"hidden": 1,
					"sort_order": 2,
				}
			).insert(ignore_permissions=True)

			apps = get_configured_apps(ignore_permission=True)
			app_titles = [a["title"] for a in apps]
			self.assertIn("Frappe Visible", app_titles)
			self.assertNotIn("Frappe Hidden", app_titles)

	def tearDown(self):
		# Clean up test data.
		for name in frappe.get_all("Picasso App Screen", pluck="name"):
			if name in ("nonexistent_app_xyzzy",):
				frappe.delete_doc("Picasso App Screen", name, force=True)
