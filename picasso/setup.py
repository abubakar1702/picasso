# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe
from frappe.utils import cint

SEED_APPS = {
	"frappe": {"title": "Frappe", "sort_order": 10, "hidden": 1},
	"erpnext": {
		"title": "ERPNext",
		"sort_order": 20,
		"has_permission": "erpnext.check_app_permission",
	},
	"hrms": {
		"title": "HR",
		"sort_order": 30,
		"has_permission": "hrms.hr.utils.check_app_permission",
	},
	"picasso": {"title": "Picasso", "sort_order": 90, "hidden": 1},
}


def _apps_to_seed():
	installed = set(frappe.get_installed_apps())
	names = set(SEED_APPS) & installed
	for app in installed:
		if app in names:
			continue
		if frappe.get_hooks("add_to_apps_screen", app_name=app):
			names.add(app)
	return sorted(names)


def seed_app_screens():
	if not frappe.db.exists("DocType", "Picasso App Screen"):
		return

	for app in _apps_to_seed():
		if frappe.db.exists("Picasso App Screen", app):
			continue

		meta = SEED_APPS.get(app, {"sort_order": 100})
		hooks = frappe.get_hooks("add_to_apps_screen", app_name=app) or []
		hook = hooks[0] if hooks else {}

		has_permission = meta.get("has_permission") or hook.get("has_permission")
		if has_permission:
			from picasso.apps import allowed_permission_methods

			try:
				frappe.get_attr(has_permission)
			except Exception:
				has_permission = None
			if has_permission not in allowed_permission_methods():
				has_permission = None

		doc = frappe.get_doc(
			{
				"doctype": "Picasso App Screen",
				"app": app,
				"title": meta.get("title") or hook.get("title") or frappe.unscrub(app),
				# Blank means "use the app's own route", which can change between versions.
				"app_home": "",
				"logo": hook.get("logo") or "",
				"sort_order": cint(meta.get("sort_order") or 100),
				"has_permission_method": has_permission,
				"hidden": cint(meta.get("hidden") or 0),
			}
		)
		doc.insert(ignore_permissions=True)


def after_install():
	seed_app_screens()
	from picasso.palette import seed_palettes

	seed_palettes()


def after_migrate():
	seed_app_screens()
	from picasso.palette import seed_palettes

	seed_palettes()
