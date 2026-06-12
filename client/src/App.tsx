import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { HomePage } from "./pages/HomePage.js";
import { JoinPage } from "./pages/JoinPage.js";
import { PlayPage } from "./pages/PlayPage.js";
import { AdminPage } from "./pages/AdminPage.js";

export function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/play/:code" element={<PlayPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
