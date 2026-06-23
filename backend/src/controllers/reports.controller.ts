import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import PDFDocument from 'pdfkit';
import { Facility, Reservation, Order, Equipment } from '../models';
import { HttpError } from '../middleware/error';

/** Parses ?month=YYYY-MM into [start, end) range. */
function monthRange(month: string): { start: Date; end: Date; label: string } {
  const [y, m] = (month || '').split('-').map(Number);
  if (!y || !m) throw new HttpError(422, 'Parametar mesec (YYYY-MM) je obavezan.');
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  return { start, end, label: `${String(m).padStart(2, '0')}/${y}` };
}

async function myFacilityIds(userId: string): Promise<Types.ObjectId[]> {
  const facilities = await Facility.find({ employees: userId }).select('_id').lean();
  return facilities.map((f) => f._id as Types.ObjectId);
}

function startPdf(res: Response, filename: string): PDFKit.PDFDocument {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);
  return doc;
}

/** Monthly occupancy report (% per resource). */
export async function occupancyReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { start, end, label } = monthRange(req.query.month as string);
    const facilities = await Facility.find({ employees: req.user!.id }).lean();

    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();

    const doc = startPdf(res, `popunjenost-${label.replace('/', '-')}.pdf`);
    doc.fontSize(18).text('Izveštaj o popunjenosti terena', { align: 'center' });
    doc.fontSize(11).text(`Mesec: ${label}`, { align: 'center' });
    doc.moveDown();

    for (const f of facilities) {
      const [openH] = f.workingHours.open.split(':').map(Number);
      const [closeH] = f.workingHours.close.split(':').map(Number);
      const availablePerResource = daysInMonth * Math.max(0, closeH - openH);

      doc.fontSize(14).fillColor('#143a5a').text(`${f.name} (${f.city})`);
      doc.fillColor('black').fontSize(10);

      for (const r of f.resources as any[]) {
        const reservations = await Reservation.find({
          facility: f._id,
          resourceId: r._id,
          status: { $nin: ['cancelled'] },
          start: { $gte: start, $lt: end },
        }).lean();
        const bookedHours = reservations.reduce(
          (sum, x) => sum + (x.end.getTime() - x.start.getTime()) / 3600000,
          0
        );
        const pct = availablePerResource ? (bookedHours / availablePerResource) * 100 : 0;
        doc.text(`  • ${r.name}: ${pct.toFixed(1)}% (${bookedHours.toFixed(0)}/${availablePerResource}h)`);
      }
      doc.moveDown(0.5);
    }
    if (!facilities.length) doc.text('Nemate objekata.');
    doc.end();
  } catch (err) {
    next(err);
  }
}

/** Monthly equipment turnover report. */
export async function equipmentReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { start, end, label } = monthRange(req.query.month as string);
    const ids = await myFacilityIds(req.user!.id);
    const equipment = await Equipment.find({ facility: { $in: ids } }).lean();
    const eqMap = new Map(equipment.map((e) => [String(e._id), e]));

    const orders = await Order.find({
      status: { $ne: 'cancelled' },
      createdAt: { $gte: start, $lt: end },
      'items.equipment': { $in: equipment.map((e) => e._id) },
    }).lean();

    const totals = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const o of orders) {
      for (const it of o.items) {
        const eq = eqMap.get(String(it.equipment));
        if (!eq) continue;
        const cur = totals.get(String(it.equipment)) || { name: eq.name, qty: 0, revenue: 0 };
        cur.qty += it.qty;
        cur.revenue += it.qty * it.priceAtOrder;
        totals.set(String(it.equipment), cur);
      }
    }

    const doc = startPdf(res, `promet-opreme-${label.replace('/', '-')}.pdf`);
    doc.fontSize(18).text('Izveštaj o prometu opreme', { align: 'center' });
    doc.fontSize(11).text(`Mesec: ${label}`, { align: 'center' });
    doc.moveDown();

    let grand = 0;
    doc.fontSize(11);
    for (const [, t] of totals) {
      doc.text(`${t.name}: ${t.qty} kom — ${t.revenue} RSD`);
      grand += t.revenue;
    }
    if (!totals.size) doc.text('Nema prodaje u izabranom mesecu.');
    doc.moveDown();
    doc.fontSize(13).fillColor('#143a5a').text(`Ukupan promet: ${grand} RSD`);
    doc.end();
  } catch (err) {
    next(err);
  }
}
