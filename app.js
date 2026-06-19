const STORAGE_KEY = "fire-alarm-application-records";
const HANDLER_STORAGE_KEY = "fire-alarm-handlers";
const AUTH_USERNAME_KEY = "fire-alarm-auth-username";
const AUTH_HASH_KEY = "fire-alarm-auth-hash";
const AUTH_SESSION_KEY = "fire-alarm-authenticated";
const AUTH_SESSION_USERNAME_KEY = "fire-alarm-session-username";
const AUTH_SESSION_HASH_KEY = "fire-alarm-session-hash";
const EXPECTED_GAS_VERSION = "2026-06-19-8";
const APP_ASSET_VERSION = "20260620-2";
const CLOUD_API_PARTS = [
  "aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mv",
  "cy9BS2Z5Y2J6VGFzRTVvNXIwQ2R3ZVRaYkpKVzJ6bldF",
  "LUJ2NVdNeEs4YzBqcFdZeG9QS2ljdVVOSzNPUW5DQ1Q1",
  "ZmFjelY0eTcvZXhlYw==",
];

const defaultHandlers = [
  "單柏洋", "許家瑋", "巫光能", "蔡聖文", "廖宇揚", "陳秀瑢", "余孟軒",
  "陳俊夆", "羅緗翎", "吳有獻", "王柏文", "蕭煒宸", "尤碩楷", "買昱霖",
  "蕭宇志", "謝元豪", "張淑惠", "張晏偉",
];

const state = {
  records: migrateRecords(loadRecords()),
  handlers: loadHandlers(),
  currentView: "dashboard",
  cloudSetupRequired: false,
  cloudReady: false,
  cloudSyncTimer: null,
};

const els = {
  navItems: document.querySelectorAll(".nav-item"),
  views: {
    dashboard: document.querySelector("#dashboardView"),
    records: document.querySelector("#recordsView"),
    print: document.querySelector("#printView"),
    settings: document.querySelector("#settingsView"),
  },
  authScreen: document.querySelector("#authScreen"),
  authForm: document.querySelector("#authForm"),
  authHint: document.querySelector("#authHint"),
  authStatus: document.querySelector("#authStatus"),
  authCloudLink: document.querySelector("#authCloudLink"),
  authUsernameInput: document.querySelector("#authUsernameInput"),
  authPasswordInput: document.querySelector("#authPasswordInput"),
  authConfirmWrap: document.querySelector("#authConfirmWrap"),
  authConfirmInput: document.querySelector("#authConfirmInput"),
  authSubmitBtn: document.querySelector("#authSubmitBtn"),
  logoutBtn: document.querySelector("#logoutBtn"),
  viewTitle: document.querySelector("#viewTitle"),
  openFormBtn: document.querySelector("#openFormBtn"),
  recordDialog: document.querySelector("#recordDialog"),
  recordForm: document.querySelector("#recordForm"),
  dialogTitle: document.querySelector("#dialogTitle"),
  recordId: document.querySelector("#recordId"),
  dateInput: document.querySelector("#dateInput"),
  serialInput: document.querySelector("#serialInput"),
  nameInput: document.querySelector("#nameInput"),
  genderInput: document.querySelector("#genderInput"),
  birthInput: document.querySelector("#birthInput"),
  nationalIdInput: document.querySelector("#nationalIdInput"),
  phoneInput: document.querySelector("#phoneInput"),
  certificateInput: document.querySelector("#certificateInput"),
  addressInput: document.querySelector("#addressInput"),
  homeStatusInput: document.querySelector("#homeStatusInput"),
  receiveMethodInput: document.querySelector("#receiveMethodInput"),
  installLocationInput: document.querySelector("#installLocationInput"),
  handlerInput: document.querySelector("#handlerInput"),
  noteInput: document.querySelector("#noteInput"),
  saveRecordBtn: document.querySelector("#saveRecordBtn"),
  printCurrentRecordBtn: document.querySelector("#printCurrentRecordBtn"),
  statHouseholds: document.querySelector("#statHouseholds"),
  statPickup: document.querySelector("#statPickup"),
  statInstall: document.querySelector("#statInstall"),
  summaryBody: document.querySelector("#summaryBody"),
  recentList: document.querySelector("#recentList"),
  lastSaved: document.querySelector("#lastSaved"),
  searchInput: document.querySelector("#searchInput"),
  handlerFilter: document.querySelector("#handlerFilter"),
  recordCount: document.querySelector("#recordCount"),
  recordBody: document.querySelector("#recordBody"),
  printMode: document.querySelector("#printMode"),
  printRecord: document.querySelector("#printRecord"),
  printBtn: document.querySelector("#printBtn"),
  applicationPrint: document.querySelector("#applicationPrint"),
  listPrint: document.querySelector("#listPrint"),
  exportCsvBtn: document.querySelector("#exportCsvBtn"),
  exportJsonBtn: document.querySelector("#exportJsonBtn"),
  importJsonInput: document.querySelector("#importJsonInput"),
  importLegacyInput: document.querySelector("#importLegacyInput"),
  seedBtn: document.querySelector("#seedBtn"),
  copySummaryBtn: document.querySelector("#copySummaryBtn"),
  newHandlerInput: document.querySelector("#newHandlerInput"),
  addHandlerBtn: document.querySelector("#addHandlerBtn"),
  handlerList: document.querySelector("#handlerList"),
  sampleDialog: document.querySelector("#sampleDialog"),
  samplePrint: document.querySelector("#samplePrint"),
  closeSampleBtn: document.querySelector("#closeSampleBtn"),
  printSampleBtn: document.querySelector("#printSampleBtn"),
  toast: document.querySelector("#toast"),
};

if (els.authStatus) {
  els.authStatus.textContent = "正在連線 Google Sheet 雲端資料...";
}
if (els.authCloudLink) {
  els.authCloudLink.href = cloudTestUrl();
}

