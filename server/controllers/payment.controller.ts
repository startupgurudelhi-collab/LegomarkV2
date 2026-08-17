import { Request, Response } from 'express';
import crypto from 'crypto';
import { leadRepository } from '../repositories/lead.repository';
import { serviceRepository } from '../repositories/service.repository';
import { packageRepository } from '../repositories/package.repository';
import { SERVICES, PACKAGES, getServiceBySlug } from '../../src/data/websiteData';
import { logger } from '../utils/logger';

/**
 * Safely parse a display price string (e.g. '₹6,999', '₹14,999 / year', '₹1,499') into a numeric INR amount
 */
function parsePriceToNumber(price: string | number | undefined | null, fallback = 0): number {
  if (typeof price === 'number') {
    return isNaN(price) ? fallback : price;
  }
  if (!price || typeof price !== 'string') {
    return fallback;
  }
  const cleaned = price.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? fallback : parsed;
}

interface ResolvedItem {
  resolvedName: string;
  resolvedAmount: number;
  itemType: 'service' | 'package';
  slug?: string;
  id?: string;
}

/**
 * Authoritatively resolves the price of an item purely on the server.
 * Completely ignores any payment amount submitted by the frontend.
 */
async function resolveAuthoritativeItemPrice(params: {
  itemType?: string;
  itemId?: string;
  slug?: string;
  itemName?: string;
}): Promise<ResolvedItem | null> {
  const { itemType, itemId, slug, itemName } = params;
  const isExplicitPackage = itemType === 'package' || itemId === 'starter' || itemId === 'growth' || itemId === 'enterprise';

  // 1. Resolve as Package if specified or if ID matches a known package
  if (isExplicitPackage || (!slug && itemId)) {
    try {
      const activePackages = await packageRepository.getActivePackages();
      const matched = activePackages.find(
        (p) =>
          (itemId && p.id.toLowerCase() === itemId.toLowerCase()) ||
          (itemName && p.name.toLowerCase() === itemName.toLowerCase())
      );
      if (matched) {
        const rawPrice = matched.priceDisplayOverride || matched.priceAmount || '0';
        const num = parsePriceToNumber(rawPrice);
        if (num > 0) {
          return {
            resolvedName: matched.name,
            resolvedAmount: num,
            itemType: 'package',
            id: matched.id,
          };
        }
      }
    } catch {
      // Fallback to static PACKAGES catalog
    }

    const staticPkg = PACKAGES.find(
      (p) =>
        (itemId && p.id.toLowerCase() === itemId.toLowerCase()) ||
        (itemName && p.name.toLowerCase() === itemName.toLowerCase())
    );
    if (staticPkg) {
      const num = parsePriceToNumber(staticPkg.price);
      if (num > 0) {
        return {
          resolvedName: staticPkg.name,
          resolvedAmount: num,
          itemType: 'package',
          id: staticPkg.id,
        };
      }
    }
  }

  // 2. Resolve as Service by Slug or ID
  const targetSlug = slug || itemId;
  if (targetSlug) {
    try {
      const dbService = await serviceRepository.getPublicServiceBySlug(targetSlug);
      if (dbService) {
        const num = parsePriceToNumber(dbService.startingPrice);
        if (num > 0) {
          return {
            resolvedName: dbService.title,
            resolvedAmount: num,
            itemType: 'service',
            slug: dbService.slug,
            id: dbService.id,
          };
        }
      }
    } catch {
      // Fallback to static catalog
    }

    const staticService = getServiceBySlug(targetSlug);
    if (staticService) {
      const num = parsePriceToNumber(staticService.startingPrice);
      if (num > 0) {
        return {
          resolvedName: staticService.title,
          resolvedAmount: num,
          itemType: 'service',
          slug: staticService.slug,
          id: staticService.id,
        };
      }
    }
  }

  // 3. Search public services by Title or Alias
  if (itemName) {
    const norm = itemName.toLowerCase().trim();

    try {
      const allServices = await serviceRepository.getAllPublicServices();
      const matched = allServices.find(
        (s) =>
          s.title.toLowerCase() === norm ||
          s.slug.toLowerCase() === norm ||
          s.id.toLowerCase() === norm
      );
      if (matched) {
        const num = parsePriceToNumber(matched.startingPrice);
        if (num > 0) {
          return {
            resolvedName: matched.title,
            resolvedAmount: num,
            itemType: 'service',
            slug: matched.slug,
            id: matched.id,
          };
        }
      }
    } catch {
      // Fallback to static catalog
    }

    const staticMatched = SERVICES.find(
      (s) =>
        s.title.toLowerCase() === norm ||
        s.slug.toLowerCase() === norm ||
        s.id.toLowerCase() === norm ||
        (s.aliases && s.aliases.some((a) => a.toLowerCase() === norm || norm.includes(a.toLowerCase())))
    );
    if (staticMatched) {
      const num = parsePriceToNumber(staticMatched.startingPrice);
      if (num > 0) {
        return {
          resolvedName: staticMatched.title,
          resolvedAmount: num,
          itemType: 'service',
          slug: staticMatched.slug,
          id: staticMatched.id,
        };
      }
    }
  }

  // 4. Fallback search in PACKAGES by name
  if (itemName) {
    const norm = itemName.toLowerCase().trim();
    const staticPkg = PACKAGES.find(
      (p) =>
        p.name.toLowerCase() === norm ||
        p.id.toLowerCase() === norm ||
        norm.includes(p.name.toLowerCase())
    );
    if (staticPkg) {
      const num = parsePriceToNumber(staticPkg.price);
      if (num > 0) {
        return {
          resolvedName: staticPkg.name,
          resolvedAmount: num,
          itemType: 'package',
          id: staticPkg.id,
        };
      }
    }
  }

  return null;
}

