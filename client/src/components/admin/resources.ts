// Declarative admin resources: each maps to /api/admin/<key> on the Express server.

export type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'date'
  | 'time'
  | 'textarea'
  | 'html'
  | 'checkbox'
  | 'select'
  | 'ref'
  | 'image' // stores a URL string
  | 'file'; // stores { url, publicId, name, resourceType }

export type Field = {
  name: string; // dotted paths allowed, e.g. "bank.accountNumber"
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  ref?: string; // resource key for 'ref' options
  readOnly?: boolean;
  sensitive?: boolean;
  help?: string;
  wide?: boolean;
  section?: string; // starts a new titled section
};

export type Column = { name: string; label: string; format?: 'date' | 'datetime' | 'bool' | 'ref' | 'money' | 'status' };

export type Resource = {
  key: string;
  label: string;
  singular: string;
  group: 'CRM' | 'Submissions' | 'Content';
  titleField: string;
  columns: Column[];
  fields: Field[];
  filters?: { name: string; label: string; options: string[] }[];
  canCreate?: boolean;
  canDelete?: boolean;
  publicPath?: (doc: Record<string, unknown>) => string | null; // "view on site"
  revalidates?: boolean; // purge Next.js content cache after save
};

const SUBMISSION_STATUSES = ['new', 'in-progress', 'done', 'spam'];
const CLIENT_STATUSES = ['Active', 'Pending', 'Cancelled', 'Completed'];

