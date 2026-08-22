# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

"""Named desk palettes: one token set for light + dark chrome."""

import frappe
from frappe import _
from frappe.utils import cint

COLOR_FIELDS = (
	"accent_color",
	"navbar_color_start",
	"navbar_color_end",
	"navbar_text_color",
	"sidebar_color_start",
	"sidebar_color_end",
	"sidebar_text_color",
	"sidebar_hover_background",
	"sidebar_selected_background",
	"page_background",
	"page_head_background",
	"page_head_text_color",
	"page_head_separator_color",
	"list_card_background",
	"list_filter_background",
	"list_header_background",
	"list_row_hover_background",
	"list_border_color",
	"shadow_color",
	"dark_accent_color",
	"dark_navbar_color_start",
	"dark_navbar_color_end",
	"dark_navbar_text_color",
	"dark_sidebar_color_start",
	"dark_sidebar_color_end",
	"dark_sidebar_text_color",
	"dark_sidebar_hover_background",
	"dark_sidebar_selected_background",
	"dark_page_background",
	"dark_page_head_background",
	"dark_page_head_text_color",
	"dark_page_head_separator_color",
	"dark_list_card_background",
	"dark_list_filter_background",
	"dark_list_header_background",
	"dark_list_row_hover_background",
	"dark_list_border_color",
	"dark_shadow_color",
)

DEFAULT_COLORS = {
	"accent_color": "#2563EB",
	"navbar_color_start": "#FFFFFF",
	"navbar_color_end": "#FFFFFF",
	"navbar_text_color": "#1F2937",
	"sidebar_color_start": "#F8F9FA",
	"sidebar_color_end": "#F8F9FA",
	"sidebar_text_color": "#1F2937",
	"sidebar_hover_background": "#EEF2FF",
	"sidebar_selected_background": "#DBEAFE",
	"page_background": "#F4F5F8",
	"page_head_background": "#FFFFFF",
	"page_head_text_color": "#1F2937",
	"page_head_separator_color": "#C4B5A0",
	"list_card_background": "#FFFFFF",
	"list_filter_background": "#FFFFFF",
	"list_header_background": "#F3F4F6",
	"list_row_hover_background": "#F3F4F6",
	"list_border_color": "#E5E7EB",
	"shadow_color": "#0F172A",
	"dark_accent_color": "#2563EB",
	"dark_navbar_color_start": "#13151C",
	"dark_navbar_color_end": "#13151C",
	"dark_navbar_text_color": "#E5E7EB",
	"dark_sidebar_color_start": "#13151C",
	"dark_sidebar_color_end": "#13151C",
	"dark_sidebar_text_color": "#E5E7EB",
	"dark_sidebar_hover_background": "#1E293B",
	"dark_sidebar_selected_background": "#1E3A5F",
	"dark_page_background": "#0F1117",
	"dark_page_head_background": "#1A1C24",
	"dark_page_head_text_color": "#E5E7EB",
	"dark_page_head_separator_color": "#9CA3AF",
	"dark_list_card_background": "#1A1C24",
	"dark_list_filter_background": "#1A1C24",
	"dark_list_header_background": "#22252E",
	"dark_list_row_hover_background": "#2A2D38",
	"dark_list_border_color": "#2A2D38",
	"dark_shadow_color": "#000000",
}

