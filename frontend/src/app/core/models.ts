export type Role = 'athlete' | 'employee' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface Sport {
  _id: string;
  name: string;
}

export interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  profileImage: string;
  sports: string[]; // sport names
  role: Role;
  status: UserStatus;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type ResourceType = 'open' | 'closed' | 'hall';

export interface FacilityResource {
  _id: string;
  name: string;
  type: ResourceType;
  capacity: number;
  equipmentDescription: string;
  sport: string; // sport name
}

export interface Facility {
  _id: string;
  name: string;
  city: string;
  address: string;
  maticniBroj: string;
  pib: string;
  employees: string[] | User[];
  status: 'pending' | 'approved';
  pricePerHour: number;
  workingHours: { open: string; close: string };
  maxNoShows: number;
  sports: string[]; // sport names
  description: string;
  images: string[];
  likes: string[];
  dislikes: string[];
  resources: FacilityResource[];
}

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'no_show'
  | 'completed';

export interface Reservation {
  _id: string;
  facility: Facility | string;
  resourceId: string;
  user: any; // username string, or {username,firstName,lastName} for display
  sport: string; // sport name
  start: string;
  end: string;
  status: ReservationStatus;
}

export interface Promotion {
  _id: string;
  name: string;
  facility: Facility | string;
  startDate: string;
  endDate: string;
  discountType: 'percent' | 'fixed';
  value: number;
  sport: string; // sport name
}

export interface Trainer {
  _id: string;
  name: string;
  specialization: string;
  facility: Facility | string;
  sport: string; // sport name
  pricePerHour: number;
  active: boolean;
  avgRating?: number;
}

export interface Training {
  _id: string;
  trainer: Trainer | string;
  user: any; // username string, or {username,firstName,lastName} for display
  facility: Facility | string;
  sport: string; // sport name
  start: string;
  end: string;
  status: string;
}

export interface Equipment {
  _id: string;
  name: string;
  sport: string; // sport name
  price: number;
  stock: number;
  image: string;
  facility: Facility | string;
}

export type OrderStatus = 'ordered' | 'picked_up' | 'cancelled';

export interface OrderItem {
  equipment: Equipment | string;
  qty: number;
  priceAtOrder: number;
}

export interface Order {
  _id: string;
  user: any; // username string, or {username,firstName,lastName} for display
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface JoinRequest {
  user: any; // username string, or {username,firstName,lastName} for display
  status: 'pending' | 'approved' | 'rejected';
}

export interface TeammateAd {
  _id: string;
  author: any; // username string, or display object
  sport: string; // sport name
  city: string;
  date: string;
  timeFrom: string;
  timeTo: string;
  neededPlayers: number;
  status: 'active' | 'inactive';
  joinRequests: JoinRequest[];
}

export interface Review {
  _id: string;
  user: any; // username string, or {username,firstName,lastName} for display
  facility: Facility | string;
  reaction: 'like' | 'dislike';
  comment: string;
  createdAt: string;
}
