-- Create notifications table for the EyeSentry application
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('warning', 'info', 'success')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    related_entity_id VARCHAR(255),
    related_entity_type VARCHAR(50),
    
    -- Add indexes for better performance
    CONSTRAINT idx_notifications_user_id_created_at UNIQUE (user_id, created_at)
);

-- Create RLS policies for the notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy to allow users to update only their own notifications (for marking as read)
CREATE POLICY "Users can update their own notifications"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy to allow service role to insert notifications
CREATE POLICY "Service role can insert notifications"
    ON public.notifications
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Create function to create a notification when a specialist updates a patient file
CREATE OR REPLACE FUNCTION public.create_specialist_update_notification()
RETURNS TRIGGER AS $$
DECLARE
    patient_name TEXT;
    specialist_name TEXT;
    doctor_id UUID;
BEGIN
    -- Get patient name
    SELECT name INTO patient_name
    FROM public.patients
    WHERE id = NEW.patient_id;
    
    -- Get specialist name
    SELECT name INTO specialist_name
    FROM public.users
    WHERE id = NEW.updated_by;
    
    -- Get doctor ID
    SELECT doctor_id INTO doctor_id
    FROM public.patients
    WHERE id = NEW.patient_id;
    
    -- Create notification
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        is_read,
        related_entity_id,
        related_entity_type
    ) VALUES (
        doctor_id,
        'info',
        'Specialist Update',
        'Specialist ' || specialist_name || ' has updated patient ' || patient_name || '''s file.',
        FALSE,
        NEW.patient_id::TEXT,
        'patient'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function when a specialist updates a patient file
CREATE TRIGGER specialist_update_notification_trigger
AFTER UPDATE ON public.patient_assessments
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.* AND NEW.updated_by IN (SELECT id FROM public.users WHERE role = 'specialist'))
EXECUTE FUNCTION public.create_specialist_update_notification();

-- Create function to create a notification for high risk assessments
CREATE OR REPLACE FUNCTION public.create_high_risk_notification()
RETURNS TRIGGER AS $$
DECLARE
    patient_name TEXT;
    doctor_id UUID;
BEGIN
    -- Only create notification if risk level is high
    IF NEW.risk_level != 'High' THEN
        RETURN NEW;
    END IF;
    
    -- Get patient name
    SELECT name INTO patient_name
    FROM public.patients
    WHERE id = NEW.patient_id;
    
    -- Get doctor ID
    SELECT doctor_id INTO doctor_id
    FROM public.patients
    WHERE id = NEW.patient_id;
    
    -- Create notification
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        is_read,
        related_entity_id,
        related_entity_type
    ) VALUES (
        doctor_id,
        'warning',
        'High Risk Assessment',
        'Patient ' || patient_name || ' has a high risk assessment that requires follow-up.',
        FALSE,
        NEW.patient_id::TEXT,
        'patient'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function when a new assessment is created with high risk
CREATE TRIGGER high_risk_notification_trigger
AFTER INSERT OR UPDATE ON public.patient_assessments
FOR EACH ROW
WHEN (NEW.risk_level = 'High')
EXECUTE FUNCTION public.create_high_risk_notification();

-- Create function to create a notification for upcoming appointments
CREATE OR REPLACE FUNCTION public.create_appointment_notification()
RETURNS TRIGGER AS $$
DECLARE
    patient_name TEXT;
    doctor_id UUID;
    appointment_date TEXT;
BEGIN
    -- Get patient name
    SELECT name INTO patient_name
    FROM public.patients
    WHERE id = NEW.patient_id;
    
    -- Get doctor ID
    SELECT doctor_id INTO doctor_id
    FROM public.patients
    WHERE id = NEW.patient_id;
    
    -- Format appointment date
    appointment_date := to_char(NEW.appointment_date, 'Month DD, YYYY at HH:MI AM');
    
    -- Create notification
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        is_read,
        related_entity_id,
        related_entity_type
    ) VALUES (
        doctor_id,
        'success',
        'Appointment Reminder',
        'Patient ' || patient_name || ' has an appointment scheduled for ' || appointment_date || '.',
        FALSE,
        NEW.id::TEXT,
        'appointment'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function when a new appointment is created
CREATE TRIGGER appointment_notification_trigger
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.create_appointment_notification();

-- Grant permissions
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT INSERT, SELECT, UPDATE ON public.notifications TO service_role;