STOCK_PALETTES = [
	{
		"title": "Paper",
		"description": "Clean light desk. White chrome, blue accent.",
		**DEFAULT_COLORS,
	},
	{
		"title": "Coast",
		"description": "Cool sky chrome with a bright blue accent.",
		"accent_color": "#0284C7",
		"navbar_color_start": "#E8F4FB",
		"navbar_color_end": "#D9EEF8",
		"navbar_text_color": "#0F3A4A",
		"sidebar_color_start": "#F3F8FC",
		"sidebar_color_end": "#EAF3F9",
		"sidebar_text_color": "#164E63",
		"sidebar_hover_background": "#D6EAF6",
		"sidebar_selected_background": "#C5E3F4",
		"page_background": "#F4F8FB",
		"page_head_background": "#F7FBFD",
		"page_head_text_color": "#0F3A4A",
		"page_head_separator_color": "#7AA8BE",
		"list_card_background": "#FFFFFF",
		"list_filter_background": "#F7FBFD",
		"list_header_background": "#E8F2F8",
		"list_row_hover_background": "#E3F1F8",
		"list_border_color": "#D0E4EF",
		"shadow_color": "#0C4A6E",
		"dark_accent_color": "#38BDF8",
		"dark_navbar_color_start": "#0C1924",
		"dark_navbar_color_end": "#0C1924",
		"dark_navbar_text_color": "#E0F2FE",
		"dark_sidebar_color_start": "#0F2433",
		"dark_sidebar_color_end": "#0F2433",
		"dark_sidebar_text_color": "#E0F2FE",
		"dark_sidebar_hover_background": "#163246",
		"dark_sidebar_selected_background": "#164E63",
		"dark_page_background": "#0A1218",
		"dark_page_head_background": "#12202C",
		"dark_page_head_text_color": "#E0F2FE",
		"dark_page_head_separator_color": "#7AA8BE",
		"dark_list_card_background": "#12202C",
		"dark_list_filter_background": "#12202C",
		"dark_list_header_background": "#163246",
		"dark_list_row_hover_background": "#1B3A50",
		"dark_list_border_color": "#1E4970",
		"dark_shadow_color": "#020617",
	},
	{
		"title": "Ink",
		"description": "Dark navy chrome, even in light mode.",
		"accent_color": "#6366F1",
		"navbar_color_start": "#111827",
		"navbar_color_end": "#1F2937",
		"navbar_text_color": "#F9FAFB",
		"sidebar_color_start": "#1F2937",
		"sidebar_color_end": "#111827",
		"sidebar_text_color": "#F3F4F6",
		"sidebar_hover_background": "#374151",
		"sidebar_selected_background": "#312E81",
		"page_background": "#F3F4F6",
		"page_head_background": "#FFFFFF",
		"page_head_text_color": "#111827",
		"page_head_separator_color": "#9CA3AF",
		"list_card_background": "#FFFFFF",
		"list_filter_background": "#FFFFFF",
		"list_header_background": "#E5E7EB",
		"list_row_hover_background": "#EEF2FF",
		"list_border_color": "#E5E7EB",
		"shadow_color": "#111827",
		"dark_accent_color": "#818CF8",
		"dark_navbar_color_start": "#0B1220",
		"dark_navbar_color_end": "#0B1220",
		"dark_navbar_text_color": "#F3F4F6",
		"dark_sidebar_color_start": "#111827",
		"dark_sidebar_color_end": "#111827",
		"dark_sidebar_text_color": "#F3F4F6",
		"dark_sidebar_hover_background": "#1F2937",
		"dark_sidebar_selected_background": "#312E81",
		"dark_page_background": "#09090F",
		"dark_page_head_background": "#111827",
		"dark_page_head_text_color": "#F3F4F6",
		"dark_page_head_separator_color": "#6B7280",
		"dark_list_card_background": "#111827",
		"dark_list_filter_background": "#111827",
		"dark_list_header_background": "#1F2937",
		"dark_list_row_hover_background": "#1E1B4B",
		"dark_list_border_color": "#1F2937",
		"dark_shadow_color": "#000000",
	},
	{
		"title": "Sand",
		"description": "Warm paper and terracotta accent.",
		"accent_color": "#C2410C",
		"navbar_color_start": "#F5EDE0",
		"navbar_color_end": "#EFE4D1",
		"navbar_text_color": "#3F2E1F",
		"sidebar_color_start": "#FAF6F1",
		"sidebar_color_end": "#F3EDE3",
		"sidebar_text_color": "#4A3424",
		"sidebar_hover_background": "#EDE0CC",
		"sidebar_selected_background": "#E7D3B5",
		"page_background": "#F7F1E8",
		"page_head_background": "#FBF7EC",
		"page_head_text_color": "#3F2E1F",
		"page_head_separator_color": "#C4A882",
		"list_card_background": "#FFFCF7",
		"list_filter_background": "#FBF7EC",
		"list_header_background": "#F0E6D4",
		"list_row_hover_background": "#F3E6D2",
		"list_border_color": "#E6D5BB",
		"shadow_color": "#7C4A1E",
		"dark_accent_color": "#FB923C",
		"dark_navbar_color_start": "#2A2118",
		"dark_navbar_color_end": "#2A2118",
		"dark_navbar_text_color": "#F5EDE0",
		"dark_sidebar_color_start": "#1C1814",
		"dark_sidebar_color_end": "#1C1814",
		"dark_sidebar_text_color": "#F5EDE0",
		"dark_sidebar_hover_background": "#3A2A1C",
		"dark_sidebar_selected_background": "#5C2E12",
		"dark_page_background": "#16110C",
		"dark_page_head_background": "#241910",
		"dark_page_head_text_color": "#F5EDE0",
		"dark_page_head_separator_color": "#A78B6A",
		"dark_list_card_background": "#241910",
		"dark_list_filter_background": "#241910",
		"dark_list_header_background": "#2E2116",
		"dark_list_row_hover_background": "#3A2A1C",
		"dark_list_border_color": "#3A2A1C",
		"dark_shadow_color": "#0A0908",
	},
	{
		"title": "Forest",
		"description": "Soft green chrome with a leaf accent.",
		"accent_color": "#15803D",
		"navbar_color_start": "#ECF4ED",
		"navbar_color_end": "#E2EEE4",
		"navbar_text_color": "#14532D",
		"sidebar_color_start": "#F3F7F4",
		"sidebar_color_end": "#EAF3EC",
		"sidebar_text_color": "#14532D",
		"sidebar_hover_background": "#DCEFDE",
		"sidebar_selected_background": "#C7E6CC",
		"page_background": "#F3F7F4",
		"page_head_background": "#F7FBF8",
		"page_head_text_color": "#14532D",
		"page_head_separator_color": "#86A78F",
		"list_card_background": "#FFFFFF",
		"list_filter_background": "#F7FBF8",
		"list_header_background": "#E5F0E8",
		"list_row_hover_background": "#DFF0E3",
		"list_border_color": "#D4E5D8",
		"shadow_color": "#14532D",
		"dark_accent_color": "#4ADE80",
		"dark_navbar_color_start": "#14241A",
		"dark_navbar_color_end": "#14241A",
		"dark_navbar_text_color": "#DCFCE7",
		"dark_sidebar_color_start": "#0F1A14",
		"dark_sidebar_color_end": "#0F1A14",
		"dark_sidebar_text_color": "#DCFCE7",
		"dark_sidebar_hover_background": "#1A3322",
		"dark_sidebar_selected_background": "#166534",
		"dark_page_background": "#0C1410",
		"dark_page_head_background": "#14241A",
		"dark_page_head_text_color": "#DCFCE7",
		"dark_page_head_separator_color": "#4D7C5A",
		"dark_list_card_background": "#14241A",
		"dark_list_filter_background": "#14241A",
		"dark_list_header_background": "#1A3322",
		"dark_list_row_hover_background": "#1F3D28",
		"dark_list_border_color": "#1F3D28",
		"dark_shadow_color": "#022C22",
	},
	{
		"title": "Slate",
		"description": "Neutral gray chrome, graphite accent.",
		"accent_color": "#334155",
		"navbar_color_start": "#F1F5F9",
		"navbar_color_end": "#E2E8F0",
		"navbar_text_color": "#0F172A",
		"sidebar_color_start": "#F8FAFC",
		"sidebar_color_end": "#F1F5F9",
		"sidebar_text_color": "#1E293B",
		"sidebar_hover_background": "#E2E8F0",
		"sidebar_selected_background": "#CBD5E1",
		"page_background": "#F8FAFC",
		"page_head_background": "#FFFFFF",
		"page_head_text_color": "#0F172A",
		"page_head_separator_color": "#94A3B8",
		"list_card_background": "#FFFFFF",
		"list_filter_background": "#FFFFFF",
		"list_header_background": "#F1F5F9",
		"list_row_hover_background": "#E2E8F0",
		"list_border_color": "#E2E8F0",
		"shadow_color": "#0F172A",
		"dark_accent_color": "#94A3B8",
		"dark_navbar_color_start": "#1E293B",
		"dark_navbar_color_end": "#1E293B",
		"dark_navbar_text_color": "#F1F5F9",
		"dark_sidebar_color_start": "#0F172A",
		"dark_sidebar_color_end": "#0F172A",
		"dark_sidebar_text_color": "#F1F5F9",
		"dark_sidebar_hover_background": "#1E293B",
		"dark_sidebar_selected_background": "#334155",
		"dark_page_background": "#020617",
		"dark_page_head_background": "#1E293B",
		"dark_page_head_text_color": "#F1F5F9",
		"dark_page_head_separator_color": "#64748B",
		"dark_list_card_background": "#1E293B",
		"dark_list_filter_background": "#1E293B",
		"dark_list_header_background": "#334155",
		"dark_list_row_hover_background": "#334155",
		"dark_list_border_color": "#334155",
		"dark_shadow_color": "#000000",
	},
]

