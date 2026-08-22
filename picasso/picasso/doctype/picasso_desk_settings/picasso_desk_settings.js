// Copyright (c) 2026, Akash and contributors
// License: MIT. See LICENSE

frappe.ui.form.on("Picasso Desk Settings", {
	refresh(frm) {
		const defaults = {
			accent_color: "#2563EB",
			navbar_color_start: "#FFFFFF",
			navbar_color_end: "#FFFFFF",
			sidebar_color_start: "#F8F9FA",
			sidebar_color_end: "#F8F9FA",
			navbar_text_color: "#1F2937",
			sidebar_text_color: "#1F2937",
			page_background: "#F4F5F8",
			page_head_background: "#FFFFFF",
			page_head_text_color: "#1F2937",
			page_head_separator_color: "#C4B5A0",
			list_card_background: "#FFFFFF",
			list_filter_background: "#FFFFFF",
			list_header_background: "#F3F4F6",
			list_row_hover_background: "#F3F4F6",
			list_border_color: "#E5E7EB",
			dark_accent_color: "#2563EB",
			dark_navbar_color_start: "#13151C",
			dark_navbar_color_end: "#13151C",
			dark_sidebar_color_start: "#13151C",
			dark_sidebar_color_end: "#13151C",
			dark_navbar_text_color: "#E5E7EB",
			dark_sidebar_text_color: "#E5E7EB",
			dark_page_background: "#0F1117",
			dark_page_head_background: "#1A1C24",
			dark_page_head_text_color: "#E5E7EB",
			dark_page_head_separator_color: "#9CA3AF",
			dark_list_card_background: "#1A1C24",
			dark_list_filter_background: "#1A1C24",
			dark_list_header_background: "#22252E",
			dark_list_row_hover_background: "#2A2D38",
			dark_list_border_color: "#2A2D38",
		};

		let updated = false;
		for (const [field, val] of Object.entries(defaults)) {
			if (!frm.doc[field]) {
				frm.set_value(field, val);
				updated = true;
			}
		}

		if (updated && frm.is_dirty()) {
			frm.refresh_fields();
		}
	},
});
