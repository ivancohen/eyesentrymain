-- Create a custom type for the order updates
CREATE TYPE question_order_update AS (
    id UUID,
    display_order INTEGER
);

-- Create function to update question order
CREATE OR REPLACE FUNCTION update_specialist_question_order(
    order_updates question_order_update[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update each question's display_order
    FOR i IN 1..array_length(order_updates, 1) LOOP
        UPDATE specialist_questions
        SET display_order = (order_updates[i]).display_order
        WHERE id = (order_updates[i]).id;
    END LOOP;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_specialist_question_order(question_order_update[]) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION update_specialist_question_order IS 'Updates the display order of specialist questions for drag and drop reordering'; 