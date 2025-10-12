# Batch Lab Scheduling System

## Overview

The batch lab scheduling system automatically creates lab sessions for each batch within a class according to the subject credits and schedules them randomly throughout the week. This ensures proper distribution of lab sessions while avoiding conflicts.

## Key Features

### 1. Automatic Batch Lab Generation
- **Credit-based scheduling**: Lab sessions are created based on the `periods_per_week` field in the subject configuration
- **Random distribution**: Lab sessions are randomly distributed throughout the week to ensure variety
- **Conflict avoidance**: The system checks for teacher, batch, classroom, and time slot conflicts
- **Multi-hour support**: Supports both 1-hour and 2-hour lab sessions based on `lab_duration_hours`

### 2. Intelligent Scheduling Algorithm
- **Batch-specific assignments**: Each batch gets its own lab sessions based on teacher assignments
- **Resource optimization**: Efficiently uses available lab classrooms and time slots
- **Conflict resolution**: Automatically resolves scheduling conflicts by finding alternative slots

### 3. Management Functions
- **Regenerate**: Completely regenerate all batch lab schedules
- **Clear**: Remove all existing batch lab schedules
- **Integration**: Seamlessly integrates with the main timetable generation process

## How It Works

### 1. Data Collection
The system gathers:
- All classes and their associated batches
- Lab subjects with their credit requirements (`periods_per_week`)
- Available teachers and their subject assignments
- Lab classrooms and time slots
- Existing batch teacher assignments

### 2. Schedule Generation Process

#### Step 1: Subject Analysis
- Identifies lab subjects for each class
- Determines required lab sessions per week based on `periods_per_week`
- Checks lab duration (1h or 2h) from `lab_duration_hours`

#### Step 2: Batch Processing
For each batch in each class:
- Finds assigned teacher for the lab subject
- Calculates total lab sessions needed
- Creates schedule entries for each required session

#### Step 3: Time Slot Assignment
- Creates a pool of available time slots (Monday-Saturday)
- Randomly shuffles slots for fair distribution
- Assigns slots while checking for conflicts

#### Step 4: Conflict Resolution
Checks for conflicts with:
- **Teacher availability**: Ensures teacher isn't double-booked across lab schedules and main timetable
- **Batch schedule**: Prevents batch from having overlapping sessions
- **Class theory/lecture conflicts**: **CRITICAL** - Ensures lab sessions are not scheduled when the class has common theory/lecture sessions
- **Classroom availability**: Ensures lab rooms aren't overbooked (checks both lab schedules and main timetable)
- **Multi-hour sessions**: Reserves consecutive slots for 2-hour labs and checks for conflicts with existing 2-hour lessons

### 3. Database Structure

