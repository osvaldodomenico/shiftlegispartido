import LoginForm from "@/components/auth/login-form";
import AuthImage from "@/public/assets/images/auth/auth-img.png";
import { StaticImg } from "@/types/static-image";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Entrar | ShiftLegis Partido",
  description:
    "Acesse a plataforma ShiftLegis Partido com seu e-mail e senha.",
};

const forgotPassImage: StaticImg = {
  image: AuthImage,
};

const Login = () => {
  return (
    <section className="bg-white dark:bg-slate-900 flex flex-wrap min-h-screen">
      {/* Left Image */}
      <div className="lg:w-1/2 hidden lg:block">
        <div className="flex items-center justify-center h-screen flex-col">
          <Image
            src={forgotPassImage.image}
            alt="Ilustração de autenticação"
            className="object-cover w-full h-full"
          />
        </div>
      </div>

      {/* Right Form */}
      <div className="lg:w-1/2 w-full py-8 px-6 flex flex-col justify-center">
        <div className="lg:max-w-[464px] w-full mx-auto">
          {/* Logo and heading */}
          <div>
            <h4 className="font-semibold mb-3">Entrar na plataforma</h4>
            <p className="mb-8 text-neutral-500 dark:text-neutral-300 text-lg">
              Digite seus dados de acesso para acessar o ShiftLegis Partido
            </p>
          </div>

          {/* Login Form */}
          <LoginForm />
        </div>
      </div>
    </section>
  );
};

export default Login;
