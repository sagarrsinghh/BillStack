import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createCustomer,
  createInvoice,
  createItem,
  getCustomers,
  getInvoiceById,
  getInvoiceByIdentifier,
  getInvoices,
  getInvoicesByCustomer,
  getItems,
  updateCustomer,
  updateItem,
} from '../api/logiedgeApi'

const AppDataContext = createContext(null)
const LOCAL_INVOICE_KEY = 'logiedge_local_invoices'

function readLocalInvoices() {
  try {
    const raw = window.localStorage.getItem(LOCAL_INVOICE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function mergeInvoices(remoteInvoices, localInvoices, customers) {
  const customerMap = new Map(customers.map((customer) => [String(customer.id), customer]))
  const localMap = new Map(localInvoices.map((invoice) => [String(invoice.invoice_id), invoice]))

  return remoteInvoices
    .map((invoice) => {
      const local = localMap.get(String(invoice.invoice_id))
      const customer = customerMap.get(String(invoice.customer_id))
      return {
        ...invoice,
        customer_name: local?.customer_name || customer?.name || `Customer #${invoice.customer_id}`,
        customer_email: local?.customer_email || customer?.email || '',
        customer_gst_registered:
          typeof local?.customer_gst_registered === 'boolean'
            ? local.customer_gst_registered
            : Boolean(customer?.gst_registered),
        line_items: local?.line_items || invoice.line_items || [],
        source: local ? 'local' : 'remote',
      }
    })
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
}

export function AppDataProvider({ children }) {
  const [customers, setCustomers] = useState([])
  const [items, setItems] = useState([])
  const [invoices, setInvoices] = useState([])
  const [localInvoices, setLocalInvoices] = useState(() => readLocalInvoices())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const persistLocalInvoices = (next) => {
    setLocalInvoices(next)
    window.localStorage.setItem(LOCAL_INVOICE_KEY, JSON.stringify(next))
  }

  const loadAll = async () => {
    setError('')
    setLoading(true)
    try {
      const [customerRows, itemRows, invoiceRows] = await Promise.all([getCustomers(), getItems(), getInvoices()])
      setCustomers(customerRows)
      setItems(itemRows)
      setInvoices(invoiceRows)
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const refreshAll = async () => {
    setRefreshing(true)
    try {
      const [customerRows, itemRows, invoiceRows] = await Promise.all([getCustomers(), getItems(), getInvoices()])
      setCustomers(customerRows)
      setItems(itemRows)
      setInvoices(invoiceRows)
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to refresh data')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  useEffect(() => {
    window.localStorage.setItem(LOCAL_INVOICE_KEY, JSON.stringify(localInvoices))
  }, [localInvoices])

  const refreshCustomers = async () => {
    const rows = await getCustomers()
    setCustomers(rows)
    return rows
  }

  const refreshItems = async () => {
    const rows = await getItems()
    setItems(rows)
    return rows
  }

  const refreshInvoices = async () => {
    const rows = await getInvoices()
    setInvoices(rows)
    return rows
  }

  const addCustomer = async (payload) => {
    const result = await createCustomer(payload)
    await refreshCustomers()
    return result
  }

  const editCustomer = async (id, payload) => {
    const result = await updateCustomer(id, payload)
    await refreshCustomers()
    return result
  }

  const addItem = async (payload) => {
    const result = await createItem(payload)
    await refreshItems()
    return result
  }

  const editItem = async (id, payload) => {
    const result = await updateItem(id, payload)
    await refreshItems()
    return result
  }

  const submitInvoice = async ({ customerId, items: selectedItems, customer, lineItems }) => {
    const result = await createInvoice({
      customer_id: customerId,
      items: selectedItems,
    })

    const responseLineItems =
      result.lineItems?.map((item) => ({
        ...item,
        lineTotal: item.lineTotal ?? Number(item.price) * Number(item.quantity),
      })) || lineItems

    const detailedRecord = {
      id: `local-${result.invoiceId}`,
      invoice_id: result.invoiceId,
      customer_id: customerId,
      customer_name: customer?.name || '',
      customer_email: customer?.email || '',
      customer_gst_registered: Boolean(customer?.gst_registered),
      total_amount: result.total,
      gst_amount: result.gst,
      final_amount: result.finalAmount,
      created_at: result.created_at || new Date().toISOString(),
      line_items: responseLineItems,
      source: 'local',
    }

    persistLocalInvoices([
      detailedRecord,
      ...localInvoices.filter((invoice) => invoice.invoice_id !== result.invoiceId),
    ].slice(0, 30))

    await refreshInvoices()
    return { ...result, detailedRecord }
  }

  const findInvoiceById = async (invoiceId) => {
    const local = localInvoices.find((invoice) => invoice.invoice_id === invoiceId)
    if (local) return local

    const remoteMatch = invoices.find((invoice) => String(invoice.invoice_id) === String(invoiceId))
    if (remoteMatch?.id) {
      const detail = await getInvoiceById(remoteMatch.id)
      const customer = customers.find((row) => String(row.id) === String(detail.customer_id))
      return {
        ...detail,
        customer_name: customer?.name || `Customer #${detail.customer_id}`,
        customer_email: customer?.email || '',
        customer_gst_registered: Boolean(customer?.gst_registered),
        line_items: detail.line_items || [],
        source: 'remote',
      }
    }

    try {
      const detail = await getInvoiceByIdentifier(invoiceId)
      const customer = customers.find((row) => String(row.id) === String(detail.customer_id))
      return {
        ...detail,
        customer_name: detail.customer_name || customer?.name || `Customer #${detail.customer_id}`,
        customer_email: detail.customer_email || customer?.email || '',
        customer_gst_registered:
          typeof detail.customer_gst_registered === 'boolean'
            ? detail.customer_gst_registered
            : Boolean(customer?.gst_registered),
        line_items: detail.line_items || [],
        source: 'remote',
      }
    } catch {
      // Fall through to null when the invoice id/code is not found.
    }

    return null
  }

  const invoicesForCustomer = async (customerId) => {
    const remote = await getInvoicesByCustomer(customerId)
    const customer = customers.find((row) => String(row.id) === String(customerId))
    const localForCustomer = localInvoices.filter((invoice) => String(invoice.customer_id) === String(customerId))
    return mergeInvoices(remote, localForCustomer, customer ? [customer] : [])
  }

  const value = useMemo(
    () => ({
      customers,
      items,
      invoices,
      localInvoices,
      combinedInvoices: mergeInvoices(invoices, localInvoices, customers),
      loading,
      refreshing,
      error,
      setError,
      refreshAll,
      refreshCustomers,
      refreshItems,
      refreshInvoices,
      addCustomer,
      editCustomer,
      addItem,
      editItem,
      submitInvoice,
      findInvoiceById,
      invoicesForCustomer,
    }),
    [customers, items, invoices, localInvoices, loading, refreshing, error],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const context = useContext(AppDataContext)
  if (!context) throw new Error('useAppData must be used within AppDataProvider')
  return context
}
