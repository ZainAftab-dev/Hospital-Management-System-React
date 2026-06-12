'use client';

import { useEffect, useMemo, useState } from 'react';
import { invoices as initialInvoices } from '@/lib/mock-data';
import { generateInvoicePDF } from '@/lib/pdf-utils';
import { hospitalApi } from '@/lib/api';
import { formatRupees } from '@/lib/utils';
import type { Invoice } from '@/types/hospital';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function BillingWorkspace() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Partial<Invoice> | null>(null);
  const [formError, setFormError] = useState('');
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    invoiceNo: '',
    date: new Date().toISOString().slice(0, 10),
    patientId: '',
    patientName: '',
    status: 'DRAFT',
    paymentMode: '',
    items: [{ description: 'Consultation Fee', quantity: 1, unitPrice: 1500, amount: 1500 }]
  });

  useEffect(() => {
    hospitalApi.invoices()
      .then((data) => {
        setInvoices(data);
        setError('');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load invoices from database'))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredInvoices = invoices.filter((inv) =>
    inv.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.invoiceNo.includes(searchTerm) ||
    inv.patientId.includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'text-green-600 bg-green-50';
      case 'UNPAID':
        return 'text-red-600 bg-red-50';
      case 'DRAFT':
        return 'text-gray-600 bg-gray-50';
      case 'CANCELLED':
        return 'text-red-800 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const createInvoice = async () => {
    if (!newInvoice.invoiceNo || !newInvoice.date || !newInvoice.patientId || !newInvoice.patientName) return;
    const items = newInvoice.items?.length
      ? newInvoice.items
      : [{ description: 'Consultation Fee', quantity: 1, unitPrice: 1500, amount: 1500 }];
    const subtotal = Number(items.reduce((sum, item) => sum + item.amount, 0).toFixed(2));
    const invoice: Invoice = {
      id: `INV${Date.now()}`,
      invoiceNo: newInvoice.invoiceNo,
      patientId: newInvoice.patientId,
      patientName: newInvoice.patientName,
      status: newInvoice.status ?? 'DRAFT',
      date: newInvoice.date,
      items,
      subtotal,
      discount: 0,
      tax: 0,
      total: subtotal
    };
    try {
      const saved = await hospitalApi.createInvoice(invoice);
      setInvoices((current) => [saved, ...current]);
      setSelectedInvoice(saved);
      setNewInvoice({
        invoiceNo: '',
        date: new Date().toISOString().slice(0, 10),
        patientId: '',
        patientName: '',
        status: 'DRAFT',
        paymentMode: '',
        items: [{ description: 'Consultation Fee', quantity: 1, unitPrice: 1500, amount: 1500 }]
      });
      setIsNewInvoiceOpen(false);
      setFormError('');
      setError('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create invoice');
    }
  };

  const saveEditedInvoice = async () => {
    if (!editingInvoice?.id || !editingInvoice.invoiceNo || !editingInvoice.date || !editingInvoice.patientId || !editingInvoice.patientName) return;
    const items = editingInvoice.items?.length ? editingInvoice.items : [];
    const subtotal = Number(items.reduce((sum, item) => sum + item.amount, 0).toFixed(2));
    const discount = editingInvoice.discount ?? 0;
    const tax = editingInvoice.tax ?? 0;
    const total = Number((subtotal - discount + tax).toFixed(2));
    try {
      const saved = await hospitalApi.updateInvoice(editingInvoice.id, { ...editingInvoice, items, subtotal, discount, tax, total } as Invoice);
      setInvoices((current) => current.map((invoice) => invoice.id === editingInvoice.id ? saved : invoice));
      setSelectedInvoice(saved);
      setIsEditOpen(false);
      setEditingInvoice(null);
      setFormError('');
      setError('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to update invoice');
    }
  };

  const updatePaymentStatus = async (invoice: Invoice, status: Invoice['status']) => {
    try {
      const updated = await hospitalApi.updateInvoiceStatus(invoice.id, status);
      setInvoices((current) => current.map((item) => (item.id === invoice.id ? updated : item)));
      setSelectedInvoice(updated);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update invoice status');
    }
  };

  const updateNewInvoiceItem = (field: 'description' | 'quantity' | 'unitPrice', value: string | number) => {
    const item = newInvoice.items?.[0] ?? { description: 'Consultation Fee', quantity: 1, unitPrice: 1500, amount: 1500 };
    const nextItem = {
      ...item,
      [field]: field === 'description' ? value : Number(value) || 0
    };
    nextItem.amount = Number((nextItem.quantity * nextItem.unitPrice).toFixed(2));
    setNewInvoice({ ...newInvoice, items: [nextItem] });
  };

  const revenueStats = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const paid = invoices.filter(inv => inv.status === 'PAID');
    const unpaid = invoices.filter(inv => inv.status === 'UNPAID');
    const thisMonthPaid = paid.filter(inv => {
      const d = new Date(inv.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    const paymentModes: Record<string, number> = {};
    paid.forEach(inv => {
      const mode = inv.paymentMode || 'Cash';
      paymentModes[mode] = (paymentModes[mode] || 0) + 1;
    });
    return {
      totalPaid: paid.reduce((s, inv) => s + inv.total, 0),
      totalUnpaid: unpaid.reduce((s, inv) => s + inv.total, 0),
      thisMonthRevenue: thisMonthPaid.reduce((s, inv) => s + inv.total, 0),
      totalInvoices: invoices.length,
      paidCount: paid.length,
      unpaidCount: unpaid.length,
      paymentModes,
    };
  }, [invoices]);

  return (
    <div className="space-y-6">
      {/* Revenue Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-300 bg-white p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Revenue</p>
          <p className="text-2xl font-bold text-green-700 mt-1">Rs. {revenueStats.totalPaid.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{revenueStats.paidCount} paid invoice{revenueStats.paidCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="rounded-lg border border-gray-300 bg-white p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Outstanding</p>
          <p className="text-2xl font-bold text-red-600 mt-1">Rs. {revenueStats.totalUnpaid.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{revenueStats.unpaidCount} unpaid invoice{revenueStats.unpaidCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="rounded-lg border border-gray-300 bg-white p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">This Month</p>
          <p className="text-2xl font-bold text-[#5b8ab8] mt-1">Rs. {revenueStats.thisMonthRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Paid invoices only</p>
        </div>
        <div className="rounded-lg border border-gray-300 bg-white p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment Methods</p>
          <div className="mt-2 space-y-0.5">
            {Object.entries(revenueStats.paymentModes).length === 0
              ? <p className="text-sm text-gray-400">No paid invoices yet</p>
              : Object.entries(revenueStats.paymentModes).map(([mode, count]) => (
                  <div key={mode} className="flex justify-between text-xs">
                    <span className="text-gray-600">{mode}</span>
                    <span className="font-semibold text-gray-800">{count}</span>
                  </div>
                ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-300 bg-white p-6">
        {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {isLoading && <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">Loading invoices from SQL Server...</div>}
        <div className="mb-6 flex gap-4">
          <Input
            placeholder="Search invoice by patient, invoice number, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button onClick={() => setSearchTerm('')}>Clear</Button>
          <Button onClick={() => setIsNewInvoiceOpen(true)}>New Invoice</Button>
          <Button variant="outline" disabled={!selectedInvoice} onClick={() => {
            if (selectedInvoice) {
              setEditingInvoice(selectedInvoice);
              setIsEditOpen(true);
            }
          }}>Edit</Button>
          <Button variant="outline" disabled={!selectedInvoice} onClick={() => {
            if (selectedInvoice && confirm('Delete this invoice?')) {
              hospitalApi.deleteInvoice(selectedInvoice.id)
                .then(() => {
                  setInvoices(invoices.filter(inv => inv.id !== selectedInvoice.id));
                  setSelectedInvoice(null);
                })
                .catch((err) => setError(err instanceof Error ? err.message : 'Unable to delete invoice'));
            }
          }}>Delete</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Invoice #</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Patient ID</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Patient Name</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Date</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Total</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-gray-300 hover:bg-blue-50 cursor-pointer"
                  onClick={() => setSelectedInvoice(invoice)}
                >
                  <td className="border border-gray-300 px-4 py-2 font-medium text-blue-600">{invoice.invoiceNo}</td>
                  <td className="border border-gray-300 px-4 py-2">{invoice.patientId}</td>
                  <td className="border border-gray-300 px-4 py-2">{invoice.patientName}</td>
                  <td className="border border-gray-300 px-4 py-2">{invoice.date}</td>
                  <td className="border border-gray-300 px-4 py-2 font-semibold">{formatRupees(invoice.total)}</td>
                  <td className={`border border-gray-300 px-4 py-2 font-semibold text-center rounded ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>

          {selectedInvoice ? (
            <div className="space-y-6">
              <div className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600">Invoice #:</p>
                  <p className="text-base font-semibold">{selectedInvoice.invoiceNo}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Date:</p>
                  <p className="text-base">{selectedInvoice.date}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Patient ID:</p>
                  <p className="text-base">{selectedInvoice.patientId}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Status:</p>
                  <p className={`text-base font-semibold ${getStatusColor(selectedInvoice.status)}`}>
                    {selectedInvoice.status}
                  </p>
                </div>
                {selectedInvoice.paymentMode && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Payment Mode:</p>
                    <p className="text-base">{selectedInvoice.paymentMode}</p>
                  </div>
                )}
              </div>

              <div className="border-b pb-4">
                <p className="font-semibold text-lg mb-2">Patient Information:</p>
                <p className="text-base">{selectedInvoice.patientName}</p>
              </div>

              <div>
                <p className="font-semibold text-lg mb-4">Billing Details:</p>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border border-gray-300 bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Quantity</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Unit Price</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx} className="border border-gray-300">
                          <td className="border border-gray-300 px-4 py-2">{item.description}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">{formatRupees(item.unitPrice)}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">{formatRupees(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-32">
                  <div>
                    <p className="text-sm text-gray-600">Subtotal:</p>
                    <p className="text-sm text-gray-600">Discount (0.0%):</p>
                    <p className="text-sm text-gray-600">Tax (0.0%):</p>
                    <p className="text-lg font-bold mt-2">Total:</p>
                  </div>
                  <div>
                    <p className="text-sm">{formatRupees(selectedInvoice.subtotal)}</p>
                    <p className="text-sm">{formatRupees(selectedInvoice.discount)}</p>
                    <p className="text-sm">{formatRupees(selectedInvoice.tax)}</p>
                    <p className="text-lg font-bold mt-2">{formatRupees(selectedInvoice.total)}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedInvoice(null)}>Close</Button>
                {selectedInvoice.status !== 'PAID' && (
                  <Button variant="outline" onClick={() => updatePaymentStatus(selectedInvoice, 'PAID')}>Mark Paid</Button>
                )}
                {selectedInvoice.status !== 'UNPAID' && (
                  <Button variant="outline" onClick={() => updatePaymentStatus(selectedInvoice, 'UNPAID')}>Mark Unpaid</Button>
                )}
                {selectedInvoice.status !== 'CANCELLED' && (
                  <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => updatePaymentStatus(selectedInvoice, 'CANCELLED')}>
                    Cancel Invoice
                  </Button>
                )}
                <Button variant="outline" onClick={() => {
                  if (selectedInvoice) {
                    setEditingInvoice(selectedInvoice);
                    setIsEditOpen(true);
                    setSelectedInvoice(null);
                  }
                }}>Edit</Button>
                <Button variant="outline" onClick={() => {
                  generateInvoicePDF(selectedInvoice);
                }}>Print</Button>
                <Button onClick={() => {
                  generateInvoicePDF(selectedInvoice);
                }}>Download PDF</Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* New Invoice Dialog */}
      <Dialog open={isNewInvoiceOpen} onOpenChange={(open) => { setIsNewInvoiceOpen(open); if (!open) setFormError(''); }}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inv-no">Invoice Number *</Label>
                <Input
                  id="inv-no"
                  placeholder="e.g., B001"
                  value={newInvoice.invoiceNo ?? ''}
                  onChange={(event) => setNewInvoice({ ...newInvoice, invoiceNo: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="inv-date">Date *</Label>
                <Input
                  id="inv-date"
                  type="date"
                  value={newInvoice.date ?? ''}
                  onChange={(event) => setNewInvoice({ ...newInvoice, date: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="patient-id">Patient ID *</Label>
                <Input
                  id="patient-id"
                  placeholder="e.g., P001"
                  value={newInvoice.patientId ?? ''}
                  onChange={(event) => setNewInvoice({ ...newInvoice, patientId: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="patient-name">Patient Name *</Label>
                <Input
                  id="patient-name"
                  placeholder="e.g., John Doe"
                  value={newInvoice.patientName ?? ''}
                  onChange={(event) => setNewInvoice({ ...newInvoice, patientName: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  className="h-8 w-full rounded-sm border border-input bg-white px-2 text-sm text-gray-900"
                  value={newInvoice.status ?? 'DRAFT'}
                  onChange={(event) => setNewInvoice({ ...newInvoice, status: event.target.value as Invoice['status'] })}
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="UNPAID">UNPAID</option>
                  <option value="PAID">PAID</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <div>
                <Label htmlFor="payment-mode">Payment Mode</Label>
                <select
                  id="payment-mode"
                  className="h-8 w-full rounded-sm border border-input bg-white px-2 text-sm text-gray-900"
                  value={newInvoice.paymentMode ?? ''}
                  onChange={(event) => setNewInvoice({ ...newInvoice, paymentMode: event.target.value })}
                >
                  <option value="">— Select —</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Insurance">Insurance</option>
                </select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="charge-description">Charge Description *</Label>
                <Input
                  id="charge-description"
                  value={newInvoice.items?.[0]?.description ?? ''}
                  onChange={(event) => updateNewInvoiceItem('description', event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="charge-quantity">Quantity *</Label>
                <Input
                  id="charge-quantity"
                  type="number"
                  min="1"
                  value={newInvoice.items?.[0]?.quantity ?? 1}
                  onChange={(event) => updateNewInvoiceItem('quantity', event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="charge-unit-price">Unit Price (Rs.) *</Label>
                <Input
                  id="charge-unit-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newInvoice.items?.[0]?.unitPrice ?? 0}
                  onChange={(event) => updateNewInvoiceItem('unitPrice', event.target.value)}
                />
              </div>
            </div>
            {formError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <p className="font-semibold mb-1">Please fix the following:</p>
                <ul className="space-y-0.5">
                  {formError.split('\n').map((msg, i) => (
                    <li key={i} className="flex gap-1.5"><span>•</span><span>{msg}</span></li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setIsNewInvoiceOpen(false)}>Cancel</Button>
              <Button onClick={createInvoice}>Create Invoice</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) setFormError(''); }}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-inv-no">Invoice Number</Label>
                <Input
                  id="edit-inv-no"
                  value={editingInvoice?.invoiceNo ?? ''}
                  onChange={(event) => setEditingInvoice({ ...(editingInvoice ?? {}), invoiceNo: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-inv-date">Date</Label>
                <Input
                  id="edit-inv-date"
                  placeholder="YYYY-MM-DD or DD-MM-YYYY"
                  value={editingInvoice?.date ?? ''}
                  onChange={(event) => setEditingInvoice({ ...(editingInvoice ?? {}), date: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-patient-id">Patient ID</Label>
                <Input
                  id="edit-patient-id"
                  value={editingInvoice?.patientId ?? ''}
                  onChange={(event) => setEditingInvoice({ ...(editingInvoice ?? {}), patientId: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-patient-name">Patient Name</Label>
                <Input
                  id="edit-patient-name"
                  value={editingInvoice?.patientName ?? ''}
                  onChange={(event) => setEditingInvoice({ ...(editingInvoice ?? {}), patientName: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  className="h-8 w-full rounded-sm border border-input bg-white px-2 text-sm text-gray-900"
                  value={editingInvoice?.status ?? 'DRAFT'}
                  onChange={(event) => setEditingInvoice({ ...(editingInvoice ?? {}), status: event.target.value as Invoice['status'] })}
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="UNPAID">UNPAID</option>
                  <option value="PAID">PAID</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit-payment-mode">Payment Mode</Label>
                <select
                  id="edit-payment-mode"
                  className="h-8 w-full rounded-sm border border-input bg-white px-2 text-sm text-gray-900"
                  value={editingInvoice?.paymentMode ?? ''}
                  onChange={(event) => setEditingInvoice({ ...(editingInvoice ?? {}), paymentMode: event.target.value })}
                >
                  <option value="">— Select —</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Insurance">Insurance</option>
                </select>
              </div>
            </div>
            {formError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <p className="font-semibold mb-1">Please fix the following:</p>
                <ul className="space-y-0.5">
                  {formError.split('\n').map((msg, i) => (
                    <li key={i} className="flex gap-1.5"><span>•</span><span>{msg}</span></li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={saveEditedInvoice}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
