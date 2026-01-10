import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { CustomerPortalProvider } from "@/contexts/CustomerPortalContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "react-hot-toast";
import ChatbotProvider from "@/components/chatbot/ChatbotProvider";

export const metadata: Metadata = {
  title: "Uruti Lending Platform",
  description: "Comprehensive loan management system",
  // Favicon will be handled by Next.js automatically if icon.ico exists in app directory
  // or can be added to public directory
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <CustomerPortalProvider>
                {children}
                <ChatbotProvider />
                <Toaster position="top-right" />
              </CustomerPortalProvider>
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
