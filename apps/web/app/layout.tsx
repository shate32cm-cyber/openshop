import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "日常好物 · 把日子过成喜欢的样子",
  description: "为日常挑选有温度的生活好物。",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
