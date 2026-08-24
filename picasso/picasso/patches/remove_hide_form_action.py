# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe


def execute():
	for name in ("Picasso Hide Form Action", "Picasso Hide Form Action Label"):
		if frappe.db.exists("DocType", name):
			frappe.delete_doc("DocType", name, force=1, ignore_permissions=True)
