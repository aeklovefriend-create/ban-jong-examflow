const CLOUD = Object.freeze({
  SPREADSHEET_ID: '1OMAa-7BsGU7AvLVbk2d1H3U1Mn19mqFDF-VFQ1OvjSk',
  TOKEN: 'BJX-2569-CLOUD-9f6f2a7c4e1b',
  UPLOAD_FOLDER: 'Ban Jong ExamFlow Uploads'
});

const CLOUD_HEADERS = Object.freeze({
  ExamTasks: ['TaskID','AssignmentID','TeacherID','TeacherName','SubjectID','SubjectName','SubjectCode','ClassID','ClassName','AcademicYear','Semester','ExamType','TotalQuestions','TotalScore','Duration','StudentCount','CopyCount','DraftJSON','Status','CreatedAt','UpdatedAt'],
  ExamSubmissions: ['SubmissionID','TaskID','Version','Status','SubmittedAt','UpdatedAt','ApprovedAt','ApprovedBy','TeacherName','Comment'],
  ExamFiles: ['FileID','SubmissionID','TaskID','Version','Kind','Name','MimeType','Size','DriveFileID','DriveUrl','UploadedAt']
});

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'sync') return cloudOutput_(cloudSync_(), p.callback);
  if (p.action === 'health') return cloudOutput_({ok:true, service:'Ban Jong ExamFlow Cloud API', time:new Date().toISOString()}, p.callback);
  return HtmlService.createHtmlOutput('<h2>Ban Jong ExamFlow Cloud API</h2><p>บริการข้อมูลกลางทำงานปกติ</p>');
}

function doPost(e) {
  try {
    const p = (e && e.parameter) || {};
    if (p.token !== CLOUD.TOKEN) throw new Error('unauthorized');
    const payload = JSON.parse(p.payload || '{}');
    let result;
    if (p.action === 'upsertSubmission') result = cloudUpsertSubmission_(payload);
    else if (p.action === 'updateStatus') result = cloudUpdateStatus_(payload);
    else result = {ok:false, message:'unknown action'};
    return cloudOutput_(result, p.callback);
  } catch (err) {
    return cloudOutput_({ok:false, message:'ระบบยังไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้ง'}, '');
  }
}

function cloudOutput_(data, callback) {
  const text = JSON.stringify(data);
  if (callback && /^[A-Za-z_$][\w$]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + text + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}

function cloudDb_() { return SpreadsheetApp.openById(CLOUD.SPREADSHEET_ID); }
function cloudSheet_(name) {
  const ss = cloudDb_();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  const headers = CLOUD_HEADERS[name];
  if (headers && sh.getLastRow() === 0) sh.getRange(1,1,1,headers.length).setValues([headers]);
  return sh;
}
function cloudRows_(name) {
  const sh = cloudSheet_(name), values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).filter(r => r.some(v => v !== '')).map((r,i) => {
    const o = {}; headers.forEach((h,j) => o[h] = r[j] instanceof Date ? r[j].toISOString() : r[j]); o.__row = i + 2; return o;
  });
}
function cloudWrite_(name, row, keyHeaders) {
  const sh = cloudSheet_(name), headers = CLOUD_HEADERS[name];
  const rows = cloudRows_(name);
  const match = rows.find(r => keyHeaders.every(k => String(r[k] || '') === String(row[k] || '')));
  const values = headers.map(h => row[h] === undefined ? '' : row[h]);
  if (match) sh.getRange(match.__row,1,1,headers.length).setValues([values]);
  else sh.getRange(sh.getLastRow()+1,1,1,headers.length).setValues([values]);
}

function cloudSync_() {
  return {ok:true, tasks:cloudRows_('ExamTasks'), submissions:cloudRows_('ExamSubmissions'), files:cloudRows_('ExamFiles'), syncedAt:new Date().toISOString()};
}

