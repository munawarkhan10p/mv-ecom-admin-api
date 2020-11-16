export enum Status {
    ACTIVE = 'ACTIVE',
    DISABLED = 'DISABLED'
}

export enum AccountRequestStatus {
    UNDECIDED = 'UNDECIDED',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

// ClientState is to maintain the current state subscription state of a client
export enum VendorState {
    // INTERNAL clients must acquire this state initially
    // EXTERNAL clients must acquire this state when the client has an active subscription
    NORMAL = 'NORMAL',

    // INTERNAL clients must never acquire this state
    // EXTERNAL clients must acquire this state initially or when the subscription is canceled
    SUBSCRIPTION_REQUIRED = 'SUBSCRIPTION_REQUIRED',

    // INTERNAL clients must never acquire this state
    // EXTERNAL clients must acquire this state if the payment for the next billing period fails
    SUBSCRIPTION_RENEW_FAILED = 'SUBSCRIPTION_RENEW_FAILED',

    // INTERNAL clients must acquire this state when their current users/targets are more than their limits
    // EXTERNAL clients must acquire this state when their current users/targets are more than their limits
    LIMIT_EXCEEDED = 'LIMIT_EXCEEDED',
}

export enum VendorType {
    INTERNAL = 'INTERNAL',
    EXTERNAL = 'EXTERNAL',
}

export enum Role {
    ADMIN = 'ADMIN',
    VENDOR = 'VENDOR',
}

export enum VendorRole {
    ADMIN = 'ADMIN',
    ANALYST = 'ANALYST',
    VETTER = 'VETTER',
}

export enum AlertType {
    NOOP = 'NOOP',
    EMAIL = 'EMAIL',
}

export enum AlertFrequency {
    DAILY = 'DAILY',
    AS_IT_HAPPENS = 'AS_IT_HAPPENS'
}

export enum OrderStatus {
    PLACED = 'PLACED',
    PROCESSING = 'PROCESSING',
    DELIVERED = 'DELIVERED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
    ON_HOLD = 'ON_HOLD',
    REFUNDED = 'REFUNDED',
    WAITING_FOR_PAYMENT = 'WAITING_FOR_PAYMENT' 
} 

export enum ProductStatus {
    OUT_OF_STOCK = 'OUT_OF_STOCK',
    IN_STOCK = 'IN_STOCK',
    RUNNING_LOW = 'RUNNING_LOW'

}

export enum CategoryType {
    PHYSICAL = 'PHYSICAL',
    DIGITAL = 'DIGITAL'
}