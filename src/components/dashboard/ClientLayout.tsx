import { Outlet } from "react-router-dom";
import { DashboardLayout } from "./DashboardLayout";

export const ClientLayout = () => {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

