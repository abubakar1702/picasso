# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe
from frappe.tests import IntegrationTestCase


class TestPicassoLoginSettings(IntegrationTestCase):
	def test_get_login_settings_returns_defaults_when_missing(self):
		"""Settings reader returns disabled defaults if no Picasso Login Settings doc exists."""
		frappe.cache.delete_value("picasso_login_settings")

		from picasso.picasso.login_settings import get_picasso_login_settings

		settings = get_picasso_login_settings()
		self.assertIsInstance(settings, dict)
		self.assertIn("enabled", settings)
		self.assertIn("accent_color", settings)
		self.assertIn("slides", settings)
		self.assertIsInstance(settings["slides"], list)

	def test_subheading_html_is_sanitized(self):
		"""subheading_html should be sanitized to strip script tags."""
		if not frappe.db.exists("DocType", "Picasso Login Settings"):
			self.skipTest("Picasso Login Settings not installed")

		frappe.cache.delete_value("picasso_login_settings")

		doc = frappe.get_doc("Picasso Login Settings")
		doc.subheading_html = '<p>Hello</p><script>alert("xss")</script>'
		doc.save(ignore_permissions=True)
		frappe.cache.delete_value("picasso_login_settings")

		from picasso.picasso.login_settings import get_picasso_login_settings

		settings = get_picasso_login_settings()
		self.assertNotIn("<script>", settings.get("subheading_html", ""))
		self.assertIn("Hello", settings.get("subheading_html", ""))

	def test_on_update_clears_cache(self):
		"""Saving login settings should invalidate the cache."""
		if not frappe.db.exists("DocType", "Picasso Login Settings"):
			self.skipTest("Picasso Login Settings not installed")

		from picasso.picasso.login_settings import get_picasso_login_settings

		# Warm the cache.
		get_picasso_login_settings()
		cached = frappe.cache.get_value("picasso_login_settings")
		self.assertIsNotNone(cached)

		# Trigger on_update.
		doc = frappe.get_doc("Picasso Login Settings")
		doc.save(ignore_permissions=True)

		# Cache should be cleared.
		self.assertIsNone(frappe.cache.get_value("picasso_login_settings"))
