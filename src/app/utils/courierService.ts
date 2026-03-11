/**
 * ============================================================
 * COURIER SERVICE UTILITY
 * ============================================================
 * এই file টি courier/carrier API integration handle করে।
 *
 * বর্তমানে DUMMY implementation দেওয়া আছে।
 * পরে client এর কাছ থেকে actual API credentials পেলে
 * নিচের `REAL API INTEGRATION` section এর dummy code
 * replace করে real HTTP call দিতে হবে।
 *
 * Supported Carriers (Dummy):
 * - DHL
 * - FedEx
 * - UPS
 * - USPS
 * - Local Delivery
 *
 * HOW TO ADD REAL CARRIER:
 * 1. .env file এ carrier API key add করুন (নিচে দেওয়া আছে)
 * 2. config/index.ts এ key export করুন
 * 3. নিচের `_callCarrierAPI` function এ real HTTP call দিন
 * ============================================================
 */

import config from '../config';
import { IOrderItem, IShippingAddress } from '../modules/Order/order.interface';

// ============================================================
// INTERFACES FOR COURIER SERVICE
// ============================================================

// Shipment তৈরির input
export interface ICreateShipmentInput {
  orderId: string;
  carrierName: string;
  senderAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  receiverAddress: IShippingAddress;
  items: IOrderItem[];
  totalWeight?: number; // kg
  packageDimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

// Courier API থেকে পাওয়া shipment response
export interface IShipmentResponse {
  success: boolean;
  shipmentId: string; // Carrier এর internal ID
  trackingNumber: string; // Public tracking number
  trackingUrl: string; // Public tracking page URL
  labelUrl?: string; // Shipping label PDF URL
  estimatedDelivery?: Date; // আনুমানিক ডেলিভারি তারিখ
  cost?: number; // Shipment cost
  currency?: string; // Cost এর currency
  message?: string; // Success/error message
}

// Tracking event একটি করে
export interface ITrackingEventFromCarrier {
  timestamp: Date;
  status: string; // Carrier specific status (e.g. "IN_TRANSIT")
  description: string; // বিবরণ
  location?: string; // কোথায় ছিল
}
 
// Carrier tracking response
export interface ICarrierTrackingResponse {
  success: boolean;
  trackingNumber: string;
  currentStatus: string;
  currentLocation?: string;
  estimatedDelivery?: Date;
  events: ITrackingEventFromCarrier[];
  message?: string;
}

// ============================================================
// CARRIER CONFIGURATIONS
// প্রতিটি carrier এর API base URL এবং credentials
// .env file থেকে load হবে
// ============================================================
const CARRIER_CONFIG = {
  DHL: {
    apiUrl: config.dhl_api_url || 'https://api.dhl.com',
    apiKey: config.dhl_api_key || 'DUMMY_DHL_KEY',
    accountNumber: config.dhl_account_number || 'DUMMY_DHL_ACCOUNT',
  },
  FedEx: {
    apiUrl: config.fedex_api_url || 'https://apis.fedex.com',
    apiKey: config.fedex_api_key || 'DUMMY_FEDEX_KEY',
    accountNumber: config.fedex_account_number || 'DUMMY_FEDEX_ACCOUNT',
    clientId: config.fedex_client_id || 'DUMMY_FEDEX_CLIENT_ID',
    clientSecret: config.fedex_client_secret || 'DUMMY_FEDEX_CLIENT_SECRET',
  },
  UPS: {
    apiUrl: config.ups_api_url || 'https://onlinetools.ups.com',
    apiKey: config.ups_api_key || 'DUMMY_UPS_KEY',
    accountNumber: config.ups_account_number || 'DUMMY_UPS_ACCOUNT',
  },
  USPS: {
    apiUrl: config.usps_api_url || 'https://api.usps.com',
    apiKey: config.usps_api_key || 'DUMMY_USPS_KEY',
    userId: config.usps_user_id || 'DUMMY_USPS_USER_ID',
  },
  'Local Delivery': {
    apiUrl: config.local_courier_api_url || 'http://localhost:9000/api',
    apiKey: config.local_courier_api_key || 'DUMMY_LOCAL_KEY',
  },
};

// ============================================================
// SENDER ADDRESS (আপনার warehouse/store এর address)
// .env থেকে load হবে
// ============================================================
const SENDER_ADDRESS = {
  name: config.store_name || 'E-Commerce Store',
  address: config.store_address || '123 Store Street',
  city: config.store_city || 'New York',
  state: config.store_state || 'NY',
  zipCode: config.store_zip_code || '10001',
  country: config.store_country || 'US',
  phone: config.store_phone || '+1-555-000-0000',
};

// ============================================================
// DUMMY HELPER: Random tracking number generate করা
// Real implementation এ carrier API এটা return করবে
// ============================================================
const generateDummyTrackingNumber = (carrierName: string): string => {
  const prefix =
    {
      DHL: 'DHL',
      FedEx: 'FDX',
      UPS: 'UPS',
      USPS: 'USPS',
      'Local Delivery': 'LCL',
      Other: 'OTH',
    }[carrierName] || 'TRK';

  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}${Date.now()}${random}`;
};

// ============================================================
// DUMMY HELPER: Tracking URL generate করা
// Real implementation এ carrier API এটা provide করবে
// ============================================================
const getTrackingUrl = (
  carrierName: string,
  trackingNumber: string,
): string => {
  const urls = {
    DHL: `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${trackingNumber}`,
    FedEx: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    UPS: `https://www.ups.com/track?loc=en_US&tracknum=${trackingNumber}`,
    USPS: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    'Local Delivery': `https://your-store.com/track/${trackingNumber}`,
    Other: `https://your-store.com/track/${trackingNumber}`,
  };
  return (
    urls[carrierName as keyof typeof urls] ||
    `https://your-store.com/track/${trackingNumber}`
  );
};

