import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import BaseLayout from "@/components/base_layout";
import { ToastContainer } from "react-toastify";
import { verifyTokenApi } from "@/lib/api/server_auth";
import { ICON_FONT_URL } from "@/components/ui/icon-names";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent3",
  description: "Build AI agents that answer from your documents",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode,
}>) {

  let user
  try {
    user = await verifyTokenApi()
  } catch (err) {
    console.error('verify token error', err)
  }

  return (
    // font variables live on <html> so the Tailwind theme (declared on :root) can read them
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link
          href={ICON_FONT_URL}
          rel="stylesheet"
        />
      </head>
      <body
        className="antialiased"
      >
        <BaseLayout
          user={user}
        >
          {children}
        </BaseLayout>
        <ToastContainer theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
