# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe
from frappe.utils import cint

from picasso.palette import DEFAULT_COLORS, get_palette_colors


def get_picasso_desk_settings() -> dict:
	cache_key = "picasso_desk_settings"
	cached = frappe.cache.get_value(cache_key)
	if cached is not None:
		return cached

	if not frappe.db.exists("DocType", "Picasso Desk Settings"):
		return _defaults(enabled=True)

	try:
		doc = frappe.get_doc("Picasso Desk Settings")
	except frappe.DoesNotExistError:
		return _defaults(enabled=True)

	palette_name = doc.get("palette") or "Paper"
	raw_enabled = doc.get("enabled")
	enabled = 1 if raw_enabled in (None, "") else cint(raw_enabled)
	settings = {
		"enabled": enabled,
		"redirect_link_workspaces": cint(doc.redirect_link_workspaces),
		"enable_hide_form_actions": 1
		if doc.enable_hide_form_actions is None or doc.enable_hide_form_actions == ""
		else cint(doc.enable_hide_form_actions),
		"show_left_sidebar": 1
		if doc.show_left_sidebar is None or doc.show_left_sidebar == ""
		else cint(doc.show_left_sidebar),
		"show_full_number_in_number_card": cint(doc.show_full_number_in_number_card),
		"show_language_switch": cint(doc.show_language_switch),
		"language_a": doc.language_a or "en",
		"language_a_label": doc.language_a_label or "EN",
		"language_b": doc.language_b or "bn",
		"language_b_label": doc.language_b_label or "বাং",
		"palette": palette_name,
		"enhance_list_ui": 1
		if doc.enhance_list_ui is None or doc.enhance_list_ui == ""
		else cint(doc.enhance_list_ui),
		"surface_radius": cint(doc.surface_radius) or 8,
		"sidebar_width": cint(doc.sidebar_width) or 240,
		"custom_css": doc.custom_css or "",
	}
	settings.update(get_palette_colors(palette_name))
	frappe.cache.set_value(cache_key, settings)
	return settings


def _defaults(enabled: bool = True) -> dict:
	return {
		"enabled": int(enabled),
		"redirect_link_workspaces": 1,
		"enable_hide_form_actions": 1,
		"show_left_sidebar": 1,
		"show_full_number_in_number_card": 0,
		"show_language_switch": 0,
		"language_a": "en",
		"language_a_label": "EN",
		"language_b": "bn",
		"language_b_label": "বাং",
		"palette": "Paper",
		"enhance_list_ui": 1,
		"surface_radius": 8,
		"sidebar_width": 240,
		"custom_css": "",
		**DEFAULT_COLORS,
	}