// ============================================================
// DUMMY HELPER: Estimated delivery date calculate করা
// Real implementation এ carrier API এটা return করবে
// ============================================================
const calculateEstimatedDelivery = (carrierName: string): Date => {
  const deliveryDays = {
    DHL: 2, // DHL Express - 2 business days
    FedEx: 3, // FedEx Ground - 3 business days
    UPS: 4, // UPS Ground - 4 business days
    USPS: 5, // USPS Priority - 5 business days
    'Local Delivery': 1, // Local - 1 business day
    Other: 7, // Unknown - 7 business days
  };

  const days = deliveryDays[carrierName as keyof typeof deliveryDays] || 7;
  const estimated = new Date();
  estimated.setDate(estimated.getDate() + days);
  return estimated;
};

// ============================================================
// MAIN COURIER SERVICE CLASS
// ============================================================
class CourierService {
  /**
   * CREATE SHIPMENT
   * ============================================================
   * একটি নতুন shipment তৈরি করে carrier API তে।
   *
   * বর্তমানে DUMMY - real order এ replace করুন:
   * 1. আপনার carrier এর API documentation দেখুন
   * 2. `_callCarrierCreateShipmentAPI` function implement করুন
   * 3. Response থেকে trackingNumber, labelUrl extract করুন
   *
   * @param input - Shipment creation input data
   * @returns IShipmentResponse
   */
  async createShipment(
    input: ICreateShipmentInput,
  ): Promise<IShipmentResponse> {
    try {
      console.log(`📦 Creating shipment with ${input.carrierName}...`);

      // ---- REAL API INTEGRATION (এখানে real code লিখতে হবে) ----
      // const response = await this._callCarrierCreateShipmentAPI(input);
      // return response;

      // ---- DUMMY IMPLEMENTATION (এখন এটি কাজ করছে) ----
      await this._simulateApiDelay();

      const trackingNumber = generateDummyTrackingNumber(input.carrierName);
      const trackingUrl = getTrackingUrl(input.carrierName, trackingNumber);
      const estimatedDelivery = calculateEstimatedDelivery(input.carrierName);

      const response: IShipmentResponse = {
        success: true,
        shipmentId: `SHIP-${Date.now()}`,
        trackingNumber,
        trackingUrl,
        labelUrl: `https://your-store.com/shipping-labels/${trackingNumber}.pdf`, // Dummy label URL
        estimatedDelivery,
        cost: this._calculateShippingCost(
          input.carrierName,
          input.totalWeight || 0.5,
        ),
        currency: 'usd',
        message: `Shipment created successfully with ${input.carrierName}`,
      };

      console.log(`✅ Shipment created: ${trackingNumber}`);
      return response;
    } catch (error) {
      console.error(
        `❌ Failed to create shipment with ${input.carrierName}:`,
        error,
      );
      return {
        success: false,
        shipmentId: '',
        trackingNumber: '',
        trackingUrl: '',
        message: `Failed to create shipment: ${(error as Error).message}`,
      };
    }
  }

