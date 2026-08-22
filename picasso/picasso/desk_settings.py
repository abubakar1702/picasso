# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe
from frappe.utils import cint


def get_picasso_desk_settings() -> dict:
	cache_key = "picasso_desk_settings"
	cached = frappe.cache.get_value(cache_key)
	if cached is not None:
		return cached

	if not frappe.db.exists("DocType", "Picasso Desk Settings"):
		return _defaults(enabled=False)

	try:
		doc = frappe.get_doc("Picasso Desk Settings")
	except frappe.DoesNotExistError:
		return _defaults(enabled=False)

	settings = {
		"enabled": cint(doc.enabled),
		"redirect_link_workspaces": cint(doc.redirect_link_workspaces),
		"enable_hide_form_actions": 1 if doc.enable_hide_form_actions is None or doc.enable_hide_form_actions == "" else cint(doc.enable_hide_form_actions),
		"show_left_sidebar": 1 if doc.show_left_sidebar is None or doc.show_left_sidebar == "" else cint(doc.show_left_sidebar),
		"show_full_number_in_number_card": cint(doc.show_full_number_in_number_card),
		"app_logo": doc.app_logo or "",
		"favicon": doc.favicon or "",
		"show_language_switch": cint(doc.show_language_switch),
		"language_a": doc.language_a or "en",
		"language_a_label": doc.language_a_label or "EN",
		"language_b": doc.language_b or "bn",
		"language_b_label": doc.language_b_label or "বাং",
		"accent_color": doc.accent_color or "#2563eb",
		"navbar_color_start": doc.navbar_color_start or "#FFFFFF",
		"navbar_color_end": doc.navbar_color_end or "#FFFFFF",
		"sidebar_color_start": doc.sidebar_color_start or "#F8F9FA",
		"sidebar_color_end": doc.sidebar_color_end or "#F8F9FA",
		"navbar_text_color": doc.navbar_text_color or "#1F2937",
		"sidebar_text_color": doc.sidebar_text_color or "#1F2937",
		"page_background": doc.page_background or "#F4F5F8",
		"page_head_background": doc.page_head_background or "#FFFFFF",
		"page_head_text_color": doc.page_head_text_color or "#1F2937",
		"page_head_separator_color": doc.get("page_head_separator_color") or "#C4B5A0",
		"enhance_list_ui": 1 if doc.enhance_list_ui is None or doc.enhance_list_ui == "" else cint(doc.enhance_list_ui),
		"list_card_background": doc.list_card_background or "#FFFFFF",
		"list_filter_background": doc.list_filter_background or "#FFFFFF",
		"list_header_background": doc.list_header_background or "#F3F4F6",
		"list_row_hover_background": doc.list_row_hover_background or "#F3F4F6",
		"list_border_color": doc.list_border_color or "#E5E7EB",
		"surface_radius": cint(doc.surface_radius) or 8,
		"sidebar_width": cint(doc.sidebar_width) or 240,
		"dark_accent_color": doc.dark_accent_color or "#2563EB",
		"dark_navbar_color_start": doc.dark_navbar_color_start or "#13151C",
		"dark_navbar_color_end": doc.dark_navbar_color_end or "#13151C",
		"dark_sidebar_color_start": doc.dark_sidebar_color_start or "#13151C",
		"dark_sidebar_color_end": doc.dark_sidebar_color_end or "#13151C",
		"dark_navbar_text_color": doc.dark_navbar_text_color or "#E5E7EB",
		"dark_sidebar_text_color": doc.dark_sidebar_text_color or "#E5E7EB",
		"dark_page_background": doc.dark_page_background or "#0F1117",
		"dark_page_head_background": doc.dark_page_head_background or "#1A1C24",
		"dark_page_head_text_color": doc.dark_page_head_text_color or "#E5E7EB",
		"dark_page_head_separator_color": doc.get("dark_page_head_separator_color") or "#9CA3AF",
		"dark_list_card_background": doc.dark_list_card_background or "#1A1C24",
		"dark_list_filter_background": doc.dark_list_filter_background or "#1A1C24",
		"dark_list_header_background": doc.dark_list_header_background or "#22252E",
		"dark_list_row_hover_background": doc.dark_list_row_hover_background or "#2A2D38",
		"dark_list_border_color": doc.dark_list_border_color or "#2A2D38",
		"custom_css": doc.custom_css or "",
	}
	frappe.cache.set_value(cache_key, settings)
	return settings


def _defaults(enabled: bool = True) -> dict:
	return {
		"enabled": int(enabled),
		"redirect_link_workspaces": 1,
		"enable_hide_form_actions": 1,
		"show_left_sidebar": 1,
		"show_full_number_in_number_card": 0,
		"app_logo": "",
		"favicon": "",
		"show_language_switch": 0,
		"language_a": "en",
		"language_a_label": "EN",
		"language_b": "bn",
		"language_b_label": "বাং",
		"accent_color": "#2563eb",
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
		"enhance_list_ui": 1,
		"list_card_background": "#FFFFFF",
		"list_filter_background": "#FFFFFF",
		"list_header_background": "#F3F4F6",
		"list_row_hover_background": "#F3F4F6",
		"list_border_color": "#E5E7EB",
		"surface_radius": 8,
		"sidebar_width": 240,
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
		"custom_css": "",
	}
