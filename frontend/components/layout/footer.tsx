const Footer = () => {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur-sm dark:border-slate-700 dark:bg-[#273142]/95 md:px-6">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-center text-center">
        <p className="text-[11px] text-neutral-700 dark:text-neutral-100 md:text-xs">
          ShiftWorks Tecnologia e Marketing do Brasil. 2026 | CNPJ
          {" "}65.693.427/0001-68
        </p>
      </div>
    </footer>
  );
};

export default Footer;
