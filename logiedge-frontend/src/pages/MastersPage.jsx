import {
  Alert,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import Grid from '@mui/material/GridLegacy'
import { useAppData } from '../context/AppDataContext'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import StatusChip from '../components/StatusChip'
import LifecycleChip from '../components/LifecycleChip'
import { currency } from '../utils/format'

const customerInitial = { name: '', email: '', phone: '', gst_registered: true, status: 'active' }
const itemInitial = { name: '', price: '', status: 'active' }

export default function MastersPage() {
  const { customers, items, addCustomer, addItem, editCustomer, editItem } = useAppData()
  const [customerForm, setCustomerForm] = useState(customerInitial)
  const [itemForm, setItemForm] = useState(itemInitial)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [savingCustomer, setSavingCustomer] = useState(false)
  const [savingItem, setSavingItem] = useState(false)
  const [statusSaving, setStatusSaving] = useState({ type: '', id: '' })

  const customerRows = useMemo(
    () => customers.slice().sort((a, b) => String(a.name).localeCompare(String(b.name))),
    [customers],
  )
  const itemRows = useMemo(() => items.slice().sort((a, b) => String(a.name).localeCompare(String(b.name))), [items])

  const handleCustomerSubmit = async (event) => {
    event.preventDefault()
    setSavingCustomer(true)
    setError('')
    setMessage('')
    try {
      const result = await addCustomer({
        ...customerForm,
        gst_registered: Boolean(customerForm.gst_registered),
      })
      setMessage(result.message || 'Customer created successfully')
      setCustomerForm(customerInitial)
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to create customer')
    } finally {
      setSavingCustomer(false)
    }
  }

  const handleItemSubmit = async (event) => {
    event.preventDefault()
    setSavingItem(true)
    setError('')
    setMessage('')
    try {
      const result = await addItem({ name: itemForm.name, price: Number(itemForm.price) })
      setMessage(result.message || 'Item created successfully')
      setItemForm(itemInitial)
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to create item')
    } finally {
      setSavingItem(false)
    }
  }

  const handleCustomerStatusChange = async (customer, nextStatus) => {
    setStatusSaving({ type: 'customer', id: customer.id })
    setError('')
    setMessage('')
    try {
      const result = await editCustomer(customer.id, {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        gst_registered: Boolean(customer.gst_registered),
        status: nextStatus,
      })
      setMessage(result.message || 'Customer updated successfully')
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to update customer status')
    } finally {
      setStatusSaving({ type: '', id: '' })
    }
  }

  const handleItemStatusChange = async (item, nextStatus) => {
    setStatusSaving({ type: 'item', id: item.id })
    setError('')
    setMessage('')
    try {
      const result = await editItem(item.id, {
        name: item.name,
        price: item.price,
        status: nextStatus,
      })
      setMessage(result.message || 'Item updated successfully')
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to update item status')
    } finally {
      setStatusSaving({ type: '', id: '' })
    }
  }

  return (
    <Box className="page-section">
      <PageHeader
        eyebrow="Master Data"
        title="Customers and Items"
      />

      <Stack spacing={2} sx={{ mb: 2.5 }}>
        {message ? <Alert severity="success">{message}</Alert> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}
      </Stack>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={5}>
          <SectionCard title="Create customer">
            <Box component="form" onSubmit={handleCustomerSubmit} sx={{ display: 'grid', gap: 2 }}>
              <TextField
                label="Customer name"
                value={customerForm.name}
                onChange={(event) => setCustomerForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
              <TextField
                label="Email"
                type="email"
                value={customerForm.email}
                onChange={(event) => setCustomerForm((current) => ({ ...current, email: event.target.value }))}
              />
              <TextField
                label="Phone"
                value={customerForm.phone}
                onChange={(event) => setCustomerForm((current) => ({ ...current, phone: event.target.value }))}
              />
              <FormControl fullWidth>
                <InputLabel id="customer-status-label">Status</InputLabel>
                <Select
                  labelId="customer-status-label"
                  label="Status"
                  value={customerForm.status}
                  onChange={(event) => setCustomerForm((current) => ({ ...current, status: event.target.value }))}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(customerForm.gst_registered)}
                    onChange={(event) =>
                      setCustomerForm((current) => ({ ...current, gst_registered: event.target.checked }))
                    }
                  />
                }
                label="GST registered"
              />
              <Button type="submit" variant="contained" disabled={savingCustomer}>
                {savingCustomer ? 'Saving...' : 'Create customer'}
              </Button>
            </Box>
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={7}>
          <SectionCard title="Customer master">
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>GST</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Change</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customerRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography variant="body2" color="text.secondary">
                          No customers found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    customerRows.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell sx={{ fontWeight: 700 }}>{customer.name}</TableCell>
                        <TableCell>{customer.email || '-'}</TableCell>
                        <TableCell>{customer.phone || '-'}</TableCell>
                        <TableCell>
                          <StatusChip registered={Boolean(customer.gst_registered)} />
                        </TableCell>
                        <TableCell>
                          <LifecycleChip status={customer.status} />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" fullWidth>
                            <Select
                              value={String(customer.status || 'active').toLowerCase()}
                              onChange={(event) => handleCustomerStatusChange(customer, event.target.value)}
                              disabled={statusSaving.type === 'customer' && statusSaving.id === customer.id}
                            >
                              <MenuItem value="active">Active</MenuItem>
                              <MenuItem value="inactive">Inactive</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={5}>
          <SectionCard title="Create item">
            <Box component="form" onSubmit={handleItemSubmit} sx={{ display: 'grid', gap: 2 }}>
              <TextField
                label="Item name"
                value={itemForm.name}
                onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
              <TextField
                label="Price"
                type="number"
                value={itemForm.price}
                onChange={(event) => setItemForm((current) => ({ ...current, price: event.target.value }))}
                required
                inputProps={{ min: 0, step: '0.01' }}
              />
              <FormControl fullWidth>
                <InputLabel id="item-status-label">Status</InputLabel>
                <Select
                  labelId="item-status-label"
                  label="Status"
                  value={itemForm.status}
                  onChange={(event) => setItemForm((current) => ({ ...current, status: event.target.value }))}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
              <Button type="submit" variant="contained" disabled={savingItem}>
                {savingItem ? 'Saving...' : 'Create item'}
              </Button>
            </Box>
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={7}>
          <SectionCard title="Item master">
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Change</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {itemRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography variant="body2" color="text.secondary">
                          No items found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    itemRows.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell sx={{ fontWeight: 700 }}>{item.name}</TableCell>
                        <TableCell align="right">{currency(item.price)}</TableCell>
                        <TableCell>
                          <LifecycleChip status={item.status} />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" fullWidth>
                            <Select
                              value={String(item.status || 'active').toLowerCase()}
                              onChange={(event) => handleItemStatusChange(item, event.target.value)}
                              disabled={statusSaving.type === 'item' && statusSaving.id === item.id}
                            >
                              <MenuItem value="active">Active</MenuItem>
                              <MenuItem value="inactive">Inactive</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  )
}
