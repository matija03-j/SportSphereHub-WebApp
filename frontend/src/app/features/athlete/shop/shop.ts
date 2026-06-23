import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShopService } from '../../../core/shop.service';
import { SportService } from '../../../core/sport.service';
import { Equipment, Order, Sport } from '../../../core/models';
import { UPLOADS_BASE } from '../../../core/config';

@Component({
  selector: 'app-shop',
  imports: [DatePipe, FormsModule],
  templateUrl: './shop.html',
})
export class Shop implements OnInit {
  private shopService = inject(ShopService);
  private sportService = inject(SportService);

  uploads = UPLOADS_BASE;
  equipment = signal<Equipment[]>([]);
  orders = signal<Order[]>([]);
  sports = signal<Sport[]>([]);
  sportFilter = '';
  message = signal('');
  error = signal('');

  /** cart: equipmentId -> qty */
  cart = signal<Record<string, number>>({});

  cartItems = computed(() =>
    Object.entries(this.cart())
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const eq = this.equipment().find((e) => e._id === id)!;
        return { eq, qty, subtotal: eq ? eq.price * qty : 0 };
      })
      .filter((i) => i.eq)
  );
  cartTotal = computed(() => this.cartItems().reduce((s, i) => s + i.subtotal, 0));

  ngOnInit(): void {
    this.sportService.list().subscribe((s) => this.sports.set(s));
    this.loadEquipment();
    this.loadOrders();
  }

  loadEquipment(): void {
    this.shopService.equipment(this.sportFilter || undefined).subscribe((e) => this.equipment.set(e));
  }
  loadOrders(): void {
    this.shopService.myOrders().subscribe((o) => this.orders.set(o));
  }

  add(eq: Equipment): void {
    const c = { ...this.cart() };
    c[eq._id] = (c[eq._id] || 0) + 1;
    this.cart.set(c);
  }
  setQty(id: string, qty: number): void {
    const c = { ...this.cart() };
    c[id] = Math.max(0, qty);
    this.cart.set(c);
  }
  removeFromCart(id: string): void {
    const c = { ...this.cart() };
    delete c[id];
    this.cart.set(c);
  }

  checkout(): void {
    const items = this.cartItems().map((i) => ({ equipment: i.eq._id, qty: i.qty }));
    if (!items.length) return;
    this.shopService.order(items).subscribe({
      next: () => {
        this.message.set('Porudžbina je kreirana.');
        this.cart.set({});
        this.loadEquipment();
        this.loadOrders();
      },
      error: (err) => this.error.set(err?.error?.message || 'Naručivanje nije uspelo.'),
    });
  }

  cancelOrder(o: Order): void {
    this.shopService.cancelOrder(o._id).subscribe({
      next: () => { this.loadOrders(); this.loadEquipment(); },
      error: (err) => this.error.set(err?.error?.message || 'Otkazivanje nije uspelo.'),
    });
  }

  img(path: string): string {
    return this.uploads + '/' + path.replace('/uploads/', '');
  }
}
