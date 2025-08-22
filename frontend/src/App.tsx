// App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Header from "./components/Header";
import Home from "./pages/Home";
import Game from "./pages/Game";
import Login from "./pages/Login";
import FreePlay from "./pages/FreePlay";
import Profile from "./pages/Profile";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Header />
          <main className="flex-1 container mx-auto px-4 py-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/game/:mode" element={<Game />} />
              <Route path="/login" element={<Login />} />
              <Route path="/play" element={<FreePlay />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
