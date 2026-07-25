import { api as baseApi, apiConfig } from "@safaar/api-client";
import { config } from "../config/config";
import { paymentsService } from "./payments/payments";

// Configure base URL at initialization
apiConfig.setBaseUrl(config.apiUrl);

export const api = {
  ...baseApi,
  payments: paymentsService,
};

export { ApiRequestError } from "@safaar/api-client";