const viewTitles = {
  dashboard: "總覽",
  records: "申請清單",
  print: "列印表單",
  settings: "設定",
};

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem("fire-alarm-distribution-records") || "[]");
  } catch {
    return [];
  }
}

function loadHandlers() {
  try {
    const saved = JSON.parse(localStorage.getItem(HANDLER_STORAGE_KEY) || "[]");
    const values = Array.isArray(saved) && saved.length ? saved : defaultHandlers;
    return uniqueNames(values);
  } catch {
    return [...defaultHandlers];
  }
}

function saveHandlers() {
  localStorage.setItem(HANDLER_STORAGE_KEY, JSON.stringify(state.handlers));
}

function cloudApiUrl() {
  return atob(CLOUD_API_PARTS.join(""));
}

function cloudTestUrl() {
  const url = new URL(cloudApiUrl());
  url.searchParams.set("action", "meta");
  url.searchParams.set("callback", "cloudTest");
  url.searchParams.set("_", `${APP_ASSET_VERSION}-${Date.now()}`);
  return url.toString();
}

function cloudGet(action, params = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = `cloudCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("雲端連線逾時，請確認此裝置可連到 script.google.com"));
    }, 15000);
    const script = document.createElement("script");

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (data) => {
      cleanup();
      resolve(data || {});
    };

    const url = new URL(cloudApiUrl());
    url.searchParams.set("action", action);
    url.searchParams.set("callback", callbackName);
    url.searchParams.set("_", String(Date.now()));
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value ?? "")));
    script.onerror = () => {
      cleanup();
      reject(new Error("雲端連線失敗，可能被瀏覽器、網路或內容阻擋功能攔截"));
    };
    script.src = url.toString();
    document.body.appendChild(script);
  });
}

async function cloudPost(action, payload = {}) {
  const form = new FormData();
  form.append("action", action);
  form.append("payload", JSON.stringify(payload));
  await fetch(cloudApiUrl(), {
    method: "POST",
    mode: "no-cors",
    body: form,
  });
}

async function initializeCloud() {
  try {
    const result = await cloudGet("meta");
    state.cloudReady = true;
    state.cloudSetupRequired = !result.hasCredentials;
    updateCloudStatus(result);

    if (state.cloudSetupRequired) {
      await migrateLocalCredentialsToCloud();
    }

    updateAuthMode();
    if (isAuthenticated()) {
      restoreSessionAuthFromLocal();
      const sessionValid = await validateSessionAuth();
      if (!sessionValid) return;
      setAuthenticated(true, sessionAuthPayload());
      await loadCloudData();
    } else {
      setAuthenticated(false);
    }
  } catch (error) {
    state.cloudReady = false;
    state.cloudSetupRequired = false;
    updateCloudStatus(null, error);
    updateAuthMode();
    setAuthenticated(false);
    toast("無法連線雲端資料，請稍後再試");
  }
}

function updateCloudStatus(meta, error = null) {
  if (!els.authStatus) return;
  if (!meta) {
    els.authStatus.textContent = `${error?.message || "雲端連線失敗"}。請點下方「開啟雲端測試」確認此裝置是否能連到 GAS。`;
    return;
  }
  const version = meta.version || "未回傳版本";
  const credentialText = meta.hasCredentials ? "已設定共用帳號" : "尚未設定共用帳號";
  const warning = version === EXPECTED_GAS_VERSION ? "" : "，請確認 GAS 已貼上最新版並重新部署";
  els.authStatus.textContent = `GAS 版本：${version}，${credentialText}${warning}`;
}

async function validateSessionAuth() {
  const auth = sessionAuthPayload();
  if (!auth.username || !auth.passwordHash) {
    setAuthenticated(false);
    return false;
  }
  const result = await cloudGet("login", auth);
  if (result.ok) return true;
  setAuthenticated(false);
  toast(authErrorMessage(result));
  return false;
}

async function migrateLocalCredentialsToCloud() {
  const username = localStorage.getItem(AUTH_USERNAME_KEY) || "";
  const passwordHash = localStorage.getItem(AUTH_HASH_KEY) || "";
  if (!username || !passwordHash) return;
  const result = await cloudGet("setup", { username, passwordHash });
  if (result.ok) {
    state.cloudSetupRequired = false;
    updateCloudStatus({ version: result.version, hasCredentials: true });
    toast("已將本機帳號同步到雲端");
  }
}

function restoreSessionAuthFromLocal() {
  const session = sessionAuthPayload();
  if (session.username && session.passwordHash) return;
  const username = localStorage.getItem(AUTH_USERNAME_KEY) || "";
  const passwordHash = localStorage.getItem(AUTH_HASH_KEY) || "";
  if (!username || !passwordHash) return;
  sessionStorage.setItem(AUTH_SESSION_USERNAME_KEY, username);
  sessionStorage.setItem(AUTH_SESSION_HASH_KEY, passwordHash);
}

function startCloudSync() {
  stopCloudSync();
  state.cloudSyncTimer = window.setInterval(() => loadCloudData({ silent: true }), 10000);
}

function stopCloudSync() {
  if (!state.cloudSyncTimer) return;
  window.clearInterval(state.cloudSyncTimer);
  state.cloudSyncTimer = null;
}

async function loadCloudData(options = {}) {
  try {
    const result = await cloudGet("data", sessionAuthPayload());
    if (!result.ok) {
      if (!options.silent) toast(result.message || "雲端資料讀取失敗");
      setAuthenticated(false);
      return;
    }
    state.records = migrateRecords(result.records || []);
    state.handlers = uniqueNames([...(result.handlers || []), ...defaultHandlers]);
    saveRecords();
    saveHandlers();
    render();
    if (!options.silent) toast("已同步雲端資料");
  } catch {
    if (!options.silent) toast("雲端資料同步失敗，請檢查網路或 Apps Script 部署");
  }
}

async function syncRecordToCloud(record) {
  await cloudPost("saveRecord", { auth: sessionAuthPayload(), record });
  window.setTimeout(() => loadCloudData({ silent: true }), 1200);
}

async function syncDeleteRecordToCloud(id) {
  await cloudPost("deleteRecord", { auth: sessionAuthPayload(), id });
  window.setTimeout(() => loadCloudData({ silent: true }), 1200);
}

async function syncHandlersToCloud() {
  await cloudPost("saveHandlers", { auth: sessionAuthPayload(), handlers: state.handlers });
  window.setTimeout(() => loadCloudData({ silent: true }), 1200);
}

async function syncRecordsToCloud(records) {
  await cloudPost("saveRecords", { auth: sessionAuthPayload(), records });
  window.setTimeout(() => loadCloudData({ silent: true }), 1200);
}

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hasAuthPassword() {
  return !state.cloudSetupRequired;
}

function isAuthenticated() {
  return sessionStorage.getItem(AUTH_SESSION_KEY) === "true";
}

function sessionAuthPayload() {
  return {
    username: sessionStorage.getItem(AUTH_SESSION_USERNAME_KEY) || "",
    passwordHash: sessionStorage.getItem(AUTH_SESSION_HASH_KEY) || "",
  };
}

function updateAuthMode() {
  const setupMode = !hasAuthPassword();
  els.authHint.textContent = setupMode ? "首次使用請先設定共用帳號與密碼。" : "請輸入共用帳號與密碼。";
  els.authConfirmWrap.hidden = !setupMode;
  els.authConfirmInput.required = setupMode;
  els.authPasswordInput.autocomplete = setupMode ? "new-password" : "current-password";
  els.authSubmitBtn.textContent = setupMode ? "設定帳號密碼並登入" : "登入";
}

function authErrorMessage(result) {
  if (!result || !result.version) {
    return "GAS 未回傳新版資訊，請確認已重新部署 Web App 且網址相同";
  }
  if (result.version !== EXPECTED_GAS_VERSION) {
    return `GAS 版本為 ${result.version}，請更新並重新部署到 ${EXPECTED_GAS_VERSION}`;
  }
  return result.message || "帳號或密碼錯誤";
}

function setAuthenticated(value, auth = null) {
  if (value) {
    sessionStorage.setItem(AUTH_SESSION_KEY, "true");
    if (auth) {
      sessionStorage.setItem(AUTH_SESSION_USERNAME_KEY, auth.username);
      sessionStorage.setItem(AUTH_SESSION_HASH_KEY, auth.passwordHash);
    }
    document.body.classList.remove("auth-locked");
    startCloudSync();
  } else {
    stopCloudSync();
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.removeItem(AUTH_SESSION_USERNAME_KEY);
    sessionStorage.removeItem(AUTH_SESSION_HASH_KEY);
    document.body.classList.add("auth-locked");
    updateAuthMode();
    els.authUsernameInput.value = "";
    els.authPasswordInput.value = "";
    els.authConfirmInput.value = "";
    window.setTimeout(() => els.authUsernameInput.focus(), 0);
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const username = normalizeText(els.authUsernameInput.value);
  const password = els.authPasswordInput.value;
  if (!username) return toast("請輸入帳號");
  if (password.length < 6) return toast("密碼至少需要 6 個字元");
  const passwordHash = await hashPassword(password);

  if (!hasAuthPassword()) {
    if (password !== els.authConfirmInput.value) return toast("兩次輸入的密碼不一致");
    const result = await cloudGet("setup", { username, passwordHash });
    if (!result.ok) return toast(result.message || "帳號設定失敗");
    state.cloudSetupRequired = false;
    localStorage.setItem(AUTH_USERNAME_KEY, username);
    localStorage.setItem(AUTH_HASH_KEY, passwordHash);
    setAuthenticated(true, { username, passwordHash });
    await loadCloudData();
    toast("帳號密碼已設定");
    return;
  }

  const result = await cloudGet("login", { username, passwordHash });
  if (!result.ok) return toast(authErrorMessage(result));
  localStorage.setItem(AUTH_USERNAME_KEY, username);
  localStorage.setItem(AUTH_HASH_KEY, passwordHash);
  setAuthenticated(true, { username, passwordHash });
  await loadCloudData();
  toast("登入成功");
}

function migrateRecords(records) {
  return records.map((record) => ({
    id: record.id || crypto.randomUUID(),
    date: record.date || todayString(),
    serial: record.serial || record.serialNo || "",
    name: record.name || "",
    gender: record.gender || "",
    birth: record.birth || record.birthDate || "",
    nationalId: record.nationalId || "",
    phone: record.phone || "",
    address: record.address || "",
    homeStatus: record.homeStatus || "自有住宅",
    receiveMethod: record.receiveMethod || "自行領取",
    installLocation: record.installLocation || "",
    personTypes: Array.isArray(record.personTypes) ? record.personTypes : [],
    housingType: record.housingType || "未設火災警報設備之住宅",
    certificateNo: record.certificateNo || record.certificate || "",
    handler: record.handler || "",
    status: "",
    note: record.note || "",
    updatedAt: record.updatedAt || new Date().toISOString(),
  }));
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
  localStorage.setItem(`${STORAGE_KEY}-saved-at`, new Date().toISOString());
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "";
  const dateValue = toDateInputValue(value);
  if (!dateValue) return String(value).split("T")[0];
  const date = new Date(`${dateValue}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("zh-TW");
}

