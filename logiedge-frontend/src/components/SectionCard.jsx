import { Box, Card, CardContent, Stack, Typography } from '@mui/material'

export default function SectionCard({ title, subtitle, action, children, sx }) {
  return (
    <Card
      className="soft-border card-surface"
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'transform 180ms ease, box-shadow 180ms ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 20px 42px rgba(18,50,74,0.11)',
        },
        ...sx,
      }}
    >
      <Box sx={{ height: 3, background: 'linear-gradient(90deg, #0f4c81 0%, #2f7fbf 52%, #f59e0b 100%)' }} />
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={1}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {title}
              </Typography>
              {subtitle ? (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              ) : null}
            </Box>
            {action}
          </Stack>
          {children}
        </Stack>
      </CardContent>
    </Card>
  )
}
