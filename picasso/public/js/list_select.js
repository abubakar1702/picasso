(() => {
	const BTN = "picasso-clear-selected";

	function paint_clear(list) {
		if (!list || !list.$result) return;

		const desk = (frappe.boot && frappe.boot.picasso_desk) || {};
		const count = (list.$checks && list.$checks.length) || 0;
		const $actions = list.$checkbox_actions || list.$result.find("header .checkbox-actions");
		if (!$actions.length) return;

		let $btn = $actions.find("." + BTN);
		if (!count || !desk.enabled) {
			$btn.remove();
			return;
		}

		if ($btn.length) return;

		const icon =
			(frappe.utils && frappe.utils.icon && frappe.utils.icon("close", "xs")) || "";
		$btn = $(
			`<button type="button" class="btn btn-default btn-xs ${BTN}" title="${__(
				"Clear Selection"
			)}">
				${icon}<span>${__("Clear")}</span>
			</button>`
		);
		$btn.on("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			list.$result.find(".list-check-all, .list-row-checkbox").prop("checked", false);
			list.clear_checked_items();
		});
		const $meta = $actions.find(".list-header-meta");
		if ($meta.length) $meta.after($btn);
		else $actions.find(".list-subject").append($btn);
	}

	function wrap_list_view() {
		const View = frappe.views && frappe.views.ListView;
		if (!View || View.prototype._picasso_clear_wrapped) return;
		const orig = View.prototype.on_row_checked;
		if (typeof orig !== "function") return;
		View.prototype.on_row_checked = function () {
			orig.apply(this, arguments);
			paint_clear(this);
		};
		View.prototype._picasso_clear_wrapped = true;
	}

	$(document).on("app_ready", wrap_list_view);
	$(document).on("page-change", () => {
		window.setTimeout(() => {
			wrap_list_view();
			if (window.cur_list) paint_clear(window.cur_list);
		}, 50);
	});
})();
