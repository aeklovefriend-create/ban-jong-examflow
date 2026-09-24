function getDb_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('DB_SPREADSHEET_ID') || CONFIG.DEFAULT_SETTINGS.SPREADSHEET_ID;
  const ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('ยังไม่ได้กำหนด Google Sheet สำหรับฐานข้อมูล');
  return ss;
}

function getSheet_(name) {
  const sh = getDb_().getSheetByName(name);
  if (!sh) throw new Error('ไม่พบ Sheet: ' + name);
  return sh;
}

function ensureSheet_(name, headers) {
  const ss = getDb_();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  else sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  sh.setFrozenRows(1);
  return sh;
}

function headerMap_(headers) { return headers.reduce((m, h, i) => { m[h] = i; return m; }, {}); }
function readRecords_(sheetName) {
  const sh = getSheet_(sheetName); const data = sh.getDataRange().getValues();
  if (!data.length) return { headers: [], records: [] };
  const headers = data[0]; const map = headerMap_(headers);
  const records = data.slice(1).filter(r => r.some(v => v !== '')).map(r => {
    const o = {}; headers.forEach((h, i) => o[h] = r[i] instanceof Date ? r[i].toISOString() : r[i]); o.__row = data.indexOf(r) + 1; return o;
  });
  return { headers, map, records };
}
function appendRecord_(sheetName, obj) { const sh = getSheet_(sheetName); const headers = CONFIG.SHEETS[sheetName]; sh.getRange(sh.getLastRow()+1,1,1,headers.length).setValues([headers.map(h => obj[h] === undefined ? '' : obj[h])]); }
function updateRecordById_(sheetName, idHeader, id, patch) {
  const sh = getSheet_(sheetName); const vals = sh.getDataRange().getValues(); if (vals.length < 2) return false;
  const headers = vals[0], map = headerMap_(headers), row = vals.findIndex((r, i) => i > 0 && String(r[map[idHeader]]) === String(id));
  if (row < 1) return false; const out = vals[row].slice(); Object.keys(patch).forEach(k => { if (map[k] !== undefined) out[map[k]] = patch[k]; });
  sh.getRange(row+1,1,1,headers.length).setValues([out]); return true;
}
function now_() { return new Date(); }
function iso_(v) { return v ? new Date(v).toISOString() : ''; }
function safeString_(v, max) { return String(v == null ? '' : v).trim().slice(0, max || 500); }
function toNumber_(v, fallback) { const n = Number(v); return Number.isFinite(n) ? n : (fallback || 0); }
function makeId_(prefix) { return prefix + '-' + Utilities.getUuid().replace(/-/g,'').slice(0, 16).toUpperCase(); }
function generateSubmissionId_(p) {
  const year = safeString_(p.AcademicYear || getSetting_('ACADEMIC_YEAR'), 4);
  const exam = safeString_(p.ExamType || 'EX', 3).replace(/[^A-Za-z0-9]/g,'').toUpperCase().slice(0,3) || 'EX';
  const grade = safeString_(p.Grade || 'G', 4).replace(/[^A-Za-z0-9ก-๙]/g,'').slice(0,4) || 'G';
  const code = safeString_(p.SubjectCode || 'SUB', 8).replace(/[^A-Za-z0-9]/g,'').toUpperCase();
  return 'BJ-' + year + '-' + exam + '-' + grade + '-' + code + '-' + Utilities.getUuid().replace(/-/g,'').slice(0,6).toUpperCase();
}
function json_(data) { return JSON.parse(JSON.stringify(data)); }
function logActivity_(action, entityType, entityId, details, actor) { appendRecord_('ActivityLogs', {LogID: makeId_('LOG'), ActorEmail: actor && actor.email || getCurrentUserEmail_(), ActorName: actor && actor.name || '', Action: action, EntityType: entityType, EntityID: entityId || '', Details: safeString_(details, 1000), CreatedAt: now_()}); }
function logError_(fn, err) { try { appendRecord_('ErrorLogs', {ErrorID: makeId_('ERR'), FunctionName: fn, Message: safeString_(err && err.message || err, 1000), Stack: safeString_(err && err.stack || '', 3000), UserEmail: getCurrentUserEmail_(), CreatedAt: now_()}); } catch (_) {} }
function withErrorHandling_(fnName, callback) { try { return callback(); } catch (e) { logError_(fnName, e); const msg=String(e && e.message || e); if(/[\u0E00-\u0E7F]/.test(msg)) throw new Error(msg); throw new Error('ระบบยังไม่สามารถดำเนินการได้ กรุณาลองอีกครั้ง'); } }
function getSetting_(key) { const rs = readRecords_('Settings').records.find(r => r.Key === key); return rs ? rs.Value : (CONFIG.DEFAULT_SETTINGS[key] || ''); }
function setSetting_(key, value, description) { const existing = readRecords_('Settings').records.find(r => r.Key === key); const data = {Key:key, Value:value, Description:description || '', UpdatedAt:now_()}; if (existing) updateRecordById_('Settings','Key',key,data); else appendRecord_('Settings', data); }
function getCurrentUserEmail_() { return Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail() || ''; }
function dateText_(v) { if (!v) return ''; return Utilities.formatDate(new Date(v), getSetting_('TIMEZONE') || CONFIG.DEFAULT_TIMEZONE, 'dd/MM/yyyy HH:mm'); }
function parseDataUrl_(dataUrl) { const m = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/); if (!m) throw new Error('รูปแบบไฟล์ไม่ถูกต้อง'); return { mime:m[1], bytes:Utilities.base64Decode(m[2]) }; }
