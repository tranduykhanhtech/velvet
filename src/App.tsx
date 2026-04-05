import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Gallery } from "./pages/Gallery";
import { MyFavorites } from "./pages/MyFavorites";
import { RecipeDetail } from "./pages/RecipeDetail";
import { Auth } from "./pages/Auth";

// Studio
import { AdminRoute } from "./components/AdminRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { StudioLayout } from "./components/StudioLayout";
import { StudioDashboard } from "./pages/studio/Dashboard";
import { RecipeList } from "./pages/studio/RecipeList";
import { StudioAddRecipe } from "./pages/studio/StudioAddRecipe";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="recipe/:id" element={<RecipeDetail />} />
          <Route path="auth" element={<Auth />} />
          
          {/* User Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="favorites" element={<MyFavorites />} />
          </Route>
        </Route>

        <Route path="/studio" element={<AdminRoute />}>
          <Route element={<StudioLayout />}>
            <Route index element={<StudioDashboard />} />
            <Route path="recipes" element={<RecipeList />} />
            <Route path="add" element={<StudioAddRecipe />} />
            <Route path="edit/:id" element={<StudioAddRecipe />} />
            <Route path="settings" element={<div>Settings Placeholder</div>} />
          </Route>
        </Route>

        <Route path="/submit" element={<Navigate to="/studio/add" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
