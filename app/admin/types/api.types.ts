/**
 * Static row types mirroring the verified backend response DTOs.
 * These are intentionally explicit; they are not generated from entities.
 */

export interface AdminUserRow {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  blocked: boolean;
  active: boolean;
  registrationDate?: string | null;
  lastLoginDate?: string | null;
  ordersCount?: number | null;
}

export interface ItemCategorySummary {
  itemCategoryId: number;
  nameEn?: string | null;
  nameAr?: string | null;
  imageURL?: string | null;
  iconURL?: string | null;
  itemsCount?: number | null;
}

export interface ItemImageRow {
  itemImageId?: number;
  imageUrl?: string | null;
}

export interface ProductRow {
  itemId: number;
  code: string;
  nameEn: string;
  nameAr: string;
  price: number;
  oldPrice?: number | null;
  favorite?: boolean | null;
  active?: boolean | null;
  available?: boolean | null;
  averageRating?: number | null;
  ratingCount?: number | null;
  createdDate?: string | null;
  brand?: string | null;
  releaseYear?: number | null;
  itemCategory?: ItemCategorySummary | null;
  images?: ItemImageRow[] | null;
}

export interface OrderItemLineRow {
  itemLineId?: number;
  totalPrice?: number | null;
  unitPrice?: number | null;
  oldUnitPrice?: number | null;
  quantity?: number | null;
  returnedQuantity?: number | null;
  itemId?: number | null;
  item?: ProductRow | null;
}

export interface OrderRow {
  orderId: number;
  code: string;
  total?: number | null;
  netTotal?: number | null;
  shippingCost?: number | null;
  totalDiscount?: number | null;
  state: string;
  userId?: number | null;
  user?: AdminUserRow | null;
  address?: string | null;
  orderItemLines?: OrderItemLineRow[] | null;
  createdDate?: string | null;
  paymentMethod?: string | null;
}

export interface ReturnOrderRow {
  returnOrderId: number;
  code: string;
  user?: AdminUserRow | null;
  orderItemLineId?: number | null;
  quantity?: number | null;
  reason: string;
  reasonMessage?: string | null;
  item?: ProductRow | null;
  unitPrice?: number | null;
  state: string;
  refundAmount?: number | null;
  createdDate?: string | null;
  address?: string | null;
  paymentMethod?: string | null;
}

export interface GovernorateSummary {
  governorateId: number;
  code?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
}

export interface ShippingRateRow {
  shippingRateId: number;
  governorate?: GovernorateSummary | null;
  shippingCost: number;
  createdDate?: string | null;
  modifiedBy?: string | null;
  modifiedDate?: string | null;
}

export interface PickupPlaceRow {
  pickupPlaceId: number;
  name: string;
  description: string;
  address: string;
  phone: string;
  workingHours: string;
  active: boolean;
  createdDate?: string | null;
  modifiedDate?: string | null;
}

export interface PendingOrderRow {
  orderId: number;
  orderCode: string;
  userName?: string | null;
  userEmail?: string | null;
  state: string;
  orderTotal?: number | null;
  createdDate?: string | null;
}
