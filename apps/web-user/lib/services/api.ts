import { api as baseApi, apiConfig } from "@safaar/api-client";
import { config } from "../config/config";
import { paymentsService } from "./payments/payments";
import { refundsService } from "./refunds/refunds";
import { notificationsService } from "./notifications/notifications";

// Configure base URL at initialization
apiConfig.setBaseUrl(config.apiUrl);

export const api = {
  ...baseApi,
  payments: paymentsService,
  refunds: refundsService,
  notifications: notificationsService,
};

export { ApiRequestError } from "@safaar/api-client";

