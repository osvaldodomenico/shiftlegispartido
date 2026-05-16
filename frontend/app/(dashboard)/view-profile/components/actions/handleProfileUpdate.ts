'use server';

export type ProfileActionState = {
  success: boolean
  message: string
}

export async function handleProfileUpdate(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const name = formData.get('name');
  const email = formData.get('email');
  const phone = formData.get('number');
  const department = formData.get('department');
  const designation = formData.get('designation');
  const language = formData.get('language');
  const description = formData.get('desc');

  void name;
  void email;
  void phone;
  void department;
  void designation;
  void language;
  void description;

  return {
    success: true,
    message: 'Perfil atualizado com sucesso.',
  };
}
