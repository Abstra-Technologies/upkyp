-- Add Diddit session tracking to LandlordVerification
ALTER TABLE LandlordVerification
ADD COLUMN didit_session_id VARCHAR(255) NULL AFTER landlord_id,
ADD COLUMN didit_workflow_id VARCHAR(255) NULL AFTER didit_session_id;
