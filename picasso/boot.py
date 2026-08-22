# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

from urllib.parse import quote

from picasso.appearance import get_studio
from picasso.picasso.desk_settings import get_picasso_desk_settings


def _encode_file_url(url: str) -> str:
	"""Encode spaces and unsafe chars in private/public file paths."""
	if not url:
		return url
	if "://" in url:
		return url
	parts = url.split("/")
	return "/".join(quote(part, safe="") if i == len(parts) - 1 else part for i, part in enumerate(parts))


def extend_bootinfo(bootinfo):
	desk = get_picasso_desk_settings()
	if desk.get("app_logo"):
		desk = dict(desk)
		desk["app_logo"] = _encode_file_url(desk["app_logo"])
	bootinfo["picasso_desk"] = desk
	bootinfo["picasso_studio"] = get_studio()

	logo = desk.get("app_logo") if desk.get("enabled") else ""
	if not logo:
		return

	# Default fallback used by sidebar header when no desktop-icon logo exists.
	app_data = bootinfo.get("app_data") or []
	for app in app_data:
		app["app_logo_url"] = logo

	navbar = bootinfo.get("navbar_settings")
	if navbar:
		try:
			navbar.app_logo = logo
		except Exception:
			if isinstance(navbar, dict):
				navbar["app_logo"] = logo
