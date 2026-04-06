import { Chip } from '@mui/material'

export default function StatusChip({ registered }) {
  return (
    <Chip
      size="small"
      label={registered ? 'GST registered' : 'GST not registered'}
      color={registered ? 'success' : 'warning'}
      variant={registered ? 'filled' : 'outlined'}
      sx={{ fontWeight: 700 }}
    />
  )
}
