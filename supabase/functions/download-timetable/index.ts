import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const format = url.searchParams.get('format') || 'csv'; // csv, pdf, excel

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

    // Fetch timetable data
    const { data: timetable, error } = await supabase
      .from('timetables')
      .select(`
        *,
        lessons (
          *,
          classes (name),
          subjects (name, code),
          teachers (name),
          classrooms (name),
          time_slots (start_time, end_time, slot_order)
        )
      `)
      .eq('id', timetableId)
      .single();

    if (error || !timetable) {
      return new Response(JSON.stringify({ error: 'Timetable not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

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
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  let csv = 'Day,Time,Subject,Code,Teacher,Class,Classroom\n';

  const lessonsByDay = groupLessonsByDay(timetable.lessons);

  days.forEach((day, dayIndex) => {
    if (lessonsByDay[dayIndex]) {
      lessonsByDay[dayIndex]
        .sort((a: any, b: any) => a.time_slots.slot_order - b.time_slots.slot_order)
        .forEach((lesson: any) => {
          const row = [
            day,
            `${lesson.time_slots.start_time} - ${lesson.time_slots.end_time}`,
            lesson.subjects.name,
            lesson.subjects.code,
            lesson.teachers.name,
            lesson.classes.name,
            lesson.classrooms?.name || 'TBA'
          ].map(field => `"${field}"`).join(',');
          
          csv += row + '\n';
        });
    }
  });

  return csv;
}

function generateHTML(timetable: any): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const lessonsByDay = groupLessonsByDay(timetable.lessons);

  let html = `
<!DOCTYPE html>
<html>
<head>
    <title>${timetable.name} - Timetable</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .day-section { margin-bottom: 30px; }
        .day-title { font-size: 1.5em; font-weight: bold; color: #333; margin-bottom: 10px; }
        .lesson { border: 1px solid #ddd; padding: 10px; margin-bottom: 5px; border-radius: 5px; }
        .lesson-time { font-weight: bold; color: #666; }
        .lesson-subject { font-size: 1.1em; color: #2563eb; }
        .lesson-details { color: #666; font-size: 0.9em; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${timetable.name}</h1>
        <p>Academic Year: ${timetable.academic_year}</p>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
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
    if (lessonsByDay[dayIndex]) {
      lessonsByDay[dayIndex]
        .sort((a: any, b: any) => a.time_slots.slot_order - b.time_slots.slot_order)
        .forEach((lesson: any) => {
          html += `
            <tr>
                <td>${day}</td>
                <td>${lesson.time_slots.start_time} - ${lesson.time_slots.end_time}</td>
                <td>${lesson.subjects.name} (${lesson.subjects.code})</td>
                <td>${lesson.teachers.name}</td>
                <td>${lesson.classes.name}</td>
                <td>${lesson.classrooms?.name || 'TBA'}</td>
            </tr>
          `;
        });
    }
  });

  html += `
        </tbody>
    </table>
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

serve(handler);