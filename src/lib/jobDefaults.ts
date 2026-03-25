import type { JobTab, SidebarField } from './api';

export function getDefaultTabs(): JobTab[] {
  return [
    {
      id: 'overview',
      label: 'Overview',
      order: 0,
      isDefault: true,
      sections: [
        {
          id: 'about-role',
          heading: 'About This Role',
          order: 0,
          contentType: 'fixed-field-map',
          fixedFieldKey: 'detailedDescription',
          customFields: [],
        },
        {
          id: 'responsibilities',
          heading: 'Key Responsibilities',
          order: 1,
          contentType: 'fixed-field-map',
          fixedFieldKey: 'responsibilities',
          customFields: [],
        },
        {
          id: 'skills',
          heading: 'Required Skills',
          order: 2,
          contentType: 'fixed-field-map',
          fixedFieldKey: 'skills',
          customFields: [],
        },
      ],
    },
    {
      id: 'requirements',
      label: 'Requirements',
      order: 1,
      isDefault: true,
      sections: [
        {
          id: 'qualifications',
          heading: 'Requirements & Qualifications',
          order: 0,
          contentType: 'fixed-field-map',
          fixedFieldKey: 'qualifications',
          customFields: [],
        },
      ],
    },
    {
      id: 'benefits',
      label: 'Benefits',
      order: 2,
      isDefault: true,
      sections: [
        {
          id: 'benefits-list',
          heading: 'Benefits & Perks',
          order: 0,
          contentType: 'fixed-field-map',
          fixedFieldKey: 'benefits',
          customFields: [],
        },
      ],
    },
    {
      id: 'job-pdf',
      label: 'Job PDF',
      order: 3,
      isDefault: true,
      sections: [
        {
          id: 'pdf-upload',
          heading: 'Job Description PDF',
          order: 0,
          contentType: 'fixed-field-map',
          fixedFieldKey: 'jobDescriptionPdf',
          customFields: [],
        },
      ],
    },
    {
      id: 'company-image',
      label: 'Company Image',
      order: 4,
      isDefault: true,
      sections: [
        {
          id: 'image-upload',
          heading: 'Company Image',
          order: 0,
          contentType: 'fixed-field-map',
          fixedFieldKey: 'companyImage',
          customFields: [],
        },
      ],
    },
  ];
}

export function getDefaultSidebarFields(): SidebarField[] {
  return [
    { id: 'salary', label: 'Salary Range', icon: 'DollarSign', fieldType: 'salary-range', value: null, fixedFieldKey: 'salary', order: 0, isDefault: true },
    { id: 'experience', label: 'Experience', icon: 'Briefcase', fieldType: 'experience-range', value: null, fixedFieldKey: 'experienceRequired', order: 1, isDefault: true },
    { id: 'job-type', label: 'Job Type', icon: 'Clock', fieldType: 'dropdown-single', value: null, fixedFieldKey: 'employmentType', order: 2, isDefault: true },
    { id: 'location', label: 'Location', icon: 'MapPin', fieldType: 'text', value: null, fixedFieldKey: 'location', order: 3, isDefault: true },
    { id: 'education', label: 'Education', icon: 'GraduationCap', fieldType: 'text', value: null, fixedFieldKey: 'education', order: 4, isDefault: true },
    { id: 'deadline', label: 'Apply Before', icon: 'Calendar', fieldType: 'text', value: null, fixedFieldKey: 'applicationDeadline', order: 5, isDefault: true },
  ];
}

let idCounter = 0;
export function generateId(prefix = 'field'): string {
  return `${prefix}-${Date.now()}-${++idCounter}`;
}
