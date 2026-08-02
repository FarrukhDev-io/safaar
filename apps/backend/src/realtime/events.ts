export const SERVER_EVENTS = {
  NOTIFICATION_CREATED: 'notification.created',
  BOOKING_STATUS_CHANGED: 'booking.status_changed',
  PAYMENT_STATUS_CHANGED: 'payment.status_changed',
  SUPPORT_MESSAGE_CREATED: 'support.message_created',
  SUPPORT_TICKET_UPDATED: 'support.ticket_updated',
  SUPPORT_PRESENCE_CHANGED: 'support.presence_changed',
  SUPPORT_TYPING: 'support.typing',
  BOOKING_MESSAGE_CREATED: 'booking.message_created',
  BOOKING_MESSAGE_READ: 'booking.message_read',
  PARTNER_DASHBOARD_UPDATED: 'partner.dashboard_updated',
  ADMIN_DASHBOARD_UPDATED: 'admin.dashboard_updated',
  HOTEL_LISTING_CHANGED: 'hotel.listing_changed',
  HOTEL_SUBMITTED_FOR_REVIEW: 'hotel.submitted_for_review',
  HOTEL_MODERATION_CHANGED: 'hotel.moderation_changed',
  PROMOS_UPDATED: 'promos.updated',
} as const;

export const CLIENT_EVENTS = {
  ROOM_JOIN: 'room.join',
  ROOM_LEAVE: 'room.leave',
  SUPPORT_TYPING: 'support.typing',
  NOTIFICATION_READ: 'notification.read',
} as const;
