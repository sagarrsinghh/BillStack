import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { useEffect, useMemo, useState } from 'react'
import Grid from '@mui/material/GridLegacy'
import { useAppData } from '../context/AppDataContext'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import StatusChip from '../components/StatusChip'
import LifecycleChip from '../components/LifecycleChip'
import { currency, dateTime } from '../utils/format'

export default function BillingPage() {
  const { customers, items, submitInvoice } = useAppData()
  const [customerId, setCustomerId] = useState('')
  const [quantities, setQuantities] = useState({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [createdInvoice, setCreatedInvoice] = useState(null)

  useEffect(() => {
    const initial = {}
    items.forEach((item) => {
      initial[item.id] = 0
    })
    setQuantities((current) => ({ ...initial, ...current }))
  }, [items])

  const selectedCustomer = useMemo(
    () => customers.find((customer) => String(customer.id) === String(customerId)) || null,
    [customers, customerId],
  )

  const selectedItems = useMemo(
    () =>
      items
        .map((item) => {
          const quantity = Number(quantities[item.id] || 0)
          if (!quantity) return null
          return {
            id: item.id,
            item_id: item.id,
            name: item.name,
            price: Number(item.price),
            quantity,
            lineTotal: Number(item.price) * quantity,
          }
        })
        .filter(Boolean),
    [items, quantities],
  )

  const subtotal = selectedItems.reduce((sum, item) => sum + item.lineTotal, 0)
  const gst = selectedCustomer?.gst_registered ? 0 : subtotal * 0.18
  const total = subtotal + gst

  const handleQuantityChange = (itemId, value) => {
    setQuantities((current) => ({
      ...current,
      [itemId]: Math.max(0, Number(value)),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')
    setCreatedInvoice(null)

    if (!customerId) {
      setError('Please select a customer before creating the invoice.')
      setSubmitting(false)
      return
    }

    if (selectedItems.length === 0) {
      setError('Please add at least one item with quantity greater than zero.')
      setSubmitting(false)
      return
    }

    try {
      const result = await submitInvoice({
        customerId: Number(customerId),
        items: selectedItems.map((item) => ({ item_id: item.item_id, quantity: item.quantity })),
        customer: selectedCustomer,
        lineItems: selectedItems,
      })
      setMessage(`Invoice ${result.invoiceId} created successfully.`)
      setCreatedInvoice({
        invoice_id: result.invoiceId,
        customer_name: selectedCustomer?.name,
        created_at: new Date().toISOString(),
        total_amount: result.total,
        gst_amount: result.gst,
        final_amount: result.finalAmount,
        line_items: selectedItems,
        customer_gst_registered: Boolean(selectedCustomer?.gst_registered),
      })
      setQuantities({})
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to create invoice')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box className="page-section">
      <PageHeader
        eyebrow="Billing"
        title="Create Invoice"
      />

      <Stack spacing={2} sx={{ mb: 2.5 }}>
        {message ? <Alert severity="success">{message}</Alert> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}
      </Stack>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={7}>
          <SectionCard title="Invoice builder">
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2.5 }}>
              <FormControl fullWidth>
                <InputLabel id="customer-select-label">Customer</InputLabel>
                <Select
                  labelId="customer-select-label"
                  label="Customer"
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                >
                  {customers.map((customer) => (
                    <MenuItem
                      key={customer.id}
                      value={customer.id}
                      disabled={String(customer.status || 'active').toLowerCase() !== 'active'}
                    >
                      {customer.name} {customer.gst_registered ? '(GST registered)' : '(GST not registered)'}{' '}
                      {String(customer.status || 'active').toLowerCase() === 'active' ? '' : '(Inactive)'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedCustomer ? (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Selected customer
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {selectedCustomer.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedCustomer.email || selectedCustomer.phone || 'No contact details available'}
                      </Typography>
                    </Box>
                    <StatusChip registered={Boolean(selectedCustomer.gst_registered)} />
                  </Stack>
                </Paper>
              ) : null}

              <Divider />

              <Stack spacing={1.5}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Item selection
                </Typography>
                {items.length === 0 ? (
                  <Alert severity="info">Create items from the Masters screen before building an invoice.</Alert>
                ) : (
                  items.map((item) => (
                    <Paper
                      key={item.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1.2fr 0.8fr 160px' },
                        gap: 2,
                        alignItems: 'center',
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                          {item.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Rate {currency(item.price)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Line total
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                          {currency(Number(item.price) * Number(quantities[item.id] || 0))}
                        </Typography>
                      </Box>
                      <Stack spacing={1}>
                        <LifecycleChip status={item.status} />
                        <TextField
                          label="Quantity"
                          type="number"
                          value={quantities[item.id] ?? 0}
                          onChange={(event) => handleQuantityChange(item.id, event.target.value)}
                          inputProps={{ min: 0, step: 1 }}
                          disabled={String(item.status || 'active').toLowerCase() !== 'active'}
                        />
                      </Stack>
                    </Paper>
                  ))
                )}
              </Stack>

              <Button type="submit" variant="contained" size="large" startIcon={<AddRoundedIcon />} disabled={submitting}>
                {submitting ? 'Creating invoice...' : 'Generate invoice'}
              </Button>
            </Box>
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={5}>
          <SectionCard title="Live totals">
            <Stack spacing={1.2}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Subtotal
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {currency(subtotal)}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  GST
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {currency(gst)}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Final amount
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {currency(total)}
                </Typography>
              </Paper>
            </Stack>

            {createdInvoice ? (
              <>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Last created invoice
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {createdInvoice.invoice_id}
                  </Typography>
                  <Typography variant="body2">Customer: {createdInvoice.customer_name}</Typography>
                  <Typography variant="body2">Created: {dateTime(createdInvoice.created_at)}</Typography>
                  <Typography variant="body2">Final amount: {currency(createdInvoice.final_amount)}</Typography>
                </Stack>
              </>
            ) : null}
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  )
}
