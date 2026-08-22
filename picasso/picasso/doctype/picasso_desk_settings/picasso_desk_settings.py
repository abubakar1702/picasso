# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe
from frappe.model.document import Document


class PicassoDeskSettings(Document):
	def onload(self):
		self.set_default_colors()

	def validate(self):
		self.set_default_colors()

	def set_default_colors(self):
		defaults = {
			"accent_color": "#2563EB",
			"navbar_color_start": "#FFFFFF",
			"navbar_color_end": "#FFFFFF",
			"sidebar_color_start": "#F8F9FA",
			"sidebar_color_end": "#F8F9FA",
			"navbar_text_color": "#1F2937",
			"sidebar_text_color": "#1F2937",
			"page_background": "#F4F5F8",
			"page_head_background": "#FFFFFF",
			"page_head_text_color": "#1F2937",
			"page_head_separator_color": "#C4B5A0",
			"list_card_background": "#FFFFFF",
			"list_filter_background": "#FFFFFF",
			"list_header_background": "#F3F4F6",
			"list_row_hover_background": "#F3F4F6",
			"list_border_color": "#E5E7EB",
			"dark_accent_color": "#2563EB",
			"dark_navbar_color_start": "#13151C",
			"dark_navbar_color_end": "#13151C",
			"dark_sidebar_color_start": "#13151C",
			"dark_sidebar_color_end": "#13151C",
			"dark_navbar_text_color": "#E5E7EB",
			"dark_sidebar_text_color": "#E5E7EB",
			"dark_page_background": "#0F1117",
			"dark_page_head_background": "#1A1C24",
			"dark_page_head_text_color": "#E5E7EB",
			"dark_page_head_separator_color": "#9CA3AF",
			"dark_list_card_background": "#1A1C24",
			"dark_list_filter_background": "#1A1C24",
			"dark_list_header_background": "#22252E",
			"dark_list_row_hover_background": "#2A2D38",
			"dark_list_border_color": "#2A2D38",
		}
		for field, default_val in defaults.items():
			if not self.get(field):
				self.set(field, default_val)

	def on_update(self):
		self.sync_navbar_logo()
		self.sync_favicon()
		frappe.cache.delete_value("picasso_desk_settings")
		frappe.cache.delete_value("picasso_login_settings")
		# Invalidate boot session cache so all users pick up the new theme on next load.
		frappe.cache.delete_keys("bootinfo")

	def sync_navbar_logo(self):
		"""Lego Core pattern: persist logo on Navbar Settings so Frappe boot picks it up."""
		if not self.enabled or not self.app_logo:
			return

		navbar = frappe.get_single("Navbar Settings")
		if navbar.app_logo != self.app_logo:
			navbar.db_set("app_logo", self.app_logo, update_modified=False)

		if frappe.db.exists("DocType", "Website Settings"):
			current = frappe.db.get_single_value("Website Settings", "app_logo")
			if current != self.app_logo:
				frappe.db.set_single_value("Website Settings", "app_logo", self.app_logo)

	def sync_favicon(self):
		"""Sync favicon to Website Settings so it's used across the site."""
		if not self.enabled or not self.favicon:
			return

		if frappe.db.exists("DocType", "Website Settings"):
			current = frappe.db.get_single_value("Website Settings", "favicon")
			if current != self.favicon:
				frappe.db.set_single_value("Website Settings", "favicon", self.favicon)
