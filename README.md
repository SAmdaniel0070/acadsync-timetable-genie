
# 🎓 ACADSYNC Timetable Generator

<div align="center">

![ACADSYNC Logo](https://img.shields.io/badge/ACADSYNC-Timetable%20Generator-blue?style=for-the-badge&logo=calendar&logoColor=white)

**A comprehensive, intelligent timetable management system for educational institutions**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[🚀 Live Demo](https://acadsync-timetable.vercel.app) • [📖 Documentation](docs/) • [🐛 Report Bug](https://github.com/SAmdaniel0070/acadsync-timetable-genie/issues) • [✨ Request Feature](https://github.com/SAmdaniel0070/acadsync-timetable-genie/issues)

</div>

---

## 🌟 Overview

ACADSYNC Timetable Generator is a modern, full-stack web application designed to revolutionize academic scheduling for educational institutions. Built with cutting-edge technologies, it provides an intelligent, constraint-based timetable generation system with an intuitive user interface.

### ✨ Key Highlights

- 🤖 **AI-Powered Scheduling**: Advanced constraint-based algorithm for optimal timetable generation
- 🎨 **Modern UI/UX**: Beautiful, responsive interface built with React and TailwindCSS
- ⚡ **Real-time Updates**: Live synchronization with Supabase backend
- 🔒 **Secure Authentication**: JWT-based authentication with role-based access control
- 📱 **Mobile Responsive**: Works seamlessly across all devices
- 🌙 **Dark Mode Support**: Toggle between light and dark themes
- 📊 **Multiple Views**: Master, class, teacher, and classroom-specific timetables
- 🧪 **2-Hour Lab Support**: Advanced scheduling for extended laboratory sessions

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for lightning-fast development
- **Styling**: TailwindCSS with custom design system
- **UI Components**: shadcn/ui component library
- **State Management**: TanStack Query for server state
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Animations**: Tailwind CSS animations

### Backend & Database
- **Backend-as-a-Service**: Supabase
- **Database**: PostgreSQL with real-time subscriptions
- **Authentication**: Supabase Auth with JWT
- **Edge Functions**: Serverless functions for timetable generation
- **Storage**: Supabase Storage for file management
- **Real-time**: WebSocket connections for live updates

### Development & Deployment
- **Package Manager**: npm
- **Code Quality**: ESLint + TypeScript
- **Version Control**: Git with conventional commits
- **Deployment**: Vercel (Frontend) + Supabase (Backend)
- **CI/CD**: GitHub Actions

## 🚀 Features

### 📋 Core Functionality
- **User Management**: Role-based authentication (Admin/Teacher)
- **Academic Structure**: Years, Classes, Subjects, Teachers, Classrooms
- **Intelligent Scheduling**: Constraint-based timetable generation
- **Multiple Views**: Master, Class, Teacher, Classroom perspectives
- **Batch Management**: Support for class subdivisions and lab batches

### 🧪 Advanced Lab Scheduling
- **2-Hour Lab Sessions**: Automatic consecutive slot allocation
- **Lab-Specific Classrooms**: Smart classroom assignment for practicals
- **Batch Scheduling**: Separate lab schedules for different student groups
- **Visual Indicators**: Clear marking of lab sessions and durations

### 📊 Timetable Management
- **Draft System**: Save and manage multiple timetable versions
- **Real-time Editing**: Live updates with conflict detection
- **Export Options**: Multiple formats (PDF, Excel, CSV, JSON)
- **Share Functionality**: WhatsApp, Email, and download sharing

### 🎨 User Experience
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Dark/Light Mode**: System preference detection with manual toggle
- **Intuitive Navigation**: Clean, modern interface design
- **Loading States**: Smooth loading animations and skeleton screens
- **Error Handling**: Comprehensive error messages and recovery options

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **Git** for version control
- **Supabase Account** for backend services

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/SAmdaniel0070/acadsync-timetable-genie.git
cd acadsync-timetable-genie
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Custom Configuration
VITE_APP_NAME=ACADSYNC Timetable Generator
VITE_APP_VERSION=1.0.0
```

### 4. Supabase Setup
1. Create a new project at [Supabase](https://supabase.com)
2. Run the database migrations:
   ```bash
   npx supabase db push
   ```
3. Set up authentication providers (optional)
4. Configure Row Level Security (RLS) policies

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### 6. Build for Production
```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
acadsync-timetable-genie/
├── 📁 public/                 # Static assets
├── 📁 src/
│   ├── 📁 components/         # Reusable UI components
│   │   ├── 📁 layout/         # Layout components
│   │   ├── 📁 timetable/      # Timetable-specific components
│   │   ├── 📁 subject/        # Subject management components
│   │   └── 📁 ui/             # Base UI components (shadcn/ui)
│   ├── 📁 contexts/           # React contexts
│   ├── 📁 hooks/              # Custom React hooks
│   ├── 📁 integrations/       # External service integrations
│   │   └── 📁 supabase/       # Supabase client and types
│   ├── 📁 lib/                # Utility libraries
│   ├── 📁 pages/              # Page components
│   ├── 📁 services/           # API service layers
│   ├── 📁 types/              # TypeScript type definitions
│   ├── 📁 utils/              # Utility functions
│   └── 📄 main.tsx            # Application entry point
├── 📁 supabase/               # Supabase configuration
│   ├── 📁 functions/          # Edge functions
│   └── 📁 migrations/         # Database migrations
├── 📁 docs/                   # Documentation
├── 📄 package.json            # Dependencies and scripts
├── 📄 tailwind.config.ts      # TailwindCSS configuration
├── 📄 tsconfig.json           # TypeScript configuration
└── 📄 vite.config.ts          # Vite configuration
```

## 🎯 Core Features

### 📚 Academic Management
<table>
<tr>
<td width="50%">

**🏫 Institution Setup**
- Academic years and semesters
- Department management
- Class and section organization
- Student batch management

**👨‍🏫 Faculty Management**
- Teacher profiles and specializations
- Subject assignments
- Availability constraints
- Workload distribution

</td>
<td width="50%">

**📖 Subject Configuration**
- Theory and practical subjects
- Credit hours and periods per week
- Lab duration settings (1h/2h)
- Classroom requirements

**🏛️ Infrastructure**
- Classroom capacity management
- Lab and regular room classification
- Equipment and resource tracking
- Building and floor organization

</td>
</tr>
</table>

### 🤖 Intelligent Timetable Generation

<details>
<summary><strong>🧠 Advanced Algorithm Features</strong></summary>

- **Constraint Satisfaction**: Respects all scheduling constraints and preferences
- **Conflict Resolution**: Automatic detection and resolution of scheduling conflicts
- **Load Balancing**: Even distribution of workload across teachers and time slots
- **Optimization**: Minimizes gaps and maximizes resource utilization
- **Multi-Hour Sessions**: Special handling for 2-hour laboratory sessions
- **Batch Scheduling**: Separate scheduling for lab batches and theory classes

</details>

### 📊 Multiple Timetable Views

| View Type | Description | Features |
|-----------|-------------|----------|
| 🗂️ **Master View** | Complete institutional overview | All classes, color-coded, conflict detection |
| 🎓 **Class View** | Individual class schedules | Student-focused, batch-specific labs |
| 👨‍🏫 **Teacher View** | Faculty-specific timetables | Workload visualization, free periods |
| 🏛️ **Classroom View** | Room utilization schedules | Occupancy tracking, resource management |
| 🧪 **Batch Lab View** | Laboratory session management | Batch-specific scheduling, equipment allocation |

### 🔧 Advanced Features

- **📝 Draft System**: Create and manage multiple timetable versions
- **🔄 Real-time Editing**: Live updates with instant conflict detection
- **📤 Export Options**: PDF, Excel, CSV, JSON formats
- **📱 Share Functionality**: WhatsApp, Email, and direct download
- **🌙 Theme Support**: Light and dark mode with system preference detection
- **📊 Analytics**: Utilization reports and scheduling statistics

## 🧪 2-Hour Lab Sessions

One of the standout features of ACADSYNC is its advanced support for extended laboratory sessions:

<div align="center">

![2-Hour Lab Demo](https://img.shields.io/badge/Feature-2--Hour%20Labs-orange?style=for-the-badge&logo=flask&logoColor=white)

</div>

### ✨ Key Capabilities

- **🔄 Automatic Consecutive Scheduling**: Intelligently finds and reserves two consecutive time slots
- **🎨 Visual Distinction**: Clear visual indicators with orange borders and continuation markers
- **⚠️ Conflict Prevention**: Comprehensive validation ensures no scheduling conflicts in either slot
- **🔧 Flexible Configuration**: Easy setup through subject configuration (1h or 2h options)
- **📊 Batch Support**: Works seamlessly with batch-specific lab scheduling

### 🎯 Visual Representation

| Slot Type | Visual Indicator | Description |
|-----------|------------------|-------------|
| **Primary Slot** | 🟧 Orange left border + "2h Lab" | Shows complete lesson details |
| **Continuation Slot** | 🔶 Dashed border + "(cont.)" | Indicates second hour of the session |

📖 **[Complete 2-Hour Labs Guide](docs/2-hour-labs-guide.md)**

## 🛠️ Development

### 📋 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Database
npx supabase start   # Start local Supabase
npx supabase db push # Push migrations to database
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### 🧪 Testing

```bash
# Run tests (when implemented)
npm run test         # Unit tests
npm run test:e2e     # End-to-end tests
npm run test:coverage # Coverage report
```

### 🔧 Code Quality

The project maintains high code quality through:

- **TypeScript**: Full type safety and IntelliSense support
- **ESLint**: Consistent code style and error detection
- **Prettier**: Automatic code formatting
- **Husky**: Pre-commit hooks for quality assurance

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Add your Supabase credentials
3. **Deploy**: Automatic deployment on every push to main branch

```bash
# Manual deployment
npm run build
npx vercel --prod
```

### Other Platforms

The application can be deployed to any static hosting service:

- **Netlify**: Drag and drop the `dist` folder
- **GitHub Pages**: Use GitHub Actions for automatic deployment
- **AWS S3 + CloudFront**: For enterprise-grade hosting
- **Docker**: Containerized deployment option

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### 🐛 Bug Reports
- Use the [issue tracker](https://github.com/SAmdaniel0070/acadsync-timetable-genie/issues)
- Include detailed reproduction steps
- Provide system information and screenshots

### ✨ Feature Requests
- Check existing issues first
- Provide clear use cases and benefits
- Consider implementation complexity

### 💻 Code Contributions

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### 📝 Development Guidelines

- Follow the existing code style
- Add TypeScript types for new features
- Update documentation for API changes
- Test your changes thoroughly

## 📚 Documentation

- **[2-Hour Labs Guide](docs/2-hour-labs-guide.md)** - Comprehensive guide for extended lab sessions
- **[API Documentation](docs/api.md)** - Complete API reference
- **[Deployment Guide](docs/deployment.md)** - Step-by-step deployment instructions
- **[Contributing Guide](docs/contributing.md)** - How to contribute to the project

## 🆘 Support

Need help? We're here for you:

- **📖 Documentation**: Check our comprehensive guides
- **🐛 Issues**: Report bugs on GitHub
- **💬 Discussions**: Join community discussions
- **📧 Email**: Contact the maintainers directly

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[Supabase](https://supabase.com)** - For the amazing backend-as-a-service platform
- **[shadcn/ui](https://ui.shadcn.com)** - For the beautiful component library
- **[TailwindCSS](https://tailwindcss.com)** - For the utility-first CSS framework
- **[React](https://reactjs.org)** - For the powerful frontend framework
- **[Vite](https://vitejs.dev)** - For the lightning-fast build tool

---

<div align="center">

**Made with ❤️ for educational institutions worldwide**

[![GitHub stars](https://img.shields.io/github/stars/SAmdaniel0070/acadsync-timetable-genie?style=social)](https://github.com/SAmdaniel0070/acadsync-timetable-genie/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/SAmdaniel0070/acadsync-timetable-genie?style=social)](https://github.com/SAmdaniel0070/acadsync-timetable-genie/network/members)

[⭐ Star this repository](https://github.com/SAmdaniel0070/acadsync-timetable-genie) if you find it helpful!

</div>
