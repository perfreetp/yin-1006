import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import StoreList from "@/pages/StoreList";
import MapSearch from "@/pages/MapSearch";
import OrderCreate from "@/pages/OrderCreate";
import OrderCenter from "@/pages/OrderCenter";
import PickupVerify from "@/pages/PickupVerify";
import StoreWorkbench from "@/pages/StoreWorkbench";
import ServiceCenter from "@/pages/ServiceCenter";
import AdminDashboard from "@/pages/AdminDashboard";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<StoreList />} />
          <Route path="/map" element={<MapSearch />} />
          <Route path="/order/create/:storeId" element={<OrderCreate />} />
          <Route path="/orders" element={<OrderCenter />} />
          <Route path="/orders/:id" element={<OrderCenter />} />
          <Route path="/pickup" element={<PickupVerify />} />
          <Route path="/store/workbench" element={<StoreWorkbench />} />
          <Route path="/service" element={<ServiceCenter />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
}
