# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe
from frappe.model.document import Document


class PicassoLoginSettings(Document):
	def on_update(self):
		frappe.cache.delete_value("picasso_login_settings")
		# Login settings affect boot context — invalidate boot cache.
		frappe.cache.delete_keys("bootinfo")
