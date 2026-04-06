import { Card, CardContent, Stack, Typography } from '@mui/material'

export default function StatCard({ label, value, helper, accent }) {
  return (
    <Card
      className="soft-border"
      sx={{
        borderRadius: 4,
        height: '100%',
        background: accent || 'rgba(255,255,255,0.9)',
      }}
    >
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.6 }}>
            {label}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {value}
          </Typography>
          {helper ? (
            <Typography variant="body2" color="text.secondary">
              {helper}
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  )
}
