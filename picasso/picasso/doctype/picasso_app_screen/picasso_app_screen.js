// Copyright (c) 2026, Akash and contributors
// License: MIT. See LICENSE

frappe.ui.form.on("Picasso App Screen", {
	refresh(frm) {
		frappe.xcall("frappe.core.doctype.module_def.module_def.get_installed_apps").then((apps) => {
			const list = typeof apps === "string" ? JSON.parse(apps) : apps;
			frm.set_df_property("app", "options", (list || []).join("\n"));
		});
		frm.set_query("workspace", "workspaces", () => ({
			filters: frm.doc.app ? { app: ["in", [frm.doc.app, ""]] } : {},
		}));
	},
});
