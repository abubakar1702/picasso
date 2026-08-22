# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe
from frappe.model.document import Document
from frappe.utils.jinja import validate_template


class PicassoReportPrintFormat(Document):
	def validate(self):
		if self.html:
			validate_template(self.html)
		if (
			self.standard == "Yes"
			and not frappe.local.conf.get("developer_mode")
			and not (frappe.flags.in_import or frappe.flags.in_test)
		):
			frappe.throw(frappe._("Standard print format cannot be updated"))

	def on_update(self):
		if self.standard == "Yes" and self.module:
			from frappe.modules.utils import export_module_json

			export_module_json(self, True, self.module)
