const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://jan-justice-bancked.onrender.com/api';
// const API_BASE_URL = 'http://localhost:5001/api';
const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  message?: string;
}

// User Types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  title?: string;
  company?: string;
  avatar?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Job Dynamic Field Types
export interface CustomField {
  id: string;
  label: string;
  fieldType: 'text' | 'number' | 'textarea' | 'richtext' | 'dropdown-single' | 'dropdown-multi';
  value: unknown;
  options?: string[];
  order: number;
  required?: boolean;
}

export interface TabSection {
  id: string;
  heading?: string;
  subheading?: string;
  order: number;
  contentType: 'fixed-field-map' | 'custom-fields';
  fixedFieldKey?: string;
  customFields?: CustomField[];
}

export interface JobTab {
  id: string;
  label: string;
  order: number;
  isDefault: boolean;
  sections: TabSection[];
}

export interface SidebarField {
  id: string;
  label: string;
  icon?: string;
  fieldType: 'text' | 'number' | 'salary-range' | 'experience-range' | 'dropdown-single';
  value: unknown;
  fixedFieldKey?: string;
  order: number;
  isDefault: boolean;
}

// Job Types
export interface Job {
  _id: string;
  title: string;
  company: string;
  department: string;
  description: string;
  detailedDescription?: string;
  responsibilities?: string[];
  qualifications?: string[];
  benefits?: string[];
  location?: string;
  workMode?: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  experienceRequired?: {
    min?: number;
    max?: number;
  };
  skills?: string[];
  employmentType?: string;
  isActive?: boolean;
  applicationDeadline?: string;
  contactEmail?: string;
  contactPhone?: string;
  companyWebsite?: string;
  applyUrl?: string;
  numberOfOpenings?: number;
  education?: string;
  jobDescriptionPdf?: {
    url?: string;
    filename?: string;
    size?: number;
  };
  companyImage?: {
    url?: string;
    filename?: string;
    size?: number;
  };
  postDate?: string;
  tags?: string[];
  customInputs?: { label: string; value: string }[];
  tabs?: JobTab[];
  sidebarFields?: SidebarField[];
  createdAt?: string;
  updatedAt?: string;
}

// Course Types
export interface CourseInstructor {
  name: string;
  title?: string;
  bio?: string;
  initials?: string;
}

export interface CourseModule {
  title: string;
  lessons: string[];
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  detailedDescription?: string;
  image: string;
  duration: string;
  level: string;
  rating?: number;
  students?: number;
  certified?: boolean;
  price: {
    current: number;
    original?: number;
    currency?: string;
  };
  discount?: number;
  features?: string[];
  modules?: CourseModule[];
  instructor?: CourseInstructor;
  category: string;
  videoHours?: string;
  resources?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Appointment Types
export interface Appointment {
  _id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceType: string;
  serviceTitle?: string;
  servicePrice?: number;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  confirmationNumber?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Analytics Types
export interface AnalyticsSummary {
  today: number;
  thisMonth: number;
  thisYear: number;
}

export interface ChartPoint {
  label: string;
  count: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  chart: ChartPoint[];
  view: string;
}

// Statistics Types
export interface DashboardStats {
  totalUsers: number;
  totalJobs: number;
  totalCourses: number;
  totalAppointments: number;
  pendingAppointments: number;
  activeJobs: number;
}

// API Client
export const adminApi = {
  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const headers = { ...authHeaders() };
    const [users, jobs, courses, appointments] = await Promise.all([
      fetch(`${API_BASE_URL}/users`, { headers }).then(r => r.json()),
      fetch(`${API_BASE_URL}/jobs`, { headers }).then(r => r.json()),
      fetch(`${API_BASE_URL}/courses`, { headers }).then(r => r.json()),
      fetch(`${API_BASE_URL}/appointments`, { headers }).then(r => r.json()),
    ]);

    const pendingAppointments = appointments.data?.filter(
      (a: Appointment) => a.status === 'pending'
    ).length || 0;

    return {
      totalUsers: users.count || 0,
      totalJobs: jobs.total || jobs.count || 0,
      totalCourses: courses.count || 0,
      totalAppointments: appointments.count || 0,
      pendingAppointments,
      activeJobs: jobs.total || jobs.count || 0,
    };
  },

