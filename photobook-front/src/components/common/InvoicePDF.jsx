import { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/* ─────────────────────────────────────────────────────────────────────────────
   InvoicePDF
   - Rend un template HTML stylisé dans un div hors écran
   - html2canvas capture le div en image haute résolution
   - jsPDF convertit l'image en PDF A5
   - Le PDF est téléchargé ou ouvert selon le mode choisi
───────────────────────────────────────────────────────────────────────────── */

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmtDate = (d, opts = {}) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', ...opts,
  });
};

const fmtPrice = (v) => {
  if (!v) return '0 GNF';
  return new Intl.NumberFormat('fr-GN', {
    style: 'currency', currency: 'GNF', minimumFractionDigits: 0,
  }).format(Number(v));
};

const STATUS = {
  paid:      { label: '✓ PAYÉE',      bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
  pending:   { label: '⏳ EN ATTENTE', bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  cancelled: { label: '✗ ANNULÉE',    bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
};

/* ── Template HTML de la facture ─────────────────────────────────────────── */
const InvoiceTemplate = ({ invoice }) => {
  const s    = STATUS[invoice.status] ?? STATUS.pending;
  const ht   = Number(invoice.amountHt   ?? 0);
  const ttc  = Number(invoice.amountTtc  ?? invoice.amount ?? 0);
  const tax  = Number(invoice.taxRate    ?? 18);
  const tva  = ttc - ht;
  const client  = invoice.booking?.client  ?? {};
  const service = invoice.booking?.service ?? {};

  return (
    <div style={{
      width: '420px',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '11px',
      color: '#1a1a1a',
      backgroundColor: '#fff',
      padding: '28px 24px',
      lineHeight: '1.5',
    }}>

      {/* ── En-tête ────────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', paddingBottom: '16px', borderBottom: '2px solid #1a1a1a', marginBottom: '14px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 8px', fontSize: '22px',
        }}>📷</div>
        <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>
          SanohPhoto
        </div>
        <div style={{ fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase', color: '#888', marginTop: '2px' }}>
          Studio · Photographe Professionnel
        </div>
        <div style={{ fontSize: '9px', color: '#666', marginTop: '6px', lineHeight: '1.7' }}>
          Kaloum, Avenue de la République · Conakry, Guinée<br />
          📞 +224 620 00 00 00 · ✉ contact@sanohphotography.com
        </div>
      </div>

      {/* ── Titre + statut ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Facture
          </div>
          <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 'bold', marginTop: '2px' }}>
            # {invoice.invoiceNumber}
          </div>
        </div>
        <div style={{
          padding: '4px 10px', borderRadius: '3px', fontSize: '9px',
          fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase',
          background: s.bg, color: s.color, border: `1px solid ${s.border}`,
        }}>
          {s.label}
        </div>
      </div>

      {/* ── Séparateur ─────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px dashed #ccc', margin: '10px 0' }} />

      {/* ── Infos émission / client ────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '2px' }}>
            Émise le
          </div>
          <div style={{ fontSize: '10px' }}>{fmtDate(invoice.issuedAt ?? invoice.createdAt)}</div>
          {invoice.dueDate && (
            <>
              <div style={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginTop: '6px', marginBottom: '2px' }}>
                Échéance
              </div>
              <div style={{ fontSize: '10px' }}>{fmtDate(invoice.dueDate)}</div>
            </>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '2px' }}>
            Facturé à
          </div>
          <div style={{ fontSize: '10px', lineHeight: '1.6' }}>
            <strong>{client.firstName} {client.lastName}</strong><br />
            {client.email}<br />
            {client.phone && <>{client.phone}</>}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px dashed #ccc', margin: '10px 0' }} />

      {/* ── Tableau prestations ────────────────────────────────────────── */}
      <div style={{ background: '#1a1a1a', color: '#fff', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', fontSize: '8px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
        <span>Prestation</span>
        <span>Montant HT</span>
      </div>

      <div style={{ padding: '10px', borderBottom: '1px dashed #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{service.name ?? 'Séance photo'}</div>
            <div style={{ fontSize: '9px', color: '#666', marginTop: '3px', lineHeight: '1.6' }}>
              {invoice.booking?.bookingDate && <>📅 {fmtDate(invoice.booking.bookingDate)}</>}
              {invoice.booking?.startTime   && <> · 🕐 {invoice.booking.startTime}</>}
              {service.durationMin          && <> · ⏱ {service.durationMin} min</>}
              {invoice.booking?.clientNotes && <><br />📝 {invoice.booking.clientNotes}</>}
            </div>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', textAlign: 'right', minWidth: '90px' }}>
            {fmtPrice(ht)}
          </div>
        </div>
      </div>

      {/* ── Totaux ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '4px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '9px', color: '#555' }}>
          <span>Sous-total HT</span>
          <span>{fmtPrice(ht)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '9px', color: '#555' }}>
          <span>TVA ({tax}%)</span>
          <span>{fmtPrice(tva)}</span>
        </div>
      </div>

      <div style={{
        background: '#1a1a1a', color: '#fff', padding: '8px 10px', marginTop: '4px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Total TTC
        </span>
        <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#f59e0b' }}>
          {fmtPrice(ttc)}
        </span>
      </div>

      {/* ── Paiement confirmé ──────────────────────────────────────────── */}
      {invoice.status === 'paid' && invoice.paidAt && (
        <div style={{
          background: '#d1fae5', border: '1px solid #6ee7b7',
          padding: '8px', marginTop: '12px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#065f46', textTransform: 'uppercase' }}>
            ✓ Paiement reçu
          </div>
          <div style={{ fontSize: '9px', color: '#047857', marginTop: '2px' }}>
            Le {fmtDate(invoice.paidAt, { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      )}

      {/* ── Pseudo code-barre ──────────────────────────────────────────── */}
      <div style={{ borderTop: '1px dashed #ccc', margin: '14px 0 6px' }} />
      <div style={{ textAlign: 'center', fontFamily: 'Courier New, monospace', fontSize: '13px', letterSpacing: '2px', color: '#1a1a1a' }}>
        ||| {invoice.invoiceNumber} |||
      </div>
      <div style={{ borderTop: '1px dashed #ccc', margin: '6px 0 12px' }} />

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', fontSize: '8px', color: '#aaa', lineHeight: '1.8' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1a1a1a', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
          Merci de votre confiance !
        </div>
        SanohPhoto Studio · Conakry, Guinée<br />
        Ce document tient lieu de facture officielle<br />
        Émis le {fmtDate(invoice.issuedAt ?? invoice.createdAt)} · Réf : {invoice.invoiceNumber}
      </div>

    </div>
  );
};

/* ── Hook utilitaire : générer le PDF depuis le DOM ──────────────────────── */
export const useInvoicePDF = () => {
  const templateRef = useRef(null);

  const generate = async (invoice, mode = 'download') => {
    if (!templateRef.current) return;

    // Rendre le div visible le temps de la capture
    templateRef.current.style.display = 'block';

    try {
      const canvas = await html2canvas(templateRef.current, {
        scale: 2,           // haute résolution
        useCORS: false,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);

      // A5 en mm : 148 × 210
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5',
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = canvas.height / canvas.width;
      const imgH  = pageW * ratio;

      // Si le contenu dépasse une page, on ajoute des pages
      let posY = 0;
      while (posY < imgH) {
        if (posY > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -posY, pageW, pageW * ratio);
        posY += pageH;
      }

      const filename = `facture-${invoice.invoiceNumber}.pdf`;

      if (mode === 'preview') {
        const blob = pdf.output('blob');
        const url  = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 30000);
      } else {
        pdf.save(filename);
      }
    } finally {
      templateRef.current.style.display = 'none';
    }
  };

  return { templateRef, generate };
};

/* ── Composant wrapper exposant le template hors écran ───────────────────── */
const InvoicePDF = ({ invoice, templateRef }) => (
  <div
    ref={templateRef}
    style={{
      position: 'fixed',
      top: '-9999px',
      left: '-9999px',
      display: 'none',
      zIndex: -1,
    }}
    aria-hidden="true"
  >
    {invoice && <InvoiceTemplate invoice={invoice} />}
  </div>
);

export default InvoicePDF;