  /**
   * GET TRACKING INFO
   * ============================================================
   * Carrier API থেকে real-time tracking information আনে।
   * User যখন "Track Order" click করে, এই function call হয়।
   *
   * @param carrierName - Carrier এর নাম
   * @param trackingNumber - Tracking number
   * @returns ICarrierTrackingResponse
   */
  async getTrackingInfo(
    carrierName: string,
    trackingNumber: string,
  ): Promise<ICarrierTrackingResponse> {
    try {
      console.log(
        `🔍 Fetching tracking info for ${trackingNumber} from ${carrierName}...`,
      );

      // ---- REAL API INTEGRATION ----
      // switch (carrierName) {
      //   case 'DHL':
      //     return await this._getDHLTracking(trackingNumber);
      //   case 'FedEx':
      //     return await this._getFedExTracking(trackingNumber);
      //   case 'UPS':
      //     return await this._getUPSTracking(trackingNumber);
      //   default:
      //     throw new Error(`Unsupported carrier: ${carrierName}`);
      // }

      // ---- DUMMY IMPLEMENTATION ----
      await this._simulateApiDelay();

      const response: ICarrierTrackingResponse = {
        success: true,
        trackingNumber,
        currentStatus: 'IN_TRANSIT',
        currentLocation: 'Distribution Center, New York',
        estimatedDelivery: calculateEstimatedDelivery(carrierName),
        events: [
          {
            timestamp: new Date(Date.now() - 3600000), // 1 hour ago
            status: 'IN_TRANSIT',
            description: 'Package in transit to destination',
            location: 'Distribution Center, New York',
          },
          {
            timestamp: new Date(Date.now() - 7200000),  // 2 hours ago
            status: 'DEPARTED_FACILITY',
            description: 'Package departed from sorting facility',
            location: 'Sorting Facility, Newark, NJ',
          },
          {
            timestamp: new Date(Date.now() - 86400000), // 1 day ago
            status: 'PICKED_UP',
            description: 'Package picked up from sender',
            location: 'Warehouse, New York',
          },
        ],
        message: 'Tracking information retrieved successfully',
      };

      return response;
    } catch (error) {
      console.error(`❌ Failed to get tracking info:`, error);
      return {
        success: false,
        trackingNumber,
        currentStatus: 'UNKNOWN',
        events: [],
        message: `Failed to get tracking info: ${(error as Error).message}`,
      };
    }
  }

