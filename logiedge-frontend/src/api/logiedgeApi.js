import { apiClient } from './client'

export const getCustomers = async () => (await apiClient.get('/customers')).data
export const createCustomer = async (payload) => (await apiClient.post('/customers', payload)).data
export const updateCustomer = async (id, payload) => (await apiClient.put(`/customers/${id}`, payload)).data

export const getItems = async () => (await apiClient.get('/items')).data
export const createItem = async (payload) => (await apiClient.post('/items', payload)).data
export const updateItem = async (id, payload) => (await apiClient.put(`/items/${id}`, payload)).data

export const getInvoices = async () => (await apiClient.get('/invoices')).data
export const getInvoiceById = async (id) => (await apiClient.get(`/invoices/${id}`)).data
export const getInvoiceByIdentifier = async (identifier) => (await apiClient.get(`/invoices/${identifier}`)).data
export const getInvoicesByCustomer = async (customerId) =>
  (await apiClient.get(`/invoices/customer/${customerId}`)).data
export const createInvoice = async (payload) => (await apiClient.post('/invoices', payload)).data
