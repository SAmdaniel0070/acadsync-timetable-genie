# 2-Hour Lab Sessions Guide

This guide explains how the timetable system handles 2-hour laboratory sessions that span across two consecutive time slots.

## Overview

The system supports both 1-hour and 2-hour lab sessions. When a subject is configured as a 2-hour lab, it will automatically occupy two consecutive time slots in the timetable, providing a seamless visual representation and proper conflict detection.

## Features

### 1. Subject Configuration
- **Lab Duration Setting**: When creating or editing a subject, you can specify if it's a lab and set the duration (1 or 2 hours)
- **Visual Indicators**: 2-hour labs are clearly marked with "(2h Lab)" badges throughout the interface

### 2. Automatic Timetable Generation
- **Consecutive Slot Allocation**: The algorithm automatically finds and reserves two consecutive slots for 2-hour labs
- **Conflict Prevention**: Ensures no conflicts occur in either the primary or continuation slot
- **Smart Scheduling**: Prioritizes scheduling 2-hour labs when consecutive slots are available

### 3. Visual Representation

#### Master Timetable View
- **Primary Slot**: Shows the full lesson details with an orange left border
- **Continuation Slot**: Shows "(cont.)" with dashed border and muted colors
- **Clear Labeling**: Both slots are clearly marked as "2h Lab" and "2h Lab - Slot 2"

#### Individual Views (Class/Teacher/Classroom)
- **Unified Display**: The lesson appears in the first slot with full details
- **Continuation Indicator**: The second slot shows the continuation with appropriate styling
- **Duration Badge**: Clear "2h Lab" badge indicates the extended duration

### 4. Batch Lab View
- **Multi-Hour Support**: Batch-specific lab schedules properly handle 2-hour sessions
- **Color Coding**: Maintains batch color coding across both slots
- **Continuation Tracking**: Shows which slot is the continuation of a 2-hour session

## How It Works

### Database Structure
```sql
-- Lessons table includes fields for multi-slot support
ALTER TABLE lessons ADD COLUMN duration_slots INTEGER DEFAULT 1;
ALTER TABLE lessons ADD COLUMN is_continuation BOOLEAN DEFAULT FALSE;
ALTER TABLE lessons ADD COLUMN parent_lesson_id UUID REFERENCES lessons(id);

-- Subjects table includes lab duration
ALTER TABLE subjects ADD COLUMN lab_duration_hours INTEGER DEFAULT 1;
```

### Automatic Continuation Creation
When a 2-hour lab is scheduled:
1. **Primary Lesson**: Created in the selected time slot
2. **Continuation Lesson**: Automatically created in the next consecutive slot
3. **Linking**: Continuation lesson references the primary lesson via `parent_lesson_id`
4. **Cleanup**: When primary lesson is deleted, continuation is automatically removed

### Visual Styling
- **Orange Left Border**: Indicates multi-hour lessons
- **Dashed Borders**: Used for continuation slots
- **Muted Colors**: Continuation slots use softer colors to indicate secondary status
- **Clear Labels**: "2h Lab - Slot 2" clearly identifies continuation slots

## Usage Instructions

### Creating 2-Hour Lab Subjects
1. Go to **Subjects** page
2. Click **Add Subject** or edit existing subject
3. Enable **Has Lab/Practical** toggle
4. Set **Lab Duration** to **2 hours**
5. Save the subject

### Scheduling 2-Hour Labs
1. **Automatic**: Use the timetable generator - it will automatically handle 2-hour labs
2. **Manual**: When adding lessons manually, select a 2-hour lab subject and the system will:
   - Show a warning about the 2-slot requirement
   - Automatically create the continuation slot if the next slot is available
   - Prevent scheduling if consecutive slots aren't available

### Viewing 2-Hour Labs
- **Master View**: See both slots with clear continuation indicators
- **Class View**: See the full 2-hour session for specific classes
- **Teacher View**: See teacher's 2-hour lab commitments
- **Batch Lab View**: See batch-specific 2-hour lab schedules

## Conflict Prevention

The system prevents conflicts by:
- **Checking Both Slots**: Validates availability of both primary and continuation slots
- **Teacher Conflicts**: Ensures teacher isn't scheduled elsewhere during the 2-hour period
- **Classroom Conflicts**: Ensures lab classroom is available for the full duration
- **Class Conflicts**: Prevents double-booking of classes during 2-hour sessions

## Best Practices

### Subject Setup
- **Clear Naming**: Use descriptive names like "Physics Lab" or "Computer Programming Lab"
- **Proper Duration**: Set lab duration based on actual requirements (1h or 2h)
- **Lab Classroom Assignment**: Ensure lab subjects are assigned to appropriate lab classrooms

### Scheduling
- **Consecutive Availability**: Ensure time slots are configured to allow consecutive scheduling
- **Break Placement**: Avoid placing breaks between potential lab slots
- **Teacher Availability**: Consider teacher schedules when planning 2-hour lab sessions

### Classroom Management
- **Lab Capacity**: Ensure lab classrooms can accommodate the class size
- **Equipment Requirements**: Consider specialized equipment needs for different lab subjects
- **Batch Scheduling**: Use batch-specific scheduling for labs requiring smaller groups

## Troubleshooting

### Common Issues

#### "No consecutive slot available"
- **Cause**: Next time slot is a break or doesn't exist
- **Solution**: Adjust time slot configuration or choose different scheduling time

#### "Next slot already occupied"
- **Cause**: The continuation slot has a conflict
- **Solution**: Resolve the conflict in the next slot or choose different time

#### "2-hour lab not displaying correctly"
- **Cause**: Subject not properly configured as 2-hour lab
- **Solution**: Check subject settings and ensure lab_duration_hours is set to 2

### Validation Checks
The system includes several validation checks:
- **Consecutive Slot Availability**: Ensures next slot exists and isn't a break
- **Conflict Detection**: Checks for teacher, class, and classroom conflicts
- **Duration Consistency**: Validates that lab duration matches subject configuration

## Technical Implementation

### Key Components
- **TimetableView.tsx**: Handles visual representation of multi-slot lessons
- **BatchLabView.tsx**: Manages batch-specific 2-hour lab display
- **timetableUtils.ts**: Utility functions for multi-hour lesson handling
- **Database Triggers**: Automatic continuation lesson creation and cleanup

### Utility Functions
```typescript
// Check if subject is 2-hour lab
isMultiHourLab(subject: Subject): boolean

// Find next consecutive time slot
findNextTimeSlot(currentSlotId: string, timeSlots: TimeSlot[]): TimeSlot | null

// Validate 2-hour lab scheduling
canScheduleMultiHourLab(day, timeSlotId, classId, teacherId, classroomId, lessons, timeSlots)

// Get visual styling for multi-hour lessons
getMultiHourLessonStyle(lesson: Lesson, subjects: Subject[])
```

This comprehensive system ensures that 2-hour lab sessions are properly scheduled, displayed, and managed throughout the timetable application.