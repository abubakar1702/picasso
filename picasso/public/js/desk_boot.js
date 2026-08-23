(() => {
	// Track the last-applied settings hash to skip redundant re-applies.
	let _lastAppliedHash = null;

	const PALETTE_TOKENS = {
		Paper: {
			"--picasso-light-accent": "#2563EB",
			"--picasso-light-navbar-start": "#FFFFFF",
			"--picasso-light-navbar-end": "#FFFFFF",
			"--picasso-light-navbar-text": "#1F2937",
			"--picasso-light-sidebar-start": "#F8F9FA",
			"--picasso-light-sidebar-end": "#F8F9FA",
			"--picasso-light-sidebar-text": "#1F2937",
			"--picasso-light-page-bg": "#F4F5F8",
			"--picasso-light-page-head-bg": "#FFFFFF",
			"--picasso-light-page-head-text": "#1F2937",
			"--picasso-light-page-head-sep": "#C4B5A0",
			"--picasso-dark-accent": "#2563EB",
			"--picasso-dark-navbar-start": "#13151C",
			"--picasso-dark-navbar-end": "#13151C",
			"--picasso-dark-navbar-text": "#E5E7EB",
			"--picasso-dark-sidebar-start": "#13151C",
			"--picasso-dark-sidebar-end": "#13151C",
			"--picasso-dark-sidebar-text": "#E5E7EB",
			"--picasso-dark-page-bg": "#0F1117",
			"--picasso-dark-page-head-bg": "#1A1C24",
			"--picasso-dark-page-head-text": "#E5E7EB",
		},
		Coast: {
			"--picasso-light-accent": "#0284C7",
			"--picasso-light-navbar-start": "#E8F4FB",
			"--picasso-light-navbar-end": "#D9EEF8",
			"--picasso-light-navbar-text": "#0F3A4A",
			"--picasso-light-sidebar-start": "#F3F8FC",
			"--picasso-light-sidebar-end": "#EAF3F9",
			"--picasso-light-sidebar-text": "#164E63",
			"--picasso-light-page-bg": "#F4F8FB",
			"--picasso-light-page-head-bg": "#F7FBFD",
			"--picasso-light-page-head-text": "#0F3A4A",
			"--picasso-dark-accent": "#38BDF8",
			"--picasso-dark-navbar-start": "#0C1924",
			"--picasso-dark-navbar-end": "#0C1924",
			"--picasso-dark-navbar-text": "#E0F2FE",
			"--picasso-dark-sidebar-start": "#0F2433",
			"--picasso-dark-sidebar-end": "#0F2433",
			"--picasso-dark-sidebar-text": "#E0F2FE",
			"--picasso-dark-page-bg": "#0A1218",
			"--picasso-dark-page-head-bg": "#12202C",
			"--picasso-dark-page-head-text": "#E0F2FE",
		},
		Sky: {
			"--picasso-light-accent": "#0284C7",
			"--picasso-light-navbar-start": "#E8F4FB",
			"--picasso-light-navbar-end": "#D9EEF8",
			"--picasso-light-navbar-text": "#0F3A4A",
			"--picasso-light-sidebar-start": "#F3F8FC",
			"--picasso-light-sidebar-end": "#EAF3F9",
			"--picasso-light-sidebar-text": "#164E63",
			"--picasso-light-page-bg": "#F4F8FB",
			"--picasso-light-page-head-bg": "#F7FBFD",
			"--picasso-light-page-head-text": "#0F3A4A",
			"--picasso-dark-accent": "#38BDF8",
			"--picasso-dark-navbar-start": "#0C1924",
			"--picasso-dark-navbar-end": "#0C1924",
			"--picasso-dark-navbar-text": "#E0F2FE",
			"--picasso-dark-sidebar-start": "#0F2433",
			"--picasso-dark-sidebar-end": "#0F2433",
			"--picasso-dark-sidebar-text": "#E0F2FE",
			"--picasso-dark-page-bg": "#0A1218",
			"--picasso-dark-page-head-bg": "#12202C",
			"--picasso-dark-page-head-text": "#E0F2FE",
		},
		Ink: {
			"--picasso-light-accent": "#6366F1",
			"--picasso-light-navbar-start": "#0B1220",
			"--picasso-light-navbar-end": "#111827",
			"--picasso-light-navbar-text": "#F8FAFC",
			"--picasso-light-sidebar-start": "#111827",
			"--picasso-light-sidebar-end": "#0B1220",
			"--picasso-light-sidebar-text": "#E0E7FF",
			"--picasso-light-page-bg": "#F4F4F7",
			"--picasso-light-page-head-bg": "#F8F8FC",
			"--picasso-light-page-head-text": "#111827",
			"--picasso-dark-accent": "#818CF8",
			"--picasso-dark-navbar-start": "#070B14",
			"--picasso-dark-navbar-end": "#070B14",
			"--picasso-dark-navbar-text": "#E0E7FF",
			"--picasso-dark-sidebar-start": "#0B1220",
			"--picasso-dark-sidebar-end": "#0B1220",
			"--picasso-dark-sidebar-text": "#E0E7FF",
			"--picasso-dark-page-bg": "#07070C",
			"--picasso-dark-page-head-bg": "#0F172A",
			"--picasso-dark-page-head-text": "#E0E7FF",
		},
		Sand: {
			"--picasso-light-accent": "#C2410C",
			"--picasso-light-navbar-start": "#F5EDE0",
			"--picasso-light-navbar-end": "#EFE4D1",
			"--picasso-light-navbar-text": "#3F2E1F",
			"--picasso-light-sidebar-start": "#FAF6F1",
			"--picasso-light-sidebar-end": "#F3EDE3",
			"--picasso-light-sidebar-text": "#4A3424",
			"--picasso-light-page-bg": "#F7F1E8",
			"--picasso-light-page-head-bg": "#FBF7EC",
			"--picasso-light-page-head-text": "#3F2E1F",
			"--picasso-dark-accent": "#FB923C",
			"--picasso-dark-navbar-start": "#2A2118",
			"--picasso-dark-navbar-end": "#2A2118",
			"--picasso-dark-navbar-text": "#F5EDE0",
			"--picasso-dark-sidebar-start": "#1C1814",
			"--picasso-dark-sidebar-end": "#1C1814",
			"--picasso-dark-sidebar-text": "#F5EDE0",
			"--picasso-dark-page-bg": "#16110C",
			"--picasso-dark-page-head-bg": "#241910",
			"--picasso-dark-page-head-text": "#F5EDE0",
		},
		Forest: {
			"--picasso-light-accent": "#15803D",
			"--picasso-light-navbar-start": "#ECF4ED",
			"--picasso-light-navbar-end": "#E2EEE4",
			"--picasso-light-navbar-text": "#14532D",
			"--picasso-light-sidebar-start": "#F3F7F4",
			"--picasso-light-sidebar-end": "#EAF3EC",
			"--picasso-light-sidebar-text": "#14532D",
			"--picasso-light-page-bg": "#F3F7F4",
			"--picasso-light-page-head-bg": "#F7FBF8",
			"--picasso-light-page-head-text": "#14532D",
			"--picasso-dark-accent": "#4ADE80",
			"--picasso-dark-navbar-start": "#14241A",
			"--picasso-dark-navbar-end": "#14241A",
			"--picasso-dark-navbar-text": "#DCFCE7",
			"--picasso-dark-sidebar-start": "#0F1A14",
			"--picasso-dark-sidebar-end": "#0F1A14",
			"--picasso-dark-sidebar-text": "#DCFCE7",
			"--picasso-dark-page-bg": "#0C1410",
			"--picasso-dark-page-head-bg": "#14241A",
			"--picasso-dark-page-head-text": "#DCFCE7",
		},
		Slate: {
			"--picasso-light-accent": "#334155",
			"--picasso-light-navbar-start": "#F1F5F9",
			"--picasso-light-navbar-end": "#E2E8F0",
			"--picasso-light-navbar-text": "#0F172A",
			"--picasso-light-sidebar-start": "#F8FAFC",
			"--picasso-light-sidebar-end": "#F1F5F9",
			"--picasso-light-sidebar-text": "#1E293B",
			"--picasso-light-page-bg": "#F8FAFC",
			"--picasso-light-page-head-bg": "#FFFFFF",
			"--picasso-light-page-head-text": "#0F172A",
			"--picasso-dark-accent": "#94A3B8",
			"--picasso-dark-navbar-start": "#1E293B",
			"--picasso-dark-navbar-end": "#1E293B",
			"--picasso-dark-navbar-text": "#F1F5F9",
			"--picasso-dark-sidebar-start": "#0F172A",
			"--picasso-dark-sidebar-end": "#0F172A",
			"--picasso-dark-sidebar-text": "#F1F5F9",
			"--picasso-dark-page-bg": "#020617",
			"--picasso-dark-page-head-bg": "#1E293B",
			"--picasso-dark-page-head-text": "#F1F5F9",
		},
	};


	function _settingsHash(desk) {
		try {
			return JSON.stringify(desk);
		} catch (e) {
			return null;
		}
	}

	function is_dark_mode() {
		const root = document.documentElement;
		const body = document.body;
		const theme = (
			root.getAttribute("data-theme") ||
			(body && body.getAttribute("data-theme")) ||
			""
		).toLowerCase();
		const themeMode = (
			root.getAttribute("data-theme-mode") ||
			(body && body.getAttribute("data-theme-mode")) ||
			""
		).toLowerCase();
		const bsTheme = (
			root.getAttribute("data-bs-theme") ||
			(body && body.getAttribute("data-bs-theme")) ||
			""
		).toLowerCase();

		// Frappe "Automatic" keeps data-theme="automatic" until set_theme() resolves it.
		if (theme === "automatic" || themeMode === "automatic") {
			return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
		}

		return (
			theme === "dark" ||
			theme === "night" ||
			themeMode === "dark" ||
			bsTheme === "dark" ||
			root.classList.contains("dark") ||
			(body && body.classList.contains("dark"))
		);
	}

	function apply_desk_theme() {
		const desk = (frappe.boot && frappe.boot.picasso_desk) || {};
		const root = document.documentElement;

		if (!desk.enabled) {
			root.classList.remove("picasso-desk-theme");
			root.classList.remove("picasso-dark-theme");
			root.classList.remove("picasso-hide-sidebar");
			root.classList.remove("picasso-full-number-card");
			root.classList.remove("picasso-enhanced-list");
			const old = document.getElementById("picasso-custom");
			if (old) old.remove();
			_lastAppliedHash = null;
			if (window.picassoPaint) {
				window.picassoPaint.remember({ enabled: false }, {}, {});
			}
			return;
		}

		// Class hook for Automatic theme before Frappe resolves data-theme.
		root.classList.toggle("picasso-dark-theme", is_dark_mode());

		const hash = _settingsHash(desk);
		if (hash && hash === _lastAppliedHash) {
			return;
		}
		_lastAppliedHash = hash;

		root.classList.add("picasso-desk-theme");

		// Source tokens only. Active aliases (--bg-color, --card-bg, --surface-menu-bar,
		// --picasso-page-bg, …) are remapped in CSS from [data-theme]. Writing those
		// here as inline styles would beat the dark remaps.
		const tokens = {
			"--picasso-light-accent": desk.accent_color || "#2563eb",
			"--picasso-light-navbar-start": desk.navbar_color_start || "#FFFFFF",
			"--picasso-light-navbar-end": desk.navbar_color_end || "#FFFFFF",
			"--picasso-light-navbar-text": desk.navbar_text_color || "#1F2937",
			"--picasso-light-sidebar-start": desk.sidebar_color_start || "#F8F9FA",
			"--picasso-light-sidebar-end": desk.sidebar_color_end || "#F8F9FA",
			"--picasso-light-sidebar-text": desk.sidebar_text_color || "#1F2937",
			"--picasso-light-page-bg": desk.page_background || "#F4F5F8",
			"--picasso-light-page-head-bg": desk.page_head_background || "#FFFFFF",
			"--picasso-light-page-head-text": desk.page_head_text_color || "#1F2937",
			"--picasso-light-page-head-sep": desk.page_head_separator_color || "#C4B5A0",
			"--picasso-light-list-card-bg": desk.list_card_background || "#FFFFFF",
			"--picasso-light-list-filter-bg": desk.list_filter_background || "#FFFFFF",
			"--picasso-light-list-header-bg": desk.list_header_background || "#F3F4F6",
			"--picasso-light-list-hover-bg": desk.list_row_hover_background || "#F3F4F6",
			"--picasso-light-list-border": desk.list_border_color || "#E5E7EB",
			"--picasso-light-sidebar-hover": desk.sidebar_hover_background || "#EEF2FF",
			"--picasso-light-sidebar-selected": desk.sidebar_selected_background || "#DBEAFE",
			"--picasso-light-shadow": desk.shadow_color || "#0F172A",
			"--picasso-dark-accent": desk.dark_accent_color || "#2563EB",
			"--picasso-dark-navbar-start": desk.dark_navbar_color_start || "#13151C",
			"--picasso-dark-navbar-end": desk.dark_navbar_color_end || "#13151C",
			"--picasso-dark-navbar-text": desk.dark_navbar_text_color || "#E5E7EB",
			"--picasso-dark-sidebar-start": desk.dark_sidebar_color_start || "#13151C",
			"--picasso-dark-sidebar-end": desk.dark_sidebar_color_end || "#13151C",
			"--picasso-dark-sidebar-text": desk.dark_sidebar_text_color || "#E5E7EB",
			"--picasso-dark-page-bg": desk.dark_page_background || "#0F1117",
			"--picasso-dark-page-head-bg": desk.dark_page_head_background || "#1A1C24",
			"--picasso-dark-page-head-text": desk.dark_page_head_text_color || "#E5E7EB",
			"--picasso-dark-page-head-sep": desk.dark_page_head_separator_color || "#9CA3AF",
			"--picasso-dark-list-card-bg": desk.dark_list_card_background || "#1A1C24",
			"--picasso-dark-list-filter-bg": desk.dark_list_filter_background || "#1A1C24",
			"--picasso-dark-list-header-bg": desk.dark_list_header_background || "#22252E",
			"--picasso-dark-list-hover-bg": desk.dark_list_row_hover_background || "#2A2D38",
			"--picasso-dark-list-border": desk.dark_list_border_color || "#2A2D38",
			"--picasso-dark-sidebar-hover": desk.dark_sidebar_hover_background || "#1E293B",
			"--picasso-dark-sidebar-selected": desk.dark_sidebar_selected_background || "#1E3A5F",
			"--picasso-dark-shadow": desk.dark_shadow_color || "#000000",
			"--picasso-surface-radius": `${desk.surface_radius || 8}px`,
			"--picasso-sidebar-width": `${desk.sidebar_width || 240}px`,
		};
		const studio = (frappe.boot && frappe.boot.picasso_studio) || {};
		const userPal = studio.palette || (window.picassoPaint && window.picassoPaint.read()?.studio?.palette);
		if (userPal && PALETTE_TOKENS[userPal]) {
			Object.assign(tokens, PALETTE_TOKENS[userPal]);
		}

		if (studio.accent) {
			root.style.setProperty("--picasso-light-accent", studio.accent);
			root.style.setProperty("--picasso-dark-accent", studio.accent);
			tokens["--picasso-light-accent"] = studio.accent;
			tokens["--picasso-dark-accent"] = studio.accent;
		}

		Object.entries(tokens).forEach(([name, value]) => {
			root.style.setProperty(name, value);
		});

		if (window.picassoPaint) {
			window.picassoPaint.remember(desk, tokens, studio);
		}

		root.classList.toggle("picasso-hide-sidebar", !desk.show_left_sidebar);
		root.classList.toggle(
			"picasso-full-number-card",
			!!desk.show_full_number_in_number_card
		);
		root.classList.toggle("picasso-enhanced-list", !!desk.enhance_list_ui);

		// NOTE: custom_css is admin-only content injected via textContent (not innerHTML),
		// so script injection is not possible. CSS-based data exfiltration is a theoretical
		// risk in multi-tenant setups but is mitigated by admin-only access.
		let style = document.getElementById("picasso-custom");
		if (desk.custom_css) {
			if (!style) {
				style = document.createElement("style");
				style.id = "picasso-custom";
				document.head.appendChild(style);
			}
			style.textContent = desk.custom_css;
		} else if (style) {
			style.remove();
		}
	}

	// Debounce: coalesce multiple rapid events into a single rAF apply.
	let _rafPending = false;
	function schedule_apply() {
		if (_rafPending) return;
		_rafPending = true;
		window.requestAnimationFrame(() => {
			_rafPending = false;
			apply_desk_theme();
		});
	}

	$(schedule_apply);
	$(document).on("app_ready", schedule_apply);
	$(document).on("toolbar_setup", schedule_apply);
	$(document).on("page-change", schedule_apply);

	// Frappe switches theme by mutating data-theme on <html>. CSS remaps
	// tokens from that attribute; we only toggle picasso-dark-theme for Automatic.
	const _themeObserver = new MutationObserver(() => schedule_apply());
	_themeObserver.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["data-theme", "data-theme-mode", "data-bs-theme"],
	});
	if (window.matchMedia) {
		window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", schedule_apply);
	}
})();