  // Users
  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users`, { headers: authHeaders() });
    const result: ApiResponse<User[]> = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch users');
    return result.data || [];
  },

  async getUser(id: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, { headers: authHeaders() });
    const result: ApiResponse<User> = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch user');
    if (!result.data) throw new Error('User not found');
    return result.data;
  },

  async createUser(userData: Omit<User, '_id'>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(userData),
    });
    const result: ApiResponse<User> = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to create user');
    if (!result.data) throw new Error('Failed to create user');
    return result.data;
  },

  async updateUser(_id: string, userData: Partial<User>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(userData),
    });
    const result: ApiResponse<User> = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to update user');
    if (!result.data) throw new Error('Failed to update user');
    return result.data;
  },

  async deleteUser(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Failed to delete user');
    }
  },

  // Upload PDF to Cloudinary
  async uploadPdf(file: File, jobTitle?: string): Promise<{ url: string; filename: string; size: number; publicId: string; uniqueId: string }> {
    const fd = new FormData();
    fd.append('pdf', file);
    if (jobTitle) fd.append('jobTitle', jobTitle);
    const response = await fetch(`${API_BASE_URL}/jobs/upload-pdf`, {
      method: 'POST',
      headers: authHeaders(),
      body: fd,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to upload PDF');
    return result.data;
  },

  // Jobs
  async getJobs(): Promise<Job[]> {
    const response = await fetch(`${API_BASE_URL}/jobs?admin=true&limit=200`, { headers: authHeaders() });
    const result: ApiResponse<Job[]> = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch jobs');
    return result.data || [];
  },

  async getJob(id: string): Promise<Job> {
    const response = await fetch(`${API_BASE_URL}/jobs/${id}`, { headers: authHeaders() });
    const result: ApiResponse<Job> = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch job');
    if (!result.data) throw new Error('Job not found');
    return result.data;
  },

  async createJob(jobData: Record<string, unknown>): Promise<Job> {
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(jobData),
    });
    const result: ApiResponse<Job> = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to create job');
    if (!result.data) throw new Error('Failed to create job');
    return result.data;
  },

  async updateJob(id: string, jobData: Record<string, unknown>): Promise<Job> {
    const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(jobData),
    });
    const result: ApiResponse<Job> = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to update job');
    if (!result.data) throw new Error('Failed to update job');
    return result.data;
  },

  async deleteJob(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Failed to delete job');
    }
  },

  // Courses
  async getCourses(): Promise<Course[]> {
    const response = await fetch(`${API_BASE_URL}/courses`, { headers: authHeaders() });
    const result: ApiResponse<Course[]> = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch courses');
    return result.data || [];
  },

  async getCourse(id: string): Promise<Course> {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, { headers: authHeaders() });
    const result: ApiResponse<Course> = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch course');
    if (!result.data) throw new Error('Course not found');
    return result.data;
  },

  async createCourse(courseData: Omit<Course, '_id'>): Promise<Course> {
    const response = await fetch(`${API_BASE_URL}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(courseData),
    });
    const result: ApiResponse<Course> = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to create course');
    if (!result.data) throw new Error('Failed to create course');
    return result.data;
  },

  async updateCourse(id: string, courseData: Partial<Course>): Promise<Course> {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(courseData),
    });
    const result: ApiResponse<Course> = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to update course');
    if (!result.data) throw new Error('Failed to update course');
    return result.data;
  },

  async deleteCourse(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Failed to delete course');
    }
  },

  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    const response = await fetch(`${API_BASE_URL}/appointments`, { headers: authHeaders() });
    const result: ApiResponse<Appointment[]> = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch appointments');
    return result.data || [];
  },

  // Analytics
  async getAnalytics(view: 'daily' | 'monthly' | 'yearly' = 'daily'): Promise<AnalyticsData> {
    const response = await fetch(`${API_BASE_URL}/analytics?view=${view}`);
    const result: ApiResponse<AnalyticsData> = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to fetch analytics');
    if (!result.data) throw new Error('No analytics data');
    return result.data;
  },

  async updateAppointmentStatus(
    id: string,
    status: Appointment['status']
  ): Promise<Appointment> {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ status }),
    });
    const result: ApiResponse<Appointment> = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to update appointment');
    if (!result.data) throw new Error('Failed to update appointment');
    return result.data;
  },
};
