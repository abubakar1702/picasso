# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe
from frappe.desk.query_report import get_script as frappe_get_script


@frappe.whitelist()
def get_script(report_name):
	response = frappe_get_script(report_name)
	if not frappe.db.exists("DocType", "Picasso Report Print Format"):
		return response

	name = frappe.db.get_value("Picasso Report Print Format", {"report": report_name}, "name")
	if name:
		html = frappe.get_cached_value("Picasso Report Print Format", name, "html")
		if html:
			response["html_format"] = html
	return response
