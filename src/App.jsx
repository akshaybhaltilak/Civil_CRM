import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Projects from "./pages/Projects";
import ProjectDashboard from "./pages/ProjectDashboard";
import Workers from "./pages/Workers";
import Material from "./pages/Materials";
import Sites from "./pages/Sites";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDashboard />} />
        <Route path="/projects/:id/workers" element={<Workers />} />
        <Route path="/projects/:id/materials" element={<Material />} />
        <Route path="/projects/:id/clients" element={<Sites />} />
        
      
      </Routes>
    </Router>
  );
}

export default App;
