-- Create risk assessment configuration tables
CREATE TABLE IF NOT EXISTS risk_assessment_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id TEXT NOT NULL,
    option_value TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(question_id, option_value)
);

-- Create risk assessment advice table
CREATE TABLE IF NOT EXISTS risk_assessment_advice (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    min_score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    advice TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(min_score, max_score)
);

-- Add risk_level column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'risk_assessment_advice' 
        AND column_name = 'risk_level'
    ) THEN
        ALTER TABLE risk_assessment_advice 
        ADD COLUMN risk_level TEXT NOT NULL DEFAULT 'low';
        
        -- Update existing rows with default risk levels based on score ranges
        UPDATE risk_assessment_advice 
        SET risk_level = CASE
            WHEN min_score <= 3 THEN 'low'
            WHEN min_score <= 7 THEN 'moderate'
            ELSE 'high'
        END;
        
        -- Drop the old unique constraint
        ALTER TABLE risk_assessment_advice 
        DROP CONSTRAINT IF EXISTS risk_assessment_advice_min_score_max_score_key;
        
        -- Add new unique constraint on risk_level
        ALTER TABLE risk_assessment_advice 
        ADD CONSTRAINT risk_assessment_advice_risk_level_key UNIQUE (risk_level);
    END IF;
END $$;

-- Add RLS policies
ALTER TABLE risk_assessment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessment_advice ENABLE ROW LEVEL SECURITY;

-- Policies for risk_assessment_config
CREATE POLICY "Allow public read access to risk_assessment_config"
    ON risk_assessment_config FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow admin write access to risk_assessment_config"
    ON risk_assessment_config FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Policies for risk_assessment_advice
CREATE POLICY "Allow public read access to risk_assessment_advice"
    ON risk_assessment_advice FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow admin write access to risk_assessment_advice"
    ON risk_assessment_advice FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_risk_assessment_config_updated_at
    BEFORE UPDATE ON risk_assessment_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_assessment_advice_updated_at
    BEFORE UPDATE ON risk_assessment_advice
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 