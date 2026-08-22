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
		self.assertIn("use_theme_palette", settings)
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

	def test_visual_panel_requires_photos(self):
		"""Left panel stays hidden until a slide has an image (or a video is set)."""
		from picasso.picasso.login_settings import _photo_slides, _should_show_visual

		class Row:
			def __init__(self, image="", title="", subtitle=""):
				self.image = image
				self.title = title
				self.subtitle = subtitle

		self.assertEqual(_photo_slides([Row("", "Title", "Copy")]), [])
		photos = _photo_slides([Row("/files/a.png", "Hi", "There"), Row("", "Skip", "")])
		self.assertEqual(len(photos), 1)
		self.assertEqual(photos[0]["image"], "/files/a.png")
		self.assertEqual(_should_show_visual(1, [], ""), 0)
		self.assertEqual(_should_show_visual(1, photos, ""), 1)
		self.assertEqual(_should_show_visual(0, photos, ""), 0)
		self.assertEqual(_should_show_visual(1, [], "/files/loop.mp4"), 1)

	def test_login_colors_follow_palette(self):
		"""Login colors are mapped from palette tokens for light and dark."""
		from picasso.picasso.login_settings import _apply_login_theme, _login_colors_from_palette

		desk = {
			"accent_color": "#0284C7",
			"page_background": "#F4F8FB",
			"list_card_background": "#FFFFFF",
			"page_head_text_color": "#0F3A4A",
			"page_head_separator_color": "#7AA8BE",
			"list_filter_background": "#F7FBFD",
			"list_border_color": "#D0E4EF",
			"dark_accent_color": "#38BDF8",
			"dark_page_background": "#0A1218",
			"dark_list_card_background": "#12202C",
			"dark_page_head_text_color": "#E0F2FE",
			"dark_page_head_separator_color": "#7AA8BE",
			"dark_list_filter_background": "#12202C",
			"dark_list_border_color": "#1E4970",
		}
		light = _login_colors_from_palette(desk, "light")
		self.assertEqual(light["page_background"], "#F4F8FB")
		self.assertEqual(light["form_background"], "#FFFFFF")
		self.assertEqual(light["accent_color"], "#0284C7")
		dark = _login_colors_from_palette(desk, "dark")
		self.assertEqual(dark["page_background"], "#0A1218")
		self.assertEqual(dark["accent_color"], "#38BDF8")

		settings = {}
		_apply_login_theme(settings, desk, None)
		self.assertEqual(settings["use_theme_palette"], 1)
		self.assertEqual(settings["page_background"], "#F4F8FB")
		self.assertEqual(settings["dark"]["page_background"], "#0A1218")

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
