# Copyright (c) 2026, Akash and contributors
# License: MIT. See LICENSE

from picasso.appearance import get_studio
from picasso.picasso.desk_settings import get_picasso_desk_settings
from picasso.picasso.doctype.picasso_quick_look.picasso_quick_look import allowed_doctypes


def extend_bootinfo(bootinfo):
	bootinfo["picasso_desk"] = get_picasso_desk_settings()
	bootinfo["picasso_studio"] = get_studio()
	bootinfo["picasso_quicklook"] = allowed_doctypes()
