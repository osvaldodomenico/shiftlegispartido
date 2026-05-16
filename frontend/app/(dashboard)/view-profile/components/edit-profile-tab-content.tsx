'use client';

import React, { useActionState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import AvatarUpload from './avatar-upload';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
    handleProfileUpdate,
    ProfileActionState,
} from './actions/handleProfileUpdate';

const initialState: ProfileActionState = {
    success: false,
    message: "",
};

const EditProfileTabContent = () => {
    const [state, formAction, isPending] = useActionState(
        handleProfileUpdate,
        initialState
    );

    useEffect(() => {
        if (state.message) {
            if (state.success) {
                toast.success(state.message);
            } else {
                toast.error(state.message);
            }
        }
    }, [state]);

    return (
        <div>
            <h6 className="mb-4 text-base text-neutral-600 dark:text-neutral-200">Imagem do perfil</h6>
            <div className="mb-6 mt-4">
                <AvatarUpload />
            </div>

            <form action={formAction}>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-x-6">
                    <div className="col-span-12 sm:col-span-6">
                        <div className="mb-5">
                            <Label htmlFor="name" className="inline-block font-semibold text-neutral-600 dark:text-neutral-200 text-sm mb-2">
                                Nome completo <span className="text-red-600">*</span>
                            </Label>
                            <Input name="name" type="text" id="name" placeholder="Informe o nome completo" required />
                        </div>
                    </div>
                    <div className="col-span-12 sm:col-span-6">
                        <div className="mb-5">
                            <Label htmlFor="email" className="inline-block font-semibold text-neutral-600 dark:text-neutral-200 text-sm mb-2">
                                E-mail <span className="text-red-600">*</span>
                            </Label>
                            <Input name="email" type="email" id="email" placeholder="Informe o e-mail" preserveCase required />
                        </div>
                    </div>
                    <div className="col-span-12 sm:col-span-6">
                        <div className="mb-5">
                            <Label htmlFor="number" className="inline-block font-semibold text-neutral-600 dark:text-neutral-200 text-sm mb-2">Celular</Label>
                            <Input name="number" type="tel" id="number" mask="phone" placeholder="(99) 99999-9999" />
                        </div>
                    </div>
                    <div className="col-span-12 sm:col-span-6">
                        <div className="mb-5">
                            <Label htmlFor="department" className="inline-block font-semibold text-neutral-600 dark:text-neutral-200 text-sm mb-2">Departamento</Label>
                            <Input name="department" id="department" placeholder="Informe o departamento" />
                        </div>
                    </div>
                    <div className="col-span-12 sm:col-span-6">
                        <div className="mb-5">
                            <Label htmlFor="designation" className="inline-block font-semibold text-neutral-600 dark:text-neutral-200 text-sm mb-2">Cargo</Label>
                            <Input name="designation" id="designation" placeholder="Informe o cargo" />
                        </div>
                    </div>
                    <div className="col-span-12 sm:col-span-6">
                        <div className="mb-5">
                            <Label htmlFor="language" className="inline-block font-semibold text-neutral-600 dark:text-neutral-200 text-sm mb-2">Idioma</Label>
                            <Input name="language" id="language" placeholder="Informe o idioma" />
                        </div>
                    </div>
                    <div className="col-span-12">
                        <div className="mb-5">
                            <Label htmlFor="desc" className="inline-block font-semibold text-neutral-600 dark:text-neutral-200 text-sm mb-2">Descrição</Label>
                            <Textarea name="desc" id="desc" placeholder="Descreva informações complementares" />
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-3">
                    <Button type="reset" variant="outline" className="h-[48px] border border-red-600 bg-transparent hover:bg-red-600/20 text-red-600 text-base px-14 py-[11px] rounded-lg">
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isPending} className="h-[48px] text-base px-14 py-3 rounded-lg">
                        {isPending ? "Salvando..." : "Salvar"}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default EditProfileTabContent;