function toDateInputValue(value) {
  if (!value) return "";
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const slashMatch = text.match(/^(\d{4})[\/.](\d{1,2})[\/.](\d{1,2})$/);
  if (slashMatch) return `${slashMatch[1]}-${slashMatch[2].padStart(2, "0")}-${slashMatch[3].padStart(2, "0")}`;
  const match = text.match(/民國\s*(\d{1,3})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (!match) return "";
  const year = Number(match[1]) + 1911;
  const month = String(match[2]).padStart(2, "0");
  const day = String(match[3]).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeText(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim();
}

function uniqueNames(values) {
  return [...new Set(values.map(normalizeText).filter(Boolean))];
}

function selectedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
}

function setCheckedValues(name, values) {
  document.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
    input.checked = values.includes(input.value);
  });
}

function getFilteredRecords() {
  const keyword = normalizeText(els.searchInput.value).toLowerCase();
  const handler = normalizeText(els.handlerFilter.value);

  return state.records.filter((record) => {
    const haystack = [
      record.serial, record.name, record.nationalId, record.address, record.phone,
      record.certificateNo, record.handler, record.personTypes.join(" "), record.housingType,
    ].join(" ").toLowerCase();
    return (!keyword || haystack.includes(keyword))
      && (!handler || record.handler === handler);
  });
}