#### Lab Schedules Table
```sql
CREATE TABLE lab_schedules (
  id UUID PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id),
  teacher_id UUID REFERENCES teachers(id),
  classroom_id UUID REFERENCES classrooms(id),
  time_slot_id UUID REFERENCES time_slots(id),
  day INTEGER, -- 0=Monday, 1=Tuesday, etc.
  class_id UUID REFERENCES classes(id),
  batch_id UUID REFERENCES batches(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### Key Relationships
- **Subject**: Links to lab subjects with `is_lab = true`
- **Teacher**: Uses batch teacher assignments or falls back to qualified teachers
- **Classroom**: Only uses classrooms with `is_lab = true`
- **Time Slot**: Uses non-break time slots from the timing configuration
- **Batch**: Creates separate schedules for each batch

## Configuration Requirements

### 1. Subject Setup
```typescript
interface Subject {
  id: string;
  name: string;
  code: string;
  periods_per_week: number; // Number of lab sessions per week
  is_lab: boolean; // Must be true for lab subjects
  lab_duration_hours: number; // 1 or 2 hours per session
}
```

### 2. Batch Teacher Assignments
```typescript
interface BatchTeacherAssignment {
  id: string;
  subject_id: string;
  batch_id: string;
  teacher_id: string;
  assignment_type: 'lab'; // Must be 'lab' for lab assignments
}
```

### 3. Classroom Configuration
```typescript
interface Classroom {
  id: string;
  name: string;
  capacity: number;
  is_lab: boolean; // Must be true for lab classrooms
}
```

## Usage Instructions

### 1. Automatic Generation
Batch lab schedules are automatically generated when:
- Creating a new timetable via "Generate Timetable"
- The system calls `generateBatchLabSchedules()` after main timetable generation

### 2. Manual Management
Use the Lab Management dropdown in the timetable actions:

#### Regenerate Batch Labs
- Clears all existing batch lab schedules
- Regenerates schedules based on current configuration
- Useful when subjects, batches, or assignments change

#### Clear Batch Labs
- Removes all batch lab schedules
- Useful for starting fresh or troubleshooting

### 3. Viewing Results
- Navigate to the "Batch Lab Schedule" tab in the timetable view
- Select a class to see batch-specific lab schedules
- Color-coded display shows different batches clearly

## Algorithm Details

### Random Distribution Strategy
```typescript
// Shuffle available slots for random distribution
const shuffledSlots = [...availableSlots].sort(() => Math.random() - 0.5);
```

### Enhanced Conflict Detection
```typescript
async checkLabScheduleConflict({
  day: number,
  timeSlotId: string,
  teacherId: string,
  batchId: string,
  classId: string,
  labDuration: number,
  existingSchedules: LabSchedule[],
  teachingTimeSlots: TimeSlot[]
}): Promise<boolean>
```

**Key Enhancement**: The conflict detection now checks both lab schedules AND main timetable lessons to prevent scheduling lab sessions when:

1. **Class has theory/lecture sessions**: Prevents batches from having lab sessions during common class lectures
2. **Teacher is busy with other classes**: Ensures teachers aren't double-booked across different classes
3. **Classroom conflicts**: Checks both lab and regular classroom usage
4. **Multi-hour lesson conflicts**: Detects when previous slots have 2-hour lessons that would overlap

### Multi-Hour Lab Handling
For 2-hour labs:
1. Finds consecutive time slots
2. Creates entries for both slots
3. Ensures both slots are available before scheduling
4. Links continuation slots to main session

## Critical Feature: Theory/Lecture Conflict Prevention

### Why This Matters
The most important feature of the batch lab scheduling system is preventing lab sessions from being scheduled when the entire class has common theory or lecture sessions. This ensures:

1. **No Student Conflicts**: Students won't be torn between attending a mandatory theory class and their batch lab session
2. **Teacher Availability**: Teachers won't be double-booked between theory classes and lab sessions
3. **Classroom Efficiency**: Prevents conflicts where the same classroom might be needed for both theory and lab sessions
4. **Academic Integrity**: Maintains the priority of common theory sessions that all students must attend

### How It Works
The system performs a comprehensive check against the main timetable:

```typescript
// Check conflicts with main timetable lessons (theory/lectures)
const mainTimetableConflicts = mainTimetableLessons.filter((lesson: any) =>
  lesson.day === day &&
  lesson.time_slot_id === slotId && (
    lesson.teacher_id === teacherId || // Teacher is already teaching another class
    lesson.class_id === classId // Class already has a theory/lecture session
  )
);
```

### Example Scenario
- **Monday 10:00 AM**: Class CS-A has "Data Structures" theory lecture
- **System Behavior**: No batch from CS-A will be scheduled for lab sessions at Monday 10:00 AM
- **Result**: All CS-A students can attend the mandatory theory lecture without conflicts

## Best Practices

### 1. Subject Configuration
- Set appropriate `periods_per_week` values (typically 1-3 for labs)
- Configure `lab_duration_hours` correctly (1 or 2)
- Ensure lab subjects have `is_lab = true`

### 2. Teacher Assignments
- Create batch teacher assignments for lab subjects
- Assign qualified teachers who can handle the subject
- Use `assignment_type = 'lab'` for lab assignments

### 3. Classroom Management
- Ensure sufficient lab classrooms are available
- Mark appropriate classrooms with `is_lab = true`
- Consider classroom capacity vs batch size

### 4. Time Slot Configuration
- Provide adequate time slots throughout the week
- Ensure consecutive slots are available for 2-hour labs
- Mark break periods correctly to avoid scheduling conflicts

## Troubleshooting

### Common Issues

#### 1. Insufficient Lab Sessions Scheduled
**Symptoms**: Fewer sessions scheduled than required
**Causes**: 
- Limited available time slots
- Too many conflicts
- Insufficient lab classrooms
**Solutions**:
- Add more time slots to the timing configuration
- Increase number of lab classrooms
- Review teacher assignments for conflicts

#### 2. No Teacher Found for Batch
**Symptoms**: Warning messages about missing teachers
**Causes**:
- No batch teacher assignment exists
- No qualified teacher available
**Solutions**:
- Create batch teacher assignments in the subjects page
- Ensure teachers have the required subject qualifications

#### 3. Classroom Conflicts
**Symptoms**: Labs not scheduled due to classroom unavailability
**Causes**:
- Insufficient lab classrooms
- Overlapping lab sessions
**Solutions**:
- Add more lab classrooms
- Stagger lab session times
- Review classroom capacity

### Debugging Tips

1. **Check Console Logs**: The system provides detailed logging during generation
2. **Verify Data**: Ensure all required data (subjects, batches, teachers, classrooms) exists
3. **Test Incrementally**: Start with one class/batch and expand gradually
4. **Review Assignments**: Verify batch teacher assignments are properly configured

## API Reference

### Core Functions

#### `generateBatchLabSchedules(): Promise<void>`
Generates batch lab schedules for all classes and batches.

#### `regenerateBatchLabSchedules(): Promise<void>`
Clears existing schedules and regenerates them.

#### `clearBatchLabSchedules(): Promise<void>`
Removes all batch lab schedules.

#### `scheduleBatchLabSessions(params): Promise<void>`
Schedules lab sessions for a specific batch and subject.

#### `checkLabScheduleConflict(params): boolean`
Checks for scheduling conflicts.

#### `findAvailableLabClassroom(params): Classroom | null`
Finds an available lab classroom for the given time slot.

## Integration Points

### 1. Main Timetable Generation
- Called automatically after main timetable generation
- Integrates with existing lesson scheduling
- Respects existing time slot allocations

### 2. Batch Lab View
- Displays batch-specific schedules
- Shows theory lessons alongside lab sessions
- Provides visual distinction between batches

### 3. Manual Edit Mode
- Allows manual adjustment of lab schedules
- Supports adding/editing/deleting lab sessions
- Maintains consistency with batch assignments

The batch lab scheduling system provides a comprehensive solution for managing lab sessions across multiple batches while ensuring optimal resource utilization and conflict-free scheduling.