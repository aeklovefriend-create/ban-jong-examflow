function doGet(e) { return HtmlService.createTemplateFromFile('index').evaluate().setTitle(CONFIG.APP_NAME).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); }
function include(filename) { return HtmlService.createHtmlOutputFromFile(filename).getContent(); }

function setupSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(); if (!ss) throw new Error('กรุณาเปิด Apps Script จาก Google Sheet ของระบบ');
  PropertiesService.getScriptProperties().setProperty('DB_SPREADSHEET_ID', ss.getId());
  Object.keys(CONFIG.SHEETS).forEach(name => ensureSheet_(name, CONFIG.SHEETS[name]));
  Object.keys(CONFIG.DEFAULT_SETTINGS).forEach(k => { if (getSetting_(k) === '') setSetting_(k, CONFIG.DEFAULT_SETTINGS[k], 'System default'); });
  seedReferenceData_(); seedSampleUsers_(); seedSampleSubmissions_(); ensureRootFolder_(); createTriggers_();
  return {ok:true, spreadsheetId:ss.getId(), message:'ตั้งค่าระบบเรียบร้อยแล้ว'};
}
function seedSampleUsers_() {
  const users=readRecords_('Users').records;
  if (!users.length) {
    const current=getCurrentUserEmail_();
    if (current) appendRecord_('Users',{UserID:makeId_('USR'),Email:current,FirstName:'ผู้ดูแล',LastName:'ระบบ',Position:'ผู้ดูแลระบบ',SubjectGroup:'',Role:'Admin',Active:true,CreatedAt:now_(),UpdatedAt:now_()});
    [['teacher1@example.com','ครู','ตัวอย่าง 1','ภาษาไทย'],['teacher2@example.com','ครู','ตัวอย่าง 2','คณิตศาสตร์'],['teacher3@example.com','ครู','ตัวอย่าง 3','ภาษาต่างประเทศ']].forEach(x=>appendRecord_('Users',{UserID:makeId_('USR'),Email:x[0],FirstName:x[1],LastName:x[2],Position:'ครูผู้สอน',SubjectGroup:x[3],Role:'Teacher',Active:true,CreatedAt:now_(),UpdatedAt:now_()}));
  }
}
function seedSampleSubmissions_() {
  if (readRecords_('Submissions').records.length) return;
  const samples=[['teacher1@example.com','ครู ตัวอย่าง 1','ท 14101','ภาษาไทย','ป.4','Submitted'],['teacher1@example.com','ครู ตัวอย่าง 1','ค 14101','คณิตศาสตร์','ป.4','Under Review'],['teacher2@example.com','ครู ตัวอย่าง 2','ว 14101','วิทยาศาสตร์','ป.5','Need Revision'],['teacher2@example.com','ครู ตัวอย่าง 2','อ 14101','ภาษาอังกฤษ','ป.4','Approved'],['teacher3@example.com','ครู ตัวอย่าง 3','ส 14101','สังคมศึกษา','ป.6','Ready to Print']];
  samples.forEach((x,i)=>{const id='BJ-2569-SAMPLE-'+(i+1); appendRecord_('Submissions',{SubmissionID:id,TeacherEmail:x[0],TeacherName:x[1],AcademicYear:'2569',Semester:'1',ExamType:i%2?'FINAL':'MID',SubjectCode:x[2],SubjectName:x[3],Grade:x[4],Room:'1',TotalQuestions:20,TotalScore:20,ExamDuration:60,StudentCount:20,CopyCount:20,Status:x[5],CurrentVersion:x[5]==='Need Revision'?2:1,SubmittedAt:now_(),ReviewedAt:'',ApprovedAt:x[5]==='Approved'||x[5]==='Ready to Print'?now_():'',ApprovedBy:'',CreatedAt:now_(),UpdatedAt:now_(),DueDate:getSetting_('DEADLINE_END'),LastComment:x[5]==='Need Revision'?'กรุณาตรวจคำสั่งและตัวชี้วัดให้สอดคล้อง':'',CoverFileId:'',ExamFolderId:''});});
}
function seedReferenceData_() {
  if (!readRecords_('ExamTypes').records.length) [['MID','กลางภาค'],['FINAL','ปลายภาค'],['QUIZ','แบบทดสอบ'],['PRE','Pre-test'],['POST','Post-test'],['OTHER','อื่น ๆ']].forEach((x,i)=>appendRecord_('ExamTypes',{ExamTypeID:x[0],Name:x[1],Active:true,SortOrder:i+1}));
  if (!readRecords_('Subjects').records.length) [['ท 14101','ภาษาไทย','ภาษาไทย','ป.4,ป.5,ป.6'],['ค 14101','คณิตศาสตร์','คณิตศาสตร์','ป.4,ป.5,ป.6'],['ว 14101','วิทยาศาสตร์','วิทยาศาสตร์และเทคโนโลยี','ป.4,ป.5,ป.6'],['อ 14101','ภาษาอังกฤษ','ภาษาต่างประเทศ','ป.4,ป.5,ป.6'],['ส 14101','สังคมศึกษา','สังคมศึกษา ศาสนาและวัฒนธรรม','ป.4,ป.5,ป.6']].forEach(x=>appendRecord_('Subjects',{SubjectCode:x[0],SubjectName:x[1],SubjectGroup:x[2],Grades:x[3],Active:true}));
  if (!readRecords_('Classes').records.length) ['ป.1','ป.2','ป.3','ป.4','ป.5','ป.6'].forEach(g=>appendRecord_('Classes',{Grade:g,Room:'1',StudentCount:20,Active:true}));
  if (!readRecords_('Indicators').records.length) [['ต 1.1 ป.4/2','ภาษาต่างประเทศ','ป.4','ภาษาเพื่อการสื่อสาร','มาตรฐาน ต 1.1','เข้าใจและตีความเรื่องที่ฟังและอ่านจากสื่อต่าง ๆ','ปลายทาง'],['ต 1.1 ป.4/3','ภาษาต่างประเทศ','ป.4','ภาษาเพื่อการสื่อสาร','มาตรฐาน ต 1.1','เลือกภาพหรือสัญลักษณ์ตรงตามความหมายของประโยค','ปลายทาง'],['ต 1.2 ป.4/4','ภาษาต่างประเทศ','ป.4','ภาษาเพื่อการสื่อสาร','มาตรฐาน ต 1.2','พูดและเขียนเพื่อขอและให้ข้อมูลเกี่ยวกับตนเอง','ระหว่างทาง'],['ต 2.1 ป.4/1','ภาษาต่างประเทศ','ป.4','ภาษาและวัฒนธรรม','มาตรฐาน ต 2.1','เข้าใจความสัมพันธ์ระหว่างภาษากับวัฒนธรรม','ปลายทาง']].forEach((x,i)=>appendRecord_('Indicators',{IndicatorID:'IND-'+(i+1),AcademicYear:'2569',SubjectGroup:x[1],Grade:x[2],Strand:x[3],Standard:x[4],Code:x[0],Description:x[5],Type:x[6],Active:true}));
}
function ensureRootFolder_() { let id=getSetting_('ROOT_FOLDER_ID'); if (id) { try { DriveApp.getFolderById(id); return id; } catch (_) {} } const folder=DriveApp.createFolder('ระบบส่งข้อสอบโรงเรียนบ้านจอง'); setSetting_('ROOT_FOLDER_ID',folder.getId(),'Root Drive folder'); return folder.getId(); }
function createTriggers_() { ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='deadlineNotifier').forEach(t=>ScriptApp.deleteTrigger(t)); ScriptApp.newTrigger('deadlineNotifier').timeBased().everyDays(1).atHour(7).create(); }
function deleteRowsWhere_(sheetName, predicate) { const sh=getSheet_(sheetName); const data=sh.getDataRange().getValues(); if(data.length<2)return 0; const headers=data[0], rows=[]; data.slice(1).forEach((r,i)=>{const o={};headers.forEach((h,j)=>o[h]=r[j]);if(predicate(o))rows.push(i+2);}); rows.reverse().forEach(r=>sh.deleteRow(r)); return rows.length; }
function clearSampleData() { const u=requireUser_(['Admin']); let removed=0; removed+=deleteRowsWhere_('Users',r=>String(r.Email).endsWith('@example.com')); removed+=deleteRowsWhere_('Submissions',r=>String(r.SubmissionID).includes('-SAMPLE-')); removed+=deleteRowsWhere_('Indicators',r=>String(r.IndicatorID).match(/^IND-[1-4]$/)); removed+=deleteRowsWhere_('ActivityLogs',r=>String(r.EntityID).includes('-SAMPLE-')); return {ok:true,removed}; }
