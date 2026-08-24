# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe
from frappe.model.document import Document

from picasso.palette import DEFAULT_COLORS


class PicassoDeskSettings(Document):
	def onload(self):
		self.set_default_colors()

	def validate(self):
		if not self.palette:
			self.palette = "Paper"
		self.set_default_colors()

	def set_default_colors(self):
		if self.palette:
			return
		for field, default_val in DEFAULT_COLORS.items():
			if not self.get(field):
				self.set(field, default_val)

	def on_update(self):
		frappe.cache.delete_value("picasso_desk_settings")
		frappe.cache.delete_value("picasso_login_settings")
		# Invalidate boot session cache so all users pick up the new theme on next load.
		frappe.cache.delete_keys("bootinfo")
		from picasso.picasso.desk_settings import broadcast_desk_settings

		broadcast_desk_settings()
