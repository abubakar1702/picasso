# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

from frappe.model.document import Document

from picasso.cache import clear_settings_cache
from picasso.palette import DEFAULT_COLORS, DEFAULT_PALETTE


class PicassoDeskSettings(Document):
	def onload(self):
		self.set_default_colors()

	def validate(self):
		if not self.palette:
			self.palette = DEFAULT_PALETTE
		self.set_default_colors()

	def set_default_colors(self):
		if self.palette:
			return
		for field, default_val in DEFAULT_COLORS.items():
			if not self.get(field):
				self.set(field, default_val)

	def on_update(self):
		clear_settings_cache()
		from picasso.picasso.desk_settings import broadcast_desk_settings

		broadcast_desk_settings()
