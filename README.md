
# Automatic Timetable Generator API

A comprehensive backend API for generating and managing timetables for an engineering college.

## Features

- User authentication with JWT
- CRUD operations for classes, teachers, subjects, classrooms, etc.
- Automatic timetable generation algorithm
- Multiple timetable views (master, class, teacher, classroom)
- Constraint-based scheduling

## Prerequisites

- Node.js (v14+)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/timetable-generator-api.git
   cd timetable-generator-api
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/timetable-generator
   JWT_SECRET=your_jwt_secret_key_change_in_production
   JWT_EXPIRES_IN=7d
   ```

4. Start the server:
   ```
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Years
- `GET /api/years` - Get all years
- `GET /api/years/:id` - Get year by ID
- `POST /api/years` - Create new year
- `PUT /api/years/:id` - Update year
- `DELETE /api/years/:id` - Delete year

### Classes
- `GET /api/classes` - Get all classes
- `GET /api/classes/:id` - Get class by ID
- `GET /api/classes/year/:yearId` - Get classes by year
- `POST /api/classes` - Create new class
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class

### Subjects
- `GET /api/subjects` - Get all subjects
- `GET /api/subjects/:id` - Get subject by ID
- `GET /api/subjects/year/:yearId` - Get subjects by year
- `GET /api/subjects/class/:classId` - Get subjects by class
- `GET /api/subjects/teacher/:teacherId` - Get subjects by teacher
- `POST /api/subjects` - Create new subject
- `PUT /api/subjects/:id` - Update subject
- `DELETE /api/subjects/:id` - Delete subject

### Teachers
- `GET /api/teachers` - Get all teachers
- `GET /api/teachers/:id` - Get teacher by ID
- `GET /api/teachers/department/:department` - Get teachers by department
- `GET /api/teachers/subject/:subjectId` - Get teachers by subject
- `POST /api/teachers` - Create new teacher
- `PUT /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher
- `POST /api/teachers/:id/subjects` - Add subject to teacher
- `DELETE /api/teachers/:id/subjects/:subjectId` - Remove subject from teacher
- `PUT /api/teachers/:id/unavailability` - Update teacher unavailability

### Classrooms
- `GET /api/classrooms` - Get all classrooms
- `GET /api/classrooms/:id` - Get classroom by ID
- `GET /api/classrooms/type/labs` - Get labs only
- `GET /api/classrooms/type/regular` - Get regular classrooms only
- `POST /api/classrooms` - Create new classroom
- `PUT /api/classrooms/:id` - Update classroom
- `DELETE /api/classrooms/:id` - Delete classroom

### Timings
- `GET /api/timings` - Get all timings
- `GET /api/timings/active` - Get active timing
- `GET /api/timings/:id` - Get timing by ID
- `POST /api/timings` - Create new timing
- `PUT /api/timings/:id` - Update timing
- `DELETE /api/timings/:id` - Delete timing
- `PUT /api/timings/:id/set-active` - Set timing as active
- `POST /api/timings/:id/time-slots` - Add time slot to timing
- `DELETE /api/timings/:id/time-slots/:slotId` - Remove time slot from timing

### Timetables
- `GET /api/timetables` - Get all timetables
- `GET /api/timetables/active` - Get active timetable
- `GET /api/timetables/:id` - Get timetable by ID
- `POST /api/timetables/generate` - Generate new timetable
- `PUT /api/timetables/:id/lessons/:lessonId` - Update lesson in timetable
- `POST /api/timetables/:id/lessons` - Add lesson to timetable
- `DELETE /api/timetables/:id/lessons/:lessonId` - Remove lesson from timetable
- `PUT /api/timetables/:id/set-active` - Set timetable as active
- `PUT /api/timetables/:id/toggle-lock` - Lock/unlock timetable
- `GET /api/timetables/:id/master` - Get master timetable
- `GET /api/timetables/:id/year/:yearId` - Get year-wise timetable
- `GET /api/timetables/:id/class/:classId` - Get class-wise timetable
- `GET /api/timetables/:id/teacher/:teacherId` - Get teacher-wise timetable
- `GET /api/timetables/:id/classroom/:classroomId` - Get classroom-wise timetable

## Timetable Generation Algorithm

The timetable generation algorithm uses constraint-based scheduling to create optimal timetables that respect:
- Teacher availability 
- Class schedules
- Subject requirements
- Classroom availability
- Lab requirements
- Maximum lectures per day
- And more!

## License

MIT
