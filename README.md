# Picasso

> Customize the Frappe Desk UI — login page, navbar, sidebar, list views, app screens, and more.

Picasso is a Frappe v16 app that lets administrators white-label and enhance the standard Frappe Desk experience without touching core code.

## Features

### 🎨 Desk Theme Customization
Pick a **Picasso Palette** in **Picasso Desk Settings** (colors live in the palette; stock palettes can be duplicated to customize):
- **Navbar** — gradient colors, text color
- **Sidebar** — gradient colors, text color, width, show/hide toggle
- **Page Canvas** — background color, page-head colors
- **List Views** — card, filter, header, hover, and border colors
- **Number Cards** — option to show full numbers (no truncation)
- **Custom CSS** — inject arbitrary CSS for advanced overrides
- **🌙 Dark Mode** — each palette carries its own dark colors, used when Frappe dark mode is active
- **📱 Mobile Responsive** — off-canvas drawer sidebar, compact navbar, and list optimization for tablets and phones

### 🔐 Custom Login Page
Configure from **Picasso Login Settings** (single doctype):
- Login shell that follows the active palette (light and dark), or custom colors
- Visual panel with image carousel and auto-play
- Video background support
- Custom branding (logo, heading, subheading)
- Configurable link chips (visual top / form footer)
- Copyright block
- Social login & email-link login toggles
- Language switcher on the login page

### 📱 App Screen Management
**Picasso App Screen** doctype:
- Rebrand, reorder or hide the apps Frappe lists
- Role-based visibility per app
- Permission methods declared by installed apps (`add_to_apps_screen` or `picasso_app_permission` hooks)
- Configurable sort order, logos, and home routes
- Auto-seeds common apps (Frappe, ERPNext, HRMS) on install

### 📊 Report Print Formats
**Picasso Report Print Format** doctype:
- Inject custom HTML print formats into Query Reports

### 🌐 Language Switcher
- Quick two-language toggle in the navbar
- Configurable language pair (default: EN / বাং)

### 🔗 Link Workspace Redirection
- Automatically redirect Link-type Workspaces to their target Page/DocType, and URL-type Workspaces to their link

## Hooks & Overrides

| Hook | Target |
|---|---|
| `extend_bootinfo` | Injects Picasso desk settings into boot |
| `before_request` | Loads `picasso.apps`, which wraps `frappe.apps.get_apps` / `get_route` |
| `update_website_context` | Customizes `/apps` page context |
| `override_whitelisted_methods` | `frappe.apps.get_apps`, `frappe.desk.query_report.get_script` |
| `after_install` / `after_migrate` | Seeds default App Screen entries and stock palettes |

## Installation

```bash
bench get-app picasso
bench --site your-site install-app picasso
```

## Configuration

1. Go to **Picasso Desk Settings** to enable and customize the desk theme
2. Go to **Picasso Login Settings** to enable and customize the login page
3. Create **Picasso App Screen** entries to customize the apps page

## License

MIT
