# Data Upload Field Mappings & Sample Files

## Overview

This guide provides the exact field names and sample files required for successful data upload to the timetable system. The backend supports multiple field name variations for flexibility.

## 📋 **Field Mappings by Data Type**

### **1. Classes Upload**

#### **Required Fields:**
| Field Name | Alternative Names | Description | Example |
|------------|------------------|-------------|---------|
| `Class Name` | `name`, `Class` | Name of the class | "10-A", "Grade 10 Section A" |
| `Year` | `Academic Year` | Academic year/grade | "Grade 10", "First Year" |
| `Section` | - | Section identifier | "A", "B", "Alpha" |
| `Student Count` | - | Number of students | 30, 35, 28 |

#### **Sample CSV:**
```csv
Class Name,Year,Section,Student Count
10-A,Grade 10,A,30
10-B,Grade 10,B,32
11-A,Grade 11,A,28
11-B,Grade 11,B,30
12-A,Grade 12,A,25
12-B,Grade 12,B,27
```

### **2. Teachers Upload**

#### **Required Fields:**
| Field Name | Alternative Names | Description | Example |
|------------|------------------|-------------|---------|
| `Teacher Name` | `Name`, `name` | Full name of teacher | "John Smith", "Dr. Sarah Johnson" |
| `Email` | `email` | Email address (unique) | "john.smith@school.edu" |
| `Phone` | `phone` | Contact number | "555-0101", "+1-555-0101" |
| `Specialization` | `Subject`, `specialization` | Main subject area | "Mathematics", "Physics" |
| `Subjects` | - | Comma-separated subjects | "Math,Physics,Chemistry" |

#### **Sample CSV:**
```csv
Teacher Name,Email,Phone,Specialization,Subjects
John Smith,john.smith@school.edu,555-0101,Mathematics,"Mathematics,Statistics"
Dr. Sarah Johnson,sarah.johnson@school.edu,555-0102,Physics,"Physics,Chemistry"
Mike Wilson,mike.wilson@school.edu,555-0103,Chemistry,"Chemistry,Biology"
Lisa Brown,lisa.brown@school.edu,555-0104,English,"English,Literature"
David Lee,david.lee@school.edu,555-0105,Computer Science,"Computer Science,Programming"
```

### **3. Subjects Upload**

#### **Required Fields:**
| Field Name | Alternative Names | Description | Example |
|------------|------------------|-------------|---------|
| `Subject Name` | `Name`, `name` | Name of the subject | "Mathematics", "Physics Lab" |
| `Subject Code` | `Code`, `code` | Unique subject code | "MATH001", "PHY101" |
| `Periods per Week` | `Periods` | Weekly periods | 5, 4, 2 |
| `Is Lab` | `Type` | Lab subject indicator | "Yes", "No", "Lab", "Theory" |
| `Credits` | - | Credit hours (optional) | 3, 4, 2 |
| `Classes` | - | Comma-separated classes | "10-A,10-B,11-A" |

#### **Sample CSV:**
```csv
Subject Name,Subject Code,Periods per Week,Is Lab,Credits,Classes
Mathematics,MATH001,5,No,4,"10-A,10-B,11-A"
Physics,PHY001,4,No,3,"11-A,11-B,12-A"
Chemistry Lab,CHEM001L,2,Yes,2,"11-A,11-B,12-A"
English,ENG001,4,No,3,"10-A,10-B,11-A,12-A"
Computer Science,CS001,3,No,3,"11-A,12-A"
Biology Lab,BIO001L,2,Yes,2,"11-A,11-B"
```

### **4. Classrooms Upload**

#### **Required Fields:**
| Field Name | Alternative Names | Description | Example |
|------------|------------------|-------------|---------|
| `Classroom Name` | `Name`, `name` | Name/number of room | "Room 101", "Physics Lab" |
| `Capacity` | - | Maximum students | 35, 25, 40 |
| `Is Lab` | `Type` | Laboratory indicator | "Yes", "No", "Lab", "Classroom" |
| `Location` | `location` | Building/floor info | "Building A", "2nd Floor" |
| `Equipment` | `equipment` | Available equipment | "Projector, Whiteboard" |

#### **Sample CSV:**
```csv
Classroom Name,Capacity,Is Lab,Location,Equipment
Room 101,35,No,Building A,"Projector,Whiteboard,AC"
Room 102,35,No,Building A,"Projector,Whiteboard,AC"
Room 103,40,No,Building A,"Smart Board,AC"
Physics Lab,25,Yes,Building B,"Lab Equipment,Projector"
Chemistry Lab,25,Yes,Building B,"Fume Hood,Lab Equipment"
Computer Lab,30,Yes,Building C,"30 Computers,Projector"
Library,100,No,Ground Floor,"Books,Reading Tables"
```

