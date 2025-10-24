import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import 'leaflet/dist/leaflet.css';


import Home from "./pages/Home";
import FindWorker from "./pages/FindWorker";
import UserDashboard from "./pages/Userdashboard";
import WorkerDashboard from "./pages/WorkerDashboard";

function ScrollRestoration() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function App() {
  return (
    <>
      <ScrollRestoration />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/find-worker" element={<FindWorker />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/worker-dashboard" element={<WorkerDashboard />} />
      </Routes>
    </>
  );
}

export default App;
