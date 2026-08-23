# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import json
from typing import Any

import frappe
from frappe import _
from frappe.utils import cstr



STUDIO_KEY = "picasso_studio"
FEATURE_KEYS = (
	"page_transitions",
	"progress_bar",
	"ripple",
	"reveal",
	"tilt",
	"counters",
	"condensed_header",
	"back_to_top",
	"toast_timers",
	"save_pulse",
	"palette",
	"charts",
	"cards",
	"app_icons",
	"dock_autohide",
	"gradients",
	"signin_entrance",
)
DENSITIES = ("compact", "cozy", "roomy")
TOAST_POS = (
	"top-left",
	"top-center",
	"top-right",
	"bottom-left",
	"bottom-center",
	"bottom-right",
)
DOCK_CORNERS = ("br", "bl", "tr", "tl")


def default_studio() -> dict:
	return {
		"density": "cozy",
		"motion": "on",
		"accent": "",
		"palette": "",
		"toast_position": "bottom-right",
		"dock_corner": "br",
		"features": {key: True for key in FEATURE_KEYS},
	}


def _clean_studio(raw: Any) -> dict:
	data = raw if isinstance(raw, dict) else {}
	out = default_studio()
	if data.get("density") in DENSITIES:
		out["density"] = data["density"]
	if data.get("motion") in ("on", "off"):
		out["motion"] = data["motion"]
	accent = cstr(data.get("accent") or "").strip()
	if accent.startswith("#") and len(accent) in (4, 7):
		out["accent"] = accent
	if isinstance(data.get("palette"), str):
		out["palette"] = cstr(data["palette"]).strip()
	if data.get("toast_position") in TOAST_POS:
		out["toast_position"] = data["toast_position"]
	if data.get("dock_corner") in DOCK_CORNERS:
		out["dock_corner"] = data["dock_corner"]
	features = data.get("features") or {}
	if isinstance(features, dict):
		for key in FEATURE_KEYS:
			if key in features:
				out["features"][key] = bool(features[key])
	return out



def get_studio(user: str | None = None) -> dict:
	user = user or frappe.session.user
	if not user or user == "Guest":
		return default_studio()
	raw = frappe.defaults.get_user_default(STUDIO_KEY, user=user)
	if not raw:
		return default_studio()
	try:
		parsed = json.loads(raw) if isinstance(raw, str) else raw
	except (TypeError, ValueError):
		return default_studio()
	return _clean_studio(parsed)


@frappe.whitelist()
def save_studio(studio=None):
	if frappe.session.user == "Guest":
		frappe.throw(_("Not permitted"), frappe.PermissionError)
	if isinstance(studio, str):
		studio = frappe.parse_json(studio)
	clean = _clean_studio(studio)
	frappe.defaults.set_user_default(STUDIO_KEY, frappe.as_json(clean))
	return clean


