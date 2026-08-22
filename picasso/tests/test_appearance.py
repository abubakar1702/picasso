# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe
from frappe.tests import IntegrationTestCase


class TestAppearance(IntegrationTestCase):
	"""Tests for picasso.appearance — peek_doc, save_studio, _clean_studio."""

	# ── save_studio ──────────────────────────────────────────────────────

	def test_save_studio_rejects_guest(self):
		"""Guest users should not be able to save studio preferences."""
		frappe.set_user("Guest")
		try:
			from picasso.appearance import save_studio

			self.assertRaises(frappe.PermissionError, save_studio, studio={})
		finally:
			frappe.set_user("Administrator")

	def test_save_studio_accepts_valid_input(self):
		"""Valid studio settings should be saved and returned cleaned."""
		frappe.set_user("Administrator")
		from picasso.appearance import save_studio

		result = save_studio(
			studio={
				"density": "compact",
				"motion": "off",
				"accent": "#FF5733",
				"toast_position": "top-center",
				"features": {"ripple": False},
			}
		)
		self.assertEqual(result["density"], "compact")
		self.assertEqual(result["motion"], "off")
		self.assertEqual(result["accent"], "#FF5733")
		self.assertEqual(result["toast_position"], "top-center")
		self.assertFalse(result["features"]["ripple"])
		# Other features should default to True.
		self.assertTrue(result["features"]["page_transitions"])

	def test_save_studio_rejects_invalid_values(self):
		"""Invalid enum values should be replaced with defaults."""
		from picasso.appearance import save_studio

		result = save_studio(
			studio={
				"density": "invalid_density",
				"motion": "maybe",
				"accent": "not-a-hex",
				"toast_position": "invalid-position",
			}
		)
		self.assertEqual(result["density"], "cozy")  # default
		self.assertEqual(result["motion"], "on")  # default
		self.assertEqual(result["accent"], "")  # default (empty)
		self.assertEqual(result["toast_position"], "bottom-right")  # default

	def test_save_studio_handles_string_json(self):
		"""Studio can be passed as a JSON string (from frappe.call)."""
		import json

		from picasso.appearance import save_studio

		result = save_studio(studio=json.dumps({"density": "roomy"}))
		self.assertEqual(result["density"], "roomy")

	# ── _clean_studio ────────────────────────────────────────────────────

	def test_clean_studio_handles_none(self):
		"""None input should return default studio settings."""
		from picasso.appearance import _clean_studio

		result = _clean_studio(None)
		self.assertEqual(result["density"], "cozy")
		self.assertEqual(result["motion"], "on")

	def test_clean_studio_handles_empty_dict(self):
		"""Empty dict should return default studio settings."""
		from picasso.appearance import _clean_studio

		result = _clean_studio({})
		self.assertEqual(result["density"], "cozy")
		self.assertTrue(all(result["features"].values()))

	def test_clean_studio_validates_accent_format(self):
		"""Only #RGB and #RRGGBB accents should be accepted."""
		from picasso.appearance import _clean_studio

		self.assertEqual(_clean_studio({"accent": "#ABC"})["accent"], "#ABC")
		self.assertEqual(_clean_studio({"accent": "#AABBCC"})["accent"], "#AABBCC")
		self.assertEqual(_clean_studio({"accent": "red"})["accent"], "")
		self.assertEqual(_clean_studio({"accent": "#AABBCCDD"})["accent"], "")
		self.assertEqual(_clean_studio({"accent": ""})["accent"], "")

	def test_clean_studio_validates_dock_corner(self):
		"""Only valid corner codes should be accepted."""
		from picasso.appearance import _clean_studio

		for corner in ("br", "bl", "tr", "tl"):
			self.assertEqual(_clean_studio({"dock_corner": corner})["dock_corner"], corner)
		self.assertEqual(_clean_studio({"dock_corner": "xx"})["dock_corner"], "br")

	# ── get_studio ───────────────────────────────────────────────────────

	def test_get_studio_returns_defaults_for_guest(self):
		"""Guest users should get default studio settings."""
		from picasso.appearance import get_studio

		result = get_studio(user="Guest")
		self.assertEqual(result["density"], "cozy")
		self.assertEqual(result["motion"], "on")

	# ── peek_doc ─────────────────────────────────────────────────────────

	def test_peek_doc_requires_doctype_and_name(self):
		"""Missing doctype/name should throw."""
		from picasso.appearance import peek_doc

		self.assertRaises(frappe.ValidationError, peek_doc, doctype="", name="test")
		self.assertRaises(frappe.ValidationError, peek_doc, doctype="User", name="")

	def test_peek_doc_checks_permission(self):
		"""peek_doc should respect read permissions."""
		from picasso.appearance import peek_doc

		# Create a test user with no permissions.
		if not frappe.db.exists("User", "test_picasso_noperm@example.com"):
			user = frappe.get_doc(
				{
					"doctype": "User",
					"email": "test_picasso_noperm@example.com",
					"first_name": "Picasso Test",
					"send_welcome_email": 0,
					"roles": [],
				}
			)
			user.insert(ignore_permissions=True)

		frappe.set_user("test_picasso_noperm@example.com")
		try:
			# This user shouldn't be able to peek at DocType (system manager only).
			self.assertRaises(
				frappe.PermissionError,
				peek_doc,
				doctype="DocType",
				name="User",
			)
		finally:
			frappe.set_user("Administrator")
