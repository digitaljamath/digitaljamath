/**
 * Desk white-label + navigation helpers for Digital Jamath.
 */
(function () {
  const BRAND = "Digital Jamath";
  const HUB = "/app/digital-jamath";
  const V = "20260910i";
  const LOGO_MARK = "/assets/digital_jamath/images/logo-mark.png?v=" + V;
  const LOGO_LOCKUP = "/assets/digital_jamath/images/logo-lockup.png?v=" + V;
  const FAVICON_ICO = "/assets/digital_jamath/images/favicon.ico?v=" + V;
  const FAVICON_SVG = "/assets/digital_jamath/images/favicon.svg?v=" + V;
  const FAVICON_PNG = "/assets/digital_jamath/images/icon-32.png?v=" + V;
  const APPLE = "/assets/digital_jamath/images/apple-touch-icon.png?v=" + V;

  function setFavicons() {
    const head = document.head || document.getElementsByTagName("head")[0];
    if (!head) return;

    // Remove stock Frappe / stale icons
    head.querySelectorAll('link[rel*="icon"], link[rel="apple-touch-icon"]').forEach((el) => {
      const href = el.getAttribute("href") || "";
      if (!href.includes("digital_jamath") || !href.includes("v=" + V)) {
        el.remove();
      }
    });

    function add(rel, href, type, sizes) {
      if (head.querySelector('link[rel="' + rel + '"][href="' + href + '"]')) return;
      const link = document.createElement("link");
      link.rel = rel;
      link.href = href;
      if (type) link.type = type;
      if (sizes) link.setAttribute("sizes", sizes);
      head.appendChild(link);
    }

    add("icon", FAVICON_SVG, "image/svg+xml");
    add("icon", FAVICON_PNG, "image/png", "32x32");
    add("shortcut icon", FAVICON_ICO, "image/x-icon");
    add("apple-touch-icon", APPLE, null, "180x180");
  }

  function retitleLogin() {
    const onLogin =
      (document.body && document.body.getAttribute("data-path") === "login") ||
      (document.body && document.body.classList.contains("login")) ||
      !!document.querySelector(".for-login, #page-login");
    if (!onLogin) return;
    document.title = "Login · " + BRAND;

    // Prefer lockup on login (readable brand name)
    document.querySelectorAll(".page-card-head .app-logo, .for-login img.app-logo").forEach((img) => {
      img.setAttribute("src", LOGO_LOCKUP);
      img.setAttribute("alt", BRAND);
    });

    document.querySelectorAll(".page-card-head h4, .for-login .page-card-head .title, .login-content .page-card-head").forEach((el) => {
      if (/frappe|erpnext|digital jamath/i.test(el.textContent || "") || !(el.textContent || "").trim()) {
        el.textContent = "Login to " + BRAND;
      }
    });
    document.querySelectorAll("h1, h2, h3, h4, p, span, a, button, label").forEach((el) => {
      if (!el.children.length && /^(Login to )?Frappe$/i.test((el.textContent || "").trim())) {
        el.textContent = el.textContent.replace(/Frappe/i, BRAND);
      }
      if (!el.children.length && /Create a Frappe Account/i.test(el.textContent || "")) {
        el.textContent = "Create a Digital Jamath Account";
      }
    });
  }

  function retitleDesk() {
    if (window.frappe && frappe.boot) {
      frappe.boot.app_name = BRAND;
      frappe.boot.app_logo_url = LOGO_MARK;
      if (frappe.boot.sysdefaults) {
        frappe.boot.sysdefaults.app_name = BRAND;
      }
    }
    if (document.title && /frappe|erpnext/i.test(document.title)) {
      document.title = document.title.replace(/frappe|erpnext/gi, BRAND);
    }
  }

  function pinNavbarLogo() {
    document.querySelectorAll("a.navbar-brand img, a.navbar-home img, img.app-logo, .navbar .app-logo").forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (!src.includes("digital_jamath") || src.includes("logo.svg")) {
        img.setAttribute("src", LOGO_MARK);
      }
      img.setAttribute("alt", BRAND);
    });
  }

  function pinNavbarHome() {
    const brand = document.querySelector("a.navbar-brand, a.navbar-home");
    if (brand) {
      brand.setAttribute("href", HUB);
      brand.setAttribute("title", BRAND + " home");
    }
    pinNavbarLogo();
  }

  /** Breadcrumb escape hatch when List views omit the workspace crumb. */
  function ensureHubCrumb() {
    const bar = document.querySelector(".navbar .breadcrumb, .navbar .breadcrumbs, #navbar-breadcrumbs");
    if (!bar) return;
    if (bar.querySelector("[data-dj-hub]")) return;

    const path = (window.location && window.location.pathname) || "";
    if (path === HUB || path === "/app" || path === "/app/") return;
    if (!path.startsWith("/app/")) return;

    const hub = document.createElement("li");
    hub.setAttribute("data-dj-hub", "1");
    hub.innerHTML = '<a href="' + HUB + '">' + BRAND + "</a>";
    bar.insertBefore(hub, bar.firstChild);
  }

  function hideHelpLinks() {
    document.querySelectorAll("a[href*='frappeframework'], a[href*='erpnext.com'], a[href*='frappe.io']").forEach((a) => {
      const li = a.closest("li") || a;
      li.style.display = "none";
    });
  }

  function rebrandAboutApps() {
    // About / Installed Apps dialog labels
    document.querySelectorAll(".about-content, .modal-about, .frappe-about").forEach((box) => {
      box.querySelectorAll("h4, h3, p, span, a").forEach((el) => {
        if (!el.children.length && /frappe framework/i.test(el.textContent || "")) {
          el.textContent = (el.textContent || "").replace(/Frappe Framework/gi, BRAND);
        }
      });
    });
  }

  function showTrialBanner() {
    if (!window.frappe || !frappe.boot || !frappe.boot.dj_cloud_trial) return;
    const t = frappe.boot.dj_cloud_trial;
    if (!t || t.status === "none" || t.status === "admin" || t.status === "Active") return;
    if (document.getElementById("dj-trial-banner")) return;

    const bar = document.createElement("div");
    bar.id = "dj-trial-banner";
    bar.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:9999;padding:10px 16px;font:600 13px/1.4 system-ui,sans-serif;text-align:center;";

    if (t.locked || t.status === "Expired") {
      bar.style.background = "#7f1d1d";
      bar.style.color = "#fff";
      bar.innerHTML =
        "Your free Cloud pilot has ended. Subscribe to keep hosting — " +
        '<a href="https://digitaljamath.com/cloud" style="color:#fde68a;text-decoration:underline">digitaljamath.com/cloud</a>' +
        " · salam@digitaljamath.com";
    } else if (t.status === "Trial") {
      const days = t.days_remaining != null ? t.days_remaining : "—";
      bar.style.background = "#0F5132";
      bar.style.color = "#fff";
      bar.innerHTML =
        "Cloud free pilot · " +
        days +
        " day(s) left · No credit card on file · " +
        '<a href="https://digitaljamath.com/cloud" style="color:#d1e7dd;text-decoration:underline">Plans after pilot</a>';
    } else {
      return;
    }

    document.body.prepend(bar);
    document.body.style.paddingTop = "42px";
  }

  function wireRouteHooks() {
    if (!window.frappe || !frappe.router || frappe.router.__dj_nav_wired) return;
    frappe.router.__dj_nav_wired = true;
    frappe.router.on("change", () => {
      pinNavbarHome();
      setTimeout(ensureHubCrumb, 50);
      setTimeout(ensureHubCrumb, 300);
      setTimeout(rebrandAboutApps, 200);
    });
  }

  function fixWebFormTitleLeak() {
    // Jinja DebugUndefined leak: literal "{{ web_form_title }}"
    document.querySelectorAll(".web-form-title h1, .web-form-head h1").forEach((el) => {
      const t = (el.textContent || "").trim();
      if (t === "{{ web_form_title }}" || t === "{{web_form_title}}") {
        const sub = document.querySelector(".web-form-title p, .web-form-head p");
        el.textContent = (sub && sub.textContent.trim()) || "Address";
      }
    });
  }

  function boot() {
    setFavicons();
    retitleLogin();
    retitleDesk();
    hideHelpLinks();
    showTrialBanner();
    pinNavbarHome();
    ensureHubCrumb();
    rebrandAboutApps();
    fixWebFormTitleLeak();
  }

  document.addEventListener("DOMContentLoaded", boot);

  if (window.frappe && frappe.ready) {
    frappe.ready(() => {
      boot();
      wireRouteHooks();
    });
  }

  setTimeout(boot, 200);
  setTimeout(boot, 800);
  setTimeout(boot, 1600);
})();
