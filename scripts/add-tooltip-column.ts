import { supabase } from "../src/lib/supabase";

async function addTooltipColumn() {
  try {
    // Add tooltip column
    const { error: alterError } = await supabase.rpc('add_tooltip_column');
    if (alterError) throw alterError;

    // Add comment
    const { error: commentError } = await supabase.rpc('add_tooltip_comment');
    if (commentError) throw commentError;

    // Update existing questions
    const { error: updateError } = await supabase.rpc('update_existing_tooltips');
    if (updateError) throw updateError;

    console.log('Successfully added tooltip column to questions table');
  } catch (error) {
    console.error('Error adding tooltip column:', error);
  } finally {
    await supabase.auth.signOut();
  }
}

addTooltipColumn(); 