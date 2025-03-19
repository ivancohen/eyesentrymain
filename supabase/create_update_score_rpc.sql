-- Create the function to update question scores
CREATE OR REPLACE FUNCTION update_question_score(
    option_type TEXT,
    option_id UUID,
    new_score INT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_admin BOOLEAN;
    success BOOLEAN;
BEGIN
    -- Check if the current user is an admin
    SELECT is_admin INTO is_admin 
    FROM profiles 
    WHERE id = auth.uid();

    -- If not admin, return false
    IF NOT is_admin THEN
        RAISE EXCEPTION 'Only administrators can update question scores.';
        RETURN FALSE;
    END IF;

    -- Update the score based on option type
    IF option_type = 'dropdown' THEN
        UPDATE dropdown_options
        SET score = new_score
        WHERE id = option_id;
    ELSIF option_type = 'conditional' THEN
        UPDATE conditional_items
        SET score = new_score
        WHERE id = option_id;
    ELSE
        RAISE EXCEPTION 'Invalid option type: %', option_type;
        RETURN FALSE;
    END IF;

    -- Check if the update was successful
    GET DIAGNOSTICS success = ROW_COUNT;
    RETURN success > 0;
END;
$$;

-- Check if admin function exists and create if not
CREATE OR REPLACE FUNCTION check_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    -- Check if the current user is an admin
    SELECT p.is_admin INTO is_admin 
    FROM profiles p
    WHERE p.id = auth.uid();
    
    RETURN COALESCE(is_admin, FALSE);
END;
$$;

-- Grant permissions to use the functions
GRANT EXECUTE ON FUNCTION update_question_score TO authenticated;
GRANT EXECUTE ON FUNCTION check_is_admin TO authenticated;
