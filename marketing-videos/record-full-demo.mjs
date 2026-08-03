import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const bundledNodeModules = process.env.CODEX_NODE_MODULES ||
  "C:\\Users\\MARTINS JOHNSON\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules";
const require = createRequire(path.join(bundledNodeModules, "playwright", "package.json"));
const { chromium, devices } = require("playwright");

const baseUrl = process.env.DEMO_BASE_URL || "http://127.0.0.1:3000";
const password = process.env.DEMO_PASSWORD;
const outRoot = process.env.DEMO_OUT_DIR || path.join(process.cwd(), "marketing-videos", "full-demo");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join(outRoot, stamp);
const videoDir = path.join(outDir, "videos");
const shotDir = path.join(outDir, "screenshots");

const users = {
  admin: process.env.DEMO_ADMIN_EMAIL || "1702london@gmail.com",
  staff: process.env.DEMO_STAFF_EMAIL || "reshapednrevamped@gmail.com",
  family: process.env.DEMO_FAMILY_EMAIL || "ile.gbono@gmail.com",
  client: process.env.DEMO_CLIENT_EMAIL || "lawdaofficial@gmail.com",
};

if (!password) {
  console.error("Missing DEMO_PASSWORD environment variable.");
  process.exit(1);
}

fs.mkdirSync(videoDir, { recursive: true });
fs.mkdirSync(shotDir, { recursive: true });

const report = {
  startedAt: new Date().toISOString(),
  baseUrl,
  videos: [],
  flows: [],
  errors: [],
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeName(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function annotate(page, text) {
  await page.evaluate((label) => {
    let box = document.querySelector("[data-demo-annotation]");
    if (!box) {
      box = document.createElement("div");
      box.setAttribute("data-demo-annotation", "true");
      Object.assign(box.style, {
        position: "fixed",
        left: "24px",
        bottom: "24px",
        zIndex: "2147483647",
        maxWidth: "520px",
        padding: "12px 16px",
        borderRadius: "12px",
        background: "rgba(26, 60, 46, 0.94)",
        color: "white",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "16px",
        fontWeight: "700",
        boxShadow: "0 18px 50px rgba(0,0,0,.25)",
        pointerEvents: "none",
      });
      document.body.appendChild(box);
    }
    box.textContent = label;
  }, text);
}

async function markClick(page, selector) {
  const loc = page.locator(selector).first();
  if (!(await loc.count())) return false;
  const box = await loc.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 14 });
  }
  await loc.click({ timeout: 4000 });
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  return true;
}

async function clickByText(page, text) {
  const patterns = [
    `role=link[name*="${text}"i]`,
    `role=button[name*="${text}"i]`,
    `text=${text}`,
  ];
  for (const selector of patterns) {
    try {
      if (await markClick(page, selector)) return true;
    } catch {}
  }
  return false;
}

async function checkPage(page, flow, label, options = {}) {
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await sleep(900);
  const title = await page.title().catch(() => "");
  const url = page.url();
  const body = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
  const broken = /Application error|server-side exception|client-side exception|Unhandled Runtime Error/i.test(body);
  const unauthorized = options.protected !== false && /\/login(\?|$)|\/carer-login(\?|$)|\/family\/login(\?|$)|\/client\/login(\?|$)/.test(new URL(url).pathname + new URL(url).search);
  const screenshot = path.join(shotDir, `${safeName(flow)}-${safeName(label)}.png`);
  await page.screenshot({ path: screenshot, fullPage: false }).catch(() => {});
  const row = { flow, label, url, title, screenshot, ok: !broken && !unauthorized };
  report.flows.push(row);
  if (broken) report.errors.push({ flow, label, url, type: "application-error", body: body.slice(0, 800) });
  if (unauthorized) report.errors.push({ flow, label, url, type: "unexpected-login-redirect", body: body.slice(0, 400) });
  return row;
}

async function goto(page, flow, route, label, options = {}) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await annotate(page, label);
  return checkPage(page, flow, label, options);
}

async function wireDiagnostics(page, flow) {
  page.on("pageerror", (error) => {
    report.errors.push({ flow, type: "pageerror", url: page.url(), message: error.message, stack: error.stack });
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      report.errors.push({ flow, type: "console-error", url: page.url(), message: msg.text() });
    }
  });
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (url.includes("/_next/webpack-hmr") || url.startsWith("data:")) return;
    const failure = request.failure()?.errorText || "";
    if (failure === "net::ERR_ABORTED") return;
    report.errors.push({ flow, type: "requestfailed", url, failure: request.failure()?.errorText });
  });
  page.on("response", (response) => {
    const status = response.status();
    const url = response.url();
    if (status >= 500 && !url.includes("/_next/webpack-hmr")) {
      report.errors.push({ flow, type: "http-5xx", url, status });
    }
  });
}

async function login(page, flow, route, email, label) {
  await goto(page, flow, route, label, { protected: false });
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await annotate(page, `Signing in as ${flow}`);
  await page.locator('button[type="submit"], button:has-text("Sign in")').first().click();
  await page.waitForURL((url) => !url.pathname.endsWith("/login") && !url.pathname.endsWith("/carer-login") && !url.pathname.endsWith("/family/login") && !url.pathname.endsWith("/client/login"), { timeout: 12000 }).catch(() => {});
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await sleep(1800);
  await checkPage(page, flow, `${flow} signed in`);
}

async function finishContext(context, flow) {
  const pages = context.pages();
  await context.close();
  for (const page of pages) {
    const video = page.video();
    if (!video) continue;
    const raw = await video.path().catch(() => null);
    if (!raw || !fs.existsSync(raw)) continue;
    const target = path.join(videoDir, `${flow}.webm`);
    fs.copyFileSync(raw, target);
    report.videos.push({ flow, path: target });
  }
}