COLOR_FIELDS = COLOR_FIELDS
DEFAULT_COLORS = DEFAULT_COLORS
STOCK_PALETTES = STOCK_PALETTES


def colors_from_doc(doc) -> dict:
	out = dict(DEFAULT_COLORS)
	for key in COLOR_FIELDS:
		value = doc.get(key) if hasattr(doc, "get") else doc.get(key)
		if value:
			out[key] = value
	return out


def get_palette_colors(name: str | None) -> dict:
	colors = dict(DEFAULT_COLORS)
	if not name or not frappe.db.exists("DocType", "Picasso Palette"):
		return colors
	row = frappe.db.get_value("Picasso Palette", name, COLOR_FIELDS, as_dict=True)
	if not row:
		return colors
	for key in COLOR_FIELDS:
		if row.get(key):
			colors[key] = row[key]
	return colors


def seed_palettes():
	if not frappe.db.exists("DocType", "Picasso Palette"):
		return

	frappe.flags.picasso_seeding_palettes = True
	try:
		for spec in STOCK_PALETTES:
			title = spec["title"]
			payload = {key: spec.get(key) or DEFAULT_COLORS[key] for key in COLOR_FIELDS}
			if frappe.db.exists("Picasso Palette", title):
				doc = frappe.get_doc("Picasso Palette", title)
				if not cint(doc.is_system):
					continue
				changed = False
				for key, value in payload.items():
					if doc.get(key) != value:
						doc.set(key, value)
						changed = True
				if doc.description != spec.get("description"):
					doc.description = spec.get("description")
					changed = True
				if changed:
					doc.save(ignore_permissions=True)
				continue

			doc = frappe.get_doc(
				{
					"doctype": "Picasso Palette",
					"title": title,
					"description": spec.get("description") or "",
					"is_system": 1,
					**payload,
				}
			)
			doc.insert(ignore_permissions=True)
	finally:
		frappe.flags.picasso_seeding_palettes = False

	_ensure_desk_palette()


@frappe.whitelist()
def duplicate_palette(source_name: str, title: str | None = None):
	if not source_name:
		frappe.throw(_("Missing palette"))
	src = frappe.get_doc("Picasso Palette", source_name)
	title = (title or "").strip() or _("{0} copy").format(src.title)
	if frappe.db.exists("Picasso Palette", title):
		frappe.throw(_("A palette named {0} already exists").format(title))
	doc = frappe.copy_doc(src)
	doc.title = title
	doc.is_system = 0
	doc.insert()
	return doc.as_dict()


def _ensure_desk_palette():
	if not frappe.db.exists("DocType", "Picasso Desk Settings"):
		return
	if not frappe.db.exists("Picasso Palette", "Paper"):
		return
	try:
		desk = frappe.get_single("Picasso Desk Settings")
	except Exception:
		return
	if desk.get("palette"):
		return
	desk.db_set("palette", "Paper", update_modified=False)
	frappe.cache.delete_value("picasso_desk_settings")
