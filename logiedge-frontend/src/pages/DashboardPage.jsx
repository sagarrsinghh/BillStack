import {
  Alert,
  Box,
  Button,
  Divider,
  Paper,
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
import ReceiptRoundedIcon from '@mui/icons-material/ReceiptRounded'
import Grid from '@mui/material/GridLegacy'
import { useMemo, useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import StatCard from '../components/StatCard'
import StatusChip from '../components/StatusChip'
import { currency, dateTime } from '../utils/format'

export default function DashboardPage() {
  const { customers, items, combinedInvoices, loading, error, findInvoiceById } = useAppData()
  const [invoiceId, setInvoiceId] = useState('')
  const [matchedInvoice, setMatchedInvoice] = useState(null)
  const [searchError, setSearchError] = useState('')
  const [searching, setSearching] = useState(false)

  const metrics = useMemo(
    () => [
      { label: 'Customers', value: customers.length, helper: 'Fetched from customer master' },
      { label: 'Items', value: items.length, helper: 'Fetched from item master' },
      { label: 'Invoices', value: combinedInvoices.length, helper: 'Recent billing activity' },
    ],
    [customers.length, items.length, combinedInvoices.length],
  )

  const recentInvoices = combinedInvoices.slice(0, 6)

  const handleSearch = async (event) => {
    event.preventDefault()
    setSearching(true)
    setSearchError('')
    try {
      const result = await findInvoiceById(invoiceId.trim())
      if (!result) {
        setMatchedInvoice(null)
        setSearchError('No invoice found for that invoice id.')
      } else {
        setMatchedInvoice(result)
      }
    } catch (err) {
      setMatchedInvoice(null)
      setSearchError(err?.response?.data?.message || err.message || 'Failed to search invoice')
    } finally {
      setSearching(false)
    }
  }

  return (
    <Box className="page-section">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
      />

      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : null}

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        {metrics.map((metric) => (
          <Grid key={metric.label} item xs={12} md={4}>
            <StatCard label={metric.label} value={loading ? '...' : metric.value} helper={metric.helper} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={7}>
          <SectionCard
            title="Recent invoices"
          >
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice ID</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">GST</TableCell>
                    <TableCell align="right">Final</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography variant="body2" color="text.secondary">
                          No invoices found yet.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentInvoices.map((invoice) => (
                      <TableRow key={`${invoice.invoice_id}-${invoice.id}`}>
                        <TableCell sx={{ fontWeight: 700 }}>{invoice.invoice_id}</TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {invoice.customer_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {dateTime(invoice.created_at)}
                            </Typography>
                          </Stack>
                        </TableCell>
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

        <Grid item xs={12} lg={5}>
          <SectionCard
            title="Invoice lookup"
            action={<ReceiptRoundedIcon color="primary" />}
          >
            <Box component="form" onSubmit={handleSearch} sx={{ display: 'grid', gap: 2 }}>
              <TextField
                label="Invoice ID"
                value={invoiceId}
                onChange={(event) => setInvoiceId(event.target.value)}
                placeholder="INVC224830"
                fullWidth
              />
              <Button variant="contained" type="submit" disabled={searching}>
                Search invoice
              </Button>
            </Box>

            {searchError ? <Alert severity="warning">{searchError}</Alert> : null}

            {matchedInvoice ? (
              <>
                <Divider />
                <Stack spacing={1.2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Invoice details
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {matchedInvoice.invoice_id}
                  </Typography>
                  <Typography variant="body2">
                    Customer: <strong>{matchedInvoice.customer_name}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Total: <strong>{currency(matchedInvoice.total_amount)}</strong>
                  </Typography>
                  <Typography variant="body2">
                    GST: <strong>{currency(matchedInvoice.gst_amount)}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Final amount: <strong>{currency(matchedInvoice.final_amount)}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Created: {dateTime(matchedInvoice.created_at)}
                  </Typography>
                  <StatusChip registered={matchedInvoice.customer_gst_registered} />

                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>
                      Line items
                    </Typography>
                    {matchedInvoice.line_items?.length ? (
                      <Stack spacing={1}>
                        {matchedInvoice.line_items.map((line, index) => (
                          <Paper key={`${line.item_id}-${index}`} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {line.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Qty {line.quantity} x {currency(line.price)}
                            </Typography>
                          </Paper>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No line items were returned for this invoice.
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </>
            ) : null}
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  )
}