function render() {
  renderHandlers();
  renderDashboard();
  renderRecords();
  renderPrintSelectors();
  renderPrint();
}

function renderHandlers() {
  const selected = els.handlerInput.value;
  const selectedFilter = els.handlerFilter.value;
  const recordHandlers = uniqueNames(state.records.map((record) => record.handler));
  state.handlers = uniqueNames([...state.handlers, ...recordHandlers]);
  els.handlerInput.innerHTML = `<option value="">請選擇</option>${state.handlers
    .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
    .join("")}`;
  if (state.handlers.includes(selected)) els.handlerInput.value = selected;

  els.handlerFilter.innerHTML = `<option value="">全部</option>${state.handlers
    .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
    .join("")}`;
  if (state.handlers.includes(selectedFilter)) els.handlerFilter.value = selectedFilter;

  els.handlerList.innerHTML = state.handlers.map((name) => {
    const used = state.records.some((record) => record.handler === name);
    return `
      <div class="manager-item">
        <span>${escapeHtml(name)}${used ? "（已有資料使用）" : ""}</span>
        <button class="mini-button danger-mini" data-delete-handler="${escapeHtml(name)}" type="button" ${used ? "disabled" : ""}>刪除</button>
      </div>
    `;
  }).join("") || `<div class="empty-state">尚無受理人員</div>`;
}

function renderDashboard() {
  const pickup = state.records.filter((record) => record.receiveMethod === "自行領取").length;
  const install = state.records.filter((record) => record.receiveMethod === "到府安裝").length;

  els.statHouseholds.textContent = state.records.length;
  els.statPickup.textContent = pickup;
  els.statInstall.textContent = install;

  const groups = new Map();
  state.records.forEach((record) => {
    const key = record.housingType || "未分類";
    const current = groups.get(key) || { housingType: key, households: 0, pickup: 0, install: 0 };
    current.households += 1;
    current.pickup += record.receiveMethod === "自行領取" ? 1 : 0;
    current.install += record.receiveMethod === "到府安裝" ? 1 : 0;
    groups.set(key, current);
  });

  els.summaryBody.innerHTML = Array.from(groups.values())
    .sort((a, b) => a.housingType.localeCompare(b.housingType, "zh-Hant"))
    .map((item) => `
      <tr>
        <td>${escapeHtml(item.housingType)}</td>
        <td>${item.households}</td>
        <td>${item.pickup}</td>
        <td>${item.install}</td>
      </tr>
    `).join("") || `<tr><td class="empty-state" colspan="4">尚無申請資料</td></tr>`;

  const recent = [...state.records].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
  els.recentList.innerHTML = recent.length
    ? recent.map((record) => `
      <div class="recent-item">
        <strong>${escapeHtml(record.name)}・${escapeHtml(record.serial || "未編號")}</strong>
        <span>${escapeHtml(record.address)}</span>
        <span>${escapeHtml(record.receiveMethod)} / ${escapeHtml(record.handler || "未填受理人員")}</span>
      </div>
    `).join("")
    : `<div class="empty-state">新增申請後，最近建檔會出現在這裡。</div>`;

  const savedAt = localStorage.getItem(`${STORAGE_KEY}-saved-at`);
  els.lastSaved.textContent = savedAt ? `最後儲存：${new Date(savedAt).toLocaleString("zh-TW")}` : "尚未儲存";
}

function renderRecords() {
  const records = getFilteredRecords().sort((a, b) => (b.serial || b.date).localeCompare(a.serial || a.date));
  els.recordCount.textContent = `共 ${records.length} 筆資料`;
  els.recordBody.innerHTML = records.length
    ? records.map((record) => `
      <tr>
        <td>${escapeHtml(record.serial || formatDate(record.date))}</td>
        <td>${escapeHtml(record.name)}</td>
        <td>${escapeHtml(record.nationalId)}</td>
        <td>${escapeHtml(record.address)}</td>
        <td>${escapeHtml(record.phone)}</td>
        <td>${escapeHtml(methodWithLocation(record))}</td>
        <td>${escapeHtml(record.personTypes.join("、") || "未選")}</td>
        <td>${escapeHtml(record.housingType)}</td>
        <td class="no-print">
          <div class="row-actions">
            <button class="mini-button" data-edit="${record.id}" type="button">編輯</button>
            <button class="mini-button" data-print="${record.id}" type="button">列印</button>
            <button class="mini-button danger-mini" data-delete="${record.id}" type="button">刪除</button>
          </div>
        </td>
      </tr>
    `).join("")
    : `<tr><td class="empty-state" colspan="9">沒有符合條件的資料</td></tr>`;
}

function renderPrintSelectors() {
  const selected = els.printRecord.value;
  els.printRecord.innerHTML = state.records.length
    ? state.records.map((record) => `<option value="${record.id}">${escapeHtml(record.serial || "")} ${escapeHtml(record.name)}</option>`).join("")
    : `<option value="">尚無資料</option>`;
  if (state.records.some((record) => record.id === selected)) els.printRecord.value = selected;
}

