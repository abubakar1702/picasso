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
		const page = report.page;
		if (!page || !page.wrapper) return;

		// Never leave a copy in the filter form.
		page.page_form && page.page_form.find("." + BTN).remove();
		page.wrapper.find("." + BTN).remove();

		if (!report.filters || !report.filters.length) return;

		const icon =
			(frappe.utils && frappe.utils.icon && frappe.utils.icon("filter", "xs")) || "";
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

		// Page-head actions (same row as Refresh). Avoid inner_toolbar —
		// query reports call clear_custom_actions() after filters setup.
		const $primary = page.btn_primary;
		if ($primary && $primary.length) {
			$btn.insertBefore($primary);
			return;
		}
		const $actions = page.page_actions && page.page_actions.find(".standard-actions");
		if ($actions && $actions.length) {
			$actions.prepend($btn);
			return;
		}
		page.page_actions && page.page_actions.prepend($btn);
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
		const orig_head = Report.prototype.setup_page_head;
		if (typeof orig_head === "function") {
			Report.prototype.setup_page_head = function () {
				orig_head.apply(this, arguments);
				add_button(this);
			};
		}
		const orig_refresh = Report.prototype.refresh_report;
		if (typeof orig_refresh === "function") {
			Report.prototype.refresh_report = function () {
				const result = orig_refresh.apply(this, arguments);
				if (result && typeof result.then === "function") {
					return result.then(() => add_button(this));
				}
				add_button(this);
				return result;
			};
		}
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
