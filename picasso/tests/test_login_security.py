# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

from unittest.mock import patch

import frappe
from frappe.tests import IntegrationTestCase
from frappe.utils import set_request
from frappe.website.serve import get_response_content

from picasso.picasso import login_settings

PAYLOAD = '"><img src=x onerror=alert(1)>'


class TestLoginPage(IntegrationTestCase):
	def render(self, **settings):
		values = {**login_settings._default_settings(), "enabled": 1, **settings}
		set_request(method="GET", path="login")
		with (
			self.set_user("Guest"),
			patch("picasso.www.login.get_picasso_login_settings", lambda: values),
		):
			return get_response_content("login")

	def test_safe_url(self):
		for url in ("javascript:alert(1)", "java\tscript:alert(1)", " JavaScript:x", "data:text/html,x"):
			self.assertEqual(login_settings.safe_url(url), "")
		self.assertEqual(login_settings.safe_url("https://a.b/c?x=1#y"), "https://a.b/c?x=1#y")
		self.assertNotIn("'", login_settings.safe_url("/files/a'b.png"))

	def test_safe_color(self):
		self.assertEqual(login_settings.safe_color("#FFF"), "#FFF")
		self.assertEqual(login_settings.safe_color("red</style><script>"), "")

	def test_settings_text_is_escaped(self):
		html = self.render(
			heading=PAYLOAD,
			has_visual=1,
			slides=[{"image": "/files/a.png", "title": PAYLOAD, "subtitle": PAYLOAD}],
			links=[{"label": PAYLOAD, "url": "/x", "icon": "", "placement": "form_footer"}],
		)
		self.assertNotIn("<img src=x", html)

	def test_login_js_feedback_elements_exist(self):
		html = self.render()
		for hook in ("login-error-banner picasso-banner", 'class="field-error"', 'data-variant="solid"'):
			self.assertIn(hook, html)

	def test_disabled_uses_stock_login(self):
		html = self.render(enabled=0)
		self.assertNotIn('class="picasso-login', html)
		self.assertIn("login_email", html)


class TestAppRouting(IntegrationTestCase):
	def get_apps(self, core, screens):
		from picasso import apps

		docs = [frappe._dict(doc) for doc in screens]
		with (
			patch.object(apps, "frappe_get_apps", lambda: core),
			patch.object(apps, "_get_screens", lambda: docs),
			patch.object(apps, "_active_apps", lambda: ["frappe", "erpnext"]),
		):
			return apps.get_apps()

	def test_legacy_route_does_not_shadow_core(self):
		core = [{"name": "erpnext", "route": "/desk/home", "title": "E", "setup_wizard_text": "x"}]
		app = self.get_apps(core, [{"app": "erpnext", "app_home": "/app", "title": "ERP"}])[0]
		self.assertEqual(app["route"], "/desk/home")
		self.assertEqual(app["title"], "ERP")
		self.assertEqual(app["setup_wizard_text"], "x")
		self.assertEqual(core[0]["title"], "E")

	def test_hidden_and_disabled_apps_are_dropped(self):
		core = [{"name": "erpnext", "route": "/desk/home", "title": "E"}]
		self.assertEqual(self.get_apps(core, [{"app": "erpnext", "hidden": 1}]), [])
		self.assertEqual(self.get_apps([], [{"app": "not_active", "title": "X"}]), [])


class TestLoginMethods(IntegrationTestCase):
	def apply(self, context, **settings):
		from picasso.www.login import _apply_login_methods

		context = frappe._dict(context)
		_apply_login_methods(context, {"show_social_logins": 0, "show_login_with_email_link": 0, **settings})
		return context

	def test_hidden_when_password_login_works(self):
		out = self.apply({"login_with_email_link": 1, "provider_logins": ["x"]})
		self.assertEqual(out.login_with_email_link, 0)
		self.assertEqual(out.provider_logins, [])

	def test_last_login_method_is_never_hidden(self):
		out = self.apply({"disable_user_pass_login": 1, "login_with_email_link": 1})
		self.assertEqual(out.login_with_email_link, 1)
		out = self.apply({"disable_user_pass_login": 1, "provider_logins": ["x"]})
		self.assertEqual(out.provider_logins, ["x"])


class TestSettingsGuards(IntegrationTestCase):
	def test_update_desk_settings_rejects_other_keys(self):
		from picasso.palette import update_desk_settings

		for key in ("flags", "owner", "save", "custom_css"):
			self.assertRaises(frappe.ValidationError, update_desk_settings, key=key, value=1)

	def test_undeclared_permission_method_is_not_run(self):
		from picasso import apps

		self.assertNotIn("frappe.ping", apps.allowed_permission_methods())
		doc = frappe._dict(app="frappe", has_permission_method="frappe.ping")
		self.assertFalse(apps._user_can_see(doc))

	def test_seeding_keeps_custom_palette_with_stock_title(self):
		from picasso import palette

		doc = frappe.get_doc("Picasso Palette", "Paper")
		doc.db_set({"is_system": 0, "accent_color": "#123456"})
		palette.seed_palettes()
		doc.reload()
		self.assertEqual((doc.is_system, doc.accent_color), (0, "#123456"))

	def test_settings_cache_is_not_filled_before_commit(self):
		from picasso.picasso.desk_settings import get_picasso_desk_settings

		get_picasso_desk_settings()
		frappe.get_single("Picasso Desk Settings").save()
		self.assertIsNone(frappe.cache.get_value("picasso_desk_settings"))

	def test_language_links_keep_redirect(self):
		values = {**login_settings._default_settings(), "enabled": 1, "show_language_switch": 1}
		set_request(method="GET", path="login", query_string={"redirect-to": "/desk/todo?a=1&b=2"})
		with (
			self.set_user("Guest"),
			patch("picasso.www.login.get_picasso_login_settings", lambda: values),
		):
			html = get_response_content("login")
		self.assertIn("?_lang=bn&amp;redirect-to=/desk/todo%3Fa%3D1%26b%3D2", html)

	def test_stock_palettes_have_readable_accent_ink(self):
		from picasso.palette import STOCK_PALETTES, _rgb, ink_on

		def luminance(color):
			channels = [c / 255 for c in _rgb(color)]
			r, g, b = (c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels)
			return 0.2126 * r + 0.7152 * g + 0.0722 * b

		def contrast(a, b):
			low, high = sorted((luminance(a), luminance(b)))
			return (high + 0.05) / (low + 0.05)

		for spec in STOCK_PALETTES:
			for key in ("accent_color", "dark_accent_color"):
				self.assertGreaterEqual(contrast(spec[key], ink_on(spec[key])), 4.5)
			for mode in ("light", "dark"):
				colors = login_settings._login_colors_from_palette(spec, mode)
				self.assertGreaterEqual(contrast(colors["muted_text_color"], colors["form_background"]), 4.5)
