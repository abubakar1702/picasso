(() => {
	const BTN_LABEL = "Reset Filters";

	function page_btn_label() {
		return __(BTN_LABEL);
	}

	function empty_value_for(df) {
		if (!df) return "";
		const fieldtype = df.fieldtype;
		if (fieldtype === "Check") return 0;
		if (
			fieldtype === "MultiSelectList" ||
			fieldtype === "MultiSelect" ||
			fieldtype === "Table MultiSelect"
		) {
			return [];
		}
		return "";
	}

	function normalize_value(val, fieldtype) {
		if (val === null || val === undefined) {
			if (fieldtype === "Check") return 0;
			if (
				fieldtype === "MultiSelectList" ||
				fieldtype === "MultiSelect" ||
				fieldtype === "Table MultiSelect"
			) {
				return [];
			}
			return "";
		}
		if (fieldtype === "Check") {
			return val ? 1 : 0;
		}
		if (
			fieldtype === "MultiSelectList" ||
			fieldtype === "MultiSelect" ||
			fieldtype === "Table MultiSelect"
		) {
			if (!Array.isArray(val)) {
				if (typeof val === "string" && val.trim()) {
					try {
						val = JSON.parse(val);
					} catch (e) {
						val = val.split(",").map((s) => s.trim()).filter(Boolean);
					}
				} else {
					val = [];
				}
			}
			return Array.isArray(val) ? val.filter(Boolean) : [];
		}
		if (typeof val === "string") {
			return val.trim();
		}
		return val;
	}

	function snapshot_defaults(report) {
		if (!report || !report.filters) return;
		report._picasso_defaults = report._picasso_defaults || {};
		report.filters.forEach((f) => {
			if (!f || !f.df || !f.df.fieldname) return;
			if (report._picasso_defaults[f.df.fieldname] === undefined) {
				let val = f.df.default;
				if (val === undefined || val === null) {
					if (typeof f.get_value === "function") {
						try {
							val = f.get_value();
						} catch (e) {
							val = undefined;
						}
					}
				}
				if (val === undefined || val === null) {
					val = empty_value_for(f.df);
				}
				report._picasso_defaults[f.df.fieldname] = val;
			}
		});
	}

	function is_field_active(f, report) {
		if (!f || !f.df || !f.df.fieldname) return false;

		let cur_val;
		if (typeof f.get_value === "function") {
			try {
				cur_val = f.get_value();
			} catch (e) {
				cur_val = f.value;
			}
		} else {
			cur_val = f.value;
		}

		const defaults = report._picasso_defaults || {};
		let def_val = Object.prototype.hasOwnProperty.call(defaults, f.df.fieldname)
			? defaults[f.df.fieldname]
			: f.df.default;

		const norm_cur = normalize_value(cur_val, f.df.fieldtype);
		const norm_def = normalize_value(def_val, f.df.fieldtype);

		return JSON.stringify(norm_cur) !== JSON.stringify(norm_def);
	}

	function has_active_filters(report) {
		if (!report || !report.filters || !report.filters.length) return false;
		return report.filters.some((f) => is_field_active(f, report));
	}

	function reset_filters(report) {
		if (!report || !report.filters || !report.filters.length) return;

		const defaults = report._picasso_defaults || {};
		report._no_refresh = true;

		const tasks = report.filters.map((f) => () => {
			if (!f || !f.df || !f.df.fieldname) return Promise.resolve();

			let target_val;
			if (
				f.df.default !== undefined &&
				f.df.default !== null &&
				f.df.default !== ""
			) {
				target_val = f.df.default;
			} else if (
				Object.prototype.hasOwnProperty.call(defaults, f.df.fieldname) &&
				defaults[f.df.fieldname] !== undefined &&
				defaults[f.df.fieldname] !== null
			) {
				target_val = defaults[f.df.fieldname];
			} else {
				target_val = empty_value_for(f.df);
			}

			try {
				if (typeof f.set_value === "function") {
					const res = f.set_value(target_val);
					if (res && typeof res.then === "function") {
						return res;
					}
				} else if (typeof f.set_input === "function") {
					f.set_input(target_val);
				}
			} catch (err) {
				console.error("Error resetting filter field:", f.df.fieldname, err);
			}
			return Promise.resolve();
		});

		return frappe.run_serially(tasks).then(() => {
			report._no_refresh = false;
			if (typeof report.refresh_filters_dependency === "function") {
				report.refresh_filters_dependency();
			}
			if (typeof report.refresh === "function") {
				report.refresh(true);
			}
			update_reset_button(report);
		});
	}

	function update_reset_button(report) {
		if (!report || !report.page || !report.filters || !report.filters.length) return;

		const page = report.page;
		const label = page_btn_label();
		const active = has_active_filters(report);

		let $btn = page.inner_toolbar
			? page.inner_toolbar.find(`button[data-label="${encodeURIComponent(label)}"]`)
			: $();

		if (!$btn.length && active && typeof page.add_inner_button === "function") {
			page.add_inner_button(label, () => {
				reset_filters(report);
			});
			$btn = page.inner_toolbar
				? page.inner_toolbar.find(`button[data-label="${encodeURIComponent(label)}"]`)
				: $();
			if ($btn.length && frappe.utils && frappe.utils.icon) {
				$btn.prepend(frappe.utils.icon("es-line-reload", "xs"));
			}
		}

		if ($btn.length) {
			$btn.toggle(active);
		}

		if (page.menu_btn_group) {
			const $menu_item = page.menu_btn_group
				.find(`a[data-label="${encodeURIComponent(label)}"]`)
				.parent();
			if ($menu_item.length) {
				$menu_item.toggle(active);
			}
		}
	}

	function attach_form_listeners(report) {
		if (!report || !report.page || !report.page.page_form) return;
		const $form = $(report.page.page_form);
		$form
			.off("change.picasso_reset input.picasso_reset")
			.on("change.picasso_reset input.picasso_reset", ".form-control, input, select", () => {
				window.setTimeout(() => update_reset_button(report), 50);
			});
	}

	function after_filters(report) {
		snapshot_defaults(report);
		attach_form_listeners(report);
		update_reset_button(report);
	}

	function wrap_query_report() {
		const Report = frappe.views && frappe.views.QueryReport;
		if (!Report || Report.prototype._picasso_reset_wrapped) return;

		const orig_setup = Report.prototype.setup_filters;
		if (typeof orig_setup === "function") {
			Report.prototype.setup_filters = function () {
				const res = orig_setup.apply(this, arguments);
				after_filters(this);
				return res;
			};
		}

		const orig_load = Report.prototype.load_report;
		if (typeof orig_load === "function") {
			Report.prototype.load_report = function () {
				const res = orig_load.apply(this, arguments);
				if (res && typeof res.then === "function") {
					return res.then(() => after_filters(this));
				}
				window.setTimeout(() => after_filters(this), 100);
				return res;
			};
		}

		const orig_refresh = Report.prototype.refresh_report;
		if (typeof orig_refresh === "function") {
			Report.prototype.refresh_report = function () {
				const res = orig_refresh.apply(this, arguments);
				if (res && typeof res.then === "function") {
					return res.then(() => update_reset_button(this));
				}
				window.setTimeout(() => update_reset_button(this), 100);
				return res;
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
		}, 150);
	});
})();