function renderPrint() {
  const isApplication = els.printMode.value === "application";
  els.applicationPrint.hidden = !isApplication;
  els.listPrint.hidden = isApplication;
  renderApplicationPrint();
  renderListPrint();
}

function renderApplicationPrint() {
  const record = state.records.find((item) => item.id === els.printRecord.value) || state.records[0];
  if (!record) {
    els.applicationPrint.innerHTML = `<div class="empty-state">請先新增申請資料</div>`;
    return;
  }

  els.applicationPrint.innerHTML = applicationFormMarkup(record);
}

function applicationFormMarkup(record, options = {}) {
  const sampleClass = options.sample ? " sample-watermark" : "";
  return `
    <div class="application-form${sampleClass}">
      <div class="form-title">
        <h3>新竹縣政府補助安裝住宅用火災警報器申請表</h3>
        <p>領取日期：${escapeHtml(formatDate(record.date))}</p>
      </div>
      <table class="application-table">
        <tr><th rowspan="7">申請人資料</th><th>姓名</th><td>${escapeHtml(record.name)}</td><th>性別</th><td>${checkPair(record.gender, "男", "女")}</td><th>出生年月日</th><td>${escapeHtml(record.birth)}</td></tr>
        <tr><th>國民身分證統一編號</th><td colspan="3">${escapeHtml(record.nationalId)}</td><th>連絡電話</th><td>${escapeHtml(record.phone)}</td></tr>
        <tr><th>申請裝設地點</th><td colspan="5">${escapeHtml(record.address)}</td></tr>
        <tr><th>場所狀況</th><td colspan="2">${checkPair(record.homeStatus, "自有住宅", "租賃住宅")}</td><th>申請領取方式</th><td colspan="2">${checkPair(record.receiveMethod, "自行領取", "到府安裝")}　安裝位置：${escapeHtml(record.installLocation)}</td></tr>
        <tr><th>人員類別</th><td colspan="5">${checkboxLine(record.personTypes, ["低收入戶", "身心障礙者", "兒童(12歲以下)", "孕婦", "年長者(65歲以上)", "獨居長者"])}</td></tr>
        <tr><th>住宅類別</th><td colspan="5">${checkboxLine([record.housingType], ["30年以上住宅", "狹小巷弄地區", "資源回收用途", "曾發生火災事故", "鐵皮屋住宅", "木造建築物", "住宅式宮廟", "裝設鐵窗住宅", "提供居家式托育服務住宅", "未設火災警報設備之住宅"])}</td></tr>
        <tr><th>申請人簽章</th><td colspan="5" class="signature-box">如代理代簽請註明身分證。本人同意個資供補助案使用。</td></tr>
        <tr><th>受理/執行人員</th><td colspan="2">${escapeHtml(record.handler)}</td><th>分隊長</th><td>單柏洋</td><th>個認號碼</th><td>${escapeHtml(record.certificateNo)}</td></tr>
      </table>
    </div>
  `;
}

function renderListPrint() {
  const records = state.records
    .sort((a, b) => (a.serial || a.name).localeCompare(b.serial || b.name, "zh-Hant"));

  els.listPrint.innerHTML = `
    <div class="print-heading">
      <div>
        <h3>住宅用火災警報器發放簽收清冊</h3>
      </div>
      <p>列印日期：${new Date().toLocaleDateString("zh-TW")}</p>
    </div>
    <table class="signature-table full-list-table">
      <thead>
        <tr>
          <th>領取日期</th>
          <th>序號</th>
          <th>姓名</th>
          <th>性別</th>
          <th>出生年月日</th>
          <th>身分證字號</th>
          <th>聯絡電話</th>
          <th>完整地址</th>
          <th>場所狀況</th>
          <th>領取方式</th>
          <th>安裝位置</th>
          <th>人員類別</th>
          <th>住宅類別</th>
          <th>個認號碼</th>
          <th>受理人員</th>
          <th>備註</th>
        </tr>
      </thead>
      <tbody>
        ${records.length ? records.map((record, index) => `
          <tr>
            <td>${escapeHtml(formatDate(record.date))}</td>
            <td>${escapeHtml(record.serial || String(index + 1))}</td>
            <td>${escapeHtml(record.name)}</td>
            <td>${escapeHtml(record.gender)}</td>
            <td>${escapeHtml(record.birth)}</td>
            <td>${escapeHtml(record.nationalId)}</td>
            <td>${escapeHtml(record.phone)}</td>
            <td>${escapeHtml(record.address)}</td>
            <td>${escapeHtml(record.homeStatus)}</td>
            <td>${escapeHtml(record.receiveMethod)}</td>
            <td>${escapeHtml(record.installLocation)}</td>
            <td>${escapeHtml(record.personTypes.join("、"))}</td>
            <td>${escapeHtml(record.housingType)}</td>
            <td>${escapeHtml(record.certificateNo)}</td>
            <td>${escapeHtml(record.handler)}</td>
            <td>${escapeHtml(record.note)}</td>
          </tr>
        `).join("") : `<tr><td class="empty-state" colspan="16">沒有可列印資料</td></tr>`}
      </tbody>
    </table>
  `;
}

function methodWithLocation(record) {
  return `${record.receiveMethod}${record.installLocation ? ` / ${record.installLocation}` : ""}`;
}

function checkPair(value, first, second) {
  return `${value === first ? "■" : "□"}${first} ${value === second ? "■" : "□"}${second}`;
}

function checkboxLine(values, options) {
  return options.map((option) => `${values.includes(option) ? "■" : "□"}${escapeHtml(option)}`).join("　");
}

