# Ban Jong School ExamFlow v2.2

ระบบส่งข้อสอบโรงเรียนบ้านจองสำหรับ Google Apps Script + Google Sheets + Google Drive + Google Docs เป็นระบบเดียว ตั้งแต่ครูสร้างร่าง ส่งไฟล์ กำหนดตัวชี้วัด ฝ่ายวิชาการตรวจและให้แก้ไข อนุมัติ สร้างใบปะหน้า PDF และบันทึกการพิมพ์

## เว็บไซต์พร้อมใช้

- เว็บสาธารณะสำหรับใช้งานทันที: https://aeklovefriend-create.github.io/ban-jong-examflow/
- Repository: https://github.com/aeklovefriend-create/ban-jong-examflow
- ระบบใช้โหมดไม่ต้อง Login ตามที่โรงเรียนขอ โดยให้เลือกชื่อครูและบันทึกผู้ดำเนินการเป็น `OPEN_UNVERIFIED`
- หน้าตรวจมี Dashboard ติดตามครูทุกคน, กล่องเปิดไฟล์ข้อสอบ/เฉลยจาก Drive/Docs และ fallback ไปคลังระบบเดิม
- ตัวชี้วัดเลือกจากรายการ Master ที่กรองตามชั้นและวิชา ครูไม่ต้องพิมพ์รหัสเอง
- หน้าเว็บอ่าน `Indicators`, `ExamTasks`, `ExamSubmissions` และ `ExamFiles` จาก Google Sheets ชุดจริงผ่าน GViz; ถ้าตาราง Exam* ยังว่าง ระบบจะแสดงข้อมูลตัวอย่างและลิงก์คลังเดิมให้ตรวจต่อได้

## สถาปัตยกรรม

```text
Browser (index.html, styles.html, app.js.html)
          │ google.script.run
Apps Script Web App
  Auth / Teacher / Academic / Indicator / Drive / PDF / Notification / Report
          │
Google Sheets (ตารางข้อมูลแบบใช้ SubmissionID เป็นคีย์)
          │
Google Drive (โฟลเดอร์ตามปี/ภาคเรียน/ประเภทสอบ/ชั้น/วิชา/ครู)
          │
Google Docs → PDF (ใบปะหน้า A4 พร้อม QR)
```

URL ระบบทดลองที่ให้มาไม่สามารถเข้าถึงจากสภาพแวดล้อมการตรวจสอบได้ จึงออกแบบ v2.0 จากสเปกที่ให้มาและรักษาฟังก์ชันหลักเดิมที่จำเป็นไว้ทั้งหมด

### โครงสร้าง Indicator ที่อ้างอิง

