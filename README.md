# Legal Hub Admin Panel

A modern, responsive admin panel for managing the Legal Hub job portal. Built with React, TypeScript, Tailwind CSS, and React Query.

## Features

- **Dashboard**: Overview with statistics cards showing total users, jobs, courses, appointments, and more
- **Jobs Management**: Full CRUD operations with PDF upload for job descriptions and image uploads
- **Courses Management**: Create, read, update, and delete courses
- **Users Management**: Manage user accounts with full CRUD operations
- **Appointments Management**: View and update appointment statuses (pending, confirmed, completed, cancelled)

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Data Fetching**: TanStack React Query
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Backend**: Express.js + MongoDB (shared with main website)

## Prerequisites

- Node.js 18+ installed
- Backend server running on http://localhost:5001
- MongoDB database connected

## Installation

1. Navigate to the admin directory:
```bash
cd /Users/adrologic/Desktop/law/frontend/admin
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5173
```

## Project Structure

```
admin/
├── src/
│   ├── components/     # Reusable UI components
│   ├── layouts/        # Layout components (AdminLayout)
│   ├── pages/          # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Jobs.tsx
│   │   ├── Courses.tsx
│   │   ├── Users.tsx
│   │   └── Appointments.tsx
│   ├── lib/            # Utilities and API client
│   │   ├── api.ts      # API functions and types
│   │   └── utils.ts    # Helper functions
│   ├── App.tsx         # Main app component with routing
│   ├── main.tsx        # App entry point
│   └── index.css       # Global styles with Tailwind
├── public/             # Static assets
├── tailwind.config.js  # Tailwind configuration
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
└── package.json        # Dependencies
```

## API Endpoints Used

### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get single job
- `POST /api/jobs` - Create job (with file upload)
- `PUT /api/jobs/:id` - Update job (with file upload)
- `DELETE /api/jobs/:id` - Delete job

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get single course
- `POST /api/courses` - Create course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Users
- `GET /api/users` - Get all users
- `GET /api/users/profile/:email` - Get user by email
- `POST /api/users/profile` - Create/update user
- `DELETE /api/users/:id` - Delete user

### Appointments
- `GET /api/appointments` - Get all appointments
- `PUT /api/appointments/:id/status` - Update appointment status

## File Upload

The admin panel supports file uploads for:

1. **Job PDFs**: Upload PDF documents for job descriptions
2. **Job Images**: Upload company logos or job-related images

Uploaded files are stored in the backend `/uploads` directory:
- PDFs: `/uploads/pdfs/`
- Images: `/uploads/images/`

## Usage

### Dashboard
View overall statistics and quick access to all management sections.

### Jobs Management
1. Click "Add Job" to create a new job posting
2. Fill in job details including:
   - Title, company, location
   - Job type, category, experience level
   - Description, requirements, responsibilities
   - Optional: PDF attachment and company image
3. Edit existing jobs by clicking the edit icon
4. Delete jobs with the trash icon

### Courses Management
1. Click "Add Course" to create a new course
2. Fill in course details:
   - Title, instructor, duration
   - Level, category, price
   - Description and curriculum
3. Edit or delete courses using the action buttons

### Users Management
1. View all users in a table format
2. Click "Add User" to create a new user account
3. Edit user details by clicking the edit icon
4. Delete users with the trash icon (removes all associated data)

### Appointments Management
1. View all appointments with filtering options
2. Filter by status: All, Pending, Confirmed, Completed, Cancelled
3. Update appointment status:
   - Confirm pending appointments
   - Mark confirmed appointments as completed
   - Cancel appointments

## Development

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Lint
```bash
npm run lint
```

## Environment Variables

The admin panel connects to the backend at `http://localhost:5001/api` by default. To change this, update the `API_BASE_URL` in `src/lib/api.ts`.

## Notes

- This admin panel shares the same backend and database with the main Legal Hub website
- Currently, there's no authentication system - add authentication before deploying to production
- All API routes are marked as "Public" but should be protected with admin authentication in production
- File uploads are limited to 10MB per file

## Future Enhancements

- [ ] Add admin authentication (login/logout)
- [ ] Protected routes with role-based access control
- [ ] Real-time statistics updates
- [ ] Export data to CSV/Excel
- [ ] Advanced filtering and sorting
- [ ] Pagination for large datasets
- [ ] Bulk operations (bulk delete, bulk status updates)
- [ ] Activity logs and audit trails
- [ ] Email notifications for appointments
- [ ] Dark mode support

## Support

For issues or questions, please refer to the main project documentation or contact the development team.
