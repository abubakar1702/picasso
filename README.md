# Picasso

> Customize the Frappe Desk UI — login page, navbar, sidebar, list views, app screens, and more.

Picasso is a Frappe v16 app that lets administrators white-label and enhance the standard Frappe Desk experience without touching core code.

## Features

### 🎨 Desk Theme Customization
Configure from **Picasso Desk Settings** (single doctype):
- **Navbar** — gradient colors, text color
- **Sidebar** — gradient colors, text color, width, show/hide toggle
- **Page Canvas** — background color, page-head colors
- **List Views** — card, filter, header, hover, and border colors
- **Number Cards** — option to show full numbers (no truncation)
- **Custom CSS** — inject arbitrary CSS for advanced overrides
- **App Logo & Favicon** — override the sidebar/navbar brand logo and browser tab favicon
- **🌙 Dark Mode** — auto-adapts dark surfaces derived from accent color when Frappe dark mode is active
- **📱 Mobile Responsive** — off-canvas drawer sidebar, compact navbar, and list optimization for tablets and phones

### 🔐 Custom Login Page
Configure from **Picasso Login Settings** (single doctype):
- Dark-themed login shell with configurable colors
- Visual panel with image carousel and auto-play
- Video background support
- Custom branding (logo, heading, subheading)
- Configurable link chips (visual top / form footer)
- Copyright block
- Social login & email-link login toggles
- Language switcher on the login page

### 📱 App Screen Management
**Picasso App Screen** doctype:
- Replace the stock `/apps` page with custom app tiles
- Role-based visibility per app
- Custom permission methods
- Configurable sort order, logos, and home routes
- Auto-seeds common apps (Frappe, ERPNext, HRMS, ThriveHR) on install

### 📊 Report Print Formats
**Picasso Report Print Format** doctype:
- Inject custom HTML print formats into Query Reports

### 🌐 Language Switcher
- Quick two-language toggle in the navbar
- Configurable language pair (default: EN / বাং)

### 🔗 Link Workspace Redirection
- Automatically redirect Link-type Workspaces to their target Page/DocType

## Hooks & Overrides

| Hook | Target |
|---|---|
| `extend_bootinfo` | Injects Picasso desk settings into boot |
| `before_request` | Monkey-patches `frappe.apps.get_apps` |
| `update_website_context` | Customizes `/apps` page context |
| `override_whitelisted_methods` | `frappe.apps.get_apps`, `frappe.desk.query_report.get_script` |
| `after_install` / `after_migrate` | Seeds default App Screen entries |

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
