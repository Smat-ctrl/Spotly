import SideBar from "./SideBar";

export default function MainLayout({
  children,
  disableVerticalScroll = false,
}: {
  children: React.ReactNode;
  disableVerticalScroll?: boolean;
}) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <SideBar />
      <main
        className={`w-full min-w-0 pl-[80px] box-border ${
          disableVerticalScroll ? "h-screen overflow-hidden" : ""
        }`}
      >
        {children}
      </main>
    </div>
  );
}
