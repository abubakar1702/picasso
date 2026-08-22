// Copyright (c) 2026, Akash and contributors
// License: MIT. See LICENSE

frappe.ui.form.on("Picasso Report Print Format", {
	refresh(frm) {
		if (frm.doc.report) {
			frm.add_custom_button(__("Open Report"), () => {
				frappe.set_route("query-report", frm.doc.report);
			});
		}
	},
});
