import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportRequest {
  file: string; // base64 encoded
  fileName: string;
  dataType: string;
  mimeType: string;
}

// Parser for different file types
class DataParser {
  
  // Parse CSV content
  static parseCSV(content: string): Record<string, any>[] {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data: Record<string, any>[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const row: Record<string, any> = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }
    
    return data;
  }
  
  // Simple text extraction from PDF (basic implementation)
  static extractTextFromPDF(content: string): Record<string, any>[] {
    // This is a simplified approach - in production, use a proper PDF parser
    console.log('PDF parsing is simplified - using basic text extraction');
    return [];
  }
  
  // Parse Excel files (simplified - would need proper XLSX parser in production)
  static parseExcel(content: string): Record<string, any>[] {
    console.log('Excel parsing requires proper XLSX library - converting to CSV approach');
    return [];
  }
}

// Data transformer for different entity types
class DataTransformer {
  
  static transformClasses(rawData: Record<string, any>[]): any[] {
    return rawData.map(row => ({
      name: row['Class Name'] || row['name'] || row['Class'] || '',
      year_id: null, // Will be linked later based on year name
      year_name: row['Year'] || row['Academic Year'] || '',
      section: row['Section'] || '',
      student_count: parseInt(row['Student Count']) || null
    })).filter(item => item.name);
  }
  
  static transformTeachers(rawData: Record<string, any>[]): any[] {
    return rawData.map(row => ({
      name: row['Teacher Name'] || row['Name'] || row['name'] || '',
      email: row['Email'] || row['email'] || '',
      phone: row['Phone'] || row['phone'] || '',
      specialization: row['Specialization'] || row['Subject'] || row['specialization'] || '',
      subjects: row['Subjects'] ? row['Subjects'].split(',').map((s: string) => s.trim()) : []
    })).filter(item => item.name && item.email);
  }
  
  static transformSubjects(rawData: Record<string, any>[]): any[] {
    return rawData.map(row => ({
      name: row['Subject Name'] || row['Name'] || row['name'] || '',
      code: row['Subject Code'] || row['Code'] || row['code'] || '',
      periods_per_week: parseInt(row['Periods per Week']) || parseInt(row['Periods']) || 1,
      is_lab: (row['Is Lab'] || row['Type'] || '').toLowerCase().includes('lab'),
      credits: parseInt(row['Credits']) || null,
      classes: row['Classes'] ? row['Classes'].split(',').map((c: string) => c.trim()) : []
    })).filter(item => item.name && item.code);
  }
  
  static transformClassrooms(rawData: Record<string, any>[]): any[] {
    return rawData.map(row => ({
      name: row['Classroom Name'] || row['Name'] || row['name'] || '',
      capacity: parseInt(row['Capacity']) || 30,
      is_lab: (row['Is Lab'] || row['Type'] || '').toLowerCase().includes('lab'),
      location: row['Location'] || row['location'] || '',
      equipment: row['Equipment'] || row['equipment'] || ''
    })).filter(item => item.name);
  }
  
  static transformTimings(rawData: Record<string, any>[]): any[] {
    const timingGroups: Record<string, any[]> = {};
    
    rawData.forEach(row => {
      const timingName = row['Timing Name'] || row['Schedule'] || 'Default Schedule';
      if (!timingGroups[timingName]) {
        timingGroups[timingName] = [];
      }
      
      timingGroups[timingName].push({
        period_name: row['Period Name'] || row['Period'] || `Period ${timingGroups[timingName].length + 1}`,
        start_time: row['Start Time'] || row['start_time'] || '',
        end_time: row['End Time'] || row['end_time'] || '',
        is_break: (row['Is Break'] || row['Type'] || '').toLowerCase().includes('break'),
        slot_order: timingGroups[timingName].length + 1
      });
    });
    
    return Object.entries(timingGroups).map(([name, periods]) => ({
      name,
      periods,
      working_days: [0, 1, 2, 3, 4, 5] // Monday to Saturday
    }));
  }
}