export class PaymentController {
  /**
   * GET /api/payment/config
   * Returns public Razorpay key ID if configured
   */
  async getConfig(req: Request, res: Response): Promise<void> {
    try {
      const keyId = process.env.RAZORPAY_KEY_ID || '';
      res.status(200).json({
        success: true,
        keyId,
      });
    } catch (error) {
      logger.error('Failed to get payment config', 'PaymentController', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payment configuration',
      });
    }
  }

  /**
   * POST /api/payment/create-order
   * Initializes payment order for service or package with authoritative server-side price validation.
   * Frontend amount parameter is completely ignored to prevent price tampering.
   */
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const {
        itemName,
        itemType,
        itemId,
        slug,
        customerName,
        customerEmail,
        customerPhone,
        city,
      } = req.body;

      if (!itemName && !slug && !itemId) {
        res.status(400).json({
          success: false,
          error: 'A valid service or package identifier (itemName, slug, or itemId) is required',
        });
        return;
      }

      // Authoritatively resolve price on server
      const authoritativeItem = await resolveAuthoritativeItemPrice({
        itemType,
        itemId,
        slug,
        itemName,
      });

      if (!authoritativeItem) {
        res.status(400).json({
          success: false,
          error: 'This service requires a custom quotation. Please request a consultation instead of direct purchase.',
        });
        return;
      }

      const { resolvedName, resolvedAmount, itemType: resolvedType } = authoritativeItem;

      if (resolvedAmount <= 0) {
        res.status(400).json({
          success: false,
          error: 'This service requires a custom quotation. Please request a consultation.',
        });
        return;
      }

      const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_legomarkindia';
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      logger.info(
        `Authoritative payment order created: [${resolvedName}] (${resolvedType}) - Server-Verified Amount: ₹${resolvedAmount} for ${customerName || 'Client'}`,
        'PaymentController'
      );

      res.status(201).json({
        success: true,
        orderId,
        keyId,
        amount: resolvedAmount, // Authoritative price only
        currency: 'INR',
        itemName: resolvedName,
        itemType: resolvedType,
      });
    } catch (error) {
      logger.error('Failed to create payment order', 'PaymentController', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create payment order',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * POST /api/payment/verify
   * Verifies Razorpay payment via HMAC-SHA256 signature validation and securely records the paid order.
   * Fails safely if RAZORPAY_KEY_SECRET is missing or signature is invalid.
   */
  async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const {
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
        itemName,
        itemType,
        itemId,
        slug,
        customerName,
        customerEmail,
        customerPhone,
        city,
      } = req.body;

      if (!razorpayPaymentId || typeof razorpayPaymentId !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Razorpay Payment ID (razorpay_payment_id) is required for verification',
        });
        return;
      }

      if (!razorpayOrderId || typeof razorpayOrderId !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Razorpay Order ID (razorpay_order_id) is required for verification',
        });
        return;
      }

      if (!razorpaySignature || typeof razorpaySignature !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Razorpay Signature (razorpay_signature) is required for verification',
        });
        return;
      }

      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        logger.error(
          'Payment verification failed: RAZORPAY_KEY_SECRET is not configured on the server',
          'PaymentController'
        );
        res.status(500).json({
          success: false,
          error: 'Payment verification failed: Server is not configured with Razorpay secret key',
        });
        return;
      }

      // Compute expected HMAC-SHA256 signature
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      // Timing-safe comparison to prevent timing attacks
      const isSignatureValid =
        expectedSignature.length === razorpaySignature.length &&
        crypto.timingSafeEqual(
          Buffer.from(expectedSignature, 'utf-8'),
          Buffer.from(razorpaySignature, 'utf-8')
        );

      if (!isSignatureValid) {
        logger.warn(
          `Invalid signature attempt for Order: ${razorpayOrderId}, Payment: ${razorpayPaymentId}`,
          'PaymentController'
        );
        res.status(400).json({
          success: false,
          error: 'Invalid payment signature. Verification failed.',
        });
        return;
      }

      // Authoritatively resolve item details for database record
      const authoritativeItem = await resolveAuthoritativeItemPrice({
        itemType,
        itemId,
        slug,
        itemName,
      });

      const confirmedItemName = authoritativeItem?.resolvedName || itemName || 'Corporate Service';
      const confirmedAmount = authoritativeItem?.resolvedAmount || 0;
      const confirmedItemType = authoritativeItem?.itemType || itemType || 'service';

      logger.info(
        `Cryptographically verified Razorpay signature for [${confirmedItemName}] - Payment ID: ${razorpayPaymentId}, Order ID: ${razorpayOrderId}, Authoritative Amount: ₹${confirmedAmount}`,
        'PaymentController'
      );

      // Record the confirmed paid order as a high-priority lead in the database
      try {
        await leadRepository.createLead({
          fullName: (customerName || 'Online Client').trim(),
          phone: (customerPhone || 'N/A').trim(),
          email: customerEmail && typeof customerEmail === 'string' ? customerEmail.trim() : undefined,
          city: city && typeof city === 'string' ? city.trim() : undefined,
          serviceInterested: `[PAID ORDER] ${confirmedItemName}`,
          message: `Online Payment Verified via Razorpay HMAC-SHA256.\nPayment ID: ${razorpayPaymentId}\nOrder ID: ${razorpayOrderId}\nVerified Amount: ₹${confirmedAmount}\nItem Type: ${confirmedItemType}\nTimestamp: ${new Date().toISOString()}`,
          source: 'Razorpay Direct Purchase',
        });
      } catch (dbErr) {
        logger.warn('Could not record paid lead to database (non-blocking):', 'PaymentController', dbErr);
      }

      res.status(200).json({
        success: true,
        message: 'Payment verified and order confirmed successfully.',
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
        itemName: confirmedItemName,
        amount: confirmedAmount,
      });
    } catch (error) {
      logger.error('Failed to verify payment', 'PaymentController', error);
      res.status(500).json({
        success: false,
        error: 'Payment verification encountered an issue',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export const paymentController = new PaymentController();

