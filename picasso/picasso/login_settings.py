# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import re
from urllib.parse import quote, urlsplit

import frappe
from frappe.utils import cint, sanitize_html

from picasso.palette import DEFAULT_COLORS, blend, ink_on
from picasso.picasso.desk_settings import get_picasso_desk_settings

# Bump when the cached shape or sanitization changes so stale values are rebuilt.
CACHE_VERSION = 4
SAFE_URL_SCHEMES = ("", "http", "https", "mailto", "tel")
CSS_COLOR = re.compile(r"#[0-9a-f]{3,8}|(?:rgb|hsl)a?\([\d\s.,%/]+\)", re.IGNORECASE)


def safe_url(value) -> str:
	"""Return a URL safe for href/src attributes and CSS url(''), or an empty string."""
	# Browsers ignore control characters, so "java\tscript:" must not slip through.
	url = re.sub(r"[\x00-\x1f\x7f]", "", value or "").strip()
	try:
		scheme = urlsplit(url).scheme
	except ValueError:
		return ""
	if scheme.lower() not in SAFE_URL_SCHEMES:
		return ""
	return quote(url, safe="/:?#[]@!$&*+,;=%~")


def safe_color(value) -> str:
	"""Return a plain CSS color, or an empty string so the template default applies."""
	color = (value or "").strip()
	return color if CSS_COLOR.fullmatch(color) else ""


def get_picasso_login_settings() -> dict:
	"""Return Picasso Login Settings as a plain dict (cached)."""
	cache_key = "picasso_login_settings"
	cached = frappe.cache.get_value(cache_key)
	if cached is not None and cached.get("cache_version") != CACHE_VERSION:
		cached = None
	if cached is not None:
		return cached

	if not frappe.db.exists("DocType", "Picasso Login Settings"):
		return _default_settings(enabled=True)

	try:
		doc = frappe.get_doc("Picasso Login Settings")
	except frappe.DoesNotExistError:
		return _default_settings(enabled=True)

	slides = _photo_slides(doc.get("slides"))

	links = [
		{
			"label": row.label,
			"url": safe_url(row.url),
			"icon": safe_url(row.icon),
			"placement": row.placement or "form_footer",
		}
		for row in (doc.get("links") or [])
	]

	desk = get_picasso_desk_settings()

	# Sanitize HTML fields to prevent stored XSS on the public login page.
	raw_subheading = doc.subheading_html or ""
	safe_subheading = sanitize_html(raw_subheading, always_sanitize=True) if raw_subheading else ""

	show_visual_panel = cint(doc.show_visual_panel)
	visual_video = safe_url(doc.visual_video)
	raw_enabled = doc.get("enabled")
	enabled = 1 if raw_enabled in (None, "") else cint(raw_enabled)
	settings = {
		"cache_version": CACHE_VERSION,
		"enabled": enabled,
		"show_visual_panel": show_visual_panel,
		"has_visual": _should_show_visual(show_visual_panel, slides, visual_video),
		"show_login_with_email_link": cint(doc.show_login_with_email_link),
		"show_social_logins": 1
		if doc.get("show_social_logins") in (None, "")
		else cint(doc.show_social_logins),
		"carousel_interval": cint(doc.carousel_interval or 5),
		"visual_video": visual_video,
		"logo": safe_url(doc.logo),
		"visual_logo": safe_url(doc.visual_logo),
		"heading": doc.heading or "Log in",
		"subheading_html": safe_subheading,
		"back_to_website_url": safe_url(doc.back_to_website_url),
		"back_to_website_label": doc.back_to_website_label or "Back to website",
		"copyright_text": doc.copyright_text or "",
		"copyright_url": safe_url(doc.copyright_url),
		"copyright_url_label": doc.copyright_url_label or "",
		"slides": slides,
		"links": links,
		"show_language_switch": desk.get("show_language_switch"),
		"language_a": desk.get("language_a") or "en",
		"language_a_label": desk.get("language_a_label") or "EN",
		"language_b": desk.get("language_b") or "bn",
		"language_b_label": desk.get("language_b_label") or "বাং",
	}
	_apply_login_theme(settings, desk, doc)

	frappe.cache.set_value(cache_key, settings)
	return settings