// Database operations
class DatabaseOperations {
  
  static async insertClasses(supabase: any, classesData: any[]): Promise<string> {
    let summary = '';
    
    // First, ensure years exist
    const uniqueYears = [...new Set(classesData.map(c => c.year_name).filter(Boolean))];
    const yearMap: Record<string, string> = {};
    
    for (const yearName of uniqueYears) {
      let { data: existingYear } = await supabase
        .from('years')
        .select('id')
        .eq('name', yearName)
        .single();
        
      if (!existingYear) {
        const { data: newYear } = await supabase
          .from('years')
          .insert({ name: yearName })
          .select('id')
          .single();
        existingYear = newYear;
      }
      
      if (existingYear) {
        yearMap[yearName] = existingYear.id;
      }
    }
    
    // Insert classes
    const classesToInsert = classesData.map(cls => ({
      name: cls.name,
      year_id: cls.year_name ? yearMap[cls.year_name] : null
    }));
    
    const { data: insertedClasses, error } = await supabase
      .from('classes')
      .upsert(classesToInsert, { onConflict: 'name' })
      .select();
      
    if (error) throw error;
    
    summary = `Inserted ${insertedClasses?.length || 0} classes`;
    return summary;
  }
  
  static async insertTeachers(supabase: any, teachersData: any[]): Promise<string> {
    const teachersToInsert = teachersData.map(teacher => ({
      name: teacher.name,
      email: teacher.email,
      specialization: teacher.specialization
    }));
    
    const { data: insertedTeachers, error } = await supabase
      .from('teachers')
      .upsert(teachersToInsert, { onConflict: 'email' })
      .select();
      
    if (error) throw error;
    
    // Handle subject assignments
    if (insertedTeachers) {
      for (const [index, teacher] of insertedTeachers.entries()) {
        const subjects = teachersData[index].subjects;
        if (subjects && subjects.length > 0) {
          // Get subject IDs
          const { data: subjectData } = await supabase
            .from('subjects')
            .select('id, name')
            .in('name', subjects);
            
          if (subjectData) {
            const assignments = subjectData.map(subject => ({
              teacher_id: teacher.id,
              subject_id: subject.id
            }));
            
            await supabase
              .from('teacher_subject_assignments')
              .upsert(assignments, { onConflict: 'teacher_id,subject_id' });
          }
        }
      }
    }
    
    return `Inserted ${insertedTeachers?.length || 0} teachers`;
  }
  
  static async insertSubjects(supabase: any, subjectsData: any[]): Promise<string> {
    const subjectsToInsert = subjectsData.map(subject => ({
      name: subject.name,
      code: subject.code,
      periods_per_week: subject.periods_per_week,
      is_lab: subject.is_lab
    }));
    
    const { data: insertedSubjects, error } = await supabase
      .from('subjects')
      .upsert(subjectsToInsert, { onConflict: 'code' })
      .select();
      
    if (error) throw error;
    
    // Handle class assignments
    if (insertedSubjects) {
      for (const [index, subject] of insertedSubjects.entries()) {
        const classes = subjectsData[index].classes;
        if (classes && classes.length > 0) {
          // Get class IDs
          const { data: classData } = await supabase
            .from('classes')
            .select('id, name')
            .in('name', classes);
            
          if (classData) {
            const assignments = classData.map(cls => ({
              subject_id: subject.id,
              class_id: cls.id
            }));
            
            await supabase
              .from('subject_class_assignments')
              .upsert(assignments, { onConflict: 'subject_id,class_id' });
          }
        }
      }
    }
    
    return `Inserted ${insertedSubjects?.length || 0} subjects`;
  }
  
