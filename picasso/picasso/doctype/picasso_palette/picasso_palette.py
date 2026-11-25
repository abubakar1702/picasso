# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint

from picasso.cache import clear_settings_cache


class PicassoPalette(Document):
	def validate(self):
		if cint(self.is_system) and not self.is_new() and not frappe.flags.picasso_seeding_palettes:
			frappe.throw(_("System palettes cannot be edited. Duplicate it to make a custom palette."))

	def on_trash(self):
		if cint(self.is_system) and not frappe.flags.picasso_seeding_palettes:
			frappe.throw(_("System palettes cannot be deleted."))
		self._clear_desk_cache()

	def on_update(self):
		self._clear_desk_cache()

	def _clear_desk_cache(self):
		clear_settings_cache()
		if frappe.flags.picasso_seeding_palettes:
			return
		from picasso.picasso.desk_settings import broadcast_desk_settings

		broadcast_desk_settings()
