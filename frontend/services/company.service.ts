import api from "./api";

export type Company = {
  id: number;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  country: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  street: string | null;
  number: string | null;
  district: string | null;
  complement: string | null;
};

export type UpdateCompanyPayload = Partial<
  Pick<
    Company,
    | "name"
    | "email"
    | "phone"
    | "website"
    | "country"
    | "city"
    | "state"
    | "zip_code"
    | "street"
    | "number"
    | "district"
    | "complement"
  >
>;

export async function getCompany(): Promise<Company> {
  const response = await api.get<{ data: Company }>("/company");
  return response.data.data;
}

export async function updateCompany(payload: UpdateCompanyPayload): Promise<Company> {
  const response = await api.patch<{ data: Company }>("/company", payload);
  return response.data.data;
}

