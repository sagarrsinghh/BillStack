import { Box, Chip, Stack, Typography } from '@mui/material'

export default function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <Box
      sx={{
        mb: 3,
        p: { xs: 2, md: 2.5 },
        borderRadius: 2,
        border: '1px solid rgba(18,50,74,0.06)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.94), rgba(248,250,255,0.78))',
        boxShadow: '0 12px 32px rgba(18,50,74,0.06)',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', md: 'flex-end' }}
        justifyContent="space-between"
      >
        <Box>
          {eyebrow ? (
            <Chip
              label={eyebrow}
              size="small"
              sx={{
                mb: 1.2,
                fontWeight: 800,
                letterSpacing: 1,
                backgroundColor: 'rgba(15,76,129,0.08)',
                color: 'primary.dark',
                borderRadius: 1.25,
              }}
            />
          ) : null}
          <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.05 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1.1, maxWidth: 900 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {action}
      </Stack>
    </Box>
  )
}