### **5. Timings Upload**

#### **Required Fields:**
| Field Name | Alternative Names | Description | Example |
|------------|------------------|-------------|---------|
| `Period Name` | `Period` | Name of time period | "Period 1", "Morning Break" |
| `Start Time` | `start_time` | Start time (HH:MM) | "09:00", "10:30" |
| `End Time` | `end_time` | End time (HH:MM) | "09:45", "10:45" |
| `Is Break` | `Type` | Break period indicator | "Yes", "No", "Break", "Class" |
| `Timing Name` | `Schedule` | Schedule group name | "Regular Schedule", "Saturday Schedule" |

#### **Sample CSV:**
```csv
Period Name,Start Time,End Time,Is Break,Timing Name
Period 1,09:00,09:45,No,Regular Schedule
Period 2,09:45,10:30,No,Regular Schedule
Morning Break,10:30,10:45,Yes,Regular Schedule
Period 3,10:45,11:30,No,Regular Schedule
Period 4,11:30,12:15,No,Regular Schedule
Lunch Break,12:15,13:00,Yes,Regular Schedule
Period 5,13:00,13:45,No,Regular Schedule
Period 6,13:45,14:30,No,Regular Schedule
```

## 📁 **Complete Sample Files**

### **1. Complete Classes File (classes.csv)**
```csv
Class Name,Year,Section,Student Count
First Year A,First Year,A,32
First Year B,First Year,B,30
First Year C,First Year,C,31
Second Year A,Second Year,A,28
Second Year B,Second Year,B,29
Second Year C,Second Year,C,27
Third Year A,Third Year,A,25
Third Year B,Third Year,B,26
Fourth Year A,Fourth Year,A,24
Fourth Year B,Fourth Year,B,23
```

### **2. Complete Teachers File (teachers.csv)**
```csv
Teacher Name,Email,Phone,Specialization,Subjects
Dr. John Smith,john.smith@college.edu,+1-555-0101,Mathematics,"Mathematics,Statistics,Calculus"
Prof. Sarah Johnson,sarah.johnson@college.edu,+1-555-0102,Physics,"Physics,Applied Physics"
Dr. Mike Wilson,mike.wilson@college.edu,+1-555-0103,Chemistry,"Chemistry,Organic Chemistry"
Ms. Lisa Brown,lisa.brown@college.edu,+1-555-0104,English,"English,Communication Skills"
Dr. David Lee,david.lee@college.edu,+1-555-0105,Computer Science,"Programming,Data Structures,Algorithms"
Prof. Emily Davis,emily.davis@college.edu,+1-555-0106,Biology,"Biology,Microbiology"
Dr. Robert Taylor,robert.taylor@college.edu,+1-555-0107,Mechanical Engineering,"Engineering Mechanics,Thermodynamics"
Ms. Jennifer Wilson,jennifer.wilson@college.edu,+1-555-0108,Electronics,"Electronics,Digital Circuits"
```

### **3. Complete Subjects File (subjects.csv)**
```csv
Subject Name,Subject Code,Periods per Week,Is Lab,Credits,Classes
Mathematics I,MATH101,5,No,4,"First Year A,First Year B,First Year C"
Physics I,PHY101,4,No,3,"First Year A,First Year B,First Year C"
Chemistry I,CHEM101,3,No,3,"First Year A,First Year B,First Year C"
Physics Lab,PHY101L,2,Yes,1,"First Year A,First Year B,First Year C"
Chemistry Lab,CHEM101L,2,Yes,1,"First Year A,First Year B,First Year C"
English Communication,ENG101,3,No,2,"First Year A,First Year B,First Year C"
Programming Fundamentals,CS101,4,No,3,"First Year A,First Year B"
Programming Lab,CS101L,2,Yes,1,"First Year A,First Year B"
Mathematics II,MATH201,5,No,4,"Second Year A,Second Year B,Second Year C"
Advanced Physics,PHY201,4,No,3,"Second Year A,Second Year B"
Data Structures,CS201,4,No,3,"Second Year A,Second Year B"
Data Structures Lab,CS201L,2,Yes,1,"Second Year A,Second Year B"
```

