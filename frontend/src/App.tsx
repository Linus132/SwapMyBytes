import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoutes";
import Home from "./Views/Home/Home";
import Register from "./Views/Register/Register";
import Login from "./Views/Login/Login";
import Files from "./Views/Files/Files";
import Trending from "./Views/Trending/Trending";
import AppLayout from "./Views/AppLayout/AppLayout";

function App() {
  return (
    <Router>
      <div className="App">
        <div>
          <AppLayout>
            <Routes>
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trending"
                element={<ProtectedRoute> <Trending /></ProtectedRoute>}
              />
              <Route
                path="/files"
                element={
                  <ProtectedRoute>
                    <Files />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AppLayout>
        </div>
      </div>
    </Router>
  );
}

export default App;
