# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint

CACHE_KEY = "picasso_quicklook"

SKIP_FIELDTYPES = {
	"Section Break",
	"Column Break",
	"Tab Break",
	"Table",
	"Table MultiSelect",
	"HTML",
	"Button",
	"Fold",
	"Heading",
	"Password",
	"Image",
}


class PicassoQuickLook(Document):
	def validate(self):
		if not self.doc_type:
			return
		meta = frappe.get_meta(self.doc_type)
		seen = set()
		for row in self.fields:
			fieldname = (row.fieldname or "").strip()
			if not fieldname:
				frappe.throw(_("Row {0}: Field is required").format(row.idx))
			if fieldname in seen:
				frappe.throw(_("Field {0} is listed more than once").format(fieldname))
			seen.add(fieldname)
			df = meta.get_field(fieldname)
			if not df:
				frappe.throw(_("Row {0}: {1} is not a field of {2}").format(row.idx, fieldname, self.doc_type))
			if df.fieldtype in SKIP_FIELDTYPES:
				frappe.throw(_("Row {0}: {1} cannot be shown in Quick Look").format(row.idx, fieldname))

	def on_update(self):
		clear_quicklook_cache()

	def on_trash(self):
		clear_quicklook_cache()


def clear_quicklook_cache():
	frappe.cache.delete_value(CACHE_KEY)


def get_quicklook_map() -> dict:
	if not frappe.db.has_table("Picasso Quick Look"):
		return {}
	cached = frappe.cache.get_value(CACHE_KEY)
	if isinstance(cached, dict):
		return cached

	out = {}
	rows = frappe.get_all(
		"Picasso Quick Look",
		filters={"enabled": 1},
		fields=["name", "doc_type", "show_image"],
		ignore_permissions=True,
	)
	for row in rows:
		if not row.doc_type:
			continue
		fields = frappe.get_all(
			"Picasso Quick Look Field",
			filters={"parent": row.name, "parenttype": "Picasso Quick Look"},
			fields=["fieldname"],
			order_by="idx asc",
			ignore_permissions=True,
		)
		out[row.doc_type] = {
			"fields": [f.fieldname for f in fields if f.fieldname],
			"show_image": cint(row.show_image),
		}
	frappe.cache.set_value(CACHE_KEY, out)
	return out


def allowed_doctypes() -> list[str]:
	return list(get_quicklook_map())
