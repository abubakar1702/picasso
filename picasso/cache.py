# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

import frappe


def _clear():
	frappe.cache.delete_value("picasso_desk_settings")
	frappe.cache.delete_value("picasso_login_settings")
	frappe.cache.delete_keys("bootinfo")


def clear_settings_cache():
	"""Drop cached settings now, and again once the transaction ends.

	Another request can refill the cache from the old (or a later rolled back) state
	while this transaction is open, so the second clear is what makes it correct.
	"""
	_clear()
	frappe.db.after_commit.add(_clear)
	frappe.db.after_rollback.add(_clear)
