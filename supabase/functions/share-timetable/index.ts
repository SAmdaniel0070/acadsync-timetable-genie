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
    const shareToken = url.searchParams.get('token');
    const format = url.searchParams.get('format') || 'json'; // json, whatsapp, email

    if (!shareToken) {
      return new Response(JSON.stringify({ error: 'Share token required' }), {
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
      .eq('share_token', shareToken)
      .single();

    if (error || !timetable) {
      return new Response(JSON.stringify({ error: 'Timetable not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Format response based on requested format
    switch (format) {
      case 'whatsapp':
        const whatsappText = formatForWhatsApp(timetable);
        return new Response(JSON.stringify({ 
          message: whatsappText,
          shareUrl: `https://wa.me/?text=${encodeURIComponent(whatsappText)}`
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });

      case 'email':
        const emailContent = formatForEmail(timetable);
        return new Response(JSON.stringify({
          subject: `Timetable: ${timetable.name}`,
          body: emailContent,
          mailtoUrl: `mailto:?subject=${encodeURIComponent(`Timetable: ${timetable.name}`)}&body=${encodeURIComponent(emailContent)}`
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });

      default:
        return new Response(JSON.stringify(timetable), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }

  } catch (error: any) {
    console.error('Error sharing timetable:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

function formatForWhatsApp(timetable: any): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  let text = `📚 *${timetable.name}*\n`;
  text += `📅 Academic Year: ${timetable.academic_year}\n\n`;

  const lessonsByDay = groupLessonsByDay(timetable.lessons);

  days.forEach((day, dayIndex) => {
    if (lessonsByDay[dayIndex] && lessonsByDay[dayIndex].length > 0) {
      text += `*${day}*\n`;
      lessonsByDay[dayIndex]
        .sort((a: any, b: any) => a.time_slots.slot_order - b.time_slots.slot_order)
        .forEach((lesson: any) => {
          text += `⏰ ${lesson.time_slots.start_time} - ${lesson.time_slots.end_time}\n`;
          text += `📖 ${lesson.subjects.name} (${lesson.subjects.code})\n`;
          text += `👨‍🏫 ${lesson.teachers.name}\n`;
          text += `🏫 ${lesson.classes.name}\n`;
          if (lesson.classrooms) {
            text += `🚪 ${lesson.classrooms.name}\n`;
          }
          text += `\n`;
        });
      text += `\n`;
    }
  });

  return text;
}

function formatForEmail(timetable: any): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  let html = `Timetable: ${timetable.name}\n`;
  html += `Academic Year: ${timetable.academic_year}\n\n`;

  const lessonsByDay = groupLessonsByDay(timetable.lessons);

  days.forEach((day, dayIndex) => {
    if (lessonsByDay[dayIndex] && lessonsByDay[dayIndex].length > 0) {
      html += `${day}\n`;
      html += `${'='.repeat(day.length)}\n`;
      lessonsByDay[dayIndex]
        .sort((a: any, b: any) => a.time_slots.slot_order - b.time_slots.slot_order)
        .forEach((lesson: any) => {
          html += `${lesson.time_slots.start_time} - ${lesson.time_slots.end_time} | `;
          html += `${lesson.subjects.name} (${lesson.subjects.code}) | `;
          html += `${lesson.teachers.name} | `;
          html += `${lesson.classes.name}`;
          if (lesson.classrooms) {
            html += ` | ${lesson.classrooms.name}`;
          }
          html += `\n`;
        });
      html += `\n`;
    }
  });

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