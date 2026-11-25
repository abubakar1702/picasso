# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

from frappe.model.document import Document

from picasso.cache import clear_settings_cache


class PicassoLoginSettings(Document):
	def on_update(self):
		clear_settings_cache()