  /**
   * CANCEL SHIPMENT
   * ============================================================
   * Carrier API এ shipment cancel করে।
   * Order cancel হলে এই function call হয়।
   *
   * @param carrierName - Carrier এর নাম
   * @param shipmentId - Carrier এর shipment ID
   * @returns { success: boolean; message: string }
   */
  async cancelShipment(
    carrierName: string,
    shipmentId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(
        `🚫 Cancelling shipment ${shipmentId} from ${carrierName}...`,
      );

      // ---- REAL API INTEGRATION ----
      // const response = await this._callCarrierCancelAPI(carrierName, shipmentId);
      // return response;

      // ---- DUMMY IMPLEMENTATION ----
      await this._simulateApiDelay();

      console.log(`✅ Shipment ${shipmentId} cancelled successfully`);
      return {
        success: true,
        message: `Shipment ${shipmentId} cancelled successfully`,
      };
    } catch (error) {
      console.error(`❌ Failed to cancel shipment:`, error);
      return {
        success: false,
        message: `Failed to cancel shipment: ${(error as Error).message}`,
      };
    }
  }

  /**
   * VALIDATE SHIPPING ADDRESS
   * Carrier API দিয়ে address validate করা (optional feature)
   */
  async validateAddress(
    address: IShippingAddress,
  ): Promise<{ isValid: boolean; suggestions?: string[] }> {
    // ---- DUMMY IMPLEMENTATION ----
    // Real implementation এ carrier API call দিন
    return { isValid: true, suggestions: [] };
  }

  /**
   * GET SHIPPING RATES
   * বিভিন্ন carrier এর shipping rate তুলনা করা
   */
  async getShippingRates(
    receiverAddress: IShippingAddress,
    weight: number,
  ): Promise<{ carrier: string; cost: number; estimatedDays: number }[]> {
    // ---- DUMMY IMPLEMENTATION ----
    return [
      { carrier: 'DHL', cost: 15.99, estimatedDays: 2 },
      { carrier: 'FedEx', cost: 12.99, estimatedDays: 3 },
      { carrier: 'UPS', cost: 11.99, estimatedDays: 4 },
      { carrier: 'USPS', cost: 9.99, estimatedDays: 5 },
      { carrier: 'Local Delivery', cost: 5.99, estimatedDays: 1 },
    ];
  }

  // ============================================================
  // PRIVATE HELPER METHODS
  // ============================================================

  /**
   * Shipping cost calculate করা carrier ও weight এর ভিত্তিতে
   */
  private _calculateShippingCost(carrierName: string, weight: number): number {
    const baseCosts: Record<string, number> = {
      DHL: 15.99,
      FedEx: 12.99,
      UPS: 11.99,
      USPS: 9.99,
      'Local Delivery': 5.99,
      Other: 10.0,
    };
    const perKgRate = 2.5;
    const base = baseCosts[carrierName] || 10;
    return parseFloat((base + weight * perKgRate).toFixed(2));
  }

  /**
   * API call simulate করার জন্য delay (dummy এর জন্য)
   * Real implementation এ এটি remove করুন
   */
  private _simulateApiDelay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * ভবিষ্যতে DHL API integration এর জন্য placeholder
   */
  // private async _getDHLTracking(trackingNumber: string): Promise<ICarrierTrackingResponse> {
  //   const config = CARRIER_CONFIG.DHL;
  //   const response = await fetch(
  //     `${config.apiUrl}/track/shipments?trackingNumber=${trackingNumber}`,
  //     {
  //       headers: {
  //         'DHL-API-Key': config.apiKey,
  //         'Content-Type': 'application/json',
  //       },
  //     }
  //   );
  //   const data = await response.json();
  //   // Map DHL response to ICarrierTrackingResponse format
  //   return { ... };
  // }

  /**
   * ভবিষ্যতে FedEx API integration এর জন্য placeholder
   */
  // private async _getFedExTracking(trackingNumber: string): Promise<ICarrierTrackingResponse> {
  //   // FedEx OAuth token first, then tracking call
  //   const tokenResponse = await fetch(`${CARRIER_CONFIG.FedEx.apiUrl}/oauth/token`, {
  //     method: 'POST',
  //     body: new URLSearchParams({
  //       grant_type: 'client_credentials',
  //       client_id: CARRIER_CONFIG.FedEx.clientId,
  //       client_secret: CARRIER_CONFIG.FedEx.clientSecret,
  //     }),
  //   });
  //   const { access_token } = await tokenResponse.json();
  //   // Then use access_token for tracking
  //   return { ... };
  // }
}

// ============================================================
// SINGLETON INSTANCE - সারা application এ একটিই instance
// ============================================================
export const courierService = new CourierService();

// Sender address export করা (order.service.ts এ ব্যবহার হবে)
export { SENDER_ADDRESS };
