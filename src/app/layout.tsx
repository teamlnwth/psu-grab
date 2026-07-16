import type { Metadata } from "next";
import { Inter, Prompt } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const prompt = Prompt({
  variable: "--font-prompt",
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["thai"],
});

export const metadata: Metadata = {
  title: "PSU Grab 🛵 - บริการสั่งอาหารและเรียกรถในวิทยาเขต ม.อ.",
  description: "บริการสั่งอาหารและเรียกรถรับส่งสำหรับนักศึกษาและบุคลากร ม.อ. รวดเร็ว ปลอดภัย ตลอด 24 ชม.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${prompt.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
