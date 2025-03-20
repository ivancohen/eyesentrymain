import { supabase } from "../src/lib/supabase";

async function addTooltipColumn() {
  try {
    // Add the tooltip column and comment
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error checking questions table:', error);
      return;
    }

    if (!data[0].hasOwnProperty('tooltip')) {
      const { error: alterError } = await supabase
        .from('questions')
        .update({ tooltip: null })
        .eq('id', data[0].id);

      if (alterError) {
        console.error('Error adding tooltip column:', alterError);
        return;
      }
    }

    console.log('Successfully added tooltip column to questions table');
  } catch (error) {
    console.error('Error adding tooltip column:', error);
  } finally {
    await supabase.auth.signOut();
  }
}

addTooltipColumn(); 