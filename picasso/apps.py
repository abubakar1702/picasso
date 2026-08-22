# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe
from frappe import _
from frappe.utils import cint, has_common

from frappe.apps import get_apps as frappe_get_apps
from frappe.apps import get_route as frappe_get_route


def _screen_to_app(doc) -> dict:
	workspaces = [row.workspace for row in (doc.get("workspaces") or []) if row.workspace]
	route = doc.app_home
	if not route and workspaces:
		route = "/app/" + frappe.utils.slug(workspaces[0])
	if not route:
		route = "/app"

	return {
		"name": doc.app,
		"logo": doc.logo or "",
		"title": _(doc.title or frappe.unscrub(doc.app)),
		"route": route,
	}


def _user_can_see(doc) -> bool:
	if cint(doc.hidden):
		return False

	if doc.app not in frappe.get_installed_apps():
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

	installed = set(frappe.get_installed_apps())
	apps = []
	for name in names:
		doc = frappe.get_cached_doc("Picasso App Screen", name)
		if doc.app not in installed:
			continue
		if ignore_permission or _user_can_see(doc):
			apps.append(_screen_to_app(doc))
	return apps


@frappe.whitelist()
def get_apps():
	if not frappe.db.exists("DocType", "Picasso App Screen"):
		return frappe_get_apps()

	# If any screens have been configured, use them (even if result is empty).
	if frappe.db.count("Picasso App Screen"):
		return get_configured_apps()

	return frappe_get_apps()


def get_route(app_name):
	if frappe.db.exists("DocType", "Picasso App Screen") and frappe.db.exists(
		"Picasso App Screen", app_name
	):
		doc = frappe.get_cached_doc("Picasso App Screen", app_name)
		return _screen_to_app(doc).get("route") or "/apps"
	return frappe_get_route(app_name)


def apps_context(context):
	path = getattr(getattr(frappe, "request", None), "path", "") or ""
	if path.rstrip("/") != "/apps":
		return context

	configured = get_configured_apps()
	if configured:
		context["apps"] = configured
	return context


def install_apps_overrides():
	"""Rebind frappe.apps lookups used by boot / website (whitelist override is not enough)."""
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


def before_request():
	install_apps_overrides()
