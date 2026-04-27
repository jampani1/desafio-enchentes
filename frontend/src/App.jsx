import { BrowserRouter } from "react-router-dom"
import { AuthProvider } from "@/context/AuthContext"
import { AppRouter } from "@/routes/AppRouter"
import { Toaster } from "@/components/ui/sonner"

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster richColors closeButton position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
