# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe
from frappe import _
from frappe.utils import cint, has_common

from frappe.apps import get_apps as frappe_get_apps
from frappe.apps import get_route as frappe_get_route


def _active_apps() -> list[str]:
	"""Installed apps that are not disabled (older Frappe has no disabled state)."""
	getter = getattr(frappe, "get_active_apps", None) or frappe.get_installed_apps
	return getter()


def _custom_route(doc) -> str:
	"""Route chosen on the screen, or "" to use the app's own route."""
	route = (doc.app_home or "").strip()
	if route.rstrip("/") == "/app":
		# Value seeded by older Picasso versions; it never meant a real destination.
		route = ""
	if not route:
		workspaces = [row.workspace for row in (doc.get("workspaces") or []) if row.workspace]
		route = "/desk/" + frappe.utils.slug(workspaces[0]) if workspaces else ""
	if route.startswith("/app/"):
		route = "/desk/" + route[len("/app/") :]
	return route


def _screen_to_app(doc) -> dict:
	return {
		"name": doc.app,
		"logo": doc.logo or "",
		"title": _(doc.title or frappe.unscrub(doc.app)),
		"route": _custom_route(doc) or "/desk",
	}


def _overlay(app: dict, doc) -> dict:
	"""Apply a screen's branding on top of Frappe's own entry."""
	out = dict(app)
	if doc.title:
		out["title"] = _(doc.title)
	if doc.logo:
		out["logo"] = doc.logo
	if route := _custom_route(doc):
		out["route"] = route
	return out


def _user_can_see(doc) -> bool:
	if cint(doc.hidden):
		return False

	if doc.app not in _active_apps():
		return False

	roles = [row.role for row in (doc.get("roles") or []) if row.role]
	if roles and not has_common(roles, frappe.get_roles()):
		return False

	method = doc.has_permission_method
	if method:
		try:
			if not frappe.get_attr(method)():
				return False
		except Exception:
			frappe.log_error(f"Picasso App Screen has_permission failed for {doc.app}")
			return False

	return True


def get_configured_apps(ignore_permission: bool = False) -> list[dict]:
	if not frappe.db.exists("DocType", "Picasso App Screen"):
		return []

	names = frappe.get_all(
		"Picasso App Screen",
		filters={"hidden": 0},
		pluck="name",
		order_by="sort_order asc, title asc",
	)
	if not names:
		return []

	active = set(_active_apps())
	apps = []
	for name in names:
		doc = frappe.get_cached_doc("Picasso App Screen", name)
		if doc.app not in active:
			continue
		if ignore_permission or _user_can_see(doc):
			apps.append(_screen_to_app(doc))
	return apps


def _get_screens() -> list:
	if not frappe.db.exists("DocType", "Picasso App Screen"):
		return []
	names = frappe.get_all("Picasso App Screen", pluck="name", order_by="sort_order asc, title asc")
	return [frappe.get_cached_doc("Picasso App Screen", name) for name in names]


@frappe.whitelist()
def get_apps():
	"""Frappe's app list with screen branding, order and visibility applied.

	Frappe decides which hooked apps are available (disabled, docked and setup-wizard
	rules); screens can only restrict those, or add apps that have no hook.
	"""
	core_apps = frappe_get_apps()
	screens = _get_screens()
	if not screens:
		return core_apps

	by_app = {doc.app: doc for doc in screens}
	entries = []
	for app in core_apps:
		doc = by_app.get(app["name"])
		if not doc:
			entries.append((100, app))
		elif _user_can_see(doc):
			entries.append((cint(doc.sort_order), _overlay(app, doc)))

	listed = {app["name"] for app in core_apps}
	for doc in screens:
		if doc.app in listed or not _user_can_see(doc):
			continue
		# Frappe never lists itself; any other hooked app was left out on purpose.
		if doc.app == "frappe" or not frappe.get_hooks("add_to_apps_screen", app_name=doc.app):
			entries.append((cint(doc.sort_order), _screen_to_app(doc)))

	entries.sort(key=lambda entry: entry[0])
	return [app for _order, app in entries]


def get_route(app_name):
	route = frappe_get_route(app_name)
	if app_name not in _active_apps():
		return route
	if frappe.db.exists("DocType", "Picasso App Screen") and frappe.db.exists("Picasso App Screen", app_name):
		doc = frappe.get_cached_doc("Picasso App Screen", app_name)
		if custom := _custom_route(doc):
			return custom
		if not frappe.get_hooks("add_to_apps_screen", app_name=app_name):
			return "/desk"
	return route


def apps_context(context):
	path = getattr(getattr(frappe, "request", None), "path", "") or ""
	if path.rstrip("/") == "/apps":
		context["apps"] = get_apps()
	return context


def install_apps_overrides():
	"""Rebind frappe.apps lookups used by boot / website (whitelist override is not enough).

	Called once at module import time (i.e. once per worker process) rather than
	on every request.
	"""
	import frappe.apps as apps_mod
	import frappe.sessions as sessions_mod
	import frappe.website.utils as website_utils

	if getattr(apps_mod.get_apps, "_picasso", False):
		return

	get_apps._picasso = True
	apps_mod.get_apps = get_apps
	apps_mod.get_route = get_route
	sessions_mod.get_apps = get_apps
	sessions_mod.get_default_path = apps_mod.get_default_path
	website_utils.get_apps = get_apps


# Run once per worker process at import time.
install_apps_overrides()


def before_request():
	# Patching is now done at module import time above.
	# This hook is kept as a no-op for forward-compatibility in case
	# future per-request setup is needed.
	pass
