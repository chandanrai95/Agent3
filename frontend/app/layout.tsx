import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import BaseLayout from "@/components/base_layout";
import { ToastContainer } from "react-toastify";
import { verifyTokenApi } from "@/lib/api/server_auth";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
    <html lang="en" className="dark">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
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
