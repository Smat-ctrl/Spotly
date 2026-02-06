export default function SideBar() {
  return (
    <aside className="fixed left-0 top-0 w-[96px] h-screen bg-white border-r">
      <div className="h-full flex flex-col items-center pt-5">
        {/* Logo */}
        <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">
          C
        </div>

        {/* Main nav icons */}
        <div className="mt-8 mx-5 flex flex-col items-center gap-6">
          <div className="w-10 h-10 rounded-xl bg-gray-300" />
          <div className="w-10 h-10 rounded-xl bg-gray-300" />
          <div className="w-10 h-10 rounded-xl bg-gray-300" />
          <div className="w-10 h-10 rounded-xl bg-gray-300" />
        </div>

        {/* Push bottom icons down */}
        <div className="mt-auto pb-6 flex flex-col items-center gap-6">
          <div className="w-10 h-10 rounded-xl bg-gray-300" />
          <div className="w-10 h-10 rounded-xl bg-gray-300" />
        </div>
      </div>
    </aside>
  );
}
