/**
 * Shared Domain Entities
 * 
 * This file contains business-critical types and enums that are shared 
 * across multiple feature modules.
 */

export enum Role {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    SELLER = 'SELLER',
    CUSTOMER = 'CUSTOMER'
}

export enum OrderStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    PROCESSING = 'PROCESSING',
    PACKED = 'PACKED',
    SHIPPED = 'SHIPPED',
    OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    REFUNDED = 'REFUNDED'
}

export enum PaymentStatus {
    UNPAID = 'UNPAID',
    PROCESSING = 'PROCESSING',
    PAID = 'PAID',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED',
    PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

export enum TransactionStatus {
    CREATED = 'CREATED',
    PENDING = 'PENDING',
    PAID = 'PAID',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED'
}

export enum PayoutStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    PAID = 'PAID',
    COMPLETED = 'COMPLETED',
    REJECTED = 'REJECTED'
}

export enum PaymentFailureReason {
    NONE = 'NONE',
    EXPIRED_CARD = 'EXPIRED_CARD',
    INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
    AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
    DECLINED = 'DECLINED',
    NETWORK_ERROR = 'NETWORK_ERROR',
    FRAUD_SUSPECTED = 'FRAUD_SUSPECTED',
    INVALID_CARD = 'INVALID_CARD',
    CARD_NOT_SUPPORTED = 'CARD_NOT_SUPPORTED'
}

export enum EmailStatus {
    PENDING = 'PENDING',
    SENT = 'SENT',
    FAILED = 'FAILED'
}

export enum ReturnStatus {
    REQUESTED = 'REQUESTED',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    PICKUP_SCHEDULED = 'PICKUP_SCHEDULED',
    PICKED_UP = 'PICKED_UP',
    REFUNDED = 'REFUNDED'
}

export enum ShipmentStatus {
    PENDING = 'PENDING',
    PICKUP_SCHEDULED = 'PICKUP_SCHEDULED',
    IN_TRANSIT = 'IN_TRANSIT',
    OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
    DELIVERED = 'DELIVERED',
    RETURNED = 'RETURNED',
    CANCELLED = 'CANCELLED'
}

export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    SELLER = 'SELLER',
    CUSTOMER = 'CUSTOMER'
}

export interface IUserDomain {
    id: string;
    email: string;
    name: string;
    role: Role;
}

