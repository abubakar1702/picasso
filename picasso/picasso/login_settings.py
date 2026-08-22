# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe
from frappe.utils import cint, sanitize_html

from picasso.picasso.desk_settings import get_picasso_desk_settings


def get_picasso_login_settings() -> dict:
	"""Return Picasso Login Settings as a plain dict (cached)."""
	cache_key = "picasso_login_settings"
	cached = frappe.cache.get_value(cache_key)
	if cached is not None:
		return cached

	if not frappe.db.exists("DocType", "Picasso Login Settings"):
		return _default_settings(enabled=False)

	try:
		doc = frappe.get_doc("Picasso Login Settings")
	except frappe.DoesNotExistError:
		return _default_settings(enabled=False)

	slides = [
		{"image": row.image, "title": row.title, "subtitle": row.subtitle}
		for row in (doc.get("slides") or [])
	]

	links = [
		{
			"label": row.label,
			"url": row.url,
			"icon": row.icon,
			"placement": row.placement or "form_footer",
		}
		for row in (doc.get("links") or [])
	]

	desk = get_picasso_desk_settings()

	# Sanitize HTML fields to prevent stored XSS on the public login page.
	raw_subheading = doc.subheading_html or ""
	safe_subheading = sanitize_html(raw_subheading) if raw_subheading else ""

	settings = {
		"enabled": cint(doc.enabled),
		"show_visual_panel": cint(doc.show_visual_panel),
		"show_login_with_email_link": cint(doc.show_login_with_email_link),
		"show_social_logins": cint(doc.show_social_logins or 1),
		"carousel_interval": cint(doc.carousel_interval or 5),
		"visual_video": doc.visual_video or "",
		"logo": doc.logo,
		"visual_logo": doc.visual_logo,
		"heading": doc.heading or "Log in",
		"subheading_html": safe_subheading,
		"back_to_website_url": doc.back_to_website_url or "",
		"back_to_website_label": doc.back_to_website_label or "Back to website",
		"page_background": doc.page_background or "#0B0B12",
		"form_background": doc.form_background or "#16161F",
		"accent_color": doc.accent_color or "#7C3AED",
		"text_color": doc.text_color or "#FFFFFF",
		"muted_text_color": doc.muted_text_color or "#A1A1AA",
		"input_background": doc.input_background or "#1F1F2B",
		"input_border_color": doc.input_border_color or "#2E2E3A",
		"copyright_text": doc.copyright_text or "",
		"copyright_url": doc.copyright_url or "",
		"copyright_url_label": doc.copyright_url_label or "",
		"copyright_text_color": doc.copyright_text_color or "#A1A1AA",
		"slides": slides,
		"links": links,
		"show_language_switch": desk.get("show_language_switch"),
		"language_a": desk.get("language_a") or "en",
		"language_a_label": desk.get("language_a_label") or "EN",
		"language_b": desk.get("language_b") or "bn",
		"language_b_label": desk.get("language_b_label") or "বাং",
	}

	frappe.cache.set_value(cache_key, settings)
	return settings


def _default_settings(enabled: bool = True) -> dict:
	return {
		"enabled": int(enabled),
		"show_visual_panel": 1,
		"show_login_with_email_link": 0,
		"show_social_logins": 1,
		"carousel_interval": 5,
		"visual_video": "",
		"logo": None,
		"visual_logo": None,
		"heading": "Log in",
		"subheading_html": "",
		"back_to_website_url": "",
		"back_to_website_label": "Back to website",
		"page_background": "#0B0B12",
		"form_background": "#16161F",
		"accent_color": "#7C3AED",
		"text_color": "#FFFFFF",
		"muted_text_color": "#A1A1AA",
		"input_background": "#1F1F2B",
		"input_border_color": "#2E2E3A",
		"copyright_text": "",
		"copyright_url": "",
		"copyright_url_label": "",
		"copyright_text_color": "#A1A1AA",
		"slides": [],
		"links": [],
		"show_language_switch": 0,
		"language_a": "en",
		"language_a_label": "EN",
		"language_b": "bn",
		"language_b_label": "বাং",
	}