async function runDesktop(browser, flow, loginRoute, email, steps) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 980 },
    recordVideo: { dir: videoDir, size: { width: 1440, height: 980 } },
  });
  const page = await context.newPage();
  await wireDiagnostics(page, flow);
  await login(page, flow, loginRoute, email, `${flow} login`);
  await steps(page, flow);
  await annotate(page, `${flow} flow complete`);
  await sleep(1200);
  await finishContext(context, flow);
}

async function runMobile(browser, flow, loginRoute, email, steps) {
  const pixel = devices["Pixel 7"];
  const context = await browser.newContext({
    ...pixel,
    recordVideo: { dir: videoDir, size: { width: 420, height: 900 } },
    permissions: ["geolocation", "microphone"],
    geolocation: { latitude: 51.5074, longitude: -0.1278 },
  });
  const page = await context.newPage();
  await wireDiagnostics(page, flow);
  await login(page, flow, loginRoute, email, `${flow} mobile login`);
  await steps(page, flow);
  await annotate(page, `${flow} flow complete`);
  await sleep(1200);
  await finishContext(context, flow);
}

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  await runDesktop(browser, "admin-operations", "/login", users.admin, async (page, flow) => {
    const routes = [
      ["/dashboard", "Admin command centre"],
      ["/clients", "Client list and care visibility"],
      ["/staff", "Staff management"],
      ["/staff/compliance", "Staff compliance tracking"],
      ["/staff/training", "Training and development"],
      ["/rota", "Rota planning"],
      ["/visits", "Visit planning"],
      ["/devices", "Approved staff devices"],
      ["/incidents", "Incident management"],
      ["/safeguarding", "Safeguarding oversight"],
      ["/role-boundaries", "Role boundary monitoring"],
      ["/complaints", "Complaints governance"],
      ["/emergency", "Emergency information access"],
    ];
    for (const [route, label] of routes) await goto(page, flow, route, label);
    await clickByText(page, "Amelia");
    await annotate(page, "Client record: tabs, care plan, risks, medicines and family access");
    await sleep(1800);
    await checkPage(page, flow, "client detail clickthrough");
  });

  await runDesktop(browser, "admin-reports-compliance-billing", "/login", users.admin, async (page, flow) => {
    const routes = [
      ["/reports/dashboard", "Reports dashboard"],
      ["/reports/visits", "Visit reports"],
      ["/reports/clients", "Client reports"],
      ["/reports/staff", "Staff reports"],
      ["/reports/compliance", "Compliance reports"],
      ["/reports/financial", "Financial reports"],
      ["/compliance", "Compliance hub"],
      ["/compliance/cqc", "CQC evidence"],
      ["/compliance/evidence", "Live evidence packs"],
      ["/dashboard/billing", "Billing and Stripe plans"],
      ["/invoicing", "Invoicing"],
      ["/payroll", "Payroll"],
    ];
    for (const [route, label] of routes) await goto(page, flow, route, label);
  });

  await runMobile(browser, "staff-mobile-app", "/carer-login", users.staff, async (page, flow) => {
    const routes = [
      ["/carer", "Staff app home: shift, location and approved device"],
      ["/carer/rota", "Staff rota"],
      ["/carer/emar", "eMAR medicines"],
      ["/carer/logs", "Shift logs and voice notes"],
      ["/carer/handover", "Handover"],
      ["/carer/report", "Incidents and concerns"],
      ["/carer/my-documents", "My documents"],
      ["/carer/settings", "Settings and logout"],
      ["/carer/sos", "SOS lone worker safety"],
      ["/carer/offline", "Offline queue"],
    ];
    for (const [route, label] of routes) await goto(page, flow, route, label);
  });

  await runMobile(browser, "family-portal", "/family/login", users.family, async (page, flow) => {
    await checkPage(page, flow, "family landing/client access");
    for (const label of ["Overview", "Care Plan", "Medication", "Nutrition", "Documents", "Messages", "Notes"]) {
      await clickByText(page, label);
      await annotate(page, `Family portal: ${label}`);
      await sleep(800);
      await checkPage(page, flow, `family ${label}`);
    }
  });

  await runMobile(browser, "client-portal", "/client/login", users.client, async (page, flow) => {
    await checkPage(page, flow, "client landing/client rights");
    for (const label of ["Today", "My Care", "Medication", "History", "Rights", "Preferences", "Support"]) {
      await clickByText(page, label);
      await annotate(page, `Client portal: ${label}`);
      await sleep(800);
      await checkPage(page, flow, `client ${label}`);
    }
  });

  await browser.close();
  report.finishedAt = new Date().toISOString();
  const jsonPath = path.join(outDir, "full-demo-qa-report.json");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  const errorLines = report.errors.length
    ? report.errors.map((e) => `- ${e.flow}: ${e.type} ${e.status || ""} ${e.url || ""} ${e.message || e.failure || ""}`)
    : ["- None captured"];
  const md = [
    "# Careroot Full Demo QA Report",
    "",
    `Base URL: ${baseUrl}`,
    `Started: ${report.startedAt}`,
    `Finished: ${report.finishedAt}`,
    "",
    "## Videos",
    ...report.videos.map((v) => `- ${v.flow}: ${v.path}`),
    "",
    "## Errors",
    ...errorLines,
    "",
    "## Pages Checked",
    ...report.flows.map((f) => `- ${f.ok ? "PASS" : "FAIL"} ${f.flow}: ${f.label} (${f.url})`),
    "",
  ].join("\n");
  const mdPath = path.join(outDir, "full-demo-qa-report.md");
  fs.writeFileSync(mdPath, md);
  console.log(JSON.stringify({ outDir, videos: report.videos, errors: report.errors.length, report: mdPath }, null, 2));
  if (report.errors.length) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
