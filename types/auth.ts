export type SignInAccountType = "person" | "business";

export interface PersonSignInProfile {
  account_type: "person";
  full_name: string;
  email: string;
  phone_number: string;
}

export interface BusinessSignInProfile {
  account_type: "business";
  company_name: string;
  ruc: string;
  dv: string;
  contact_person_name: string;
  email: string;
  phone_number: string;
}

export type SignInProfile = PersonSignInProfile | BusinessSignInProfile;
