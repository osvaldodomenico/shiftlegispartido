import Footer from "@/components/layout/footer";
import { LoadingProvider } from "@/contexts/LoadingContext";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shift Legis - Partido",
  description: "Plataforma de gestão do diretório com foco operacional, financeiro e administrativo.",
  metadataBase: new URL("http://localhost:3001"),
  openGraph: {
    title: "Shift Legis - Partido",
    description: "Plataforma de gestão do diretório com foco operacional, financeiro e administrativo.",
    url: "http://localhost:3001",
    siteName: "Shift Legis - Partido",
    images: [
      {
        url: "http://localhost:3001/logo-light.png",
        width: 1200,
        height: 630,
        alt: "Shift Legis - Partido",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shift Legis - Partido",
    description: "Plataforma de gestão do diretório com foco operacional, financeiro e administrativo.",
    images: ["http://localhost:3001/logo-light.png"],
  },
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased pb-16">
        <LoadingProvider>
          {children}
          <Footer />
        </LoadingProvider>
      </body>
    </html>
  );
}
