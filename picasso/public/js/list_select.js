(() => {
	const BTN = "picasso-clear-selected";
	function page_btn_label() {
		return __("Clear Selection");
	}

	function paint_clear(list) {
		if (!list || !list.$result) return;

		const count = (list.$checks && list.$checks.length) || 0;
		const $actions = list.$checkbox_actions || list.$result.find("header .checkbox-actions");
		if (!$actions.length) return;

		let $btn = $actions.find("." + BTN);
		if (!count) {
			$btn.remove();
			if (list._picasso_page_clear && list.page && list.page.remove_inner_button) {
				list.page.remove_inner_button(page_btn_label());
				list._picasso_page_clear = false;
			}
			return;
		}

		if (!$btn.length) {
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

		if (list.page && list.page.add_inner_button && !list._picasso_page_clear) {
			list.page.add_inner_button(page_btn_label(), () => {
				list.$result.find(".list-check-all, .list-row-checkbox").prop("checked", false);
				list.clear_checked_items();
			});
			const $page_btn = list.page.inner_toolbar.find(
				`button[data-label="${encodeURIComponent(page_btn_label())}"]`
			);
			if ($page_btn.length && frappe.utils && frappe.utils.icon) {
				$page_btn.prepend(frappe.utils.icon("close", "xs"));
			}
			list._picasso_page_clear = true;
		}
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