### **4. Complete Classrooms File (classrooms.csv)**
```csv
Classroom Name,Capacity,Is Lab,Location,Equipment
Room 101,40,No,Building A - Ground Floor,"Projector,Whiteboard,AC,Sound System"
Room 102,40,No,Building A - Ground Floor,"Projector,Whiteboard,AC"
Room 103,35,No,Building A - First Floor,"Smart Board,AC,Sound System"
Room 104,35,No,Building A - First Floor,"Projector,Whiteboard,AC"
Room 201,40,No,Building A - Second Floor,"Projector,Whiteboard,AC"
Room 202,40,No,Building A - Second Floor,"Smart Board,AC"
Physics Lab 1,25,Yes,Building B - Ground Floor,"Physics Equipment,Projector,Lab Tables"
Physics Lab 2,25,Yes,Building B - Ground Floor,"Advanced Physics Equipment,Projector"
Chemistry Lab 1,25,Yes,Building B - First Floor,"Fume Hoods,Chemical Storage,Lab Equipment"
Chemistry Lab 2,25,Yes,Building B - First Floor,"Organic Chemistry Setup,Fume Hoods"
Computer Lab 1,30,Yes,Building C - Ground Floor,"30 Computers,Projector,AC,Network"
Computer Lab 2,30,Yes,Building C - First Floor,"30 Computers,Smart Board,AC,Network"
Seminar Hall,100,No,Building A - Ground Floor,"Audio System,Projector,AC,Stage"
Library,150,No,Building D,"Reading Tables,Books,Digital Resources"
```

### **5. Complete Timings File (timings.csv)**
```csv
Period Name,Start Time,End Time,Is Break,Timing Name
Period 1,08:30,09:15,No,Weekday Schedule
Period 2,09:15,10:00,No,Weekday Schedule
Short Break,10:00,10:15,Yes,Weekday Schedule
Period 3,10:15,11:00,No,Weekday Schedule
Period 4,11:00,11:45,No,Weekday Schedule
Long Break,11:45,12:30,Yes,Weekday Schedule
Period 5,12:30,13:15,No,Weekday Schedule
Period 6,13:15,14:00,No,Weekday Schedule
Lunch Break,14:00,14:45,Yes,Weekday Schedule
Period 7,14:45,15:30,No,Weekday Schedule
Period 8,15:30,16:15,No,Weekday Schedule
```

## 🔧 **Advanced Features**

### **Batch & Teacher Assignments (Optional)**
Create a separate file for batch-teacher assignments:

#### **batch_assignments.csv**
```csv
Subject Code,Batch Name,Teacher Email,Assignment Type,Class Name
CS101L,Batch A,david.lee@college.edu,lab,First Year A
CS101L,Batch B,david.lee@college.edu,lab,First Year A
PHY101L,Batch A,sarah.johnson@college.edu,lab,First Year A
PHY101L,Batch B,sarah.johnson@college.edu,lab,First Year B
CHEM101L,Batch A,mike.wilson@college.edu,lab,First Year A
CHEM101L,Batch B,mike.wilson@college.edu,lab,First Year B
```

## 📝 **Upload Guidelines**

### **File Format Requirements:**
- **Excel**: `.xlsx` or `.xls` format
- **CSV**: Comma-separated values with UTF-8 encoding
- **PDF**: Tabular data (basic extraction)
- **Headers**: First row must contain column headers
- **Size Limit**: Maximum 10MB per file

### **Data Quality Tips:**
1. **Consistent Naming**: Use consistent naming conventions
2. **No Special Characters**: Avoid special characters in names
3. **Time Format**: Use 24-hour format (HH:MM)
4. **Boolean Values**: Use "Yes/No" or "True/False"
5. **Email Uniqueness**: Ensure teacher emails are unique
6. **Code Uniqueness**: Ensure subject codes are unique

### **Upload Order:**
1. **Classes** (creates years automatically)
2. **Subjects** (with class assignments)
3. **Teachers** (with subject assignments)
4. **Classrooms**
5. **Timings**
6. **Generate Timetable**

## 🚀 **Quick Start Templates**

### **Minimal Test Data**
For quick testing, use these minimal files:

#### **test_classes.csv**
```csv
Class Name,Year,Section,Student Count
CS-A,First Year,A,30
CS-B,First Year,B,28
IT-A,Second Year,A,25
```

#### **test_subjects.csv**
```csv
Subject Name,Subject Code,Periods per Week,Is Lab,Classes
Programming,CS101,4,No,"CS-A,CS-B"
Programming Lab,CS101L,2,Yes,"CS-A,CS-B"
Mathematics,MATH101,5,No,"CS-A,CS-B,IT-A"
```

#### **test_teachers.csv**
```csv
Teacher Name,Email,Specialization,Subjects
John Doe,john@test.edu,Computer Science,"Programming,Programming Lab"
Jane Smith,jane@test.edu,Mathematics,Mathematics
```

#### **test_classrooms.csv**
```csv
Classroom Name,Capacity,Is Lab
Room 101,35,No
Computer Lab,25,Yes
```

#### **test_timings.csv**
```csv
Period Name,Start Time,End Time,Is Break
Period 1,09:00,09:45,No
Period 2,09:45,10:30,No
Break,10:30,10:45,Yes
Period 3,10:45,11:30,No
```

This comprehensive guide ensures successful data upload with proper field mapping and sample data for all entity types in the timetable system.