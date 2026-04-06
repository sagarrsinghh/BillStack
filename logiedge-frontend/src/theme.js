import { createTheme } from '@mui/material/styles'

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0f4c81', dark: '#0a3559', light: '#2f7fbf' },
    secondary: { main: '#f59e0b' },
    background: { default: '#f4f7fb', paper: '#ffffff' },
    text: { primary: '#12324a', secondary: '#587089' },
    success: { main: '#15803d' },
    warning: { main: '#d97706' },
  },
  typography: {
    fontFamily: '"Manrope", "Segoe UI", sans-serif',
    h1: { fontFamily: '"Space Grotesk", "Manrope", sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Space Grotesk", "Manrope", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Space Grotesk", "Manrope", sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Space Grotesk", "Manrope", sans-serif', fontWeight: 700 },
    h5: { fontFamily: '"Space Grotesk", "Manrope", sans-serif', fontWeight: 700 },
    h6: { fontFamily: '"Space Grotesk", "Manrope", sans-serif', fontWeight: 700 },
  },
  shape: { borderRadius: 18 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 999,
          fontWeight: 700,
          paddingInline: 18,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
})
