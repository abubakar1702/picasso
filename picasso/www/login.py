# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe
from frappe.utils import cint
from frappe.www.login import get_context as frappe_get_context

from picasso.picasso.login_settings import get_picasso_login_settings

no_cache = True


def get_context(context):
	frappe_get_context(context)

	settings = get_picasso_login_settings()
	context["picasso_login"] = settings
	context["current_language"] = frappe.local.lang or "en"

	if settings.get("enabled"):
		# Drop Bootstrap .container so the login background can be full-bleed.
		context["full_width"] = 1
		context["no_header"] = True
		context["show_sidebar"] = 0

		if settings.get("logo"):
			context["logo"] = settings["logo"]

		if settings.get("show_login_with_email_link"):
			context["login_with_email_link"] = cint(
				frappe.get_system_settings("login_with_email_link")
			)
		else:
			context["login_with_email_link"] = 0

		if not settings.get("show_social_logins"):
			context["provider_logins"] = []
			context["social_login"] = False

	return context