  static async insertClassrooms(supabase: any, classroomsData: any[]): Promise<string> {
    const classroomsToInsert = classroomsData.map(classroom => ({
      name: classroom.name,
      capacity: classroom.capacity,
      is_lab: classroom.is_lab
    }));
    
    const { data: insertedClassrooms, error } = await supabase
      .from('classrooms')
      .upsert(classroomsToInsert, { onConflict: 'name' })
      .select();
      
    if (error) throw error;
    
    return `Inserted ${insertedClassrooms?.length || 0} classrooms`;
  }
  
  static async insertTimings(supabase: any, timingsData: any[]): Promise<string> {
    let totalTimeSlots = 0;
    
    for (const timing of timingsData) {
      // Insert timing
      const { data: insertedTiming, error: timingError } = await supabase
        .from('timings')
        .upsert({
          name: timing.name,
          periods: timing.periods,
          working_days: timing.working_days
        }, { onConflict: 'name' })
        .select()
        .single();
        
      if (timingError) throw timingError;
      
      // Insert time slots
      const timeSlots = timing.periods.map((period: any, index: number) => ({
        timing_id: insertedTiming.id,
        start_time: period.start_time,
        end_time: period.end_time,
        slot_order: period.slot_order || index + 1,
        is_break: period.is_break || false
      }));
      
      const { data: insertedSlots, error: slotsError } = await supabase
        .from('time_slots')
        .upsert(timeSlots, { onConflict: 'timing_id,slot_order' })
        .select();
        
      if (slotsError) throw slotsError;
      
      totalTimeSlots += insertedSlots?.length || 0;
    }
    
    return `Inserted ${timingsData.length} timing schedules with ${totalTimeSlots} time slots`;
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Data import request received');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const request: ImportRequest = await req.json();
    console.log('Import request for:', request.dataType, request.fileName);

    // Decode base64 file
    const fileContent = atob(request.file);
    
    // Parse file based on type
    let parsedData: Record<string, any>[] = [];
    
    if (request.mimeType.includes('csv') || request.fileName.endsWith('.csv')) {
      parsedData = DataParser.parseCSV(fileContent);
    } else if (request.mimeType.includes('sheet') || request.fileName.endsWith('.xlsx') || request.fileName.endsWith('.xls')) {
      parsedData = DataParser.parseExcel(fileContent);
    } else if (request.mimeType.includes('pdf') || request.fileName.endsWith('.pdf')) {
      parsedData = DataParser.extractTextFromPDF(fileContent);
    } else {
      throw new Error('Unsupported file format');
    }

    console.log(`Parsed ${parsedData.length} rows from ${request.fileName}`);

    if (parsedData.length === 0) {
      throw new Error('No data found in file or unsupported format. Please ensure CSV format with proper headers.');
    }

    // Transform and insert data based on type
    let summary = '';
    
    switch (request.dataType) {
      case 'classes':
        const classesData = DataTransformer.transformClasses(parsedData);
        summary = await DatabaseOperations.insertClasses(supabase, classesData);
        break;
        
      case 'teachers':
        const teachersData = DataTransformer.transformTeachers(parsedData);
        summary = await DatabaseOperations.insertTeachers(supabase, teachersData);
        break;
        
      case 'subjects':
        const subjectsData = DataTransformer.transformSubjects(parsedData);
        summary = await DatabaseOperations.insertSubjects(supabase, subjectsData);
        break;
        
      case 'classrooms':
        const classroomsData = DataTransformer.transformClassrooms(parsedData);
        summary = await DatabaseOperations.insertClassrooms(supabase, classroomsData);
        break;
        
      case 'timings':
        const timingsData = DataTransformer.transformTimings(parsedData);
        summary = await DatabaseOperations.insertTimings(supabase, timingsData);
        break;
        
      default:
        throw new Error(`Unsupported data type: ${request.dataType}`);
    }

    console.log('Data import completed:', summary);

    return new Response(JSON.stringify({ 
      success: true, 
      summary: summary,
      rowsProcessed: parsedData.length 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error importing data:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to import data',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);