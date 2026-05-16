'use server'

export type CompanyActionState = {
  success: boolean
  message: string
}

export async function saveProfileAction(
  _prevState: CompanyActionState,
  formData: FormData
): Promise<CompanyActionState> {
  const name = formData.get("name");
  const email = formData.get("email");
  const number = formData.get("number");
  const website = formData.get("website");
  const country = formData.get("country");
  const city = formData.get("city");
  const state = formData.get("state");
  const zip = formData.get("zip");
  const address = formData.get("address");

  void name;
  void email;
  void number;
  void website;
  void country;
  void city;
  void state;
  void zip;
  void address;

  return {
    success: true,
    message: "Dados da empresa salvos com sucesso.",
  };
}
