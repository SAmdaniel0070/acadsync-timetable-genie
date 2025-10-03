import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const timetableId = url.searchParams.get('id');
    const format = url.searchParams.get('format') || 'csv'; // csv, pdf, excel, json, html

    console.log('Download request:', { timetableId, format });

    if (!timetableId) {
      return new Response(JSON.stringify({ error: 'Timetable ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Fetch timetable data with all related information
    const { data: timetableData, error: timetableError } = await supabase
      .from('timetables')
      .select('*')
      .eq('id', timetableId)
      .single();

    if (timetableError || !timetableData) {
      console.error('Timetable fetch error:', timetableError);
      return new Response(JSON.stringify({ error: 'Timetable not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Fetch all lessons for this timetable
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('timetable_id', timetableId);

    if (lessonsError) {
      console.error('Lessons fetch error:', lessonsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch lessons' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Fetch all related data
    const classIds = [...new Set(lessons?.map((l: any) => l.class_id))];
    const subjectIds = [...new Set(lessons?.map((l: any) => l.subject_id))];
    const teacherIds = [...new Set(lessons?.map((l: any) => l.teacher_id))];
    const classroomIds = [...new Set(lessons?.map((l: any) => l.classroom_id).filter(Boolean))];
    const timeSlotIds = [...new Set(lessons?.map((l: any) => l.time_slot_id))];

    const [classesData, subjectsData, teachersData, classroomsData, timeSlotsData] = await Promise.all([
      supabase.from('classes').select('*').in('id', classIds),
      supabase.from('subjects').select('*').in('id', subjectIds),
      supabase.from('teachers').select('*').in('id', teacherIds),
      classroomIds.length > 0 ? supabase.from('classrooms').select('*').in('id', classroomIds) : { data: [] },
      supabase.from('time_slots').select('*').in('id', timeSlotIds),
    ]);

    // Create lookup maps
    const classesMap = new Map((classesData.data || []).map((c: any) => [c.id, c]));
    const subjectsMap = new Map((subjectsData.data || []).map((s: any) => [s.id, s]));
    const teachersMap = new Map((teachersData.data || []).map((t: any) => [t.id, t]));
    const classroomsMap = new Map((classroomsData.data || []).map((c: any) => [c.id, c]));
    const timeSlotsMap = new Map((timeSlotsData.data || []).map((t: any) => [t.id, t]));

    // Enrich lessons with related data
    const enrichedLessons = (lessons || []).map((lesson: any) => ({
      ...lesson,
      classes: classesMap.get(lesson.class_id),
      subjects: subjectsMap.get(lesson.subject_id),
      teachers: teachersMap.get(lesson.teacher_id),
      classrooms: classroomsMap.get(lesson.classroom_id),
      time_slots: timeSlotsMap.get(lesson.time_slot_id),
    }));

    const timetable = {
      ...timetableData,
      lessons: enrichedLessons,
    };

    console.log('Timetable data prepared:', { 
      name: timetable.name, 
      lessonsCount: enrichedLessons.length 
    });

    // Generate file based on format
    switch (format) {
      case 'csv':
        const csvContent = generateCSV(timetable);
        return new Response(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${timetable.name.replace(/[^a-zA-Z0-9]/g, '_')}_timetable.csv"`,
            ...corsHeaders,
          },
        });

      case 'json':
        return new Response(JSON.stringify(timetable, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${timetable.name.replace(/[^a-zA-Z0-9]/g, '_')}_timetable.json"`,
            ...corsHeaders,
          },
        });

      case 'html':
        const htmlContent = generateHTML(timetable);
        return new Response(htmlContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            'Content-Disposition': `attachment; filename="${timetable.name.replace(/[^a-zA-Z0-9]/g, '_')}_timetable.html"`,
            ...corsHeaders,
          },
        });

      case 'pdf':
        const pdfBuffer = generatePDF(timetable);
        return new Response(pdfBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${timetable.name.replace(/[^a-zA-Z0-9]/g, '_')}_timetable.pdf"`,
            ...corsHeaders,
          },
        });

      case 'excel':
        const excelBuffer = generateExcel(timetable);
        return new Response(excelBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${timetable.name.replace(/[^a-zA-Z0-9]/g, '_')}_timetable.xlsx"`,
            ...corsHeaders,
          },
        });

      default:
        return new Response(JSON.stringify({ error: 'Unsupported format' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }

  } catch (error: any) {
    console.error('Error downloading timetable:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

function generateCSV(timetable: any): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  let csv = 'Day,Time,Subject,Code,Teacher,Class,Classroom\n';

  const lessonsByDay = groupLessonsByDay(timetable.lessons);

  days.forEach((day, dayIndex) => {
    if (lessonsByDay[dayIndex] && lessonsByDay[dayIndex].length > 0) {
      const sortedLessons = lessonsByDay[dayIndex]
        .filter((lesson: any) => lesson.time_slots && lesson.subjects && lesson.teachers && lesson.classes)
        .sort((a: any, b: any) => (a.time_slots?.slot_order || 0) - (b.time_slots?.slot_order || 0));
      
      sortedLessons.forEach((lesson: any) => {
        const row = [
          day,
          `${lesson.time_slots.start_time} - ${lesson.time_slots.end_time}`,
          lesson.subjects.name || 'N/A',
          lesson.subjects.code || 'N/A',
          lesson.teachers.name || 'N/A',
          lesson.classes.name || 'N/A',
          lesson.classrooms?.name || 'TBA'
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
        
        csv += row + '\n';
      });
    }
  });

  return csv;
}

function generateHTML(timetable: any): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const lessonsByDay = groupLessonsByDay(timetable.lessons);

  let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${timetable.name} - Timetable</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
        .header h1 { color: #1e40af; margin: 0 0 10px 0; }
        .header p { color: #666; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px 8px; text-align: left; }
        th { background-color: #2563eb; color: white; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9fafb; }
        tr:hover { background-color: #eff6ff; }
        .subject-cell { font-weight: 500; color: #1e40af; }
        .time-cell { color: #666; font-size: 0.9em; white-space: nowrap; }
        @media print {
            body { margin: 0; background: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${timetable.name || 'Timetable'}</h1>
            <p>Academic Year: ${timetable.academic_year || 'N/A'}</p>
            <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Subject</th>
                    <th>Teacher</th>
                    <th>Class</th>
                    <th>Classroom</th>
                </tr>
            </thead>
            <tbody>
  `;

  days.forEach((day, dayIndex) => {
    if (lessonsByDay[dayIndex] && lessonsByDay[dayIndex].length > 0) {
      const sortedLessons = lessonsByDay[dayIndex]
        .filter((lesson: any) => lesson.time_slots && lesson.subjects && lesson.teachers && lesson.classes)
        .sort((a: any, b: any) => (a.time_slots?.slot_order || 0) - (b.time_slots?.slot_order || 0));
      
      sortedLessons.forEach((lesson: any) => {
        html += `
            <tr>
                <td><strong>${day}</strong></td>
                <td class="time-cell">${lesson.time_slots.start_time} - ${lesson.time_slots.end_time}</td>
                <td class="subject-cell">${lesson.subjects.name || 'N/A'} <span style="color: #666;">(${lesson.subjects.code || 'N/A'})</span></td>
                <td>${lesson.teachers.name || 'N/A'}</td>
                <td>${lesson.classes.name || 'N/A'}</td>
                <td>${lesson.classrooms?.name || 'TBA'}</td>
            </tr>
        `;
      });
    }
  });

  html += `
            </tbody>
        </table>
    </div>
</body>
</html>
  `;

  return html;
}

function groupLessonsByDay(lessons: any[]): { [key: number]: any[] } {
  return lessons.reduce((acc, lesson) => {
    if (!acc[lesson.day]) {
      acc[lesson.day] = [];
    }
    acc[lesson.day].push(lesson);
    return acc;
  }, {});
}

function generatePDF(timetable: any): Uint8Array {
  const doc = new jsPDF();
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const lessonsByDay = groupLessonsByDay(timetable.lessons);
  
  // Add title
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text(timetable.name || 'Timetable', 105, 20, { align: 'center' });
  
  // Add metadata
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Academic Year: ${timetable.academic_year || 'N/A'}`, 105, 32, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 105, 40, { align: 'center' });
  
  let yPos = 55;
  
  days.forEach((day, dayIndex) => {
    if (lessonsByDay[dayIndex] && lessonsByDay[dayIndex].length > 0) {
      const sortedLessons = lessonsByDay[dayIndex]
        .filter((lesson: any) => lesson.time_slots && lesson.subjects && lesson.teachers && lesson.classes)
        .sort((a: any, b: any) => (a.time_slots?.slot_order || 0) - (b.time_slots?.slot_order || 0));
      
      if (sortedLessons.length === 0) return;
      
      // Check if we need a new page before starting a new day
      if (yPos + (sortedLessons.length * 20) > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      // Add day header with background
      doc.setFillColor(37, 99, 235);
      doc.rect(15, yPos - 6, 180, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(day, 20, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 12;
      
      // Add lessons for this day
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      
      sortedLessons.forEach((lesson: any, index: number) => {
        // Alternate background colors for readability
        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(15, yPos - 5, 180, 17, 'F');
        }
        
        const timeStr = `${lesson.time_slots.start_time} - ${lesson.time_slots.end_time}`;
        const subjectStr = `${lesson.subjects.name || 'N/A'} (${lesson.subjects.code || 'N/A'})`;
        const teacherStr = lesson.teachers.name || 'N/A';
        const classStr = lesson.classes.name || 'N/A';
        const roomStr = lesson.classrooms?.name || 'TBA';
        
        // Time and subject on first line
        doc.setFont(undefined, 'bold');
        doc.text(timeStr, 20, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(subjectStr, 60, yPos);
        yPos += 6;
        
        // Details on second line
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Teacher: ${teacherStr} | Class: ${classStr} | Room: ${roomStr}`, 20, yPos);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        yPos += 11;
        
        // Check if we need a new page
        if (yPos > 265) {
          doc.addPage();
          yPos = 20;
        }
      });
      
      yPos += 8;
    }
  });
  
  return doc.output('arraybuffer');
}

function generateExcel(timetable: any): Uint8Array {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const lessonsByDay = groupLessonsByDay(timetable.lessons);
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Create summary info sheet
  const infoData: any[][] = [
    ['Timetable Name', timetable.name || 'N/A'],
    ['Academic Year', timetable.academic_year || 'N/A'],
    ['Generated On', new Date().toLocaleDateString()],
    ['Generated At', new Date().toLocaleTimeString()],
    ['Total Lessons', timetable.lessons?.length || 0],
    [],
    ['This workbook contains:'],
    ['- All Lessons (combined view)'],
    ['- Individual sheets for each day'],
  ];
  
  const infoWs = XLSX.utils.aoa_to_sheet(infoData);
  infoWs['!cols'] = [{ width: 20 }, { width: 40 }];
  XLSX.utils.book_append_sheet(wb, infoWs, 'Info');
  
  // Create main sheet with all lessons
  const worksheetData: any[][] = [
    ['Day', 'Time', 'Subject', 'Code', 'Teacher', 'Class', 'Classroom']
  ];
  
  days.forEach((day, dayIndex) => {
    if (lessonsByDay[dayIndex] && lessonsByDay[dayIndex].length > 0) {
      const sortedLessons = lessonsByDay[dayIndex]
        .filter((lesson: any) => lesson.time_slots && lesson.subjects && lesson.teachers && lesson.classes)
        .sort((a: any, b: any) => (a.time_slots?.slot_order || 0) - (b.time_slots?.slot_order || 0));
      
      sortedLessons.forEach((lesson: any) => {
        worksheetData.push([
          day,
          `${lesson.time_slots.start_time} - ${lesson.time_slots.end_time}`,
          lesson.subjects.name || 'N/A',
          lesson.subjects.code || 'N/A',
          lesson.teachers.name || 'N/A',
          lesson.classes.name || 'N/A',
          lesson.classrooms?.name || 'TBA'
        ]);
      });
    }
  });
  
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Auto-resize columns with better calculation
  const colWidths = worksheetData[0].map((_, colIndex) => {
    const maxLength = Math.max(
      ...worksheetData.map(row => String(row[colIndex] || '').length)
    );
    return Math.min(Math.max(maxLength + 2, 10), 50); // Min 10, max 50
  });
  ws['!cols'] = colWidths.map(width => ({ width }));
  
  XLSX.utils.book_append_sheet(wb, ws, 'All Lessons');
  
  // Create individual day sheets
  days.forEach((day, dayIndex) => {
    if (lessonsByDay[dayIndex] && lessonsByDay[dayIndex].length > 0) {
      const sortedLessons = lessonsByDay[dayIndex]
        .filter((lesson: any) => lesson.time_slots && lesson.subjects && lesson.teachers && lesson.classes)
        .sort((a: any, b: any) => (a.time_slots?.slot_order || 0) - (b.time_slots?.slot_order || 0));
      
      if (sortedLessons.length === 0) return;
      
      const dayData: any[][] = [
        ['Time', 'Subject', 'Code', 'Teacher', 'Class', 'Classroom']
      ];
      
      sortedLessons.forEach((lesson: any) => {
        dayData.push([
          `${lesson.time_slots.start_time} - ${lesson.time_slots.end_time}`,
          lesson.subjects.name || 'N/A',
          lesson.subjects.code || 'N/A',
          lesson.teachers.name || 'N/A',
          lesson.classes.name || 'N/A',
          lesson.classrooms?.name || 'TBA'
        ]);
      });
      
      const dayWs = XLSX.utils.aoa_to_sheet(dayData);
      const dayColWidths = dayData[0].map((_, colIndex) => {
        const maxLength = Math.max(
          ...dayData.map(row => String(row[colIndex] || '').length)
        );
        return Math.min(Math.max(maxLength + 2, 10), 50);
      });
      dayWs['!cols'] = dayColWidths.map(width => ({ width }));
      
      XLSX.utils.book_append_sheet(wb, dayWs, day);
    }
  });
  
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

serve(handler);