function openForm(record = null) {
  els.recordForm.reset();
  els.recordId.value = record?.id || "";
  els.dialogTitle.textContent = record ? "編輯申請資料" : "新增申請資料";
  els.dateInput.value = toDateInputValue(record?.date) || todayString();
  els.serialInput.value = record?.serial || nextSerial();
  els.nameInput.value = record?.name || "";
  els.genderInput.value = record?.gender || "";
  els.birthInput.value = toDateInputValue(record?.birth);
  els.nationalIdInput.value = record?.nationalId || "";
  els.phoneInput.value = record?.phone || "";
  els.certificateInput.value = record?.certificateNo || "CFS";
  els.addressInput.value = record?.address || "新竹縣湖口鄉";
  els.homeStatusInput.value = record?.homeStatus || "自有住宅";
  els.receiveMethodInput.value = record?.receiveMethod || "自行領取";
  els.installLocationInput.value = record?.installLocation || "";
  els.handlerInput.value = record?.handler || "";
  els.noteInput.value = record?.note || "";
  setCheckedValues("personTypes", record?.personTypes || []);
  setCheckedValues("housingType", record?.housingType ? [record.housingType] : []);
  updateInstallLocationRequirement();
  els.recordDialog.showModal();
}

function updateInstallLocationRequirement() {
  const required = els.receiveMethodInput.value === "到府安裝";
  els.installLocationInput.required = required;
  els.installLocationInput.closest("label").classList.toggle("required", required);
}

async function saveForm() {
  const record = buildRecordFromForm();
  if (!record) return;

  const index = state.records.findIndex((item) => item.id === record.id);
  if (index >= 0) state.records[index] = record;
  else state.records.push(record);

  saveRecords();
  els.recordDialog.close();
  render();
  try {
    await syncRecordToCloud(record);
    toast("資料已儲存並同步到雲端");
  } catch {
    toast("資料已先儲存在本機，雲端同步失敗");
  }
}

function buildRecordFromForm() {
  if (!els.recordForm.reportValidity()) return null;
  const personTypes = selectedValues("personTypes");
  const housingType = selectedValues("housingType")[0] || "";
  if (!personTypes.length) {
    toast("請至少選一項人員類別");
    return null;
  }
  if (!housingType) {
    toast("請選一項住宅類別");
    return null;
  }
  const nationalId = normalizeText(els.nationalIdInput.value).toUpperCase();
  if (!/^[A-Z][12][0-9]{8}$/.test(nationalId)) {
    toast("身分證字號格式錯誤，例：J123456789");
    return null;
  }
  const address = normalizeText(els.addressInput.value);
  if (address.length < 7) {
    toast("地址至少需要 7 個字");
    return null;
  }
  const certificateNo = normalizeText(els.certificateInput.value).toUpperCase();
  if (!/^CFS[0-9]{10}$/.test(certificateNo)) {
    toast("個認號碼格式錯誤，需為 CFS 加 10 碼數字");
    return null;
  }
  const installLocation = normalizeText(els.installLocationInput.value);
  if (els.receiveMethodInput.value === "到府安裝" && !installLocation) {
    toast("領取方式為到府安裝時，必須輸入安裝位置");
    return null;
  }
  const duplicate = findDuplicateApplication({
    id: els.recordId.value,
    address,
    certificateNo,
  });
  if (duplicate) {
    toast(`${duplicate.field}與現存資料「${duplicate.name}」重複，禁止儲存或列印`);
    return null;
  }

  return {
    id: els.recordId.value || crypto.randomUUID(),
    date: els.dateInput.value,
    serial: normalizeText(els.serialInput.value),
    name: normalizeText(els.nameInput.value),
    gender: els.genderInput.value,
    birth: normalizeText(els.birthInput.value),
    nationalId,
    phone: normalizeText(els.phoneInput.value),
    certificateNo,
    address,
    homeStatus: els.homeStatusInput.value,
    receiveMethod: els.receiveMethodInput.value,
    installLocation,
    handler: normalizeText(els.handlerInput.value),
    status: "",
    personTypes,
    housingType,
    note: normalizeText(els.noteInput.value),
    updatedAt: new Date().toISOString(),
  };
}

function findDuplicateApplication(current) {
  const currentId = normalizeText(current.id);
  const currentAddress = normalizeForDuplicate(current.address);
  const currentCertificate = normalizeForDuplicate(current.certificateNo);
  return state.records
    .filter((record) => record.id !== currentId)
    .map((record) => ({
      id: record.id,
      name: record.name || record.serial || "未命名資料",
      address: normalizeForDuplicate(record.address),
      certificateNo: normalizeForDuplicate(record.certificateNo),
    }))
    .find((record) => {
      if (currentAddress && record.address === currentAddress) {
        record.field = "地址";
        return true;
      }
      if (currentCertificate && record.certificateNo === currentCertificate) {
        record.field = "個認號碼";
        return true;
      }
      return false;
    });
}

function normalizeForDuplicate(value) {
  return normalizeText(value).replace(/\s+/g, "").toUpperCase();
}

function printCurrentForm() {
  const record = buildRecordFromForm();
  if (!record) return;
  els.printMode.value = "application";
  els.applicationPrint.hidden = false;
  els.listPrint.hidden = true;
  els.applicationPrint.innerHTML = applicationFormMarkup(record);
  window.print();
}

async function addHandler() {
  const name = normalizeText(els.newHandlerInput.value);
  if (!name) return toast("請輸入受理人員姓名");
  if (state.handlers.includes(name)) return toast("名單已有此人員");
  state.handlers.push(name);
  state.handlers = uniqueNames(state.handlers);
  saveHandlers();
  els.newHandlerInput.value = "";
  renderHandlers();
  try {
    await syncHandlersToCloud();
    toast("受理人員已新增並同步");
  } catch {
    toast("受理人員已先儲存在本機，雲端同步失敗");
  }
}

