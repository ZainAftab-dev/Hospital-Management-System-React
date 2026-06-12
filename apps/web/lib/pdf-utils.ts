import jsPDF from 'jspdf';
import type { Patient, Invoice } from '@/types/hospital';

const HOSPITAL_HEADER = {
  name: 'HMS — HOSPITAL MANAGEMENT SYSTEM',
  address: '123 Medical City, Lahore, Pakistan',
  phone: '+92-42-123-4567',
  email: 'info@hms.com'
};

const LINE_HEIGHT = 7;
const PAGE_WIDTH = 210;
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

function addHospitalHeader(doc: jsPDF) {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(HOSPITAL_HEADER.name, PAGE_WIDTH / 2, MARGIN + 5, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(HOSPITAL_HEADER.address, PAGE_WIDTH / 2, MARGIN + 13, { align: 'center' });
  doc.text(`Phone: ${HOSPITAL_HEADER.phone} | Email: ${HOSPITAL_HEADER.email}`, PAGE_WIDTH / 2, MARGIN + 20, { align: 'center' });

  doc.setDrawColor(200, 200, 200);
  doc.line(MARGIN, MARGIN + 25, PAGE_WIDTH - MARGIN, MARGIN + 25);
}

export function generatePatientReportPDF(patient: Patient) {
  const doc = new jsPDF();

  // Add header
  addHospitalHeader(doc);

  // Add report title
  let yPos = MARGIN + 35;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT REPORT', MARGIN, yPos);

  // Add patient information section
  yPos += 12;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Information:', MARGIN, yPos);

  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const patientDetails = [
    `ID: ${patient.id}`,
    `Name: ${patient.name}`,
    `Age: ${patient.age}`,
    `Contact: ${patient.contact}`,
    `Email: ${patient.email || 'N/A'}`,
    `Address: ${patient.address || 'N/A'}`,
    `Gender: ${patient.gender}`,
    `Disease: ${patient.disease || 'N/A'}`,
    `Blood Group: ${patient.bloodGroup || 'N/A'}`,
    `Allergies: ${patient.allergies || 'N/A'}`
  ];

  patientDetails.forEach((detail) => {
    doc.text(detail, MARGIN, yPos);
    yPos += LINE_HEIGHT;
  });

  yPos += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('No medical records found.', MARGIN, yPos);

  // Add footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setDrawColor(200, 200, 200);
  doc.line(MARGIN, 280, PAGE_WIDTH - MARGIN, 280);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, PAGE_WIDTH / 2, 287, { align: 'center' });

  const fileName = `Patient_Report_${patient.id}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

export function generateInvoicePDF(invoice: Invoice) {
  const doc = new jsPDF();

  // Add header
  addHospitalHeader(doc);

  // Add invoice title
  let yPos = MARGIN + 35;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', MARGIN, yPos);

  // Add invoice details
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.invoiceNo}`, MARGIN, yPos);
  yPos += 7;
  doc.text(`Date: ${invoice.date}`, MARGIN, yPos);
  yPos += 7;
  doc.text(`Payment Status: ${invoice.status}`, MARGIN, yPos);

  // Add patient information
  yPos += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Information:', MARGIN, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`ID: ${invoice.patientId}`, MARGIN, yPos);
  yPos += 7;
  doc.text(`Name: ${invoice.patientName}`, MARGIN, yPos);

  // Add billing details table
  yPos += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('Billing Details:', MARGIN, yPos);

  // Table headers
  yPos += 8;
  const tableWidth = CONTENT_WIDTH;
  const colWidths = [tableWidth * 0.4, tableWidth * 0.2, tableWidth * 0.2, tableWidth * 0.2];
  const startX = MARGIN;

  doc.setFillColor(240, 240, 240);
  doc.rect(startX, yPos - 5, tableWidth, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  let xPos = startX;
  doc.text('Description', xPos + 2, yPos);
  xPos += colWidths[0];
  doc.text('Quantity', xPos + 8, yPos);
  xPos += colWidths[1];
  doc.text('Unit Price', xPos + 8, yPos);
  xPos += colWidths[2];
  doc.text('Amount', xPos + 8, yPos);

  // Table rows
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  invoice.items.forEach((item) => {
    xPos = startX;
    doc.text(item.description, xPos + 2, yPos);
    xPos += colWidths[0];
    doc.text(item.quantity.toString(), xPos + 8, yPos);
    xPos += colWidths[1];
    doc.text(`Rs. ${item.unitPrice.toFixed(2)}`, xPos + 8, yPos);
    xPos += colWidths[2];
    doc.text(`Rs. ${item.amount.toFixed(2)}`, xPos + 8, yPos);
    yPos += 7;
  });

  // Totals section
  yPos += 5;
  const totalsStartX = startX + tableWidth * 0.6;
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsStartX, yPos);
  doc.text(`Rs. ${invoice.subtotal.toFixed(2)}`, totalsStartX + 70, yPos);

  yPos += 7;
  doc.text(`Discount (0.0%):`, totalsStartX, yPos);
  doc.text(`Rs. ${invoice.discount.toFixed(2)}`, totalsStartX + 70, yPos);

  yPos += 7;
  doc.text(`Tax (0.0%):`, totalsStartX, yPos);
  doc.text(`Rs. ${invoice.tax.toFixed(2)}`, totalsStartX + 70, yPos);

  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total:', totalsStartX, yPos);
  doc.text(`Rs. ${invoice.total.toFixed(2)}`, totalsStartX + 70, yPos);

  // Add footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setDrawColor(200, 200, 200);
  doc.line(MARGIN, 280, PAGE_WIDTH - MARGIN, 280);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, PAGE_WIDTH / 2, 287, { align: 'center' });

  const fileName = `Invoice_${invoice.invoiceNo}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
