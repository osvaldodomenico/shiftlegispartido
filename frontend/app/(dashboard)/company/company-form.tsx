"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCompany, updateCompany } from "@/services/company.service";

type FormState = {
  name: string;
  email: string;
  phone: string;
  website: string;
  country: string;
  zip_code: string;
  street: string;
  number: string;
  district: string;
  complement: string;
  city: string;
  state: string;
};

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  complemento?: string;
  localidade?: string;
  uf?: string;
};

const BRAZIL_UF = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
] as const;

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  website: "",
  country: "BRASIL",
  zip_code: "",
  street: "",
  number: "",
  district: "",
  complement: "",
  city: "",
  state: "",
};

export default function CompanyForm() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<FormState>(EMPTY_FORM);
  const [isPending, setIsPending] = useState(false);
  const [lastCepLookup, setLastCepLookup] = useState<string>("");

  useEffect(() => {
    getCompany()
      .then((company) => {
        const next: FormState = {
          name: company.name ?? "",
          email: company.email ?? "",
          phone: company.phone ?? "",
          website: company.website ?? "",
          country: company.country ?? "BRASIL",
          zip_code: company.zip_code ?? "",
          street: company.street ?? "",
          number: company.number ?? "",
          district: company.district ?? "",
          complement: company.complement ?? "",
          city: company.city ?? "",
          state: company.state ?? "",
        };
        setForm(next);
        setInitialForm(next);
      })
      .catch(() => {});
  }, []);

  const cepDigits = useMemo(() => form.zip_code.replace(/\D/g, ""), [form.zip_code]);

  useEffect(() => {
    if (cepDigits.length !== 8) return;
    if (cepDigits === lastCepLookup) return;
    if (form.country && form.country !== "BRASIL") return;

    setLastCepLookup(cepDigits);

    fetch(`https://viacep.com.br/ws/${cepDigits}/json/`)
      .then((res) => res.json())
      .then((data: ViaCepResponse) => {
        if (data?.erro) {
          toast.error("CEP não encontrado.");
          return;
        }

        setForm((prev) => ({
          ...prev,
          street: data?.logradouro ?? prev.street,
          number: prev.number || "S/N",
          district: data?.bairro ?? prev.district,
          complement: data?.complemento ?? prev.complement,
          city: data?.localidade ?? prev.city,
          state: data?.uf ?? prev.state,
        }));
      })
      .catch(() => {
        toast.error("Não foi possível consultar o CEP.");
      });
  }, [cepDigits, form.country, lastCepLookup]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Informe o nome do diretório.");
      return;
    }

    if (!form.email.trim()) {
      toast.error("Informe o e-mail institucional.");
      return;
    }

    setIsPending(true);
    try {
      await updateCompany({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        website: form.website.trim() || undefined,
        country: form.country.trim() || undefined,
        zip_code: form.zip_code.trim() || undefined,
        street: form.street.trim() || undefined,
        number: form.number.trim() || undefined,
        district: form.district.trim() || undefined,
        complement: form.complement.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
      });
      toast.success("Dados da empresa salvos com sucesso.");
      setInitialForm(form);
    } catch (err: unknown) {
      const apiMessage =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message;
      const message = Array.isArray(apiMessage)
        ? apiMessage.join(", ")
        : (apiMessage ?? "Erro ao salvar os dados da empresa.");
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-x-5 md:grid-cols-2">
        <div className="mb-5">
          <Label htmlFor="name" className="mb-2 block text-sm font-semibold text-neutral-900 dark:text-white">
            Nome do diretório <span className="text-red-600">*</span>
          </Label>
          <Input
            type="text"
            id="name"
            placeholder="Informe o nome institucional"
            className="h-12 rounded-lg border border-neutral-300 px-5 !shadow-none !ring-0 focus:border-primary focus-visible:border-primary dark:border-slate-500 dark:focus:border-primary"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
          />
        </div>
        <div className="mb-5">
          <Label htmlFor="email" className="mb-2 block text-sm font-semibold text-neutral-900 dark:text-white">
            E-mail <span className="text-red-600">*</span>
          </Label>
          <Input
            type="email"
            id="email"
            placeholder="Informe o e-mail institucional"
            preserveCase
            className="h-12 rounded-lg border border-neutral-300 px-5 !shadow-none !ring-0 focus:border-primary focus-visible:border-primary dark:border-slate-500 dark:focus:border-primary"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            required
          />
        </div>
        <div className="mb-5">
          <Label htmlFor="phone" className="mb-2 block text-sm font-semibold text-neutral-900 dark:text-white">
            Celular
          </Label>
          <Input
            type="tel"
            id="phone"
            mask="phone"
            placeholder="(99) 99999-9999"
            className="h-12 rounded-lg border border-neutral-300 px-5 !shadow-none !ring-0 focus:border-primary focus-visible:border-primary dark:border-slate-500 dark:focus:border-primary"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
        <div className="mb-5">
          <Label htmlFor="website" className="mb-2 block text-sm font-semibold text-neutral-900 dark:text-white">
            Site
          </Label>
          <Input
            type="url"
            id="website"
            preserveCase
            placeholder="https://SITE-OFICIAL.COM.BR"
            className="h-12 rounded-lg border border-neutral-300 px-5 !shadow-none !ring-0 focus:border-primary focus-visible:border-primary dark:border-slate-500 dark:focus:border-primary"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
          />
        </div>
        <div className="mb-5">
          <Label htmlFor="country" className="mb-2 block text-sm font-semibold text-neutral-900 dark:text-white">
            País <span className="text-red-600">*</span>
          </Label>
          <Select value={form.country} onValueChange={(v) => set("country", v)}>
            <SelectTrigger id="country" className="!h-[48px] !w-full !rounded-lg border border-neutral-300 px-5 !shadow-none !ring-0 focus:border-primary focus-visible:border-primary dark:border-slate-500 dark:focus:border-primary">
              <SelectValue placeholder="Selecione o país" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRASIL">BRASIL</SelectItem>
              <SelectItem value="ARGENTINA">ARGENTINA</SelectItem>
              <SelectItem value="PARAGUAI">PARAGUAI</SelectItem>
              <SelectItem value="URUGUAI">URUGUAI</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mb-5">
          <Label htmlFor="zip_code" className="mb-2 block text-sm font-semibold text-neutral-900 dark:text-white">
            CEP <span className="text-red-600">*</span>
          </Label>
          <Input
            type="text"
            id="zip_code"
            mask="cep"
            placeholder="99999-999"
            className="h-12 rounded-lg border border-neutral-300 px-5 !shadow-none !ring-0 focus:border-primary focus-visible:border-primary dark:border-slate-500 dark:focus:border-primary"
            value={form.zip_code}
            onChange={(e) => set("zip_code", e.target.value)}
            required
          />
        </div>
        <div className="mb-5">
          <Label htmlFor="street" className="mb-2 block text-sm font-semibold text-neutral-900 dark:text-white">
            Logradouro <span className="text-red-600">*</span>
          </Label>
          <Input
            type="text"
            id="street"
            placeholder="Ex: Rua, Avenida..."
            className="h-12 rounded-lg border border-neutral-300 px-5 !shadow-none !ring-0 focus:border-primary focus-visible:border-primary dark:border-slate-500 dark:focus:border-primary"
            value={form.street}
            onChange={(e) => set("street", e.target.value)}
            required
          />
        </div>
        <div className="mb-5">
          <Label htmlFor="number" className="mb-2 block text-sm font-semibold text-neutral-900 dark:text-white">
            Número <span className="text-red-600">*</span>
          </Label>
          <Input
            type="text"
            id="number"
            placeholder="Ex: 123"
            className="h-12 rounded-lg border border-neutral-300 px-5 !shadow-none !ring-0 focus:border-primary focus-visible:border-primary dark:border-slate-500 dark:focus:border-primary"
            value={form.number}
            onChange={(e) => set("number", e.target.value)}
            required
          />
        </div>
        <div className="mb-5">
          <Label htmlFor="district" className="mb-2 block text-sm font-semibold text-neutral-900 dark:text-white">
            Bairro <span className="text-red-600">*</span>
          </Label>
          <Input
            type="text"
            id="district"
            placeholder="Informe o bairro"
            className="h-12 rounded-lg border border-neutral-300 px-5 !shadow-none !ring-0 focus:border-primary focus-visible:border-primary dark:border-slate-500 dark:focus:border-primary"
            value={form.district}
            onChange={(e) => set("district", e.target.value)}
            required
          />
        </div>
        <div className="mb-5">
          <Label htmlFor="complement" className="mb-2 block text-sm font-semibold text-neutral-900 dark:text-white">
            Complemento
          </Label>
          <Input
            type="text"
            id="complement"
            placeholder="Apto, bloco, sala..."
            className="h-12 rounded-lg border border-neutral-300 px-5 !shadow-none !ring-0 focus:border-primary focus-visible:border-primary dark:border-slate-500 dark:focus:border-primary"
            value={form.complement}
            onChange={(e) => set("complement", e.target.value)}
          />
        </div>
        <div className="mb-5">
          <Label htmlFor="city" className="mb-2 block text-sm font-semibold text-neutral-900 dark:text-white">
            Cidade <span className="text-red-600">*</span>
          </Label>
          <Input
            type="text"
            id="city"
            placeholder="Informe a cidade"
            className="h-12 rounded-lg border border-neutral-300 px-5 !shadow-none !ring-0 focus:border-primary focus-visible:border-primary dark:border-slate-500 dark:focus:border-primary"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            required
          />
        </div>
        <div className="mb-5">
          <Label htmlFor="state" className="mb-2 block text-sm font-semibold text-neutral-900 dark:text-white">
            UF <span className="text-red-600">*</span>
          </Label>
          <Select value={form.state} onValueChange={(v) => set("state", v)}>
            <SelectTrigger
              id="state"
              className="!h-[48px] !w-full !rounded-lg border border-neutral-300 px-5 !shadow-none !ring-0 focus:border-primary focus-visible:border-primary dark:border-slate-500 dark:focus:border-primary"
            >
              <SelectValue placeholder="Selecione a UF" />
            </SelectTrigger>
            <SelectContent>
              {BRAZIL_UF.map((uf) => (
                <SelectItem key={uf.value} value={uf.value}>
                  {uf.value} - {uf.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 mt-6 flex items-center justify-center gap-3">
          <Button
            type="reset"
            className="h-[48px] rounded-lg border border-red-600 bg-transparent px-14 py-[11px] text-base text-red-600 hover:bg-red-600/20 dark:hover:bg-red-600/20"
            onClick={() => setForm(initialForm)}
          >
            Limpar
          </Button>
          <Button type="submit" disabled={isPending} className="h-[48px] rounded-lg px-14 py-3 text-base">
            {isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </div>
    </form>
  );
}
