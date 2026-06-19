const SPREADSHEET_ID = "";
const APPLICATIONS_SHEET = "Applications";
const SETTINGS_SHEET = "Settings";
const USERNAME_KEY = "sharedUsername";
const PASSWORD_HASH_KEY = "sharedPasswordHash";

const APPLICATION_HEADERS = [
  "id",
  "date",
  "serial",
  "name",
  "gender",
  "birth",
  "nationalId",
  "phone",
  "address",
  "homeStatus",
  "receiveMethod",
  "installLocation",
  "personTypes",
  "housingType",
  "certificateNo",
  "handler",
  "status",
  "note",
  "updatedAt",
];

function doGet(e) {
  const action = e.parameter.action || "";
  const callback = e.parameter.callback || "callback";
  let result;

  try {
    if (action === "meta") result = meta();
    else if (action === "setup") result = setupCredentials(e.parameter);
    else if (action === "login") result = login(e.parameter);
    else if (action === "data") result = getData(e.parameter);
    else result = { ok: false, message: "Unknown action" };
  } catch (error) {
    result = { ok: false, message: error.message };
  }

  return ContentService
    .createTextOutput(`${callback}(${JSON.stringify(result)})`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doPost(e) {
  const action = e.parameter.action || "";
  const payload = JSON.parse(e.parameter.payload || "{}");
  let result;

  try {
    assertAuth(payload.auth || {});
    if (action === "saveRecord") result = saveRecord(payload.record);
    else if (action === "deleteRecord") result = deleteRecord(payload.id);
    else if (action === "saveHandlers") result = saveHandlers(payload.handlers || []);
    else result = { ok: false, message: "Unknown action" };
  } catch (error) {
    result = { ok: false, message: error.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function meta() {
  ensureSheets();
  const props = PropertiesService.getScriptProperties();
  return {
    ok: true,
    hasCredentials: Boolean(props.getProperty(USERNAME_KEY) && props.getProperty(PASSWORD_HASH_KEY)),
  };
}

function setupCredentials(params) {
  ensureSheets();
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty(USERNAME_KEY) || props.getProperty(PASSWORD_HASH_KEY)) {
    return { ok: false, message: "帳號已設定" };
  }
  const username = String(params.username || "").trim();
  const passwordHash = String(params.passwordHash || "").trim();
  if (!username || !passwordHash) return { ok: false, message: "帳號或密碼不可空白" };
  props.setProperty(USERNAME_KEY, username);
  props.setProperty(PASSWORD_HASH_KEY, passwordHash);
  return { ok: true };
}

function login(params) {
  assertAuth(params);
  return { ok: true };
}

function getData(auth) {
  assertAuth(auth);
  ensureSheets();
  return {
    ok: true,
    records: readRecords(),
    handlers: readHandlers(),
  };
}

function assertAuth(auth) {
  const props = PropertiesService.getScriptProperties();
  const username = props.getProperty(USERNAME_KEY);
  const passwordHash = props.getProperty(PASSWORD_HASH_KEY);
  if (!username || !passwordHash) throw new Error("尚未設定帳號密碼");
  if (String(auth.username || "") !== username || String(auth.passwordHash || "") !== passwordHash) {
    throw new Error("帳號或密碼錯誤");
  }
}

function saveRecord(record) {
  if (!record || !record.id) throw new Error("資料缺少 id");
  const sheet = getSheet(APPLICATIONS_SHEET);
  const values = sheet.getDataRange().getValues();
  const row = APPLICATION_HEADERS.map((key) => {
    const value = record[key];
    return Array.isArray(value) ? value.join("、") : (value || "");
  });
  const idColumn = 1;
  let targetRow = -1;
  for (let i = 1; i < values.length; i += 1) {
    if (values[i][idColumn - 1] === record.id) {
      targetRow = i + 1;
      break;
    }
  }
  if (targetRow > 0) sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
  else sheet.appendRow(row);
  return { ok: true };
}

function deleteRecord(id) {
  if (!id) throw new Error("缺少 id");
  const sheet = getSheet(APPLICATIONS_SHEET);
  const values = sheet.getDataRange().getValues();
  for (let i = values.length - 1; i >= 1; i -= 1) {
    if (values[i][0] === id) sheet.deleteRow(i + 1);
  }
  return { ok: true };
}

function saveHandlers(handlers) {
  const sheet = getSheet(SETTINGS_SHEET);
  const names = [...new Set(handlers.map((name) => String(name || "").trim()).filter(Boolean))];
  sheet.clearContents();
  sheet.getRange(1, 1).setValue("handlers");
  if (names.length) sheet.getRange(2, 1, names.length, 1).setValues(names.map((name) => [name]));
  return { ok: true };
}

function readRecords() {
  const sheet = getSheet(APPLICATIONS_SHEET);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  return values.slice(1).filter((row) => row[0]).map((row) => {
    const record = {};
    APPLICATION_HEADERS.forEach((key, index) => {
      record[key] = row[index] || "";
    });
    record.personTypes = String(record.personTypes || "").split("、").filter(Boolean);
    return record;
  });
}

function readHandlers() {
  const sheet = getSheet(SETTINGS_SHEET);
  const values = sheet.getDataRange().getValues();
  return values.slice(1).map((row) => String(row[0] || "").trim()).filter(Boolean);
}

function ensureSheets() {
  const appSheet = getSheet(APPLICATIONS_SHEET);
  const settingsSheet = getSheet(SETTINGS_SHEET);
  ensureHeaders(appSheet, APPLICATION_HEADERS);
  if (settingsSheet.getLastRow() === 0) settingsSheet.getRange(1, 1).setValue("handlers");
}

function ensureHeaders(sheet, headers) {
  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const needsHeader = headers.some((header, index) => current[index] !== header);
  if (needsHeader) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

function getSheet(name) {
  const spreadsheet = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  return sheet;
}
