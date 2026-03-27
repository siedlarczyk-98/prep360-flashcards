import { Outlet } from "react-router-dom";
import NavigationRail from "./NavigationRail";

const AppLayout = () => {
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      <NavigationRail />
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain -webkit-overflow-scrolling-touch">
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;
