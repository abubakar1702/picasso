// Copyright (c) 2026, Akash and contributors
// License: MIT. See LICENSE

const SKIP_QUICKLOOK_TYPES = new Set([
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
]);

function field_options(doctype) {
	if (!doctype) return "";
	const meta = frappe.get_meta(doctype);
	if (!meta) return "";
	return (meta.fields || [])
		.filter((df) => df.fieldname && !SKIP_QUICKLOOK_TYPES.has(df.fieldtype))
		.map((df) => df.fieldname)
		.join("\n");
}

frappe.ui.form.on("Picasso Quick Look", {
	setup(frm) {
		frm.set_query("doc_type", () => ({
			filters: {
				issingle: 0,
				istable: 0,
			},
		}));
	},
	refresh(frm) {
		frm.trigger("set_field_options");
	},
	doc_type(frm) {
		frm.trigger("set_field_options");
	},
	set_field_options(frm) {
		if (!frm.doc.doc_type) {
			frm.fields_dict.fields.grid.update_docfield_property("fieldname", "options", "");
			return;
		}
		frappe.model.with_doctype(frm.doc.doc_type, () => {
			frm.fields_dict.fields.grid.update_docfield_property(
				"fieldname",
				"options",
				field_options(frm.doc.doc_type)
			);
		});
	},
});
