# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe


@frappe.whitelist()
def get_hidden_actions(doctype: str) -> list[list[str]]:
	if not frappe.db.exists("DocType", "Picasso Hide Form Action"):
		return []
	if not frappe.db.exists("Picasso Hide Form Action", doctype):
		return []

	doc = frappe.get_cached_doc("Picasso Hide Form Action", doctype)
	return [[row.label, row.btn_group or ""] for row in (doc.labels or []) if row.label]
