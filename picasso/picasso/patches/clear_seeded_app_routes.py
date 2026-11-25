# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe

# Routes older versions seeded; they shadow the route each app declares itself.
SEEDED_ROUTES = {"hrms": "/app/overview"}


def execute():
	for doc in frappe.get_all("Picasso App Screen", fields=["name", "app", "app_home"]):
		if not frappe.get_hooks("add_to_apps_screen", app_name=doc.app):
			continue
		if doc.app_home in ("/app", SEEDED_ROUTES.get(doc.app)):
			frappe.db.set_value("Picasso App Screen", doc.name, "app_home", "", update_modified=False)
	frappe.cache.delete_keys("bootinfo")
