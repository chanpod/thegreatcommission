-- Add contact_form_enabled column to landing_page_config table
ALTER TABLE landing_page_config ADD COLUMN IF NOT EXISTS contact_form_enabled boolean DEFAULT false; 