import AuthGuard from "./components/AuthGuard";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <AuthGuard>
      <AppRoutes />
    </AuthGuard>
  );
}

export default App;
