// Copyright (c) 2026, Akash and contributors
// License: MIT. See LICENSE

function preview_markup(doc) {
	const n = doc.navbar_color_start || "#fff";
	const nt = doc.navbar_text_color || "#111";
	const s = doc.sidebar_color_start || "#f8f9fa";
	const st = doc.sidebar_text_color || "#111";
	const sel = doc.sidebar_selected_background || "#dbeafe";
	const page = doc.page_background || "#f4f5f8";
	const accent = doc.accent_color || "#2563eb";
	const title = frappe.utils.escape_html(doc.title || "");
	return `
		<div style="border:1px solid var(--border-color);border-radius:10px;overflow:hidden;max-width:420px;font-size:12px;">
			<div style="background:${n};color:${nt};padding:8px 12px;font-weight:600;">Navbar · ${title}</div>
			<div style="display:flex;min-height:88px;">
				<div style="width:36%;background:${s};color:${st};padding:8px;">
					<div style="opacity:.7;margin-bottom:6px;">Sidebar</div>
					<div style="background:${sel};border-radius:6px;padding:4px 8px;">Selected</div>
				</div>
				<div style="flex:1;background:${page};padding:8px;">
					<div style="background:#fff;border-radius:6px;padding:8px;">
						<span style="display:inline-block;width:10px;height:10px;border-radius:99px;background:${accent};margin-right:6px;"></span>
						List
					</div>
				</div>
			</div>
		</div>`;
}

frappe.ui.form.on("Picasso Palette", {
	refresh(frm) {
		if (frm.doc.is_system && !frm.is_new()) {
			frm.set_read_only();
			frm.disable_save();
		}
		if (!frm.is_new()) {
			frm.add_custom_button(__("Duplicate"), () => {
				frappe.prompt(
					{
						fieldname: "title",
						fieldtype: "Data",
						label: __("Name"),
						reqd: 1,
						default: __("{0} copy", [frm.doc.title || "Palette"]),
					},
					(values) => {
						frappe.call({
							method: "picasso.palette.duplicate_palette",
							args: { source_name: frm.doc.name, title: values.title },
							freeze: true,
							callback(r) {
								if (r.message && r.message.name) {
									frappe.set_route("Form", "Picasso Palette", r.message.name);
								}
							},
						});
					},
					__("Duplicate palette")
				);
			});
		}
		frm.get_field("preview_html").$wrapper.html(preview_markup(frm.doc));
	},
	after_save() {
		frappe.call({
			method: "picasso.picasso.desk_settings.get_picasso_desk_settings",
			callback(r) {
				if (!r.message) return;
				if (window.picasso && typeof window.picasso.applyDeskTheme === "function") {
					window.picasso.applyDeskTheme(r.message, { force: true });
				} else if (window.frappe && frappe.boot) {
					frappe.boot.picasso_desk = r.message;
				}
			},
		});
	},
});
