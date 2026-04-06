import { Navigate, Route, Routes } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { AppDataProvider } from './context/AppDataContext'
import { appTheme } from './theme'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import MastersPage from './pages/MastersPage'
import BillingPage from './pages/BillingPage'
import InvoicesPage from './pages/InvoicesPage'

export default function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AppDataProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/masters" element={<MastersPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
          </Route>
        </Routes>
      </AppDataProvider>
    </ThemeProvider>
  )
}
