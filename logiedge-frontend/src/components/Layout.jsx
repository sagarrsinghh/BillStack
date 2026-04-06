import {
  AppBar,
  Box,
  Container,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'
import { useAppData } from '../context/AppDataContext'

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: <DashboardRoundedIcon fontSize="small" /> },
  { label: 'Masters', to: '/masters', icon: <PeopleAltRoundedIcon fontSize="small" /> },
  { label: 'Billing', to: '/billing', icon: <PaymentsRoundedIcon fontSize="small" /> },
  { label: 'Invoices', to: '/invoices', icon: <ReceiptLongRoundedIcon fontSize="small" /> },
]

export default function Layout() {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopExpanded, setDesktopExpanded] = useState(true)
  const location = useLocation()
  const expandedWidth = 320
  const collapsedWidth = 88
  const drawerWidth = isDesktop ? (desktopExpanded ? expandedWidth : collapsedWidth) : expandedWidth

  const drawer = (
    <Box sx={{ width: drawerWidth, p: 2.25 }}>
        <Stack spacing={2.2}>
          <Box
            sx={{
              p: 2.1,
              borderRadius: 2,
              border: '1px solid rgba(18,50,74,0.08)',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(244,247,251,0.92))',
              boxShadow: '0 14px 32px rgba(18,50,74,0.06)',
              overflow: 'hidden',
            }}
          >
            {desktopExpanded || !isDesktop ? (
              <>
                <Typography
                  variant="overline"
                  sx={{
                    letterSpacing: 2,
                    color: 'primary.main',
                    fontWeight: 800,
                  }}
                >
                  LogiEdge
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.02, mt: 0.5 }}>
                  Billing Dashboard
                </Typography>
              </>
            ) : (
              <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 84 }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main' }}>
                  L
                </Typography>
              </Box>
            )}
          </Box>

          <List disablePadding>
            {navItems.map((item) => (
              <ListItemButton
                key={item.to}
                component={NavLink}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                sx={{
                  mb: 0.75,
                  py: 1.1,
                  px: desktopExpanded || !isDesktop ? 1.5 : 1.1,
                  borderRadius: 2,
                  transition: 'all 180ms ease',
                  justifyContent: desktopExpanded || !isDesktop ? 'flex-start' : 'center',
                  '&.active': {
                    background: 'linear-gradient(135deg, rgba(15,76,129,0.16), rgba(245,158,11,0.12))',
                    color: 'primary.dark',
                    boxShadow: '0 12px 28px rgba(15,76,129,0.10)',
                  },
                  '&:hover': {
                    transform: 'translateX(2px)',
                    backgroundColor: 'rgba(15,76,129,0.04)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>{item.icon}</ListItemIcon>
                {desktopExpanded || !isDesktop ? (
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 700 }} />
                ) : null}
              </ListItemButton>
            ))}
          </List>
        </Stack>
      </Box>
  )

  return (
    <Box className="app-shell">
        <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backdropFilter: 'blur(20px)',
          background:
            'linear-gradient(90deg, rgba(246,249,253,0.92) 0%, rgba(251,253,255,0.88) 55%, rgba(244,248,252,0.90) 100%)',
          color: 'text.primary',
          borderBottom: '1px solid rgba(18,50,74,0.08)',
          boxShadow: '0 12px 28px rgba(18,50,74,0.05)',
          ...(isDesktop
            ? {
                width: `calc(100% - ${drawerWidth}px)`,
                ml: `${drawerWidth}px`,
              }
            : {}),
        }}
      >
        <Toolbar sx={{ gap: 2, minHeight: 74 }}>
          <IconButton
            edge="start"
            onClick={() => {
              if (isDesktop) {
                setDesktopExpanded((value) => !value)
              } else {
                setMobileOpen((value) => !value)
              }
            }}
            sx={{ mr: 0.5 }}
          >
            {isDesktop ? (
              desktopExpanded ? (
                <ChevronLeftRoundedIcon />
              ) : (
                <ChevronRightRoundedIcon />
              )
            ) : mobileOpen ? (
              <CloseRoundedIcon />
            ) : (
              <MenuRoundedIcon />
            )}
          </IconButton>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flex: 1,
              minWidth: 0,
            }}
          >
            <Box sx={{ display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  color: '#fff',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #0f4c81 0%, #1f6aa8 48%, #f59e0b 100%)',
                  boxShadow: '0 10px 24px rgba(15,76,129,0.18)',
                }}
              >
                L
              </Box>
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ lineHeight: 1.1 }}>
                LogiEdge Billing Dashboard
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  textTransform: 'capitalize',
                  fontSize: 13,
                  letterSpacing: 0.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {location.pathname.replace('/', '') || 'dashboard'}
              </Typography>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Box>
        {isDesktop ? (
          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
                overflowX: 'hidden',
                background: 'rgba(255,255,255,0.94)',
                backdropFilter: 'blur(22px)',
                borderRight: '1px solid rgba(18,50,74,0.08)',
                transition: theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
              },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            PaperProps={{
              sx: {
                width: expandedWidth,
                background: 'rgba(255,255,255,0.96)',
                backdropFilter: 'blur(22px)',
              },
            }}
          >
            {drawer}
          </Drawer>
        )}

        <Box
          component="main"
          sx={{
            p: { xs: 2, md: 4 },
            ml: isDesktop ? `${drawerWidth}px` : 0,
            width: isDesktop ? `calc(100% - ${drawerWidth}px)` : '100%',
            transition: theme.transitions.create(['margin-left', 'width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.shorter,
            }),
          }}
        >
          <Container maxWidth="xl" disableGutters>
            <Outlet />
          </Container>
        </Box>
      </Box>
    </Box>
  )
}