async function deleteHandler(name) {
  if (state.records.some((record) => record.handler === name)) {
    toast("此人員已有申請資料使用，無法刪除");
    return;
  }
  if (!confirm(`系統提示：確定刪除受理人員「${name}」？`)) return;
  state.handlers = state.handlers.filter((handler) => handler !== name);
  saveHandlers();
  renderHandlers();
  try {
    await syncHandlersToCloud();
    toast("受理人員已刪除並同步");
  } catch {
    toast("受理人員已先從本機刪除，雲端同步失敗");
  }
}

function cancelForm() {
  const ok = confirm("系統提示：確認是否離開頁面？系統不會保存這筆資料。");
  if (!ok) return;
  els.recordDialog.close();
}

async function deleteRecord(id) {
  const record = state.records.find((item) => item.id === id);
  if (!record || !confirm(`系統提示：確定刪除「${record.name}」這筆資料？`)) return;
  state.records = state.records.filter((item) => item.id !== id);
  saveRecords();
  render();
  try {
    await syncDeleteRecordToCloud(id);
    toast("資料已刪除並同步");
  } catch {
    toast("資料已先從本機刪除，雲端同步失敗");
  }
}

function nextSerial() {
  const date = todayString().replaceAll("-", "");
  const count = state.records.filter((record) => record.serial?.startsWith(date)).length + 1;
  return `${date}-${count}`;
}

function setView(view) {
  state.currentView = view;
  els.navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  Object.entries(els.views).forEach(([key, element]) => element.classList.toggle("active", key === view));
  els.viewTitle.textContent = viewTitles[view];
  render();
}

function exportCsv() {
  const headers = ["領取日期", "序號", "申請人姓名", "性別", "出生年月日", "申請人身分證字號", "申請人電話", "申請人地址", "場所狀況", "領取方式", "安裝位置", "人員類別", "住宅類別", "個認號碼", "受理人員", "備註"];
  const rows = state.records.map((record) => [
    record.date, record.serial, record.name, record.gender, record.birth, record.nationalId, record.phone, record.address,
    record.homeStatus, record.receiveMethod, record.installLocation, record.personTypes.join("、"), record.housingType,
    record.certificateNo, record.handler, record.note,
  ]);
  downloadFile(`住警器申請清冊_${todayString()}.csv`, toCsv([headers, ...rows]), "text/csv;charset=utf-8");
}

function exportJson() {
  downloadFile(`住警器系統備份_${todayString()}.json`, JSON.stringify(state.records, null, 2), "application/json");
}

function importJson(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const incoming = migrateRecords(JSON.parse(reader.result));
      const merged = new Map(state.records.map((record) => [record.id, record]));
      incoming.forEach((record) => merged.set(record.id, record));
      state.records = Array.from(merged.values());
      saveRecords();
      render();
      await syncRecordsToCloud(incoming);
      toast("備份已匯入並同步");
    } catch {
      toast("匯入失敗，請確認 JSON 格式");
    } finally {
      els.importJsonInput.value = "";
    }
  };
  reader.readAsText(file);
}

async function importLegacyFile(file) {
  if (!file) return;
  try {
    const rows = await readLegacyRows(file);
    const records = legacyRowsToRecords(rows);
    if (!records.length) {
      toast("沒有找到可匯入的清單資料");
      return;
    }
    const ok = confirm(`找到 ${records.length} 筆舊清單資料，是否匯入並同步到 Google Sheet？`);
    if (!ok) return;

    const merged = new Map(state.records.map((record) => [record.id, record]));
    records.forEach((record) => merged.set(record.id, record));
    state.records = Array.from(merged.values());
    state.handlers = uniqueNames([...state.handlers, ...records.map((record) => record.handler).filter(Boolean)]);
    saveRecords();
    saveHandlers();
    render();

    await syncRecordsToCloud(records);
    if (state.handlers.length) await syncHandlersToCloud();
    toast(`已匯入 ${records.length} 筆舊清單並同步`);
  } catch (error) {
    toast(error.message || "舊清單匯入失敗");
  } finally {
    els.importLegacyInput.value = "";
  }
}

async function readLegacyRows(file) {
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith(".csv")) return parseCsv(await file.text());
  if (!window.XLSX) throw new Error("Excel 匯入元件載入失敗，請確認網路可連到 CDN");
  const buffer = await file.arrayBuffer();
  const workbook = window.XLSX.read(buffer, { type: "array", cellDates: false });
  const sheetName = workbook.SheetNames.find((name) => name.includes("資料彙整")) || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
}

function legacyRowsToRecords(rows) {
  const table = rows.filter((row) => row.some((cell) => normalizeText(cell)));
  if (!table.length) return [];
  const headerIndex = table.findIndex((row) => row.some((cell) => normalizeText(cell) === "序號"));
  if (headerIndex < 0) throw new Error("找不到「序號」標題列，請確認匯入的是資料彙整清單");
  const headers = table[headerIndex].map((cell) => normalizeText(cell));
  const dataRows = table.slice(headerIndex + 1);
  return dataRows
    .map((row) => legacyRowToRecord(headers, row))
    .filter(Boolean);
}

function legacyRowToRecord(headers, row) {
  const get = (...names) => {
    for (const name of names) {
      const index = headers.indexOf(name);
      if (index >= 0) return normalizeText(row[index]);
    }
    return "";
  };
  const serial = get("序號");
  const name = get("申請人姓名", "姓名");
  if (!serial && !name) return null;
  const methodParts = splitReceiveMethod(get("領取方式/位置", "領取方式"));
  const now = new Date().toISOString();
  const record = {
    id: `legacy-${serial || name}`.replace(/[^\w\u4e00-\u9fa5-]/g, "-"),
    date: dateFromSerial(serial) || todayString(),
    serial,
    name,
    gender: get("性別"),
    birth: toDateInputValue(get("出生年月日")),
    nationalId: get("申請人身分證字號", "身分證字號", "國民身分證統一編號").toUpperCase(),
    phone: get("申請人電話", "聯絡電話", "連絡電話"),
    address: get("申請人地址", "完整地址", "地址") || "新竹縣湖口鄉",
    homeStatus: get("場所狀況") || "自有住宅",
    receiveMethod: methodParts.receiveMethod,
    installLocation: methodParts.installLocation,
    personTypes: splitMultiValue(get("人員類別")),
    housingType: get("住宅類別"),
    certificateNo: get("個認號碼", "個認編號") || "CFS",
    handler: get("受理人員"),
    status: "",
    note: get("備註"),
    updatedAt: now,
  };
  return record;
}

