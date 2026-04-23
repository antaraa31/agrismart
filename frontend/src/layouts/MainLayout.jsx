import { Outlet } from 'react-router-dom';
import TopNavbar from './TopNavbar';

export default function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-x-hidden">
      <TopNavbar />
      <main className="flex-1 w-full flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
