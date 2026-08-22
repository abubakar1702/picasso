(() => {
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

		const $btn = $(`
			<button type="button" class="btn btn-sm picasso-lang-switch" title="${__("Switch language")}">
				<span class="picasso-lang-switch__a ${is_b ? "" : "is-active"}">${frappe.utils.escape_html(label_a)}</span>
				<span class="picasso-lang-switch__sep">/</span>
				<span class="picasso-lang-switch__b ${is_b ? "is-active" : ""}">${frappe.utils.escape_html(label_b)}</span>
			</button>
		`);

		const $anchor = $(".dropdown-navbar-user").first();
		if ($anchor.length) {
			$btn.insertBefore($anchor);
		} else {
			$("header.navbar .navbar-collapse").append($btn);
		}

		$btn.on("click", () => {
			const next = ((frappe.boot && frappe.boot.lang) || lang_a) === lang_b ? lang_a : lang_b;

			// Show loading state to give user feedback.
			$btn.prop("disabled", true).css("opacity", "0.5");

			frappe.db
				.set_value("User", frappe.session.user, "language", next)
				.then((r) => {
					if (!r.exc) {
						frappe.ui.toolbar.clear_cache();
					}
				})
				.catch((err) => {
					// Restore button state if the call fails (e.g. permission denied).
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
	$(render_language_switch);
})();
