const ViewProfileSidebar = () => {
    return (
        <div className="relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-600 dark:bg-[#273142]">
            <div className="border-b border-slate-200 bg-gradient-to-br from-slate-100 to-white px-6 py-8 dark:border-slate-600 dark:from-slate-800 dark:to-[#273142]">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
                    SP
                </div>
                <h6 className="mb-0 mt-4 text-xl font-semibold text-neutral-900 dark:text-white">Perfil sem dados publicados</h6>
                <span className="mt-2 block text-sm text-neutral-500 dark:text-neutral-300">
                    Nenhuma informacao ficticia e exibida nesta lateral.
                </span>
            </div>
            <div className="space-y-4 p-6">
                <div className="rounded-xl border border-dashed border-neutral-300 px-4 py-4 dark:border-slate-600">
                    <h6 className="mb-2 text-base font-semibold text-neutral-800 dark:text-white">Resumo</h6>
                    <p className="text-sm text-neutral-500 dark:text-neutral-300">
                        Os dados reais deste perfil devem vir da autenticacao do usuario e da API.
                    </p>
                </div>
                <div className="rounded-xl bg-neutral-50 px-4 py-4 dark:bg-slate-800/40">
                    <ul className="space-y-3 text-sm">
                        <li className="flex items-center justify-between gap-3">
                            <span className="font-semibold text-neutral-700 dark:text-neutral-200">Nome</span>
                            <span className="text-neutral-500 dark:text-neutral-300">Nao informado</span>
                        </li>
                        <li className="flex items-center justify-between gap-3">
                            <span className="font-semibold text-neutral-700 dark:text-neutral-200">E-mail</span>
                            <span className="text-neutral-500 dark:text-neutral-300">Nao informado</span>
                        </li>
                        <li className="flex items-center justify-between gap-3">
                            <span className="font-semibold text-neutral-700 dark:text-neutral-200">Celular</span>
                            <span className="text-neutral-500 dark:text-neutral-300">Nao informado</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ViewProfileSidebar;