def _photo_slides(rows) -> list:
	"""Return carousel slides that actually have an image attached."""
	out = []
	for row in rows or []:
		image = safe_url(row.image)
		if not image:
			continue
		out.append(
			{
				"image": image,
				"title": row.title or "",
				"subtitle": row.subtitle or "",
			}
		)
	return out


def _should_show_visual(show_visual_panel, slides, visual_video) -> int:
	"""Left panel only when enabled and at least one photo (or a video) exists."""
	if not cint(show_visual_panel):
		return 0
	if slides or (visual_video or "").strip():
		return 1
	return 0


def _login_colors_from_palette(desk: dict | None, mode: str = "light") -> dict:
	"""Map Desk palette tokens onto the login CSS color slots."""
	desk = desk or {}
	prefix = "dark_" if mode == "dark" else ""

	def token(*names: str) -> str:
		for name in names:
			key = f"{prefix}{name}" if prefix else name
			value = (desk.get(key) or DEFAULT_COLORS.get(key) or "").strip()
			if value:
				return value
			if prefix:
				# Fall back to the light token if a dark value is missing.
				value = (desk.get(name) or DEFAULT_COLORS.get(name) or "").strip()
				if value:
					return value
		return ""

	text = token("page_head_text_color", "navbar_text_color")
	form = token("list_card_background", "page_head_background")
	# Separator colors are decorative and too faint for text; derive muted ink instead.
	muted = blend(text, form)
	return {
		"page_background": token("page_background"),
		"form_background": form,
		"accent_color": token("accent_color"),
		"text_color": text,
		"muted_text_color": muted,
		"input_background": token("list_filter_background", "list_card_background"),
		"input_border_color": token("list_border_color"),
		"copyright_text_color": muted,
	}


def _apply_login_theme(settings: dict, desk: dict | None, doc=None) -> None:
	"""Fill login colors from the active palette unless custom colors are requested."""
	raw = None if doc is None else doc.get("use_theme_palette")
	use_theme_palette = 1 if raw in (None, "") else cint(raw)
	light = _login_colors_from_palette(desk, "light")
	dark = _login_colors_from_palette(desk, "dark")
	if use_theme_palette:
		colors = light
	else:
		colors = {
			"page_background": (doc and doc.get("page_background")) or light["page_background"],
			"form_background": (doc and doc.get("form_background")) or light["form_background"],
			"accent_color": (doc and doc.get("accent_color")) or light["accent_color"],
			"text_color": (doc and doc.get("text_color")) or light["text_color"],
			"muted_text_color": (doc and doc.get("muted_text_color")) or light["muted_text_color"],
			"input_background": (doc and doc.get("input_background")) or light["input_background"],
			"input_border_color": (doc and doc.get("input_border_color")) or light["input_border_color"],
			"copyright_text_color": (doc and doc.get("copyright_text_color"))
			or light["copyright_text_color"],
		}
		dark = None
	colors["on_accent_color"] = ink_on(colors["accent_color"])
	if dark:
		dark["on_accent_color"] = ink_on(dark["accent_color"])
	settings.update({key: safe_color(value) for key, value in colors.items()})
	settings["use_theme_palette"] = use_theme_palette
	settings["dark"] = {key: safe_color(value) for key, value in dark.items()} if dark else None


def _default_settings(enabled: bool = True) -> dict:
	settings = {
		"enabled": int(enabled),
		"show_visual_panel": 1,
		"has_visual": 0,
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
		"copyright_text": "",
		"copyright_url": "",
		"copyright_url_label": "",
		"slides": [],
		"links": [],
		"show_language_switch": 0,
		"language_a": "en",
		"language_a_label": "EN",
		"language_b": "bn",
		"language_b_label": "বাং",
	}
	try:
		desk = get_picasso_desk_settings()
	except Exception:
		desk = {}
	_apply_login_theme(settings, desk, None)
	return settings
