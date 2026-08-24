app_name = "picasso"
app_title = "Picasso"
app_publisher = "Akash"
app_description = "Picasso will make the default frappe ui looks better."
app_email = "abubakar.akash17@gmail.com"
app_license = "mit"

# Desk theme is compiled from public/scss/picasso.bundle.scss
app_include_css = "picasso.bundle.css"
app_include_js = [
	"/assets/picasso/js/paint.js",
	"picasso.bundle.js",
	"/assets/picasso/js/desk_boot.js",
	"/assets/picasso/js/link_workspaces.js",
	"/assets/picasso/js/sidebar_active.js",
	"/assets/picasso/js/language_switch.js",
	"/assets/picasso/js/list_select.js",
	"/assets/picasso/js/report_filters.js",
]

# Installation
after_install = "picasso.setup.after_install"
after_migrate = "picasso.setup.after_migrate"
# Boot / request
extend_bootinfo = "picasso.boot.extend_bootinfo"
before_request = ["picasso.apps.before_request"]
update_website_context = ["picasso.apps.apps_context"]

# Overrides
override_whitelisted_methods = {
	"frappe.apps.get_apps": "picasso.apps.get_apps",
	"frappe.desk.query_report.get_script": "picasso.query_report.get_script",
}