หน้าอ้างอิง [KUMSUB ตัวชี้วัดระหว่างทางและปลายทาง](https://kru.kumsub.com/p/idct/search) ให้เลือก `ระดับชั้น` และ `กลุ่มสาระการเรียนรู้` แล้วแสดงผลแยกตาม `สาระที่ 1–4` เป็นตารางที่มีคอลัมน์ `กลุ่มที่`, `ตัวชี้วัดระหว่างทาง`, `ตัวชี้วัดปลายทาง` โดยแต่ละรายการประกอบด้วย `รหัสตัวชี้วัด` และ `รายละเอียด` ตัวอย่าง ป.4/ภาษาต่างประเทศแสดง 14 ตัวชี้วัดระหว่างทาง, 6 ตัวชี้วัดปลายทาง รวม 20 รายการ ระบบจึงเก็บ `SubjectGroup, Grade, Strand, Standard, Code, Description, Type` ใน `Indicators` และใช้ `Type` เป็น `ระหว่างทาง`/`ปลายทาง` แทนการ scrape หน้าเว็บทุกครั้ง

## ไฟล์ในโปรเจกต์

- `Code.gs` — `doGet`, `setupSystem`, seed data, trigger และ entry point
- `Config.gs` — สถานะ, ชื่อ Sheet, headers, default settings
- `Auth.gs` — Google Account + whitelist + RBAC
- `Utils.gs` — batch Sheet helpers, validation, logging, Lock-safe utilities
- `TeacherService.gs` — dashboard, draft, submit, revision, detail
- `AcademicService.gs` — dashboard, review checklist, approve, print queue
- `IndicatorService.gs` — master indicator search, mapping validation, blueprint, import
- `DriveService.gs` — folder tree และ upload file validation
- `PDFService.gs` — Google Docs cover sheet, PDF, QR status link
- `NotificationService.gs` — email notifications และ deadline trigger
- `ReportService.gs` — CSV export และ activity log
- `AdminService.gs` — จัดการ users, subjects, classes และ settings จาก server side
- `index.html`, `styles.html`, `app.js.html` — responsive Thai UI
- `appsscript.json` — runtime, scopes, Advanced Drive service

## โครงสร้างฐานข้อมูล

`setupSystem()` จะสร้าง Sheet และ header ให้เอง โดยใช้ชื่อคอลัมน์ตามนี้

| Sheet | หน้าที่ | Primary key |
|---|---|---|
| Users | whitelist, role, กลุ่มสาระ | UserID |
| Submissions | metadata และ workflow state | SubmissionID |
| Files | ไฟล์ข้อสอบ/เฉลยทุก version | FileID |
| Versions | ประวัติ version | VersionID |
| Indicators | Indicator Master Database ที่ import จาก CSV/Sheet ได้ | IndicatorID |
| ItemIndicators | mapping ช่วงข้อ ↔ ตัวชี้วัด | MappingID |
| ReviewChecklist | ผลตรวจ checklist | ReviewID |
| ApprovalLogs | ประวัติ transition | ApprovalID |
| PrintLogs | รับเข้าคิว/พิมพ์แล้ว | PrintID |
| Subjects | วิชาและกลุ่มสาระ | SubjectCode |
| Classes | ชั้น/ห้อง/จำนวนนักเรียน | Grade + Room |
| ExamTypes | ประเภทสอบ | ExamTypeID |
| Settings | ค่าโรงเรียน/กำหนดส่ง/สี/Folder ID | Key |
| ActivityLogs | audit log | LogID |
| ErrorLogs | technical error | ErrorID |

## ติดตั้งทีละขั้น

1. สร้าง Google Sheet ใหม่ในบัญชีโรงเรียน เปิด Extensions → Apps Script
2. สร้างไฟล์ `.gs` และ `.html` ตามชื่อในโฟลเดอร์นี้ แล้วคัดลอกโค้ดทั้งหมดไปวาง หรือใช้ clasp นำเข้าไฟล์ทั้งชุด
3. เปิด `appsscript.json` ใน Project Settings และใช้ manifest นี้ ระบบใช้บริการมาตรฐานของ Apps Script จึงไม่ต้องเปิด Advanced Drive API เพิ่ม
4. Run `setupSystem()` ครั้งแรก ยืนยันสิทธิ์ Sheets, Drive, Docs, Mail และ External request
5. ระบบจะสร้าง Sheets, default settings, folder root, exam types, subjects, classes, indicators ตัวอย่าง, users ตัวอย่าง และ submissions ตัวอย่าง 5 รายการ
6. เปิด Sheet `Users` แทนที่อีเมล `teacher1@example.com` ฯลฯ ด้วยบัญชีจริง และเพิ่มผู้รับบท `Academic`/`Admin` ตามต้องการ บัญชีที่ใช้ run setup จะถูกเพิ่มเป็น Admin อัตโนมัติถ้า Users ยังว่าง
7. แก้ `Settings` เช่น `SCHOOL_LOGO_URL`, `ACADEMIC_YEAR`, `SEMESTER`, `DEADLINE_START`, `DEADLINE_END`, `DIRECTOR_NAME`, `ACADEMIC_HEAD_NAME`, `COVER_TEMPLATE_ID` (ถ้ามี) และ `ROOT_FOLDER_ID` ตามจริง
8. รุ่น GitHub Pages มี Indicator Master ฝังในหน้าเว็บแล้ว 1,059 รายการไม่ซ้ำจาก PDF ทั้ง 8 กลุ่มสาระที่ผู้ใช้ให้มา ครบ ป.1–ป.6 และกรองตามชั้น/กลุ่มสาระอัตโนมัติ หากใช้ Apps Script backend ให้ import ชุดเดียวกันลง Sheet `Indicators` ด้วย fields `AcademicYear, SubjectGroup, Grade, Strand, Standard, Code, Description, Type` ระบบไม่ scrape ทุกครั้งที่เปิดหน้า
9. Deploy → New deployment → Web app; Execute as: Me; Who has access: ผู้ใช้ในโดเมนโรงเรียน หรือ Anyone with Google account หากโรงเรียนใช้ Gmail ส่วนตัวหลายบัญชี
10. เปิด URL ด้วยบัญชี Teacher และทดสอบ upload/review/approve/print ตามชุดทดสอบด้านล่าง

## Workflow ที่บันทึกในระบบ

`Draft → Submitted → Under Review → Need Revision → Resubmitted → Approved → Ready to Print → Printed → Completed`

ทุก transition บันทึกเวลา ผู้ดำเนินการ และรายละเอียดใน `ActivityLogs`/`ApprovalLogs` ส่วนไฟล์เดิมไม่ถูกลบเมื่อส่ง V2/V3

โฟลเดอร์ Drive จะเป็น `ปีการศึกษา/ภาคเรียนที่ n/ประเภทสอบ/ระดับชั้น/รหัสวิชา ชื่อวิชา/ชื่อครู SubmissionID` และสร้างโฟลเดอร์ย่อย `ข้อสอบ`, `เฉลย`, `ใบปะหน้า`, `Versions` อัตโนมัติ

## การทดสอบรับมอบ (UAT)

| ID | กรณีทดสอบ | ผลที่คาดหวัง |
|---|---|---|
| TC01 | Teacher login ด้วยอีเมลใน Users | เห็น dashboard ครู |
| TC02 | กรอกข้อมูลและบันทึกร่าง | ได้ SubmissionID และสถานะ Draft |
| TC03 | แนบ PDF ข้อสอบ | รับไฟล์และบันทึกใน Drive |
| TC04 | แนบ DOCX | รับไฟล์และบันทึก MIME type ถูกต้อง |
| TC05 | ไม่แนบเฉลย | ระบบไม่ยอม submit |
| TC06 | mapping ไม่ครบ/ซ้ำ/เกินจำนวนข้อ | ระบบเตือนช่วงข้อที่ผิด |
| TC07 | Submit ครบ | สถานะ Submitted และ email ฝ่ายวิชาการ |
| TC08 | Academic เปิดรายการ | เปลี่ยนเป็น Under Review และเปิดไฟล์ได้ |
| TC09 | ส่งกลับแก้ไข | ครูเห็น Need Revision + comment |
| TC10 | Teacher ส่ง V2 | Version 1 ยังคงอยู่, สถานะ Resubmitted |
| TC11 | Approve โดย checklist ไม่ครบ | ระบบไม่อนุมัติ |
| TC12 | Approve ครบ | Ready to Print และสร้าง cover Doc/PDF |
| TC13 | Export PDF | PDF อยู่ในโฟลเดอร์ submission |
| TC14 | บันทึกพิมพ์แล้ว | PrintLogs มีผู้พิมพ์/เวลา/จำนวนชุด |
| TC15 | Teacher เปิดของคนอื่น | server ปฏิเสธ |
| TC16 | อีเมลไม่อยู่ whitelist | แสดงหน้าไม่อนุญาต |
| TC17 | เปิดมือถือ | layout ปรับเป็น 1 column, ปุ่มเต็มความกว้าง |
| TC18 | ครูสองคน submit พร้อมกัน | LockService กัน duplicate write |
| TC19 | ไฟล์เกิน 25 MB/ชนิดอื่น | ปฏิเสธก่อนสร้างไฟล์ |
| TC20 | เปิด Version History | เห็น V1/V2 พร้อมผู้ส่งและเวลา |

## Troubleshooting

- `ไม่ได้รับอนุญาต`: เพิ่มอีเมลใน `Users` และตั้ง `Active=true` พร้อม Role ให้ถูกต้อง จากนั้น reload
- `ยังไม่ได้กำหนด Google Sheet`: ต้อง run `setupSystem()` จาก Apps Script ที่เปิดจาก spreadsheet หรือใส่ `DB_SPREADSHEET_ID` ใน Script Properties
- อัปโหลดล้มเหลว: ตรวจ MIME type, ขนาดไฟล์ และ quota ของ Drive; ไฟล์เดิมจะไม่ถูกลบเมื่อ retry
- ไม่เห็นตัวชี้วัด: ตรวจ `Indicators.Active`, `Grade`, `SubjectGroup` ให้ตรงกับข้อมูลใน `Subjects`
- QR เปิดไม่พบรายการ: ต้อง deploy Web App แล้วใช้ URL deployment จริง เพราะ `ScriptApp.getService().getUrl()` จะว่างใน editor
- Email ไม่ออก: ตรวจ Mail quota และ trigger `deadlineNotifier`; workflow หลักยังทำงานได้แม้อีเมลส่งไม่สำเร็จ และ error จะอยู่ใน `ErrorLogs`
- PDF layout: ใบปะหน้าถูกสร้างเป็น Google Docs ด้วยขอบ A4 และ font มาตรฐานของ Docs; ถ้าต้องการโลโก้ให้ใส่ `SCHOOL_LOGO_URL` และขยาย `createCoverDocument()` ให้แทรกรูปตาม CI ของโรงเรียน

## ข้อควรรู้ก่อนใช้งานจริง

ระบบใช้ Google Account และ server-side RBAC เป็นหลัก การเปิดไฟล์จะอาศัยสิทธิ์ Drive ของผู้ใช้ที่ได้รับอนุญาต จึงไม่ต้องเปิดโฟลเดอร์เป็นสาธารณะ ข้อมูลตัวชี้วัดถูกเก็บใน Sheets เพื่อความเร็วและลด dependency จากเว็บภายนอก การตั้งค่า production ควรเปลี่ยนอีเมลตัวอย่างและล้าง sample data หลังทดสอบด้วยเมนู Admin
