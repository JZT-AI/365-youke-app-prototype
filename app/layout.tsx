import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI有客 APP 全量交互原型",
  description: "从登录入驻到客户、消息、有客币与个人中心的完整交互原型。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
