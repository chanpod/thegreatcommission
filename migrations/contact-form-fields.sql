-- Add contact form fields to landing_page_config table
ALTER TABLE landing_page_config ADD COLUMN IF NOT EXISTS contact_form_enabled boolean DEFAULT false;
ALTER TABLE landing_page_config ADD COLUMN IF NOT EXISTS contact_title TEXT DEFAULT 'Contact Us';
ALTER TABLE landing_page_config ADD COLUMN IF NOT EXISTS contact_description TEXT DEFAULT 'Have questions? We''d love to hear from you!';
ALTER TABLE landing_page_config ADD COLUMN IF NOT EXISTS contact_button_text TEXT DEFAULT 'Send Message';
ALTER TABLE landing_page_config ADD COLUMN IF NOT EXISTS contact_background_color TEXT DEFAULT '#F3F4F6';
ALTER TABLE landing_page_config ADD COLUMN IF NOT EXISTS contact_text_color TEXT DEFAULT '#000000'; 