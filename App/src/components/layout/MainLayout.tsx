import SideBar from "./SideBar";
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <SideBar />
      <main className="w-full pl-[96px]">
        <div className="mx-auto max-w px-6">{children}</div>
      </main>
    </div>
  );
}
