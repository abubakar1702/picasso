(() => {
	function visible($el) {
		return $el.length && $el.is(":visible");
	}

	function mount_target() {
		// Prefer a visible sidebar user menu (legacy + floating-dock desks).
		const $sidebar_user = $(".body-sidebar .dropdown-navbar-user").filter(":visible").first();
		if (visible($sidebar_user)) {
			return { $el: $sidebar_user, where: "before", surface: "sidebar" };
		}

		// Pinned dock hides sidebar user — mount above the dock avatar.
		const $dock_user = $(".dock .dock-user").filter(":visible").first();
		if (visible($dock_user)) {
			return { $el: $dock_user, where: "before", surface: "dock" };
		}

		const $dock_utils = $(".dock .dock-utilities").filter(":visible").first();
		if (visible($dock_utils)) {
			return { $el: $dock_utils, where: "append", surface: "dock" };
		}

		// Older desks with a classic top navbar.
		const $navbar = $("header.navbar .navbar-collapse").first();
		if ($navbar.length) {
			return { $el: $navbar, where: "append", surface: "navbar" };
		}

		// Last resort: any user dropdown (may be hidden on dock-pinned).
		const $any_user = $(".dropdown-navbar-user").first();
		if ($any_user.length) {
			return { $el: $any_user, where: "before", surface: "sidebar" };
		}

		return null;
	}

	function render_language_switch() {
		const desk = (frappe.boot && frappe.boot.picasso_desk) || {};
		if (!desk.enabled || !desk.show_language_switch) {
			return;
		}

		if (document.querySelector(".picasso-lang-switch")) {
			return;
		}

		const lang_a = desk.language_a || "en";
		const lang_b = desk.language_b || "bn";
		const label_a = desk.language_a_label || "EN";
		const label_b = desk.language_b_label || "বাং";
		const current = (frappe.boot && frappe.boot.lang) || lang_a;
		const is_b = current === lang_b;

		const target = mount_target();
		if (!target) {
			return;
		}

		const $btn = $(`
			<button type="button" class="btn btn-sm picasso-lang-switch" data-surface="${target.surface}" title="${__(
			"Switch language"
		)}">
				<span class="picasso-lang-switch__a ${is_b ? "" : "is-active"}">${frappe.utils.escape_html(label_a)}</span>
				<span class="picasso-lang-switch__sep">/</span>
				<span class="picasso-lang-switch__b ${is_b ? "is-active" : ""}">${frappe.utils.escape_html(label_b)}</span>
			</button>
		`);

		if (target.where === "append") {
			target.$el.append($btn);
		} else {
			$btn.insertBefore(target.$el);
		}

		$btn.on("click", () => {
			const next = ((frappe.boot && frappe.boot.lang) || lang_a) === lang_b ? lang_a : lang_b;

			$btn.prop("disabled", true).css("opacity", "0.5");

			frappe.db
				.set_value("User", frappe.session.user, "language", next)
				.then((r) => {
					if (!r.exc) {
						frappe.ui.toolbar.clear_cache();
					}
				})
				.catch((err) => {
					$btn.prop("disabled", false).css("opacity", "1");
					frappe.msgprint({
						title: __("Language Switch Failed"),
						indicator: "red",
						message: __("Could not switch language. Please try again."),
					});
					console.error("Picasso language switch error:", err);
				});
		});
	}

	$(document).on("app_ready", render_language_switch);
	$(document).on("page-change sidebar-expand", () => {
		if (!document.querySelector(".picasso-lang-switch")) {
			render_language_switch();
		}
	});
	$(render_language_switch);
})();
