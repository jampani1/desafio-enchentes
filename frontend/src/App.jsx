import { BrowserRouter } from "react-router-dom"
import { AuthProvider } from "@/context/AuthContext"
import { CatalogoProvider } from "@/context/CatalogoContext"
import { AppRouter } from "@/routes/AppRouter"
import { Toaster } from "@/components/ui/sonner"

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CatalogoProvider>
          <AppRouter />
          <Toaster richColors closeButton position="top-right" />
        </CatalogoProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
