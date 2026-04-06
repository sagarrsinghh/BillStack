import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import Grid from '@mui/material/GridLegacy'
import { useEffect, useMemo, useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import StatusChip from '../components/StatusChip'
import { currency, dateTime } from '../utils/format'

export default function InvoicesPage() {
  const { customers, combinedInvoices, invoicesForCustomer, findInvoiceById } = useAppData()
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [searchInvoiceId, setSearchInvoiceId] = useState('')
  const [filteredInvoices, setFilteredInvoices] = useState(combinedInvoices)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const customerMap = useMemo(
    () => new Map(customers.map((customer) => [String(customer.id), customer])),
    [customers],
  )

  useEffect(() => {
    if (!selectedCustomerId && !selectedInvoice) {
      setFilteredInvoices(combinedInvoices)
    }
  }, [combinedInvoices, selectedCustomerId, selectedInvoice])

  const handleCustomerFilter = async (customerId) => {
    setSelectedCustomerId(customerId)
    setLoading(true)
    setInfo('')
    setError('')
    setSelectedInvoice(null)
    try {
      if (!customerId) {
        setFilteredInvoices(combinedInvoices)
        setInfo('Showing all invoices.')
      } else {
        const rows = await invoicesForCustomer(customerId)
        setFilteredInvoices(rows)
        setInfo(`Showing invoices for ${customerMap.get(String(customerId))?.name || 'selected customer'}.`)
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load customer invoices')
    } finally {
      setLoading(false)
    }
  }

  const handleInvoiceSearch = async (event) => {
    event.preventDefault()
    setLoading(true)
    setInfo('')
    setError('')
    setSelectedInvoice(null)
    try {
      const result = await findInvoiceById(searchInvoiceId.trim())
      if (!result) {
        setError('No invoice matched that invoice id.')
        setFilteredInvoices([])
      } else {
        setSelectedInvoice(result)
        setFilteredInvoices([result])
        setInfo(`Displaying invoice ${result.invoice_id}.`)
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to search invoice')
    } finally {
      setLoading(false)
    }
  }

  const displayInvoices = filteredInvoices.length ? filteredInvoices : combinedInvoices

  return (
    <Box className="page-section">
      <PageHeader
        eyebrow="Invoices"
        title="Invoice Dashboard"
      />

      <Stack spacing={2} sx={{ mb: 2.5 }}>
        {info ? <Alert severity="info">{info}</Alert> : null}
        {error ? <Alert severity="warning">{error}</Alert> : null}
      </Stack>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={4}>
          <SectionCard title="Search invoice">
            <Box component="form" onSubmit={handleInvoiceSearch} sx={{ display: 'grid', gap: 2 }}>
              <TextField
                label="Invoice ID"
                value={searchInvoiceId}
                onChange={(event) => setSearchInvoiceId(event.target.value)}
                placeholder="INVC224830"
                fullWidth
              />
              <Button type="submit" variant="contained" startIcon={<SearchRoundedIcon />} disabled={loading}>
                Search
              </Button>
            </Box>
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={8}>
          <SectionCard title="Customer filter">
            <FormControl fullWidth>
              <InputLabel id="invoice-customer-filter">Customer</InputLabel>
              <Select
                labelId="invoice-customer-filter"
                label="Customer"
                value={selectedCustomerId}
                onChange={(event) => handleCustomerFilter(event.target.value)}
              >
                <MenuItem value="">All customers</MenuItem>
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </SectionCard>
        </Grid>

        <Grid item xs={12}>
          <SectionCard title="Invoice list">
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                    <TableCell align="right">GST</TableCell>
                    <TableCell align="right">Final</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography variant="body2" color="text.secondary">
                          No invoices to show.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayInvoices.map((invoice) => (
                      <TableRow
                        key={`${invoice.invoice_id}-${invoice.id}`}
                        hover
                        onClick={() => setSelectedInvoice(invoice)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell sx={{ fontWeight: 700 }}>{invoice.invoice_id}</TableCell>
                        <TableCell>{invoice.customer_name}</TableCell>
                        <TableCell>{dateTime(invoice.created_at)}</TableCell>
                        <TableCell align="right">{currency(invoice.total_amount)}</TableCell>
                        <TableCell align="right">{currency(invoice.gst_amount)}</TableCell>
                        <TableCell align="right">{currency(invoice.final_amount)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        </Grid>

        <Grid item xs={12}>
          {selectedInvoice ? (
            <SectionCard title={`Invoice ${selectedInvoice.invoice_id}`}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Customer
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {selectedInvoice.customer_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedInvoice.customer_email || 'No email available'}
                      </Typography>
                      <StatusChip registered={Boolean(selectedInvoice.customer_gst_registered)} />
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Amounts
                      </Typography>
                      <Typography variant="body2">Subtotal: {currency(selectedInvoice.total_amount)}</Typography>
                      <Typography variant="body2">GST: {currency(selectedInvoice.gst_amount)}</Typography>
                      <Typography variant="body2">Final: {currency(selectedInvoice.final_amount)}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Created: {dateTime(selectedInvoice.created_at)}
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Line items
                    </Typography>
                    {selectedInvoice.line_items?.length ? (
                      <Stack spacing={1}>
                        {selectedInvoice.line_items.map((line, index) => (
                          <Paper key={`${line.item_id}-${index}`} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                  {line.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Quantity {line.quantity} x {currency(line.price)}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {currency(line.lineTotal)}
                              </Typography>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    ) : (
                      <Alert severity="info">
                        No line items were returned for this invoice.
                      </Alert>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </SectionCard>
          ) : null}
        </Grid>
      </Grid>
    </Box>
  )
}
