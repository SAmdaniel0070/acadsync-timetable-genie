import { supabase } from "@/integrations/supabase/client";

export const assignLabSchedules = async () => {
  const { data, error } = await supabase.functions.invoke('assign-lab-schedules', {
    body: {}
  });

  if (error) {
    console.error('Error assigning lab schedules:', error);
    throw error;
  }

  return data;
};
