export type AccountType = "person" | "business";

export interface Address {
  line1: string;
  line2?: string;
  province: string;
  district: string;
  corregimiento?: string;
  postal_code?: string;
}

export interface UserProfileBase {
  id: string;
  email: string;
  phone_number: string;
  account_type: AccountType;
  marketing_opt_in_sms: boolean;
  marketing_opt_in_email: boolean;
}

/** "Atleta" persona — an individual retail shopper. */
export interface PersonProfile extends UserProfileBase {
  account_type: "person";
  full_name: string;
  default_address: Address;
}

/** "Equipo" persona — a B2B buyer registered under Panamanian tax law. */
export interface BusinessProfile extends UserProfileBase {
  account_type: "business";
  /** Razón Social */
  company_name: string;
  /** Registro Único de Contribuyente */
  ruc: string;
  /** Dígito Verificador */
  dv: string;
  contact_person_name: string;
  province_district: string;
}

export type UserProfile = PersonProfile | BusinessProfile;

export function isBusinessProfile(profile: UserProfile): profile is BusinessProfile {
  return profile.account_type === "business";
}

export function isPersonProfile(profile: UserProfile): profile is PersonProfile {
  return profile.account_type === "person";
}
