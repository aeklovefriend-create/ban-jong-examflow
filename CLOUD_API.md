# Ban Jong ExamFlow Cloud API

เว็บสาธารณะของ ExamFlow ใช้ Apps Script Web App ตัวกลางสำหรับให้ครูหลายเครื่องส่งข้อมูลเข้าฐานเดียวกัน

- Spreadsheet: `1OMAa-7BsGU7AvLVbk2d1H3U1Mn19mqFDF-VFQ1OvjSk`
- Endpoint: `https://script.google.com/macros/s/AKfycbzMXHH5yRyvPmwikCMrviMkPGrGXAkKhoWGbQk6oVz6EFfiBYgCuxX70OxCO1ezDYISOA/exec`
- โหมดอ่านข้อมูล: `GET ?action=sync&callback=...`
- โหมดเขียนข้อมูล: `POST action=upsertSubmission` และ `POST action=updateStatus`

ไฟล์ `CloudApi.gs` เป็นโค้ด Apps Script ของบริการนี้ โดยรันในฐานะเจ้าของโครงการและเขียนลงตาราง `ExamTasks`, `ExamSubmissions`, `ExamFiles` อัตโนมัติ ใช้ `LockService` ป้องกันการเขียนชนกัน และเก็บไฟล์ข้อสอบ/เฉลยไว้ใน Google Drive โฟลเดอร์ `Ban Jong ExamFlow Uploads`

เว็บหลักยังเก็บ Draft ในเครื่องเพื่อให้ทำงานต่อได้เมื่อสัญญาณไม่เสถียร แต่เมื่อกดส่ง ฝั่งเว็บจะส่ง metadata ก่อน แล้วอัปโหลดไฟล์ข้อสอบ/เฉลยแยกคำขอ (รองรับตามข้อจำกัดหน้าแบบฟอร์มไม่เกิน 20 MB ต่อไฟล์) ไปยัง Cloud API ทำให้หัวหน้าวิชาการเห็นรายการและเปิดไฟล์จากทุกเครื่องหลังอัปเดตข้อมูล
