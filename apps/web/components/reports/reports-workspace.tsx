'use client';

import { useEffect, useState } from 'react';
import { invoices, patients } from '@/lib/mock-data';
import { hospitalApi } from '@/lib/api';
import { generatePatientReportPDF, generateInvoicePDF } from '@/lib/pdf-utils';
import { formatRupees } from '@/lib/utils';
import type { Patient, Invoice } from '@/types/hospital';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ReportsWorkspace() {
  const [reportType, setReportType] = useState<'patient' | 'invoice'>('patient');
  const [searchTerm, setSearchTerm] = useState('');
  const [savedPatients, setSavedPatients] = useState<Patient[]>(patients);
  const [savedInvoices, setSavedInvoices] = useState<Invoice[]>(invoices);

  useEffect(() => {
    let mounted = true;

    async function loadReportsData() {
      const [patientsData, invoicesData] = await Promise.all([
        hospitalApi.patients(),
        hospitalApi.invoices()
      ]);

      if (!mounted) return;
      setSavedPatients(patientsData);
      setSavedInvoices(invoicesData);
    }

    loadReportsData().catch((error) => {
      console.error('Failed to load reports data', error);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const patientReports = savedPatients.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.includes(searchTerm)
  );

  const invoiceReports = savedInvoices.filter((inv) =>
    inv.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.invoiceNo.includes(searchTerm) ||
    inv.patientId.includes(searchTerm)
  );

  const handleDownloadPatientReport = (patient: Patient) => {
    generatePatientReportPDF(patient);
  };

  const handleDownloadInvoiceReport = (invoice: Invoice) => {
    generateInvoicePDF(invoice);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-300 bg-white p-6">
        <div className="mb-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => {
                setReportType('patient');
                setSearchTerm('');
              }}
              className={`px-6 py-2 font-semibold rounded ${
                reportType === 'patient'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Patient Reports
            </button>
            <button
              onClick={() => {
                setReportType('invoice');
                setSearchTerm('');
              }}
              className={`px-6 py-2 font-semibold rounded ${
                reportType === 'invoice'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Invoice Reports
            </button>
          </div>

          <div className="flex gap-4">
            <Input
              placeholder={
                reportType === 'patient'
                  ? 'Search patient by name or ID...'
                  : 'Search invoice by patient name, invoice number, or ID...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" onClick={() => setSearchTerm('')}>Clear</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'patient' ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">ID</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Age</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Contact</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Disease</th>
                  <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {patientReports.map((patient) => (
                  <tr
                    key={patient.id}
                    className="border-b border-gray-300 hover:bg-blue-50"
                  >
                    <td className="border border-gray-300 px-4 py-2 font-medium text-blue-600">{patient.id}</td>
                    <td className="border border-gray-300 px-4 py-2">{patient.name}</td>
                    <td className="border border-gray-300 px-4 py-2">{patient.age}</td>
                    <td className="border border-gray-300 px-4 py-2">{patient.contact}</td>
                    <td className="border border-gray-300 px-4 py-2">{patient.disease || 'N/A'}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <Button
                        size="sm"
                        className="bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => handleDownloadPatientReport(patient)}
                      >
                        Download PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Invoice #</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Patient ID</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Patient Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Date</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Total</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Status</th>
                  <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoiceReports.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-gray-300 hover:bg-blue-50"
                  >
                    <td className="border border-gray-300 px-4 py-2 font-medium text-blue-600">{invoice.invoiceNo}</td>
                    <td className="border border-gray-300 px-4 py-2">{invoice.patientId}</td>
                    <td className="border border-gray-300 px-4 py-2">{invoice.patientName}</td>
                    <td className="border border-gray-300 px-4 py-2">{invoice.date}</td>
                    <td className="border border-gray-300 px-4 py-2 font-semibold">{formatRupees(invoice.total)}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span
                        className={`font-semibold px-2 py-1 rounded ${
                          invoice.status === 'PAID'
                            ? 'text-green-600 bg-green-50'
                            : invoice.status === 'UNPAID'
                            ? 'text-red-600 bg-red-50'
                            : 'text-gray-600 bg-gray-50'
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <Button
                        size="sm"
                        className="bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => handleDownloadInvoiceReport(invoice)}
                      >
                        Download PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
