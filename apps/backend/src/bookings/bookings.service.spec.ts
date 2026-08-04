import { PostgresService } from '../infrastructure/postgres.service';
import { EventsService } from '../realtime/events.service';
import { BookingsService } from './bookings.service';

describe('BookingsService.createHotel guest checkout', () => {
  let service: BookingsService;
  let pg: jest.Mocked<Pick<PostgresService, 'query'>>;
  let events: {
    bookingStatusChanged: jest.Mock;
    partnerDashboardUpdated: jest.Mock;
    adminDashboardUpdated: jest.Mock;
  };

  beforeEach(() => {
    pg = {
      query: jest.fn(),
    };
    events = {
      bookingStatusChanged: jest.fn(),
      partnerDashboardUpdated: jest.fn(),
      adminDashboardUpdated: jest.fn(),
    };
    service = new BookingsService(
      pg as unknown as PostgresService,
      events as unknown as EventsService,
    );
  });

  it('stores guest contact fields for unauthenticated hotel bookings', async () => {
    pg.query
      .mockResolvedValueOnce([
        {
          id: 'hotel-1',
          partner_organization_id: 'partner-1',
          partner_type: 'hotel',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'room-1',
          hotel_id: 'hotel-1',
          base_price: '100000',
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await service.createHotel(undefined, {
      hotel_id: 'hotel-1',
      room_id: 'room-1',
      check_in: '2026-08-10',
      check_out: '2026-08-12',
      rooms: 1,
      guests: 2,
      firstName: ' Laziz ',
      lastName: ' Shakarov ',
      email: 'LAZIZ@EXAMPLE.COM ',
      phone: ' +998901234567 ',
    });

    expect(result.booking.user_id).toBeNull();
    expect(result.booking.guest_name).toBe('Laziz Shakarov');
    expect(result.booking.guest_email).toBe('laziz@example.com');
    expect(result.booking.guest_phone).toBe('+998901234567');
    expect(result.booking.price_snapshot).toMatchObject({
      guest: {
        first_name: 'Laziz',
        last_name: 'Shakarov',
        name: 'Laziz Shakarov',
        email: 'laziz@example.com',
        phone: '+998901234567',
      },
    });
    expect(events.bookingStatusChanged).toHaveBeenCalledWith(result.booking);
    expect(events.partnerDashboardUpdated).toHaveBeenCalledWith('partner-1');
    expect(events.adminDashboardUpdated).toHaveBeenCalled();
  });
});
