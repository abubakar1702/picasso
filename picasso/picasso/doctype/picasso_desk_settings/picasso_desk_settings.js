// Copyright (c) 2026, Akash and contributors
// License: MIT. See LICENSE

function palette_preview_html(p) {
	if (!p) return "";
	const n = p.navbar_color_start || "#fff";
	const nt = p.navbar_text_color || "#111";
	const s = p.sidebar_color_start || "#f8f9fa";
	const st = p.sidebar_text_color || "#111";
	const sel = p.sidebar_selected_background || "#dbeafe";
	const page = p.page_background || "#f4f5f8";
	const accent = p.accent_color || "#2563eb";
	const title = frappe.utils.escape_html(p.title || p.name || "");
	return `
		<div style="border:1px solid var(--border-color);border-radius:10px;overflow:hidden;max-width:440px;font-size:12px;margin:8px 0 20px;">
			<div style="background:${n};color:${nt};padding:8px 12px;font-weight:600;">${title}</div>
			<div style="display:flex;min-height:84px;">
				<div style="width:34%;background:${s};color:${st};padding:8px;">
					<div style="background:${sel};border-radius:6px;padding:4px 8px;">Selected</div>
				</div>
				<div style="flex:1;background:${page};padding:8px;">
					<span style="display:inline-block;width:10px;height:10px;border-radius:99px;background:${accent};"></span>
				</div>
			</div>
		</div>`;
}

function apply_saved_desk_settings() {
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
}

function paint_desk_preview(frm) {
	const wrap = frm.get_field("palette_preview");
	if (!wrap) return;
	wrap.$wrapper.css({ paddingBottom: "8px" });
	if (!frm.doc.palette) {
		wrap.$wrapper.html("");
		return;
	}
	frappe.model.with_doc("Picasso Palette", frm.doc.palette, () => {
		const doc = frappe.get_doc("Picasso Palette", frm.doc.palette);
		wrap.$wrapper.html(palette_preview_html(doc));
	});
}

frappe.ui.form.on("Picasso Desk Settings", {
	refresh(frm) {
		frm.add_custom_button(__("Website Settings"), () => frappe.set_route("Form", "Website Settings"), __("Brand"));
		frm.add_custom_button(__("Navbar Settings"), () => frappe.set_route("Form", "Navbar Settings"), __("Brand"));
		frm.add_custom_button(__("Palettes"), () => frappe.set_route("List", "Picasso Palette"), __("Brand"));
		if (frm.doc.palette) {
			frm.add_custom_button(__("Edit palette"), () => frappe.set_route("Form", "Picasso Palette", frm.doc.palette));
			frm.add_custom_button(__("Duplicate palette"), () => {
				frappe.set_route("Form", "Picasso Palette", frm.doc.palette);
			});
		}
		paint_desk_preview(frm);
	},
	palette(frm) {
		paint_desk_preview(frm);
	},
	after_save() {
		apply_saved_desk_settings();
	},
});
