/**
 * Shared Unit type used across tenant UI components
 * (cards, listings, portals).
 */
export interface UnitDetails {
  unit_id: string;
  unit_name: string;

  unit_style: string;
  unit_size: number;
  bed_spacing: number;
  avail_beds: number;
  rent_amount: number;
  furnish: string;
  status: string;

  amenities: string;
  min_stay: number;
  late_fee: number;
  flexipay_enabled: number;
  accepted_payment_methods: string;

  sec_deposit: number;
  advanced_payment: number;
  is_advance_payment_paid: number;
  is_security_deposit_paid: number;

  photos: string[];

  property_id: string;
  property_name: string;
  property_type: string;
  property_amenities: string;
  property_description: string;

  city: string;
  province: string;
  street: string;

  latitude: number;
  longitude: number;

  zip_code?: string;
  brgy_district?: string;

  agreement_id?: string;
  start_date?: string;
  end_date?: string;
  move_in_date?: string;
  move_in_checklist?: number;
  has_pending_proof?: boolean;

  leaseSignature?: string;
  has_signature_records?: boolean;
  tenant_sig?: string;
  landlord_sig?: string;

  landlord_id: string;
  landlord_name: string;

  landlord_contact: string;

  landlord_photo: string;
}
