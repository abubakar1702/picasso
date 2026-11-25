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
