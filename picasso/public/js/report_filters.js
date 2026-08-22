(() => {
	const BTN = "picasso-reset-filters";

	function empty_for(fieldtype) {
		if (fieldtype === "MultiSelectList") return [];
		if (fieldtype === "Check") return 0;
		return null;
	}

	function snapshot_defaults(report) {
		report._picasso_defaults = {};
		(report.filters || []).forEach((f) => {
			if (!f || !f.df) return;
			let value = f.df.default;
			if (typeof f.get_value === "function") {
				try {
					value = f.get_value();
				} catch (e) {
					value = f.df.default;
				}
			}
			if (value === undefined) value = empty_for(f.df.fieldtype);
			report._picasso_defaults[f.df.fieldname] = value;
		});
	}

	function reset_filters(report) {
		if (!report || !report.filters) return;
		const defaults = report._picasso_defaults || {};
		report._no_refresh = true;
		const tasks = report.filters.map((f) => () => {
			if (!f || !f.df) return;
			let value = Object.prototype.hasOwnProperty.call(defaults, f.df.fieldname)
				? defaults[f.df.fieldname]
				: f.df.default;
			if (value === undefined || value === null) value = empty_for(f.df.fieldtype);
			if (typeof f.set_value === "function") return f.set_value(value);
			if (typeof f.set_input === "function") f.set_input(value);
		});
		return frappe.run_serially(tasks).then(() => {
			report._no_refresh = false;
			if (typeof report.refresh === "function") report.refresh(true);
		});
	}

	function add_button(report) {
		if (!report.page || !report.page.page_form) return;
		const $form = report.page.page_form;
		$form.find("." + BTN).remove();
		if (!report.filters || !report.filters.length) return;

		const icon =
			(frappe.utils && frappe.utils.icon && frappe.utils.icon("filter", "sm")) || "";
		const $btn = $(
			`<button type="button" class="btn btn-default btn-sm ${BTN}" title="${__(
				"Reset filters to defaults"
			)}">
				${icon}<span>${__("Reset Filters")}</span>
			</button>`
		);
		$btn.on("click", (e) => {
			e.preventDefault();
			reset_filters(report);
		});
		$form.append($btn);
	}

	function wrap_query_report() {
		const Report = frappe.views && frappe.views.QueryReport;
		if (!Report || Report.prototype._picasso_reset_wrapped) return;
		const orig = Report.prototype.setup_filters;
		if (typeof orig !== "function") return;
		Report.prototype.setup_filters = function () {
			orig.apply(this, arguments);
			snapshot_defaults(this);
			add_button(this);
		};
		Report.prototype._picasso_reset_wrapped = true;
	}

	$(document).on("app_ready", wrap_query_report);
	$(document).on("page-change", () => {
		window.setTimeout(() => {
			wrap_query_report();
			if (window.frappe && frappe.query_report) {
				if (frappe.query_report._picasso_defaults) add_button(frappe.query_report);
			}
		}, 80);
	});
})();
