import { Chip } from '@mui/material'

export default function LifecycleChip({ status }) {
  const normalized = String(status || 'active').toLowerCase()
  const active = normalized === 'active'

  return (
    <Chip
      size="small"
      label={active ? 'Active' : 'Inactive'}
      color={active ? 'success' : 'default'}
      variant={active ? 'filled' : 'outlined'}
      sx={{
        fontWeight: 800,
        ...(active
          ? {}
          : {
              borderColor: 'rgba(18,50,74,0.20)',
              color: 'text.secondary',
            }),
      }}
    />
  )
}