export const RESOURCES: Resource[] = [
  // ---------------- CRM (rebuild of the old AppGini app)
  {
    key: 'clients',
    label: 'Clients',
    singular: 'Client',
    group: 'CRM',
    titleField: 'clientName',
    canCreate: true,
    canDelete: true,
    filters: [{ name: 'status', label: 'Status', options: CLIENT_STATUSES }],
    columns: [
      { name: 'clientName', label: 'Client' },
      { name: 'idNumber', label: 'ID number' },
      { name: 'projectName', label: 'Project' },
      { name: 'consultant', label: 'Consultant', format: 'ref' },
      { name: 'dateSigned', label: 'Signed', format: 'date' },
      { name: 'debitAmount', label: 'Debit', format: 'money' },
      { name: 'status', label: 'Status', format: 'status' },
    ],
    fields: [
      { name: 'clientName', label: 'Client name', type: 'text', required: true, section: 'Client' },
      { name: 'idNumber', label: 'ID number', type: 'text', required: true, sensitive: true },
      { name: 'cell', label: 'Cell', type: 'tel' },
      { name: 'businessPhone', label: 'Business phone', type: 'tel' },
      { name: 'emailAddress', label: 'Email', type: 'email' },
      { name: 'area', label: 'Area', type: 'text' },
      { name: 'projectName', label: 'Project name', type: 'text', section: 'Sale' },
      { name: 'enrolmentNumber', label: 'Enrolment number', type: 'text' },
      { name: 'financeHouse', label: 'Finance house', type: 'text' },
      { name: 'dateSigned', label: 'Date signed', type: 'date' },
      { name: 'consultant', label: 'Consultant', type: 'ref', ref: 'employees' },
      { name: 'telemarketer', label: 'Telemarketer', type: 'ref', ref: 'employees' },
      { name: 'status', label: 'Status', type: 'select', options: CLIENT_STATUSES },
      { name: 'verified', label: 'Verified', type: 'checkbox' },
      { name: 'dateCancelled', label: 'Date cancelled', type: 'date' },
      { name: 'bank', label: 'Bank', type: 'text', section: 'Debit order' },
      { name: 'branch', label: 'Branch', type: 'text' },
      { name: 'branchCode', label: 'Branch code', type: 'text' },
      { name: 'accountHolder', label: 'Account holder', type: 'text' },
      { name: 'accountNumber', label: 'Account number', type: 'text', sensitive: true },
      { name: 'accountType', label: 'Account type', type: 'select', options: ['Savings', 'Cheque', 'Current', 'Other'] },
      { name: 'tradingAccount', label: 'Trading account', type: 'text' },
      { name: 'debitAmount', label: 'Debit amount (R)', type: 'number' },
      { name: 'debitDate', label: 'Debit date', type: 'date' },
      { name: 'depositPaid', label: 'Deposit paid (R)', type: 'number' },
      { name: 'contract', label: 'Signed contract', type: 'file', section: 'Documents' },
      { name: 'comment', label: 'Comment', type: 'textarea', wide: true },
    ],
  },
  {
    key: 'appointments',
    label: 'Appointments',
    singular: 'Appointment',
    group: 'CRM',
    titleField: 'clientName',
    canCreate: true,
    canDelete: true,
    filters: [
      { name: 'seen', label: 'Seen', options: ['true', 'false'] },
      { name: 'sale', label: 'Sale', options: ['true', 'false'] },
    ],
    columns: [
      { name: 'date', label: 'Date', format: 'date' },
      { name: 'time', label: 'Time' },
      { name: 'clientName', label: 'Client' },
      { name: 'salesRep', label: 'Sales rep', format: 'ref' },
      { name: 'meetingPlace', label: 'Meeting place' },
      { name: 'seen', label: 'Seen', format: 'bool' },
      { name: 'signed', label: 'Signed', format: 'bool' },
      { name: 'sale', label: 'Sale', format: 'bool' },
    ],
    fields: [
      { name: 'date', label: 'Date', type: 'date', required: true, section: 'Appointment' },
      { name: 'time', label: 'Time', type: 'time' },
      { name: 'meetingPlace', label: 'Meeting place', type: 'text' },
      { name: 'projectName', label: 'Project name', type: 'text' },
      { name: 'salesRep', label: 'Sales rep', type: 'ref', ref: 'employees' },
      { name: 'telemarketer', label: 'Telemarketer', type: 'ref', ref: 'employees' },
      { name: 'clientName', label: 'Client name', type: 'text', required: true, section: 'Prospect' },
      { name: 'occupation', label: 'Occupation', type: 'text' },
      { name: 'department', label: 'Department', type: 'text' },
      { name: 'incomeBracket', label: 'Income bracket', type: 'text' },
      { name: 'workNumber', label: 'Work number', type: 'tel' },
      { name: 'cellNumber', label: 'Cell number', type: 'tel' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'seen', label: 'Seen', type: 'checkbox', section: 'Outcome' },
      { name: 'signed', label: 'Signed', type: 'checkbox' },
      { name: 'sale', label: 'Sale', type: 'checkbox' },
      { name: 'notAvailable', label: 'Not available', type: 'checkbox' },
      { name: 'comments', label: 'Comments', type: 'textarea', wide: true },
    ],
  },
  {
    key: 'employees',
    label: 'Employees',
    singular: 'Employee',
    group: 'CRM',
    titleField: 'name',
    canCreate: true,
    canDelete: true,
    columns: [
      { name: 'name', label: 'Name' },
      { name: 'post', label: 'Post' },
      { name: 'employeeId', label: 'Employee ID' },
      { name: 'cell', label: 'Cell' },
      { name: 'email', label: 'Email' },
      { name: 'started', label: 'Started', format: 'date' },
      { name: 'active', label: 'Active', format: 'bool' },
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'post', label: 'Post / job title', type: 'text' },
      { name: 'employeeId', label: 'Employee ID', type: 'text' },
      { name: 'cell', label: 'Cell', type: 'tel', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'started', label: 'Start date', type: 'date' },
      { name: 'resAddress', label: 'Residential address', type: 'textarea', wide: true },
      { name: 'active', label: 'Active', type: 'checkbox' },
      { name: 'image', label: 'Photo', type: 'file' },
      { name: 'contract', label: 'Contract', type: 'file' },
      { name: 'comment', label: 'Comment', type: 'textarea', wide: true },
    ],
  },

  // ---------------- Submissions from the public site
  {
    key: 'enrolments',
    label: 'Enrolments',
    singular: 'Enrolment',
    group: 'Submissions',
    titleField: 'surname',
    canDelete: true,
    filters: [{ name: 'status', label: 'Status', options: SUBMISSION_STATUSES }],
    columns: [
      { name: 'createdAt', label: 'Received', format: 'datetime' },
      { name: 'firstNames', label: 'First names' },
      { name: 'surname', label: 'Surname' },
      { name: 'phones.mobile', label: 'Mobile' },
      { name: 'email', label: 'Email' },
      { name: 'consultant', label: 'Consultant' },
      { name: 'status', label: 'Status', format: 'status' },
    ],
    fields: [
      { name: 'status', label: 'Status', type: 'select', options: SUBMISSION_STATUSES, section: 'Processing' },
      { name: 'notes', label: 'Internal notes', type: 'textarea', wide: true },
      { name: 'title', label: 'Title', type: 'text', readOnly: true, section: 'Customer' },
      { name: 'firstNames', label: 'First names', type: 'text', readOnly: true },
      { name: 'surname', label: 'Surname', type: 'text', readOnly: true },
      { name: 'gender', label: 'Gender', type: 'text', readOnly: true },
      { name: 'idNumber', label: 'ID / passport', type: 'text', readOnly: true, sensitive: true },
      { name: 'dateOfBirth', label: 'Date of birth', type: 'date', readOnly: true },
      { name: 'language', label: 'Language', type: 'text', readOnly: true },
      { name: 'contactTime', label: 'Contact time', type: 'text', readOnly: true },
      { name: 'consultant', label: 'Consultant', type: 'text', readOnly: true },
      { name: 'financedBy', label: 'Financed by', type: 'text', readOnly: true },
      { name: 'phones.mobile', label: 'Mobile', type: 'tel', readOnly: true, section: 'Contact' },
      { name: 'phones.work', label: 'Work', type: 'tel', readOnly: true },
      { name: 'phones.home', label: 'Home', type: 'tel', readOnly: true },
      { name: 'email', label: 'Email', type: 'email', readOnly: true },
      { name: 'address.unitNumber', label: 'Unit / house', type: 'text', readOnly: true },
      { name: 'address.street', label: 'Street', type: 'text', readOnly: true },
      { name: 'address.town', label: 'Town', type: 'text', readOnly: true },
      { name: 'address.city', label: 'City', type: 'text', readOnly: true },
      { name: 'address.province', label: 'Province', type: 'text', readOnly: true },
      { name: 'address.postalCode', label: 'Postal code', type: 'text', readOnly: true },
      { name: 'bank.accountName', label: 'Account holder', type: 'text', readOnly: true, section: 'Banking' },
      { name: 'bank.bankName', label: 'Bank', type: 'text', readOnly: true },
      { name: 'bank.accountNumber', label: 'Account number', type: 'text', readOnly: true, sensitive: true },
      { name: 'bank.accountType', label: 'Account type', type: 'text', readOnly: true },
      { name: 'employment.employerName', label: 'Employer', type: 'text', readOnly: true, section: 'Employment' },
      { name: 'employment.occupation', label: 'Occupation', type: 'text', readOnly: true },
      { name: 'employment.appointmentType', label: 'Appointment type', type: 'text', readOnly: true },
      { name: 'employment.appointmentDate', label: 'Appointment date', type: 'text', readOnly: true },
      { name: 'employment.salaryPaid', label: 'Salary paid', type: 'text', readOnly: true },
      { name: 'employment.salaryDate', label: 'Salary date', type: 'text', readOnly: true },
      { name: 'employment.grossSalary', label: 'Gross salary', type: 'number', readOnly: true },
      { name: 'employment.netSalary', label: 'Net salary', type: 'number', readOnly: true },
    ],
  },
  {
    key: 'messages',
    label: 'Messages',
    singular: 'Message',
    group: 'Submissions',
    titleField: 'name',
    canDelete: true,
    filters: [{ name: 'status', label: 'Status', options: SUBMISSION_STATUSES }],
    columns: [
      { name: 'createdAt', label: 'Received', format: 'datetime' },
      { name: 'name', label: 'Name' },
      { name: 'email', label: 'Email' },
      { name: 'subject', label: 'Subject' },
      { name: 'status', label: 'Status', format: 'status' },
    ],
    fields: [
      { name: 'status', label: 'Status', type: 'select', options: SUBMISSION_STATUSES },
      { name: 'name', label: 'Name', type: 'text', readOnly: true },
      { name: 'email', label: 'Email', type: 'email', readOnly: true },
      { name: 'phone', label: 'Phone', type: 'tel', readOnly: true },
      { name: 'subject', label: 'Subject', type: 'text', readOnly: true },
      { name: 'message', label: 'Message', type: 'textarea', readOnly: true, wide: true },
    ],
  },

  // ---------------- Website content
  {
    key: 'pages',
    label: 'Pages',
    singular: 'Page',
    group: 'Content',
    titleField: 'title',
    canCreate: true,
    canDelete: true,
    revalidates: true,
    publicPath: (d) => (d.slug ? `/${d.slug}` : null),
    columns: [
      { name: 'title', label: 'Title' },
      { name: 'slug', label: 'URL' },
      { name: 'navOrder', label: 'Menu position' },
      { name: 'published', label: 'Published', format: 'bool' },
      { name: 'updatedAt', label: 'Updated', format: 'date' },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'slug', label: 'URL slug', type: 'text', help: 'Lowercase letters, numbers and dashes. Leave empty to generate from the title.' },
      { name: 'navOrder', label: 'Main menu position', type: 'number', help: 'Leave empty to hide from the menu.' },
      { name: 'navLabel', label: 'Menu label', type: 'text', help: 'Short name shown in the menu. Defaults to the title.' },
      { name: 'published', label: 'Published', type: 'checkbox' },
      { name: 'heroImage', label: 'Header image', type: 'image' },
      { name: 'content', label: 'Content', type: 'html', wide: true },
      { name: 'excerpt', label: 'Summary', type: 'textarea', wide: true, section: 'SEO' },
      { name: 'seoTitle', label: 'SEO title', type: 'text' },
      { name: 'seoDescription', label: 'SEO description', type: 'textarea', wide: true },
    ],
  },
  {
    key: 'posts',
    label: 'Articles',
    singular: 'Article',
    group: 'Content',
    titleField: 'title',
    canCreate: true,
    canDelete: true,
    revalidates: true,
    publicPath: (d) => (d.slug ? `/blog/${d.slug}` : null),
    columns: [
      { name: 'title', label: 'Title' },
      { name: 'publishedAt', label: 'Date', format: 'date' },
      { name: 'published', label: 'Published', format: 'bool' },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'slug', label: 'URL slug', type: 'text' },
      { name: 'publishedAt', label: 'Publish date', type: 'date' },
      { name: 'published', label: 'Published', type: 'checkbox' },
      { name: 'coverImage', label: 'Cover image', type: 'image' },
      { name: 'excerpt', label: 'Summary', type: 'textarea', wide: true },
      { name: 'content', label: 'Content', type: 'html', wide: true },
    ],
  },
  {
    key: 'events',
    label: 'Events',
    singular: 'Event',
    group: 'Content',
    titleField: 'title',
    canCreate: true,
    canDelete: true,
    revalidates: true,
    columns: [
      { name: 'title', label: 'Title' },
      { name: 'startDate', label: 'Starts', format: 'date' },
      { name: 'venue.name', label: 'Venue' },
      { name: 'published', label: 'Published', format: 'bool' },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'slug', label: 'URL slug', type: 'text' },
      { name: 'startDate', label: 'Start date', type: 'date', required: true },
      { name: 'endDate', label: 'End date', type: 'date' },
      { name: 'published', label: 'Published', type: 'checkbox' },
      { name: 'image', label: 'Image', type: 'image' },
      { name: 'description', label: 'Description', type: 'html', wide: true },
      { name: 'venue.name', label: 'Venue name', type: 'text', section: 'Venue' },
      { name: 'venue.address', label: 'Address', type: 'text' },
      { name: 'venue.city', label: 'City', type: 'text' },
      { name: 'venue.province', label: 'Province', type: 'text' },
      { name: 'venue.postalCode', label: 'Postal code', type: 'text' },
    ],
  },
  {
    key: 'testimonials',
    label: 'Testimonials',
    singular: 'Testimonial',
    group: 'Content',
    titleField: 'name',
    canCreate: true,
    canDelete: true,
    revalidates: true,
    columns: [
      { name: 'name', label: 'Name' },
      { name: 'company', label: 'Company' },
      { name: 'order', label: 'Order' },
      { name: 'published', label: 'Published', format: 'bool' },
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'role', label: 'Role', type: 'text' },
      { name: 'company', label: 'Company', type: 'text' },
      { name: 'order', label: 'Display order', type: 'number' },
      { name: 'published', label: 'Published', type: 'checkbox' },
      { name: 'photo', label: 'Photo', type: 'image' },
      { name: 'quote', label: 'Quote', type: 'textarea', required: true, wide: true },
    ],
  },
];

export const RESOURCE_MAP = Object.fromEntries(RESOURCES.map((r) => [r.key, r]));

export function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj);
}

export function setPath<T extends Record<string, unknown>>(obj: T, path: string, value: unknown): T {
  const copy = structuredClone(obj);
  const parts = path.split('.');
  let cur = copy as Record<string, unknown>;
  parts.slice(0, -1).forEach((p) => {
    cur[p] = cur[p] && typeof cur[p] === 'object' ? { ...(cur[p] as object) } : {};
    cur = cur[p] as Record<string, unknown>;
  });
  cur[parts.at(-1)!] = value;
  return copy;
}
