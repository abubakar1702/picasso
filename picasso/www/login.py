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
	context["login_redirect_to"] = frappe.local.request.args.get("redirect-to") or ""
	context["current_language"] = frappe.local.lang or "en"

	if settings.get("enabled"):
		# Drop Bootstrap .container so the login background can be full-bleed.
		context["full_width"] = 1
		context["no_header"] = True
		context["show_sidebar"] = 0

		if settings.get("logo"):
			context["logo"] = settings["logo"]

		_apply_login_methods(context, settings)

	return context


def _apply_login_methods(context, settings):
	"""Hide optional login methods, unless that would leave no way to sign in."""
	ldap = context.get("ldap_settings") or {}
	has_password = not cint(context.get("disable_user_pass_login")) or bool(ldap.get("enabled"))
	has_social = bool(context.get("provider_logins"))
	has_email_link = bool(cint(context.get("login_with_email_link")))

	show_social = has_social and bool(settings.get("show_social_logins"))
	show_email_link = has_email_link and bool(settings.get("show_login_with_email_link"))
	if not (has_password or show_social or show_email_link):
		show_social, show_email_link = has_social, has_email_link

	context["login_with_email_link"] = int(show_email_link)
	if not show_social:
		context["provider_logins"] = []
		context["social_login"] = False
