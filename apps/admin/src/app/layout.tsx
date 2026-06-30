export const metadata = { title: "Vyntro Sports — Admin" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body style={{ background: "#0a0a0f", color: "#f5f5f7" }}>{children}</body>
    </html>
  );
}
