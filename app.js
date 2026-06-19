const STORAGE_KEY = "fire-alarm-application-records";
const HANDLER_STORAGE_KEY = "fire-alarm-handlers";

const defaultHandlers = [
  "單柏洋", "許家瑋", "巫光能", "蔡聖文", "廖宇揚", "陳秀瑢", "余孟軒",
  "陳俊夆", "羅緗翎", "吳有獻", "王柏文", "蕭煒宸", "尤碩楷", "買昱霖",
  "蕭宇志", "謝元豪", "張淑惠", "張晏偉",
];

const state = {
  records: migrateRecords(loadRecords()),
  handlers: loadHandlers(),
  currentView: "dashboard",
};

const els = {
  navItems: document.querySelectorAll(".nav-item"),
  views: {
    dashboard: document.querySelector("#dashboardView"),
    records: document.querySelector("#recordsView"),
    print: document.querySelector("#printView"),
    settings: document.querySelector("#settingsView"),
  },
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
  recordStatusInput: document.querySelector("#recordStatusInput"),
  noteInput: document.querySelector("#noteInput"),
  saveRecordBtn: document.querySelector("#saveRecordBtn"),
  statHouseholds: document.querySelector("#statHouseholds"),
  statPickup: document.querySelector("#statPickup"),
  statInstall: document.querySelector("#statInstall"),
  statSigned: document.querySelector("#statSigned"),
  summaryBody: document.querySelector("#summaryBody"),
  recentList: document.querySelector("#recentList"),
  lastSaved: document.querySelector("#lastSaved"),
  searchInput: document.querySelector("#searchInput"),
  statusFilter: document.querySelector("#statusFilter"),
  handlerFilter: document.querySelector("#handlerFilter"),
  recordBody: document.querySelector("#recordBody"),
  printMode: document.querySelector("#printMode"),
  printRecord: document.querySelector("#printRecord"),
  printStatus: document.querySelector("#printStatus"),
  agencyInput: document.querySelector("#agencyInput"),
  printBtn: document.querySelector("#printBtn"),
  applicationPrint: document.querySelector("#applicationPrint"),
  listPrint: document.querySelector("#listPrint"),
  exportCsvBtn: document.querySelector("#exportCsvBtn"),
  exportJsonBtn: document.querySelector("#exportJsonBtn"),
  importJsonInput: document.querySelector("#importJsonInput"),
  clearBtn: document.querySelector("#clearBtn"),
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
    status: record.status === "待補件" ? "未簽收" : (record.status || "未簽收"),
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
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("zh-TW");
}