function cloudUpsertSubmission_(p) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const now = new Date().toISOString();
    const taskId = String(p.taskId || p.id || '');
    const id = String(p.id || '');
    if (!taskId || !id) throw new Error('missing id');
    const draft = JSON.stringify({assignmentId:p.assignmentId,teacherId:p.teacherId,teacherName:p.teacherName,subjectId:p.subjectId,subjectName:p.subjectName,subjectCode:p.subjectCode,classId:p.classId,className:p.className,academicYear:p.academicYear,semester:p.semester,examType:p.examType,totalQuestions:p.totalQuestions,totalScore:p.totalScore,duration:p.duration,studentCount:p.studentCount,copyCount:p.copyCount,indicators:p.indicators || []});
    cloudWrite_('ExamTasks',{TaskID:taskId,AssignmentID:p.assignmentId||'',TeacherID:p.teacherId||'',TeacherName:p.teacherName||'',SubjectID:p.subjectId||'',SubjectName:p.subjectName||'',SubjectCode:p.subjectCode||'',ClassID:p.classId||'',ClassName:p.className||'',AcademicYear:p.academicYear||'2569',Semester:p.semester||'1',ExamType:p.examType||'',TotalQuestions:Number(p.totalQuestions||0),TotalScore:Number(p.totalScore||0),Duration:Number(p.duration||0),StudentCount:Number(p.studentCount||0),CopyCount:Number(p.copyCount||0),DraftJSON:draft,Status:p.status||'Submitted',CreatedAt:p.createdAt||now,UpdatedAt:p.updatedAt||now},['TaskID']);
    cloudWrite_('ExamSubmissions',{SubmissionID:id,TaskID:taskId,Version:Number(p.version||1),Status:p.status||'Submitted',SubmittedAt:p.submittedAt||now,UpdatedAt:p.updatedAt||now,ApprovedAt:p.approvedAt||'',ApprovedBy:p.approvedBy||'',TeacherName:p.teacherName||'',Comment:p.comment||''},['SubmissionID','Version']);
    (p.files || []).forEach(f => cloudSaveFile_(p,f,now));
    return {ok:true,submissionId:id,updatedAt:now};
  } finally { lock.releaseLock(); }
}

function cloudSaveFile_(p,f,now) {
  let driveId = '', driveUrl = '';
  if (f.dataUrl && /^data:[^;]+;base64,/.test(f.dataUrl)) {
    const match = f.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    const bytes = Utilities.base64Decode(match[2]);
    const folder = cloudUploadFolder_();
    const file = folder.createFile(Utilities.newBlob(bytes, match[1], String(p.id)+'-V'+String(p.version||1)+'-'+String(f.kind||'file')+'-'+String(f.name||'upload')));
    driveId = file.getId(); driveUrl = file.getUrl();
  }
  cloudWrite_('ExamFiles',{FileID:'FILE-'+Utilities.getUuid(),SubmissionID:p.id||'',TaskID:p.taskId||p.id||'',Version:Number(p.version||1),Kind:f.kind||'',Name:f.name||'',MimeType:f.type||'',Size:Number(f.size||0),DriveFileID:driveId,DriveUrl:driveUrl,UploadedAt:now},['SubmissionID','Version','Kind']);
}
function cloudUploadFolder_() {
  const props = PropertiesService.getScriptProperties(), key = 'CLOUD_UPLOAD_FOLDER_ID';
  const existing = props.getProperty(key); if (existing) { try { return DriveApp.getFolderById(existing); } catch (_) {} }
  const folder = DriveApp.createFolder(CLOUD.UPLOAD_FOLDER); props.setProperty(key,folder.getId()); return folder;
}

function cloudUpdateStatus_(p) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const rows = cloudRows_('ExamSubmissions'), now = new Date().toISOString();
    const row = rows.find(r => String(r.SubmissionID) === String(p.id) && String(r.Version) === String(p.version || 1));
    if (!row) throw new Error('not found');
    row.Status = p.status || row.Status; row.UpdatedAt = now; row.Comment = p.comment || row.Comment || ''; row.ApprovedAt = p.approvedAt || row.ApprovedAt || ''; row.ApprovedBy = p.approvedBy || row.ApprovedBy || '';
    cloudWrite_('ExamSubmissions',row,['SubmissionID','Version']);
    const tasks = cloudRows_('ExamTasks').find(r => String(r.TaskID) === String(row.TaskID));
    if (tasks) { tasks.Status = row.Status; tasks.UpdatedAt = now; cloudWrite_('ExamTasks',tasks,['TaskID']); }
    return {ok:true,submissionId:p.id,updatedAt:now};
  } finally { lock.releaseLock(); }
}