function splitReceiveMethod(value) {
  const text = normalizeText(value);
  if (!text) return { receiveMethod: "自行領取", installLocation: "" };
  const [method, location = ""] = text.split(/\s*[\/／]\s*/);
  const receiveMethod = method.includes("到府") ? "到府安裝" : "自行領取";
  return { receiveMethod, installLocation: normalizeText(location) };
}

function splitMultiValue(value) {
  return normalizeText(value)
    .split(/[、,，;；\s]+/)
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

function dateFromSerial(serial) {
  const match = String(serial || "").match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return "";
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  rows.push(row);
  return rows;
}

function copySummary() {
  const lines = [["住宅類別", "戶數", "自行領取", "到府安裝"]];
  Array.from(els.summaryBody.querySelectorAll("tr")).forEach((row) => {
    const cells = Array.from(row.children).map((cell) => cell.textContent.trim());
    if (cells.length === 4 && !cells[0].includes("尚無")) lines.push(cells);
  });
  navigator.clipboard.writeText(lines.map((row) => row.join("\t")).join("\n"));
  toast("彙整已複製");
}

function seedRecords() {
  const sampleRecord = {
    id: "sample",
    date: todayString(),
    serial: `${todayString().replaceAll("-", "")}-範例`,
    name: "王小明",
    gender: "男",
    birth: "民國65年01月01日",
    nationalId: "A123456789",
    phone: "0912-345-678",
    address: "新竹縣湖口鄉範例路100號",
    homeStatus: "自有住宅",
    receiveMethod: "自行領取",
    installLocation: "客廳",
    personTypes: ["年長者(65歲以上)"],
    housingType: "未設火災警報設備之住宅",
    certificateNo: "CFS0000000000",
    handler: state.handlers[0] || "受理人員",
    status: "",
    note: "",
    updatedAt: new Date().toISOString(),
  };
  els.samplePrint.innerHTML = applicationFormMarkup(sampleRecord, { sample: true });
  els.sampleDialog.showModal();
}

function downloadFile(filename, content, type) {
  const blob = new Blob(["\ufeff", content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows) {
  return rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => els.toast.classList.remove("show"), 2200);
}

els.navItems.forEach((item) => item.addEventListener("click", () => setView(item.dataset.view)));
els.authForm.addEventListener("submit", handleAuthSubmit);
els.logoutBtn.addEventListener("click", () => setAuthenticated(false));
els.openFormBtn.addEventListener("click", () => openForm());
els.saveRecordBtn.addEventListener("click", saveForm);
els.printCurrentRecordBtn.addEventListener("click", printCurrentForm);
els.addHandlerBtn.addEventListener("click", addHandler);
els.newHandlerInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  addHandler();
});
els.handlerList.addEventListener("click", (event) => {
  const name = event.target.dataset.deleteHandler;
  if (name) deleteHandler(name);
});
document.querySelectorAll("[data-cancel-form]").forEach((button) => button.addEventListener("click", cancelForm));
els.recordDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  cancelForm();
});
els.searchInput.addEventListener("input", renderRecords);
els.nationalIdInput.addEventListener("input", () => {
  els.nationalIdInput.value = els.nationalIdInput.value.toUpperCase();
});
els.certificateInput.addEventListener("input", () => {
  els.certificateInput.value = els.certificateInput.value.toUpperCase();
});
els.receiveMethodInput.addEventListener("change", updateInstallLocationRequirement);
els.handlerFilter.addEventListener("change", renderRecords);
els.printMode.addEventListener("change", renderPrint);
els.printRecord.addEventListener("change", renderPrint);
els.printBtn.addEventListener("click", () => {
  renderPrint();
  window.print();
});
els.exportCsvBtn.addEventListener("click", exportCsv);
els.exportJsonBtn.addEventListener("click", exportJson);
els.importJsonInput.addEventListener("change", (event) => importJson(event.target.files[0]));
els.importLegacyInput.addEventListener("change", (event) => importLegacyFile(event.target.files[0]));
els.seedBtn.addEventListener("click", seedRecords);
els.closeSampleBtn.addEventListener("click", () => els.sampleDialog.close());
els.sampleDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  els.sampleDialog.close();
});
els.printSampleBtn.addEventListener("click", () => {
  document.body.classList.add("sample-printing");
  window.print();
});
window.addEventListener("afterprint", () => document.body.classList.remove("sample-printing"));
window.addEventListener("focus", () => {
  if (isAuthenticated()) loadCloudData({ silent: true });
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && isAuthenticated()) loadCloudData({ silent: true });
});
els.copySummaryBtn.addEventListener("click", copySummary);
els.recordBody.addEventListener("click", (event) => {
  const editId = event.target.dataset.edit;
  const printId = event.target.dataset.print;
  const deleteId = event.target.dataset.delete;
  if (editId) openForm(state.records.find((record) => record.id === editId));
  if (printId) {
    setView("print");
    els.printMode.value = "application";
    els.printRecord.value = printId;
    renderPrint();
  }
  if (deleteId) deleteRecord(deleteId);
});

saveRecords();
render();
updateAuthMode();
initializeCloud();