function normalizeText(value) {
  return String(value || "").trim();
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
  const status = els.statusFilter.value;
  const handler = normalizeText(els.handlerFilter.value).toLowerCase();

  return state.records.filter((record) => {
    const haystack = [
      record.serial, record.name, record.nationalId, record.address, record.phone,
      record.certificateNo, record.handler, record.personTypes.join(" "), record.housingType,
    ].join(" ").toLowerCase();
    return (!keyword || haystack.includes(keyword))
      && (status === "all" || record.status === status)
      && (!handler || record.handler.toLowerCase().includes(handler));
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
  const recordHandlers = uniqueNames(state.records.map((record) => record.handler));
  state.handlers = uniqueNames([...state.handlers, ...recordHandlers]);
  els.handlerInput.innerHTML = `<option value="">請選擇</option>${state.handlers
    .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
    .join("")}`;
  if (state.handlers.includes(selected)) els.handlerInput.value = selected;

  els.handlerList.innerHTML = state.handlers.map((name) => {
    const used = state.records.some((record) => record.handler === name);
    return `
      <div class="manager-item">
        <span>${escapeHtml(name)}${used ? "（已有資料使用）" : ""}</span>
        <button class="mini-button" data-delete-handler="${escapeHtml(name)}" type="button" ${used ? "disabled" : ""}>刪除</button>
      </div>
    `;
  }).join("") || `<div class="empty-state">尚無受理人員</div>`;
}

function renderDashboard() {
  const pickup = state.records.filter((record) => record.receiveMethod === "自行領取").length;
  const install = state.records.filter((record) => record.receiveMethod === "到府安裝").length;
  const signed = state.records.filter((record) => record.status === "已簽收").length;

  els.statHouseholds.textContent = state.records.length;
  els.statPickup.textContent = pickup;
  els.statInstall.textContent = install;
  els.statSigned.textContent = signed;

  const groups = new Map();
  state.records.forEach((record) => {
    const key = record.housingType || "未分類";
    const current = groups.get(key) || { housingType: key, households: 0, pickup: 0, install: 0, signed: 0 };
    current.households += 1;
    current.pickup += record.receiveMethod === "自行領取" ? 1 : 0;
    current.install += record.receiveMethod === "到府安裝" ? 1 : 0;
    current.signed += record.status === "已簽收" ? 1 : 0;
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
        <td>${item.signed}</td>
      </tr>
    `).join("") || `<tr><td class="empty-state" colspan="5">尚無申請資料</td></tr>`;

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
        <td>${statusPill(record.status)}</td>
        <td class="no-print">
          <div class="row-actions">
            <button class="mini-button" data-edit="${record.id}" type="button">編輯</button>
            <button class="mini-button" data-print="${record.id}" type="button">列印</button>
            <button class="mini-button" data-delete="${record.id}" type="button">刪除</button>
          </div>
        </td>
      </tr>
    `).join("")
    : `<tr><td class="empty-state" colspan="10">沒有符合條件的資料</td></tr>`;
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
        <p>${escapeHtml(formatDate(record.date))}</p>
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
  const status = els.printStatus.value;
  const records = state.records
    .filter((record) => status === "all" || record.status === status)
    .sort((a, b) => (a.serial || a.name).localeCompare(b.serial || b.name, "zh-Hant"));

  els.listPrint.innerHTML = `
    <div class="print-heading">
      <div>
        <h3>住宅用火災警報器發放簽收清冊</h3>
        <p>承辦單位：${escapeHtml(els.agencyInput.value || "消防分隊")}</p>
      </div>
      <p>列印日期：${new Date().toLocaleDateString("zh-TW")}</p>
    </div>
    <table class="signature-table">
      <thead>
        <tr><th>序號</th><th>姓名</th><th>電話</th><th>地址</th><th>領取方式</th><th>個認號碼</th><th>簽名</th><th>備註</th></tr>
      </thead>
      <tbody>
        ${records.length ? records.map((record, index) => `
          <tr>
            <td>${escapeHtml(record.serial || String(index + 1))}</td>
            <td>${escapeHtml(record.name)}</td>
            <td>${escapeHtml(record.phone)}</td>
            <td>${escapeHtml(record.address)}</td>
            <td>${escapeHtml(methodWithLocation(record))}</td>
            <td>${escapeHtml(record.certificateNo)}</td>
            <td></td>
            <td>${escapeHtml(record.note)}</td>
          </tr>
        `).join("") : `<tr><td class="empty-state" colspan="8">沒有可列印資料</td></tr>`}
      </tbody>
    </table>
  `;
}

function statusPill(status) {
  const className = status === "未簽收" ? "unsigned" : "";
  return `<span class="status-pill ${className}">${escapeHtml(status)}</span>`;
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
  els.dateInput.value = record?.date || todayString();
  els.serialInput.value = record?.serial || nextSerial();
  els.nameInput.value = record?.name || "";
  els.genderInput.value = record?.gender || "";
  els.birthInput.value = record?.birth || "";
  els.nationalIdInput.value = record?.nationalId || "";
  els.phoneInput.value = record?.phone || "";
  els.certificateInput.value = record?.certificateNo || "";
  els.addressInput.value = record?.address || "";
  els.homeStatusInput.value = record?.homeStatus || "自有住宅";
  els.receiveMethodInput.value = record?.receiveMethod || "自行領取";
  els.installLocationInput.value = record?.installLocation || "";
  els.handlerInput.value = record?.handler || "";
  els.recordStatusInput.value = record?.status || "未簽收";
  els.noteInput.value = record?.note || "";
  setCheckedValues("personTypes", record?.personTypes || []);
  setCheckedValues("housingType", record?.housingType ? [record.housingType] : []);
  els.recordDialog.showModal();
}

function saveForm() {
  if (!els.recordForm.reportValidity()) return;
  const personTypes = selectedValues("personTypes");
  const housingType = selectedValues("housingType")[0] || "";
  if (!personTypes.length) return toast("請至少選一項人員類別");
  if (!housingType) return toast("請選一項住宅類別");

  const now = new Date().toISOString();
  const record = {
    id: els.recordId.value || crypto.randomUUID(),
    date: els.dateInput.value,
    serial: normalizeText(els.serialInput.value),
    name: normalizeText(els.nameInput.value),
    gender: els.genderInput.value,
    birth: normalizeText(els.birthInput.value),
    nationalId: normalizeText(els.nationalIdInput.value).toUpperCase(),
    phone: normalizeText(els.phoneInput.value),
    certificateNo: normalizeText(els.certificateInput.value),
    address: normalizeText(els.addressInput.value),
    homeStatus: els.homeStatusInput.value,
    receiveMethod: els.receiveMethodInput.value,
    installLocation: normalizeText(els.installLocationInput.value),
    handler: normalizeText(els.handlerInput.value),
    status: els.recordStatusInput.value,
    personTypes,
    housingType,
    note: normalizeText(els.noteInput.value),
    updatedAt: now,
  };

  const index = state.records.findIndex((item) => item.id === record.id);
  if (index >= 0) state.records[index] = record;
  else state.records.push(record);

  saveRecords();
  els.recordDialog.close();
  render();
  toast("資料已儲存");
}

function addHandler() {
  const name = normalizeText(els.newHandlerInput.value);
  if (!name) return toast("請輸入受理人員姓名");
  if (state.handlers.includes(name)) return toast("名單已有此人員");
  state.handlers.push(name);
  state.handlers = uniqueNames(state.handlers);
  saveHandlers();
  els.newHandlerInput.value = "";
  renderHandlers();
  toast("受理人員已新增");
}

function deleteHandler(name) {
  if (state.records.some((record) => record.handler === name)) {
    toast("此人員已有申請資料使用，無法刪除");
    return;
  }
  if (!confirm(`確定刪除「${name}」？`)) return;
  state.handlers = state.handlers.filter((handler) => handler !== name);
  saveHandlers();
  renderHandlers();
  toast("受理人員已刪除");
}

function cancelForm() {
  const ok = confirm("確認是否離開頁面？系統不會保存這筆資料。");
  if (!ok) return;
  els.recordDialog.close();
}

function deleteRecord(id) {
  const record = state.records.find((item) => item.id === id);
  if (!record || !confirm(`確定刪除「${record.name}」這筆資料？`)) return;
  state.records = state.records.filter((item) => item.id !== id);
  saveRecords();
  render();
  toast("資料已刪除");
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
  const headers = ["序號", "申請人姓名", "申請人電話", "出生年月日", "申請人身分證字號", "申請人地址", "場所狀況", "領取方式/位置", "人員類別", "住宅類別", "個認號碼", "受理人員", "狀態", "備註"];
  const rows = state.records.map((record) => [
    record.serial, record.name, record.phone, record.birth, record.nationalId, record.address,
    record.homeStatus, methodWithLocation(record), record.personTypes.join("、"), record.housingType,
    record.certificateNo, record.handler, record.status, record.note,
  ]);
  downloadFile(`住警器申請清冊_${todayString()}.csv`, toCsv([headers, ...rows]), "text/csv;charset=utf-8");
}

function exportJson() {
  downloadFile(`住警器系統備份_${todayString()}.json`, JSON.stringify(state.records, null, 2), "application/json");
}

function importJson(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const incoming = migrateRecords(JSON.parse(reader.result));
      const merged = new Map(state.records.map((record) => [record.id, record]));
      incoming.forEach((record) => merged.set(record.id, record));
      state.records = Array.from(merged.values());
      saveRecords();
      render();
      toast("備份已匯入");
    } catch {
      toast("匯入失敗，請確認 JSON 格式");
    } finally {
      els.importJsonInput.value = "";
    }
  };
  reader.readAsText(file);
}

function copySummary() {
  const lines = [["住宅類別", "戶數", "自行領取", "到府安裝", "已簽收"]];
  Array.from(els.summaryBody.querySelectorAll("tr")).forEach((row) => {
    const cells = Array.from(row.children).map((cell) => cell.textContent.trim());
    if (cells.length === 5 && !cells[0].includes("尚無")) lines.push(cells);
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
    status: "未簽收",
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
els.openFormBtn.addEventListener("click", () => openForm());
els.saveRecordBtn.addEventListener("click", saveForm);
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
els.statusFilter.addEventListener("change", renderRecords);
els.handlerFilter.addEventListener("input", renderRecords);
els.printMode.addEventListener("change", renderPrint);
els.printRecord.addEventListener("change", renderPrint);
els.printStatus.addEventListener("change", renderPrint);
els.agencyInput.addEventListener("input", renderPrint);
els.printBtn.addEventListener("click", () => {
  renderPrint();
  window.print();
});
els.exportCsvBtn.addEventListener("click", exportCsv);
els.exportJsonBtn.addEventListener("click", exportJson);
els.importJsonInput.addEventListener("change", (event) => importJson(event.target.files[0]));
els.clearBtn.addEventListener("click", () => {
  if (!confirm("確定清除全部本機資料？請先確認已完成備份。")) return;
  state.records = [];
  saveRecords();
  render();
  toast("本機資料已清除");
});
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
