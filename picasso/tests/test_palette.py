# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe
from frappe.tests import IntegrationTestCase


class TestPalette(IntegrationTestCase):
	"""Tests for picasso.palette — seed_palettes, duplicate_palette, get_palette_colors."""

	def setUp(self):
		if not frappe.db.exists("DocType", "Picasso Palette"):
			self.skipTest("Picasso Palette not installed")

	# ── seed_palettes ────────────────────────────────────────────────────

	def test_seed_palettes_creates_stock_palettes(self):
		"""After seeding, all stock palette titles should exist."""
		from picasso.palette import STOCK_PALETTES, seed_palettes

		seed_palettes()
		for spec in STOCK_PALETTES:
			self.assertTrue(
				frappe.db.exists("Picasso Palette", spec["title"]),
				f"Stock palette '{spec['title']}' should exist after seeding",
			)

	def test_seed_palettes_is_idempotent(self):
		"""Running seed_palettes twice should not create duplicates or error."""
		from picasso.palette import STOCK_PALETTES, seed_palettes

		seed_palettes()
		count_before = frappe.db.count("Picasso Palette")
		seed_palettes()
		count_after = frappe.db.count("Picasso Palette")
		self.assertEqual(count_before, count_after)

	def test_system_palettes_are_protected(self):
		"""System palettes should not be editable by normal saves."""
		from picasso.palette import seed_palettes

		seed_palettes()
		if not frappe.db.exists("Picasso Palette", "Paper"):
			self.skipTest("Paper palette not found")

		doc = frappe.get_doc("Picasso Palette", "Paper")
		doc.accent_color = "#FF0000"
		self.assertRaises(frappe.ValidationError, doc.save)

	def test_system_palettes_cannot_be_deleted(self):
		"""System palettes should not be deletable."""
		from picasso.palette import seed_palettes

		seed_palettes()
		if not frappe.db.exists("Picasso Palette", "Paper"):
			self.skipTest("Paper palette not found")

		self.assertRaises(
			frappe.ValidationError,
			frappe.delete_doc,
			"Picasso Palette",
			"Paper",
		)

	# ── duplicate_palette ────────────────────────────────────────────────

	def test_duplicate_palette_creates_copy(self):
		"""Duplicating a palette should create a new non-system palette."""
		from picasso.palette import duplicate_palette, seed_palettes

		seed_palettes()
		if not frappe.db.exists("Picasso Palette", "Paper"):
			self.skipTest("Paper palette not found")

		# Clean up any leftover test palette.
		test_name = "Paper Test Copy"
		if frappe.db.exists("Picasso Palette", test_name):
			frappe.delete_doc("Picasso Palette", test_name, force=True)

		result = duplicate_palette(source_name="Paper", title=test_name)
		self.assertEqual(result["title"], test_name)
		self.assertEqual(result["is_system"], 0)
		self.assertTrue(frappe.db.exists("Picasso Palette", test_name))

		# Cleanup.
		frappe.delete_doc("Picasso Palette", test_name, force=True)

	def test_duplicate_palette_rejects_duplicate_title(self):
		"""Duplicating to an existing title should throw."""
		from picasso.palette import duplicate_palette, seed_palettes

		seed_palettes()
		if not frappe.db.exists("Picasso Palette", "Paper"):
			self.skipTest("Paper palette not found")

		self.assertRaises(
			frappe.ValidationError,
			duplicate_palette,
			source_name="Paper",
			title="Paper",
		)

	# ── get_palette_colors ───────────────────────────────────────────────

	def test_get_palette_colors_returns_defaults_for_missing(self):
		"""Missing palette name should return DEFAULT_COLORS."""
		from picasso.palette import DEFAULT_COLORS, get_palette_colors

		result = get_palette_colors(None)
		self.assertEqual(result, DEFAULT_COLORS)

		result = get_palette_colors("")
		self.assertEqual(result, DEFAULT_COLORS)

	def test_get_palette_colors_returns_palette_values(self):
		"""Existing palette should return its color values."""
		from picasso.palette import get_palette_colors, seed_palettes

		seed_palettes()
		if not frappe.db.exists("Picasso Palette", "Ink"):
			self.skipTest("Ink palette not found")

		result = get_palette_colors("Ink")
		self.assertEqual(result["accent_color"], "#6366F1")
