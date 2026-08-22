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

	function action_slot(page) {
		// Target the page header instead of the filter section
		if (page.page_head && page.page_head.length) {
			const $std = page.page_head.find(".standard-actions");
			if ($std.length) return $std;
			const $pa = page.page_head.find(".page-actions");
			if ($pa.length) return $pa;
		}
		const $head = $(document).find(".page-head .standard-actions").first();
		if ($head.length) return $head;
		const $headActions = $(document).find(".page-head .page-actions").first();
		if ($headActions.length) return $headActions;
		// Fallback to page-level actions
		if (page.page_actions && page.page_actions.length) return page.page_actions;
		if (page.standard_actions && page.standard_actions.length) return page.standard_actions;
		return null;
	}

	function add_button(report) {
		const page = report && report.page;
		if (!page) return;

		$(document)
			.find("." + BTN)
			.remove();
		if (!report.filters || !report.filters.length) return;

		const $slot = action_slot(page);
		if (!$slot || !$slot.length) return;

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

		const $primary =
			(page.btn_primary &&
				page.btn_primary.length &&
				$slot.has(page.btn_primary).length &&
				page.btn_primary) ||
			$slot.find(".primary-action").first();
		if ($primary && $primary.length) {
			$btn.insertBefore($primary);
		} else {
			$slot.prepend($btn);
		}
	}

	function after_filters(report) {
		snapshot_defaults(report);
		add_button(report);
	}

	function wrap_query_report() {
		const Report = frappe.views && frappe.views.QueryReport;
		if (!Report || Report.prototype._picasso_reset_wrapped) return;
		const orig = Report.prototype.setup_filters;
		if (typeof orig !== "function") return;
		Report.prototype.setup_filters = function () {
			orig.apply(this, arguments);
			after_filters(this);
		};
		const orig_refresh = Report.prototype.refresh_report;
		if (typeof orig_refresh === "function") {
			Report.prototype.refresh_report = function () {
				const result = orig_refresh.apply(this, arguments);
				const paint = () => after_filters(this);
				if (result && typeof result.then === "function") {
					return result.then(paint);
				}
				window.setTimeout(paint, 0);
				return result;
			};
		}
		Report.prototype._picasso_reset_wrapped = true;
	}

	$(document).on("app_ready", wrap_query_report);
	$(document).on("page-change", () => {
		window.setTimeout(() => {
			wrap_query_report();
			const report = window.frappe && frappe.query_report;
			if (report) after_filters(report);
		}, 200);
	});
})();
