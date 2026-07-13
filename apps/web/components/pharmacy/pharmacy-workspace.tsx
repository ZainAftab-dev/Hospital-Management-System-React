'use client';

import { AlertTriangle, FileText, PackagePlus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { hospitalApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { CartItem, Invoice, InvoiceItem, Medicine, Patient } from '@/types/hospital';
import { DataTable } from './data-table';

const emptyPrescription = {
  dosage: '1 tablet',
  frequency: 'Twice daily',
  duration: '7 days'
};

const prescriptionDefaultsSchema = z.object({
  dosage: z.string().min(2, 'Dosage is required'),
  frequency: z.string().min(2, 'Frequency is required'),
  duration: z.string().min(2, 'Duration is required')
});

type PrescriptionDefaults = z.infer<typeof prescriptionDefaultsSchema>;

export function PharmacyWorkspace() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDispensing, setIsDispensing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | undefined>(undefined);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAddMedicineOpen, setIsAddMedicineOpen] = useState(false);
  const [isEditMedicineOpen, setIsEditMedicineOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [medicineFormData, setMedicineFormData] = useState({
    id: '',
    name: '',
    manufacturer: '',
    category: '',
    price: '',
    stock: '',
    reorderLevel: '20',
    description: '',
    expiryDate: '',
    batchNumber: '',
    unit: 'Tablet'
  });
  const prescriptionForm = useForm<PrescriptionDefaults>({
    resolver: zodResolver(prescriptionDefaultsSchema),
    defaultValues: emptyPrescription,
    mode: 'onChange'
  });

  useEffect(() => {
    Promise.all([hospitalApi.medicines(), hospitalApi.patients()])
      .then(([databaseMedicines, databasePatients]) => {
        setMedicines(databaseMedicines);
        setPatients(databasePatients);
        setSelectedMedicine(databaseMedicines[0]);
        setSelectedPatientId(databasePatients[0]?.id ?? '');
        setError('');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load pharmacy data from database'))
      .finally(() => setIsLoading(false));
  }, []);

  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId) ?? patients[0];
  const activeInvoice = selectedPatient
    ? invoices.find(
        (invoice) =>
          invoice.patientId === selectedPatient.id &&
          (invoice.status === 'UNPAID' || invoice.status === 'DRAFT')
      )
    : undefined;
  const categories = useMemo(() => ['all', ...Array.from(new Set(medicines.map((medicine) => medicine.category)))], [medicines]);
  const filteredMedicines = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return medicines.filter((medicine) => {
      const matchesCategory = category === 'all' || medicine.category === category;
      const matchesSearch =
        !needle ||
        medicine.id.toLowerCase().includes(needle) ||
        medicine.name.toLowerCase().includes(needle) ||
        medicine.manufacturer.toLowerCase().includes(needle);
      return matchesCategory && matchesSearch;
    });
  }, [category, medicines, search]);

  const lowStockCount = medicines.filter((medicine) => medicine.quantity <= medicine.reorderLevel).length;
  const expiringCount = medicines.filter((medicine) => {
    if (!medicine.expiryDate) return false;
    const exp = new Date(medicine.expiryDate);
    const threeMonths = new Date();
    threeMonths.setMonth(threeMonths.getMonth() + 3);
    return exp < threeMonths;
  }).length;
  const cartTotal = cart.reduce((sum, item) => sum + item.quantity * item.medicine.priceCents, 0);

  const inventoryColumns = useMemo<ColumnDef<Medicine>[]>(
    () => [
      { accessorKey: 'id', header: 'ID', size: 110 },
      { accessorKey: 'name', header: 'Name', size: 200 },
      { accessorKey: 'category', header: 'Category', size: 140 },
      { accessorKey: 'manufacturer', header: 'Manufacturer', size: 150 },
      {
        accessorKey: 'priceCents',
        header: 'Price',
        size: 100,
        cell: ({ row }) => formatCurrency(row.original.priceCents)
      },
      {
        accessorKey: 'quantity',
        header: 'Stock',
        size: 80,
        cell: ({ row }) => (
          <span className={row.original.quantity <= row.original.reorderLevel ? 'font-bold text-[#a33a2a]' : undefined}>
            {row.original.quantity}
          </span>
        )
      }
    ],
    []
  );

  const cartColumns = useMemo<ColumnDef<CartItem>[]>(
    () => [
      { id: 'id', header: 'ID', size: 105, cell: ({ row }) => row.original.medicine.id },
      { id: 'name', header: 'Name', size: 150, cell: ({ row }) => row.original.medicine.name },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        size: 110,
        cell: ({ row }) => (
          <Input
            min={1}
            max={row.original.medicine.quantity}
            type="number"
            value={row.original.quantity}
            onChange={(event) => updateCart(row.original.medicine.id, 'quantity', Number(event.target.value))}
          />
        )
      },
      {
        accessorKey: 'dosage',
        header: 'Dosage',
        size: 135,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              className="h-6 w-6 rounded border border-gray-300 bg-gray-100 hover:bg-gray-200 text-sm font-semibold"
              onClick={() => {
                const current = parseInt(row.original.dosage) || 1;
                updateCart(row.original.medicine.id, 'dosage', String(Math.max(1, current - 1)));
              }}
            >
              -
            </button>
            <Input 
              className="h-6 w-12 text-center p-0"
              value={row.original.dosage} 
              onChange={(event) => updateCart(row.original.medicine.id, 'dosage', event.target.value)} 
            />
            <button
              className="h-6 w-6 rounded border border-gray-300 bg-gray-100 hover:bg-gray-200 text-sm font-semibold"
              onClick={() => {
                const current = parseInt(row.original.dosage) || 1;
                updateCart(row.original.medicine.id, 'dosage', String(current + 1));
              }}
            >
              +
            </button>
          </div>
        )
      },
      {
        accessorKey: 'frequency',
        header: 'Frequency',
        size: 145,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              className="h-6 w-6 rounded border border-gray-300 bg-gray-100 hover:bg-gray-200 text-sm font-semibold"
              onClick={() => {
                const current = parseInt(row.original.frequency) || 1;
                updateCart(row.original.medicine.id, 'frequency', String(Math.max(1, current - 1)));
              }}
            >
              -
            </button>
            <Input 
              className="h-6 w-12 text-center p-0"
              value={row.original.frequency} 
              onChange={(event) => updateCart(row.original.medicine.id, 'frequency', event.target.value)} 
            />
            <button
              className="h-6 w-6 rounded border border-gray-300 bg-gray-100 hover:bg-gray-200 text-sm font-semibold"
              onClick={() => {
                const current = parseInt(row.original.frequency) || 1;
                updateCart(row.original.medicine.id, 'frequency', String(current + 1));
              }}
            >
              +
            </button>
          </div>
        )
      },
      {
        accessorKey: 'duration',
        header: 'Duration',
        size: 120,
        cell: ({ row }) => (
          <Input
            value={row.original.duration}
            onChange={(event) => updateCart(row.original.medicine.id, 'duration', event.target.value)}
          />
        )
      },
      {
        id: 'lineTotal',
        header: 'Line Total',
        size: 115,
        cell: ({ row }) => formatCurrency(row.original.quantity * row.original.medicine.priceCents)
      }
    ],
    [cart]
  );

  function addToCart(medicine = selectedMedicine) {
    if (!medicine || medicine.quantity <= 0) return;
    const defaults = prescriptionDefaultsSchema.safeParse(prescriptionForm.getValues());
    if (!defaults.success) return;
    setCart((current) => {
      const existing = current.find((item) => item.medicine.id === medicine.id);
      if (existing) {
        return current.map((item) =>
          item.medicine.id === medicine.id
            ? { ...item, quantity: Math.min(item.quantity + 1, item.medicine.quantity) }
            : item
        );
      }
      return [...current, { medicine, quantity: 1, ...defaults.data }];
    });
  }

  function updateCart(id: string, field: keyof Omit<CartItem, 'medicine'>, value: string | number) {
    setCart((current) =>
      current.map((item) => {
        if (item.medicine.id !== id) return item;
        if (field === 'quantity') {
          const quantity = Math.max(1, Math.min(Number(value) || 1, item.medicine.quantity));
          return { ...item, quantity };
        }
        return { ...item, [field]: value };
      })
    );
  }

  function removeSelectedFromCart() {
    if (!selectedMedicine) return;
    setCart((current) => current.filter((item) => item.medicine.id !== selectedMedicine.id));
  }

  async function dispenseMedicine() {
    if (isDispensing || !cart.length || !selectedPatient) return;
    setIsDispensing(true);
    try {
      const result = await hospitalApi.dispense({
        patientId: selectedPatient.id,
        invoiceId: activeInvoice?.id,
        items: cart.map((item) => ({
          medicineId: item.medicine.id,
          quantity: item.quantity,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration
        }))
      });
      setMedicines((current) =>
        current.map((medicine) => {
          const item = cart.find((entry) => entry.medicine.id === medicine.id);
          return item ? { ...medicine, quantity: medicine.quantity - item.quantity } : medicine;
        })
      );
      setInvoices((current) => {
        const withoutUpdated = current.filter((invoice) => invoice.id !== result.invoice.id);
        return [...withoutUpdated, result.invoice];
      });
      setCart([]);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to dispense medicine');
    } finally {
      setIsDispensing(false);
    }
  }

  function resetMedicineForm() {
    setMedicineFormData({
      id: '',
      name: '',
      manufacturer: '',
      category: '',
      price: '',
      stock: '',
      reorderLevel: '20',
      description: '',
      expiryDate: '',
      batchNumber: '',
      unit: 'Tablet'
    });
  }

  function openAddMedicine() {
    resetMedicineForm();
    setFormError('');
    setIsAddMedicineOpen(true);
  }

  function openEditMedicine(medicine: Medicine) {
    setMedicineFormData({
      id: medicine.id,
      name: medicine.name,
      manufacturer: medicine.manufacturer,
      category: medicine.category,
      price: String((medicine.priceCents / 100).toFixed(2)),
      stock: String(medicine.quantity),
      reorderLevel: String(medicine.reorderLevel),
      description: medicine.description ?? '',
      expiryDate: medicine.expiryDate ? medicine.expiryDate.slice(0, 10) : '',
      batchNumber: medicine.batchNumber ?? '',
      unit: medicine.unit ?? 'Tablet'
    });
    setFormError('');
    setIsEditMedicineOpen(true);
  }

  function buildMedicineFromForm(existingId?: string): Medicine | null {
    const price = Number(medicineFormData.price);
    const quantity = Number(medicineFormData.stock);
    const reorderLevel = Number(medicineFormData.reorderLevel);

    if (
      !medicineFormData.name.trim() ||
      !medicineFormData.manufacturer.trim() ||
      !medicineFormData.category.trim() ||
      Number.isNaN(price) ||
      price < 0 ||
      !Number.isInteger(quantity) ||
      quantity < 0 ||
      !Number.isInteger(reorderLevel) ||
      reorderLevel < 0
    ) {
      return null;
    }

    return {
      id: existingId ?? `M${Date.now()}`,
      name: medicineFormData.name.trim(),
      manufacturer: medicineFormData.manufacturer.trim(),
      category: medicineFormData.category.trim(),
      priceCents: Math.round(price * 100),
      quantity,
      reorderLevel,
      description: medicineFormData.description.trim() || 'No description recorded',
      expiryDate: medicineFormData.expiryDate || undefined,
      batchNumber: medicineFormData.batchNumber.trim() || undefined,
      unit: medicineFormData.unit.trim() || undefined
    };
  }

  async function saveNewMedicine() {
    const medicine = buildMedicineFromForm();
    if (!medicine) return;
    try {
      const saved = await hospitalApi.createMedicine(medicine);
      setMedicines((current) => [...current, saved]);
      setSelectedMedicine(saved);
      setIsAddMedicineOpen(false);
      resetMedicineForm();
      setFormError('');
      setError('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to add medicine');
    }
  }

  async function saveEditedMedicine() {
    const selectedId = medicineFormData.id || selectedMedicine?.id;
    if (!selectedId) return;
    const medicine = buildMedicineFromForm(selectedId);
    if (!medicine) return;
    try {
      const saved = await hospitalApi.updateMedicine(selectedId, medicine);
      setMedicines((current) => current.map((item) => (item.id === selectedId ? saved : item)));
      setCart((current) => current.map((item) => (item.medicine.id === selectedId ? { ...item, medicine: saved } : item)));
      setSelectedMedicine(saved);
      setIsEditMedicineOpen(false);
      resetMedicineForm();
      setFormError('');
      setError('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to update medicine');
    }
  }

  async function deleteMedicine(medicine: Medicine) {
    if (!confirm(`Delete ${medicine.name} from pharmacy inventory?`)) return;
    try {
      await hospitalApi.deleteMedicine(medicine.id);
      setMedicines((current) => current.filter((item) => item.id !== medicine.id));
      setCart((current) => current.filter((item) => item.medicine.id !== medicine.id));
      setSelectedMedicine((current) => (current?.id === medicine.id ? undefined : current));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete medicine');
    }
  }

  return (
    <section className="clinical-panel min-h-[calc(100vh-132px)] p-4">
      <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
        <div>
          <h2 className="text-xl font-bold text-[#23313d]">Pharmacy</h2>
          <p className="text-sm text-muted-foreground">Inventory control, prescription dispensing, and invoice posting</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {lowStockCount > 0 && (
            <div className="flex h-8 items-center gap-2 border border-[#d9a441] bg-[#fff8e5] px-3 font-semibold text-[#7a5412]">
              <AlertTriangle className="h-4 w-4" />
              {lowStockCount} low stock
            </div>
          )}
          {expiringCount > 0 && (
            <div className="flex h-8 items-center gap-2 border border-red-300 bg-red-50 px-3 font-semibold text-red-700">
              <AlertTriangle className="h-4 w-4" />
              {expiringCount} expiring soon
            </div>
          )}
        </div>
      </div>
      {error && <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {isLoading && <div className="mb-3 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">Loading pharmacy data from database...</div>}

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="dispense">Dispense Medicine</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <InventoryTab
            category={category}
            categories={categories}
            columns={inventoryColumns}
            filteredMedicines={filteredMedicines}
            onAddMedicine={openAddMedicine}
            onDeleteMedicine={deleteMedicine}
            onEditMedicine={openEditMedicine}
            search={search}
            selectedMedicine={selectedMedicine}
            setCategory={setCategory}
            setSearch={setSearch}
            setSelectedMedicine={setSelectedMedicine}
          />
        </TabsContent>

        <TabsContent value="dispense">
          <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-4">
            <div className="min-w-0 space-y-4">
              <div className="clinical-panel p-3">
                <div className="mb-3 grid grid-cols-[240px_1fr_180px] gap-3">
                  <div>
                    <Label>Patient</Label>
                    <select
                      className="mt-1 h-8 w-full rounded-sm border border-input bg-white px-2 text-sm"
                      value={selectedPatientId}
                      onChange={(event) => setSelectedPatientId(event.target.value)}
                    >
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.id} - {patient.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Search medicines</Label>
                    <div className="mt-1 flex">
                      <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ID, name, manufacturer" />
                      <Button className="ml-2" variant="outline" size="icon" title="Search">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <select
                      className="mt-1 h-8 w-full rounded-sm border border-input bg-white px-2 text-sm"
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                    >
                      {categories.map((item) => (
                        <option key={item} value={item}>
                          {item === 'all' ? 'All categories' : item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <form
                  className="mb-3 grid grid-cols-3 gap-3 border border-border bg-[#f7f9fb] p-3"
                  onSubmit={(event) => event.preventDefault()}
                >
                  <div>
                    <Label>Default dosage</Label>
                    <Input className="mt-1" {...prescriptionForm.register('dosage')} />
                    {prescriptionForm.formState.errors.dosage && (
                      <p className="mt-1 text-xs font-semibold text-destructive">{prescriptionForm.formState.errors.dosage.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>Default frequency</Label>
                    <Input className="mt-1" {...prescriptionForm.register('frequency')} />
                    {prescriptionForm.formState.errors.frequency && (
                      <p className="mt-1 text-xs font-semibold text-destructive">{prescriptionForm.formState.errors.frequency.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>Default duration</Label>
                    <Input className="mt-1" {...prescriptionForm.register('duration')} />
                    {prescriptionForm.formState.errors.duration && (
                      <p className="mt-1 text-xs font-semibold text-destructive">{prescriptionForm.formState.errors.duration.message}</p>
                    )}
                  </div>
                </form>

                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-base font-bold">Available Medicines</h3>
                  <Button size="sm" onClick={() => addToCart()}>
                    <PackagePlus className="h-4 w-4" />
                    Add Medicine
                  </Button>
                </div>
                <DataTable
                  columns={inventoryColumns}
                  data={filteredMedicines}
                  getRowId={(row) => row.id}
                  onRowClick={(row) => {
                    setSelectedMedicine(row);
                    addToCart(row);
                  }}
                  selectedId={selectedMedicine?.id}
                />
              </div>

              <div className="clinical-panel p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-base font-bold">Selected Medicines for Prescription</h3>
                  <Button variant="outline" size="sm" onClick={removeSelectedFromCart}>
                    Remove
                  </Button>
                </div>
                <DataTable columns={cartColumns} data={cart} getRowId={(row) => row.medicine.id} selectedId={selectedMedicine?.id} />
                <div className="mt-3 flex justify-end text-xl font-bold">Total: {formatCurrency(cartTotal)}</div>
              </div>
            </div>

            {selectedPatient
              ? <InvoicePreview patient={selectedPatient} activeInvoice={activeInvoice} cart={cart} pendingTotal={cartTotal} onDispense={dispenseMedicine} isDispensing={isDispensing} />
              : <div className="clinical-panel flex min-h-[620px] flex-col p-4 items-center justify-center text-gray-500"><p className="text-sm">Select a patient to begin prescribing</p></div>
            }
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Medicine Dialog */}
      <Dialog open={isAddMedicineOpen} onOpenChange={(open) => { setIsAddMedicineOpen(open); if (!open) setFormError(''); }}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Add New Medicine</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="medicine-name">Medicine Name *</Label>
                <Input
                  id="medicine-name"
                  placeholder="e.g., Paracetamol"
                  value={medicineFormData.name}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="medicine-manufacturer">Manufacturer *</Label>
                <Input
                  id="medicine-manufacturer"
                  placeholder="e.g., HealWell Pharma"
                  value={medicineFormData.manufacturer}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, manufacturer: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="medicine-category">Category *</Label>
                <Input
                  id="medicine-category"
                  placeholder="e.g., Pain Relief"
                  value={medicineFormData.category}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, category: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="medicine-price">Price (Rs.) *</Label>
                <Input
                  id="medicine-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={medicineFormData.price}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, price: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="medicine-stock">Stock Quantity *</Label>
                <Input
                  id="medicine-stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={medicineFormData.stock}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, stock: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="medicine-reorder">Reorder Level *</Label>
                <Input
                  id="medicine-reorder"
                  type="number"
                  min="0"
                  placeholder="20"
                  value={medicineFormData.reorderLevel}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, reorderLevel: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="medicine-unit">Unit</Label>
                <select
                  id="medicine-unit"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={medicineFormData.unit}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, unit: e.target.value })}
                >
                  <option>Tablet</option>
                  <option>Capsule</option>
                  <option>Syrup (ml)</option>
                  <option>Injection (ml)</option>
                  <option>Cream (g)</option>
                  <option>Drops</option>
                  <option>Sachet</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="medicine-expiry">Expiry Date</Label>
                <Input
                  id="medicine-expiry"
                  type="date"
                  value={medicineFormData.expiryDate}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, expiryDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="medicine-batch">Batch Number</Label>
                <Input
                  id="medicine-batch"
                  placeholder="e.g., BATCH-2024-001"
                  value={medicineFormData.batchNumber}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, batchNumber: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="medicine-description">Description</Label>
                <Input
                  id="medicine-description"
                  placeholder="Clinical note or pack information"
                  value={medicineFormData.description}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, description: e.target.value })}
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
              <Button variant="outline" onClick={() => setIsAddMedicineOpen(false)}>Cancel</Button>
              <Button onClick={saveNewMedicine}>Add Medicine</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditMedicineOpen} onOpenChange={(open) => { setIsEditMedicineOpen(open); if (!open) setFormError(''); }}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Edit Medicine</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-medicine-name">Medicine Name *</Label>
                <Input
                  id="edit-medicine-name"
                  value={medicineFormData.name}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-medicine-manufacturer">Manufacturer *</Label>
                <Input
                  id="edit-medicine-manufacturer"
                  value={medicineFormData.manufacturer}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, manufacturer: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-medicine-category">Category *</Label>
                <Input
                  id="edit-medicine-category"
                  value={medicineFormData.category}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, category: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-medicine-price">Price (Rs.) *</Label>
                <Input
                  id="edit-medicine-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={medicineFormData.price}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, price: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-medicine-stock">Stock Quantity *</Label>
                <Input
                  id="edit-medicine-stock"
                  type="number"
                  min="0"
                  value={medicineFormData.stock}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, stock: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-medicine-reorder">Reorder Level *</Label>
                <Input
                  id="edit-medicine-reorder"
                  type="number"
                  min="0"
                  value={medicineFormData.reorderLevel}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, reorderLevel: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-medicine-unit">Unit</Label>
                <select
                  id="edit-medicine-unit"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  value={medicineFormData.unit}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, unit: e.target.value })}
                >
                  <option>Tablet</option>
                  <option>Capsule</option>
                  <option>Syrup (ml)</option>
                  <option>Injection (ml)</option>
                  <option>Cream (g)</option>
                  <option>Drops</option>
                  <option>Sachet</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit-medicine-expiry">Expiry Date</Label>
                <Input
                  id="edit-medicine-expiry"
                  type="date"
                  value={medicineFormData.expiryDate}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, expiryDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-medicine-batch">Batch Number</Label>
                <Input
                  id="edit-medicine-batch"
                  value={medicineFormData.batchNumber}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, batchNumber: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-medicine-description">Description</Label>
                <Input
                  id="edit-medicine-description"
                  value={medicineFormData.description}
                  onChange={(e) => setMedicineFormData({ ...medicineFormData, description: e.target.value })}
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
              <Button variant="outline" onClick={() => setIsEditMedicineOpen(false)}>Cancel</Button>
              <Button onClick={saveEditedMedicine}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

type InventoryTabProps = {
  search: string;
  setSearch: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  categories: string[];
  selectedMedicine?: Medicine;
  setSelectedMedicine: (medicine: Medicine) => void;
  filteredMedicines: Medicine[];
  columns: ColumnDef<Medicine>[];
  onAddMedicine: () => void;
  onEditMedicine: (medicine: Medicine) => void;
  onDeleteMedicine: (medicine: Medicine) => void;
};

function InventoryTab(props: InventoryTabProps) {
  return (
    <div className="clinical-panel p-3">
      <div className="mb-3 grid grid-cols-[320px_220px_1fr] gap-3">
        <div>
          <Label>Search</Label>
          <Input className="mt-1" value={props.search} onChange={(event) => props.setSearch(event.target.value)} />
        </div>
        <div>
          <Label>Category</Label>
          <select
            className="mt-1 h-8 w-full rounded-sm border border-input bg-white px-2 text-sm"
            value={props.category}
            onChange={(event) => props.setCategory(event.target.value)}
          >
            {props.categories.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? 'All categories' : item}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end justify-end gap-2">
          <Button variant="outline" size="sm" onClick={props.onAddMedicine}>Add Medicine</Button>
          <Button variant="outline" size="sm" disabled={!props.selectedMedicine} onClick={() => {
            if (props.selectedMedicine) props.onEditMedicine(props.selectedMedicine);
          }}>Edit</Button>
          <Button variant="outline" size="sm" disabled={!props.selectedMedicine} onClick={() => {
            if (props.selectedMedicine) props.onDeleteMedicine(props.selectedMedicine);
          }}>Delete</Button>
          <MedicineDetailsDialog medicine={props.selectedMedicine} />
        </div>
      </div>
      <DataTable
        columns={props.columns}
        data={props.filteredMedicines}
        getRowId={(row) => row.id}
        selectedId={props.selectedMedicine?.id}
        onRowClick={props.setSelectedMedicine}
      />
    </div>
  );
}

function MedicineDetailsDialog({ medicine }: { medicine?: Medicine }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={!medicine}>
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Medicine Details</DialogTitle>
        </DialogHeader>
        {medicine && (
          <div className="grid grid-cols-[220px_1fr] gap-y-4 px-8 py-7 text-sm">
            <h3 className="col-span-2 mb-2 text-2xl font-bold">Medicine Information</h3>
            <strong>Medicine ID:</strong>
            <span>{medicine.id}</span>
            <strong>Name:</strong>
            <span>{medicine.name}</span>
            <strong>Manufacturer:</strong>
            <span>{medicine.manufacturer}</span>
            <strong>Category:</strong>
            <span>{medicine.category}</span>
            <strong>Price:</strong>
            <span>{formatCurrency(medicine.priceCents)}</span>
            <strong>Unit:</strong>
            <span>{medicine.unit ?? '—'}</span>
            <strong>Quantity:</strong>
            <span>{medicine.quantity}</span>
            <strong>Batch Number:</strong>
            <span>{medicine.batchNumber ?? '—'}</span>
            <strong>Expiry Date:</strong>
            <span>{medicine.expiryDate ? medicine.expiryDate.slice(0, 10) : '—'}</span>
            <strong>Description:</strong>
            <span>{medicine.description}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InvoicePreview({
  patient,
  activeInvoice,
  cart,
  pendingTotal,
  onDispense,
  isDispensing
}: {
  patient: Patient;
  activeInvoice?: Invoice;
  cart: CartItem[];
  pendingTotal: number;
  onDispense: () => void;
  isDispensing: boolean;
}) {
  const pendingItems = cart.map((item) => ({
    description: `Medicine - ${item.medicine.name}`,
    quantity: item.quantity,
    amountCents: item.quantity * item.medicine.priceCents
  }));
  const activeInvoiceTotalCents = activeInvoice ? Math.round(activeInvoice.total * 100) : 0;
  const total = activeInvoiceTotalCents + pendingTotal;

  return (
    <aside className="clinical-panel flex min-h-[620px] flex-col p-4">
      <div className="mb-4 border-b border-border pb-3 text-center">
        <h3 className="text-xl font-bold">HMS — HOSPITAL MANAGEMENT SYSTEM</h3>
        <p className="text-xs text-muted-foreground">123 Medical City, Lahore, Pakistan</p>
        <p className="text-xs text-muted-foreground">Phone: +92-42-123-4567 | Email: info@hms.com</p>
      </div>
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <h4 className="text-lg font-bold">Invoice</h4>
        </div>
        <p className="mt-2 text-sm">Invoice #: {activeInvoice?.invoiceNo ?? 'New pharmacy invoice'}</p>
        <p className="text-sm">Payment Status: {activeInvoice?.status ?? 'UNPAID'}</p>
      </div>

      <div className="mb-4 text-sm">
        <h4 className="mb-1 font-bold">Patient Information</h4>
        <p>ID: {patient.id}</p>
        <p>Name: {patient.name}</p>
        <p>Contact: {patient.contact}</p>
      </div>

      <div className="flex-1">
        <h4 className="mb-2 font-bold">Billing Details</h4>
        <table className="data-grid">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {activeInvoice?.items.map((item, index) => (
              <tr key={`${item.description}-${index}`}>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(Math.round(item.amount * 100))}</td>
              </tr>
            ))}
            {pendingItems.map((item, index) => (
              <tr key={`${item.description}-pending-${index}`}>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.amountCents)}</td>
              </tr>
            ))}
            {!activeInvoice && pendingItems.length === 0 && (
              <tr>
                <td>No items selected</td>
                <td>-</td>
                <td>{formatCurrency(0)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 border-t border-border pt-3 text-sm">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
        <div className="flex justify-between">
          <span>Discount (0.0%):</span>
          <span>{formatCurrency(0)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax (0.0%):</span>
          <span>{formatCurrency(0)}</span>
        </div>
        <div className="mt-2 flex justify-between text-xl font-bold">
          <span>Total:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <Button className="mt-4 w-full" disabled={pendingTotal <= 0 || isDispensing} onClick={onDispense}>
        {isDispensing ? 'Dispensing...' : 'Dispense Medicine and Update Invoice'}
      </Button>
    </aside>
  );
}
