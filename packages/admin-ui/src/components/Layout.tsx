import { Outlet } from "react-router-dom";
import { NavMenu } from "./NavMenu";

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* You can add a Header component here if needed */}
      {/* <header className="border-b p-4">
        <h1 className="text-xl font-semibold">ErrorHub Admin</h1>
      </header> */}
      <div className="flex flex-1">
        <aside className="w-64 border-r bg-muted/40 p-4 hidden md:block">
          <NavMenu />
        </aside>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
} 