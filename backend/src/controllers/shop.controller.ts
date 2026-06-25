import { Request, Response, NextFunction } from 'express';
import { Equipment, Order } from '../models';
import { HttpError } from '../middleware/error';

/** Equipment catalog (optionally filtered by sport). */
export async function listEquipment(req: Request, res: Response, next: NextFunction) {
  try {
    const { sport } = req.query as Record<string, string>;
    const match: any = {};
    if (sport) match.sport = sport;
    const items = await Equipment.find(match)
      .populate('facility', 'name')
      .lean();
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function myOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await Order.find({ user: req.user!.username })
      .sort({ createdAt: -1 })
      .populate('items.equipment', 'name image')
      .lean();
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

/** Place an order from a cart of { equipment, qty } items (no online payment). */
export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const items: Array<{ equipment: string; qty: number }> = req.body.items || [];
    if (!items.length) throw new HttpError(422, 'Korpa je prazna.');

    let total = 0;
    const orderItems = [];
    for (const it of items) {
      const eq = await Equipment.findById(it.equipment);
      if (!eq) throw new HttpError(404, 'Oprema nije pronađena.');
      const qty = Number(it.qty) || 1;
      if (qty > eq.stock) throw new HttpError(409, `Nedovoljno na stanju: ${eq.name}.`);
      total += eq.price * qty;
      orderItems.push({ equipment: eq._id, qty, priceAtOrder: eq.price });
      eq.stock -= qty;
      await eq.save();
    }

    const order = await Order.create({
      user: req.user!.username,
      items: orderItems,
      total,
      status: 'ordered',
    });
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

/** Athlete cancels an active (ordered) order; stock is restored. */
export async function cancelOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user!.username });
    if (!order) throw new HttpError(404, 'Porudžbina nije pronađena.');
    if (order.status !== 'ordered' && order.status !== 'accepted') {
      throw new HttpError(400, 'Samo aktivne porudžbine se mogu otkazati.');
    }
    for (const it of order.items) {
      await Equipment.updateOne({ _id: it.equipment }, { $inc: { stock: it.qty } });
    }
    order.status = 'cancelled';
    await order.save();
    res.json(order);
  } catch (err) {
    next(err);
  }
}
