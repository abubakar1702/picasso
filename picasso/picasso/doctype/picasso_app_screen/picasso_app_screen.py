# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe
from frappe.model.document import Document


class PicassoAppScreen(Document):
	def validate(self):
		installed = frappe.get_installed_apps()
		if self.app and self.app not in installed:
			frappe.throw(frappe._("{0} is not an installed app").format(self.app))

	def on_update(self):
		frappe.clear_document_cache("Picasso App Screen", self.name)
		frappe.cache.delete_keys("bootinfo")
		frappe.cache.delete_keys("Picasso App Screen")
