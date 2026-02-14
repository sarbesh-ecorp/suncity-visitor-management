import { Outlet } from "react-router-dom";
import TopBar from "./components/TopBar";
import Footer from "./components/Footer";

export default function PublicLayout() {
  return (
    <>
      <TopBar />
      <Outlet />
      <Footer />
    </>
  );
}
