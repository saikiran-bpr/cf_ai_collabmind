import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { Document } from "./pages/Document";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/doc/:docId" element={<Document />} />
      </Routes>
    </BrowserRouter>
  );
}
