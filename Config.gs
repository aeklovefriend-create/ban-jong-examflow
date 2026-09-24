/** Ban Jong School ExamFlow v2.0 - central configuration. */
const CONFIG = Object.freeze({
  APP_NAME: 'Ban Jong School ExamFlow v2.0',
  SCHOOL_NAME: 'โรงเรียนบ้านจอง',
  DEFAULT_TIMEZONE: 'Asia/Bangkok',
  MAX_FILE_BYTES: 25 * 1024 * 1024,
  ALLOWED_MIME_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  STATUS: {
    DRAFT: 'Draft', SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under Review', NEED_REVISION: 'Need Revision',
    RESUBMITTED: 'Resubmitted', APPROVED: 'Approved', READY_TO_PRINT: 'Ready to Print', PRINTED: 'Printed', COMPLETED: 'Completed'
  },
  STATUS_TH: {
    Draft: 'ร่าง', Submitted: 'ส่งแล้ว', 'Under Review': 'รอตรวจ', 'Need Revision': 'ให้แก้ไข',
    Resubmitted: 'ส่งแก้ไขแล้ว', Approved: 'อนุมัติแล้ว', 'Ready to Print': 'พร้อมพิมพ์', Printed: 'พิมพ์แล้ว', Completed: 'เสร็จสิ้น'
  },
  SHEETS: {
    Users: ['UserID','Email','FirstName','LastName','Position','SubjectGroup','Role','Active','CreatedAt','UpdatedAt'],
    Submissions: ['SubmissionID','TeacherEmail','TeacherName','AcademicYear','Semester','ExamType','SubjectCode','SubjectName','Grade','Room','TotalQuestions','TotalScore','ExamDuration','StudentCount','CopyCount','Status','CurrentVersion','SubmittedAt','ReviewedAt','ApprovedAt','ApprovedBy','CreatedAt','UpdatedAt','DueDate','LastComment','CoverFileId','ExamFolderId'],
    Files: ['FileID','SubmissionID','Version','FileType','FileName','MimeType','SizeBytes','DriveFileId','DriveUrl','UploadedBy','UploadedAt','Active'],
    Versions: ['VersionID','SubmissionID','Version','QuestionFileId','AnswerFileId','Comment','Status','UploadedBy','UploadedAt'],
    Indicators: ['IndicatorID','AcademicYear','SubjectGroup','Grade','Strand','Standard','Code','Description','Type','Active'],
    ItemIndicators: ['MappingID','SubmissionID','Version','StartItem','EndItem','IndicatorID','Code','Type','Description','ItemCount','CreatedBy','CreatedAt'],
    ReviewChecklist: ['ReviewID','SubmissionID','Version','FormatOk','QuestionCountOk','ScoreOk','InstructionOk','LanguageOk','OptionsOk','AnswerKeyOk','IndicatorAlignmentOk','CoverageOk','PrivacyOk','ReadyOk','Comment','ReviewedBy','ReviewedAt'],
    ApprovalLogs: ['ApprovalID','SubmissionID','FromStatus','ToStatus','Action','Comment','ActorEmail','ActorName','CreatedAt'],
    PrintLogs: ['PrintID','SubmissionID','CopyCount','PrintedBy','PrintedAt','Note'],
    Subjects: ['SubjectCode','SubjectName','SubjectGroup','Grades','Active'],
    Classes: ['Grade','Room','StudentCount','Active'],
    ExamTypes: ['ExamTypeID','Name','Active','SortOrder'],
    Settings: ['Key','Value','Description','UpdatedAt'],
    ActivityLogs: ['LogID','ActorEmail','ActorName','Action','EntityType','EntityID','Details','CreatedAt'],
    ErrorLogs: ['ErrorID','FunctionName','Message','Stack','UserEmail','CreatedAt']
  },
  DEFAULT_SETTINGS: {
    SCHOOL_NAME: 'โรงเรียนบ้านจอง', SCHOOL_LOGO_URL: '', DIRECTOR_NAME: '', ACADEMIC_HEAD_NAME: '',
    ACADEMIC_YEAR: '2569', SEMESTER: '1', DEADLINE_START: '2026-09-28', DEADLINE_END: '2026-10-02',
    ROOT_FOLDER_ID: '', COVER_TEMPLATE_ID: '', PRIMARY_COLOR: '#155EEF', SECONDARY_COLOR: '#E8F1FF',
    MAX_FILE_MB: '25', SCHOOL_DOMAIN: ''
  }
});
