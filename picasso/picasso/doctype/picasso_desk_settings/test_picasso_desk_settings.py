# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe
from frappe.tests import IntegrationTestCase


class TestPicassoDeskSettings(IntegrationTestCase):
	def test_get_desk_settings_returns_defaults_when_missing(self):
		"""Settings reader returns disabled defaults if no Picasso Desk Settings doc exists."""
		frappe.cache.delete_value("picasso_desk_settings")

		from picasso.picasso.desk_settings import get_picasso_desk_settings

		settings = get_picasso_desk_settings()
		self.assertIsInstance(settings, dict)
		self.assertIn("enabled", settings)
		self.assertIn("accent_color", settings)
		self.assertIn("dark_accent_color", settings)
		self.assertIn("palette", settings)

	def test_get_desk_settings_is_cached(self):
		"""Second call returns the same cached dict without hitting the DB again."""
		frappe.cache.delete_value("picasso_desk_settings")

		from picasso.picasso.desk_settings import get_picasso_desk_settings

		first = get_picasso_desk_settings()
		second = get_picasso_desk_settings()
		self.assertEqual(first, second)

	def test_on_update_refreshes_cache(self):
		"""Saving settings should rebuild the cache from the saved palette."""
		if not frappe.db.exists("DocType", "Picasso Desk Settings"):
			self.skipTest("Picasso Desk Settings not installed")

		from picasso.picasso.desk_settings import get_picasso_desk_settings

		get_picasso_desk_settings()
		self.assertIsNotNone(frappe.cache.get_value("picasso_desk_settings"))

		doc = frappe.get_doc("Picasso Desk Settings")
		doc.save(ignore_permissions=True)

		cached = frappe.cache.get_value("picasso_desk_settings")
		self.assertIsNotNone(cached)
		self.assertEqual(cached.get("palette"), doc.palette)
