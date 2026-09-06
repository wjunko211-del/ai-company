import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Company",
  description: "Claude APIで動くAI社員と対話できる社内ダッシュボード",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
