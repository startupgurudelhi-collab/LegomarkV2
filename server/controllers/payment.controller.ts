import { Request, Response } from 'express';
import crypto from 'crypto';
import { leadRepository } from '../repositories/lead.repository';
import { serviceRepository } from '../repositories/service.repository';
import { packageRepository } from '../repositories/package.repository';
import { SERVICES, PACKAGES, getServiceBySlug } from '../../src/data/websiteData';
import { logger } from '../utils/logger';
import { crmService } from '../services/crm.service';
import { Lead } from '../../db/schema/index';

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

  // 1. If a service slug/context is provided along with a package reference, resolve service-scoped package first
  let serviceSlug = slug;
  if (!serviceSlug && itemName && (isExplicitPackage || itemType === 'package')) {
    if (itemName.includes(' - ')) {
      const candidateTitle = itemName.split(' - ')[0].trim().toLowerCase();
      const matchedService = SERVICES.find(
        (s) => s.title.toLowerCase() === candidateTitle || s.slug.toLowerCase() === candidateTitle
      );
      if (matchedService) {
        serviceSlug = matchedService.slug;
      }
    }
  }

  if (serviceSlug && (isExplicitPackage || itemId)) {
    try {
      const dbService = await serviceRepository.getPublicServiceBySlug(serviceSlug);
      if (dbService && dbService.packages && dbService.packages.length > 0) {
        const matchedPkg = dbService.packages.find(
          (p) =>
            (itemId && p.id.toLowerCase() === itemId.toLowerCase()) ||
            (itemName && p.name.toLowerCase() === itemName.toLowerCase()) ||
            (itemName && `${dbService.title} - ${p.name}`.toLowerCase() === itemName.toLowerCase()) ||
            (itemName && `${dbService.title} (${p.name})`.toLowerCase() === itemName.toLowerCase()) ||
            (itemName && itemName.toLowerCase().includes(p.name.toLowerCase())) ||
            (itemId && p.name.toLowerCase().includes(itemId.toLowerCase())) ||
            (itemId && itemId.toLowerCase().includes(p.name.toLowerCase())) ||
            (itemName && p.id.toLowerCase() === itemName.toLowerCase())
        );
        if (matchedPkg) {
          const num = matchedPkg.priceAmount > 0 ? matchedPkg.priceAmount : parsePriceToNumber(matchedPkg.price);
          if (num > 0) {
            return {
              resolvedName: `${dbService.title} - ${matchedPkg.name}`,
              resolvedAmount: num,
              itemType: 'package',
              slug: dbService.slug,
              id: matchedPkg.id,
            };
          }
        }
      }
    } catch {
      // Fallback
    }

    const staticService = getServiceBySlug(serviceSlug);
    if (staticService && (staticService as any).packages && (staticService as any).packages.length > 0) {
      const matchedPkg = (staticService as any).packages.find(
        (p: any) =>
          (itemId && p.id.toLowerCase() === itemId.toLowerCase()) ||
          (itemName && p.name.toLowerCase() === itemName.toLowerCase()) ||
          (itemName && `${staticService.title} - ${p.name}`.toLowerCase() === itemName.toLowerCase()) ||
          (itemName && `${staticService.title} (${p.name})`.toLowerCase() === itemName.toLowerCase()) ||
          (itemName && itemName.toLowerCase().includes(p.name.toLowerCase())) ||
          (itemId && p.name.toLowerCase().includes(itemId.toLowerCase())) ||
          (itemId && itemId.toLowerCase().includes(p.name.toLowerCase())) ||
          (itemName && p.id.toLowerCase() === itemName.toLowerCase())
      );
      if (matchedPkg) {
        const num = matchedPkg.priceAmount > 0 ? matchedPkg.priceAmount : parsePriceToNumber(matchedPkg.price);
        if (num > 0) {
          return {
            resolvedName: `${staticService.title} - ${matchedPkg.name}`,
            resolvedAmount: num,
            itemType: 'package',
            slug: staticService.slug,
            id: matchedPkg.id,
          };
        }
      }
    }
  }

  // 2. Resolve as global Package if specified or if ID matches a known package
  if (isExplicitPackage || (!slug && itemId)) {
    try {
      const activePackages = await packageRepository.getActivePackages();
      const matched = activePackages.find(
        (p) =>
          (itemId && p.id.toLowerCase() === itemId.toLowerCase()) ||
          (itemName && p.name.toLowerCase() === itemName.toLowerCase()) ||
          (itemName && itemName.toLowerCase().includes(p.name.toLowerCase()))
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
        (itemName && p.name.toLowerCase() === itemName.toLowerCase()) ||
        (itemName && itemName.toLowerCase().includes(p.name.toLowerCase()))
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

  // 3. HARD GUARD: If this item was explicitly requested as a package (or has a package tier ID),
  // NEVER fall back to service startingPrice. A package purchase must only resolve
  // to an authoritative package price.
  if (isExplicitPackage || itemType === 'package') {
    logger.warn(
      `Package price resolution failed for itemId=${itemId}, slug=${slug}, itemName=${itemName}. Refusing fallback to service startingPrice.`,
      'PaymentController'
    );
    return null;
  }

  // 4. Resolve as Service by Slug or ID
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
        state,
        leadId,
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

      if (typeof resolvedAmount !== 'number' || isNaN(resolvedAmount) || resolvedAmount <= 0) {
        res.status(400).json({
          success: false,
          error: 'This service requires a custom quotation. Please request a consultation.',
        });
        return;
      }

      // 1. Immediately record or reuse customer lead in LEGOMARK Admin Leads & Enquiries
      // This ensures EVERY genuine package purchase attempt is captured even if payment is later abandoned/cancelled
      let targetLead: Lead | null = null;
      const cleanPhone = typeof customerPhone === 'string' ? customerPhone.trim() : '';
      const cleanEmail = typeof customerEmail === 'string' ? customerEmail.trim() : '';
      const cleanName = typeof customerName === 'string' ? customerName.trim() : '';
      const cleanCity = typeof city === 'string' ? city.trim() : undefined;
      const cleanState = typeof state === 'string' ? state.trim() : undefined;
      const providedLeadId = typeof leadId === 'string' ? leadId.trim() : undefined;

      // Extract clean service and package info for CRM & LEGOMARK
      let resolvedServiceName = resolvedName;
      let resolvedPackageDetails: string | undefined = undefined;
      if (resolvedName.includes(' - ')) {
        const [sName, ...pParts] = resolvedName.split(' - ');
        resolvedServiceName = sName.trim();
        resolvedPackageDetails = pParts.join(' - ').trim();
      } else if (resolvedType === 'package') {
        resolvedPackageDetails = resolvedName;
      }

      if (cleanPhone || cleanEmail || providedLeadId) {
        try {
          const existingLead = await leadRepository.findExistingLead({
            id: providedLeadId,
            phone: cleanPhone || undefined,
            email: cleanEmail || undefined,
          });

          if (existingLead) {
            targetLead = await leadRepository.recordPurchaseIntentOnLead(existingLead.id, {
              serviceInterested: resolvedName,
              city: cleanCity,
              additionalMessage: `Direct Package Purchase Initiated: ${resolvedName} (Fee: ₹${resolvedAmount}). Payment in progress via Razorpay.`,
            });
            if (!targetLead) {
              targetLead = existingLead;
            }
            logger.info(
              `Reused existing LEGOMARK lead ${targetLead.id} for package purchase attempt [${resolvedName}]`,
              'PaymentController'
            );
          }
        } catch (findErr) {
          logger.warn('Could not query existing lead for purchase attempt (non-blocking):', 'PaymentController', findErr);
        }

        if (!targetLead && (cleanPhone || cleanName)) {
          try {
            targetLead = await leadRepository.createLead({
              fullName: cleanName || 'Online Client',
              phone: cleanPhone || 'N/A',
              email: cleanEmail || undefined,
              city: cleanCity,
              serviceInterested: resolvedName,
              message: `Direct package purchase initiated for ${resolvedName} (Fee: ₹${resolvedAmount}). Payment in progress via Razorpay.`,
              source: 'Website Package Purchase Form',
            });
            logger.info(
              `Created new LEGOMARK unpaid lead ${targetLead.id} for package purchase attempt [${resolvedName}]`,
              'PaymentController'
            );
          } catch (dbErr) {
            logger.warn('Could not record purchase intent lead to database (non-blocking):', 'PaymentController', dbErr);
          }
        }
      }

      // 2. Send newly created/updated lead through the EXISTING crmService to EFILINGG CRM (non-blocking)
      // CRM failure will never prevent the lead from being saved or prevent the payment flow from continuing
      if (targetLead) {
        crmService
          .sendLeadToCrm(targetLead, {
            selectedService: resolvedServiceName,
            packageDetails: resolvedPackageDetails,
            packageFee: resolvedAmount,
            city: cleanCity || targetLead.city || undefined,
            state: cleanState,
            submissionChannel: 'Website Package Purchase Form',
            notes: `Direct package purchase initiated for ${resolvedName}. Awaiting Razorpay payment.`,
          })
          .catch((crmErr) => {
            logger.warn('Non-blocking EFILINGG CRM sync notice on order creation:', 'PaymentController', crmErr?.message || crmErr);
          });
      }

      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!keyId || !keySecret) {
        logger.warn('Payment order creation rejected: Razorpay credentials not configured in environment', 'PaymentController');
        res.status(503).json({
          success: false,
          error: 'Online payment gateway is temporarily unavailable. Please request a consultation to proceed with this service.',
          leadId: targetLead?.id,
        });
        return;
      }

      // Convert authoritative amount to paise (1 INR = 100 paise)
      const payableAmountInPaise = Math.round(Number(resolvedAmount) * 100);

      if (isNaN(payableAmountInPaise) || payableAmountInPaise <= 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid service amount for online payment.',
        });
        return;
      }

      const receipt = `rcpt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

      // Create authentic Order on Razorpay
      const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: payableAmountInPaise,
          currency: 'INR',
          receipt,
          notes: {
            itemName: resolvedName.substring(0, 40),
            itemType: resolvedType,
            customerName: (customerName || 'Client').substring(0, 40),
            customerPhone: (customerPhone || 'N/A').substring(0, 15),
          },
        }),
      });

      if (!rzpResponse.ok) {
        const errorText = await rzpResponse.text().catch(() => '');
        logger.error(`Razorpay Orders API error (${rzpResponse.status}): ${errorText}`, 'PaymentController');
        res.status(502).json({
          success: false,
          error: 'Unable to initiate order with Razorpay payment gateway. Please try again or request a consultation.',
        });
        return;
      }

      const rzpOrderData = (await rzpResponse.json()) as { id: string; amount: number; currency: string };
      const orderId = rzpOrderData.id;

      logger.info(
        `Authoritative Razorpay payment order created: ${orderId} for [${resolvedName}] (${resolvedType}) - Server-Verified Amount: ₹${resolvedAmount} (${payableAmountInPaise} paise) for ${customerName || 'Client'}`,
        'PaymentController'
      );

      res.status(201).json({
        success: true,
        orderId,
        keyId,
        amount: payableAmountInPaise, // Returned in paise (e.g. 699900) as required by Razorpay
        currency: 'INR',
        itemName: resolvedName,
        itemType: resolvedType,
        leadId: targetLead?.id,
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
        state,
        leadId,
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

      // 1. Resolve exact leadId from request body or authoritative Razorpay order notes
      let effectiveLeadId = typeof leadId === 'string' && leadId.trim() ? leadId.trim() : undefined;
      let orderCustomerName: string | undefined;
      let orderCustomerPhone: string | undefined;
      let orderCustomerEmail: string | undefined;

      if (!effectiveLeadId && razorpayOrderId) {
        try {
          const keyId = process.env.RAZORPAY_KEY_ID;
          const keySecret = process.env.RAZORPAY_KEY_SECRET;
          if (keyId && keySecret) {
            const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
            const rzpOrderRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpayOrderId}`, {
              headers: { Authorization: authHeader },
            });
            if (rzpOrderRes.ok) {
              const rzpOrder = (await rzpOrderRes.json()) as any;
              if (rzpOrder?.notes?.leadId) {
                effectiveLeadId = String(rzpOrder.notes.leadId).trim();
              }
              if (rzpOrder?.notes?.customerName) {
                orderCustomerName = String(rzpOrder.notes.customerName).trim();
              }
              if (rzpOrder?.notes?.customerPhone) {
                orderCustomerPhone = String(rzpOrder.notes.customerPhone).trim();
              }
              if (rzpOrder?.notes?.customerEmail) {
                orderCustomerEmail = String(rzpOrder.notes.customerEmail).trim();
              }
            }
          }
        } catch (fetchErr) {
          logger.warn('Could not fetch Razorpay order notes (non-blocking):', 'PaymentController', fetchErr);
        }
      }

      // 2. Primary lookup: Look up existing lead directly by exact leadId
      let existingLead: Lead | null = null;
      if (effectiveLeadId) {
        try {
          existingLead = await leadRepository.getLeadById(effectiveLeadId);
          if (existingLead) {
            logger.info(
              `Found existing LEGOMARK lead ${existingLead.id} directly by exact leadId for payment ${razorpayPaymentId}`,
              'PaymentController'
            );
          }
        } catch (idErr) {
          logger.warn(`Could not lookup lead by ID ${effectiveLeadId}:`, 'PaymentController', idErr);
        }
      }

      // 3. Fallback lookup: If leadId was missing, invalid, or not found, fall back to phone/email lookup
      if (!existingLead) {
        const queryPhone = (typeof customerPhone === 'string' && customerPhone.trim()) || orderCustomerPhone;
        const queryEmail = (typeof customerEmail === 'string' && customerEmail.trim()) || orderCustomerEmail;
        try {
          existingLead = await leadRepository.findExistingLead({
            phone: queryPhone || undefined,
            email: queryEmail || undefined,
          });
          if (existingLead) {
            logger.info(
              `Found existing LEGOMARK lead ${existingLead.id} via contact fallback for payment ${razorpayPaymentId}`,
              'PaymentController'
            );
          }
        } catch (findErr) {
          logger.warn('Could not query existing lead by contact for payment (non-blocking):', 'PaymentController', findErr);
        }
      }

      const paymentVerificationMessage = `Online Payment Verified via Razorpay HMAC-SHA256.\nPayment ID: ${razorpayPaymentId}\nOrder ID: ${razorpayOrderId}\nVerified Amount: ₹${confirmedAmount}\nItem Type: ${confirmedItemType}\nTimestamp: ${new Date().toISOString()}`;

      let targetLead: Lead | null = null;

      try {
        if (existingLead) {
          // Update the SAME existing lead with paid order details
          targetLead = await leadRepository.recordPaymentOnLead(existingLead.id, {
            serviceInterested: `[PAID ORDER] ${confirmedItemName}`,
            source: 'Razorpay Verified',
            status: 'NEW',
            additionalMessage: paymentVerificationMessage,
          });
          if (!targetLead) {
            targetLead = existingLead;
          }
          logger.info(`Updated existing LEGOMARK lead ${targetLead.id} with verified payment ${razorpayPaymentId}`, 'PaymentController');
        } else {
          // Create new high-priority paid lead record in LEGOMARK database if no existing lead could be matched
          targetLead = await leadRepository.createLead({
            fullName: (customerName || orderCustomerName || 'Online Client').trim(),
            phone: (customerPhone || orderCustomerPhone || 'N/A').trim(),
            email: (customerEmail || orderCustomerEmail || '').trim() || undefined,
            city: (city || '').trim() || undefined,
            serviceInterested: `[PAID ORDER] ${confirmedItemName}`,
            message: paymentVerificationMessage,
            source: 'Razorpay Verified',
          });
          logger.info(`Created new LEGOMARK paid lead ${targetLead.id} for payment ${razorpayPaymentId}`, 'PaymentController');
        }
      } catch (dbErr) {
        logger.warn('Could not record paid lead to database (non-blocking):', 'PaymentController', dbErr);
      }

      // Extract clean service and package info for CRM
      let resolvedServiceName = confirmedItemName;
      let resolvedPackageDetails: string | undefined = undefined;
      if (confirmedItemName.includes(' - ')) {
        const [sName, ...pParts] = confirmedItemName.split(' - ');
        resolvedServiceName = sName.trim();
        resolvedPackageDetails = pParts.join(' - ').trim();
      }

      // Forward paid lead to EFILINGG CRM server-side in a non-blocking flow
      // LEGOMARK remains the primary lead record and CRM failure never breaks payment response
      const leadToSync: Lead = targetLead || {
        id: existingLead?.id || effectiveLeadId || crypto.randomUUID(),
        fullName: (customerName || orderCustomerName || 'Online Client').trim(),
        phone: (customerPhone || orderCustomerPhone || 'N/A').trim(),
        email: (customerEmail || orderCustomerEmail || '').trim() || null,
        city: (city || '').trim() || null,
        serviceInterested: `[PAID ORDER] ${confirmedItemName}`,
        serviceId: null,
        message: paymentVerificationMessage,
        source: 'Razorpay Verified',
        status: 'NEW' as const,
        adminNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: null,
      };

      crmService
        .sendLeadToCrm(leadToSync, {
          selectedService: resolvedServiceName,
          packageDetails: resolvedPackageDetails || (confirmedItemType === 'package' ? confirmedItemName : undefined),
          packageFee: confirmedAmount > 0 ? confirmedAmount : undefined,
          city: (city && typeof city === 'string' ? city.trim() : undefined) || leadToSync.city || undefined,
          state: typeof state === 'string' ? state.trim() : undefined,
          submissionChannel: 'Razorpay Direct Purchase',
          notes: paymentVerificationMessage,
          paymentId: razorpayPaymentId,
          paymentOrderId: razorpayOrderId,
          paymentStatus: 'PAID',
          paymentDetails: `Online Payment Verified via Razorpay HMAC-SHA256 (Amount: ₹${confirmedAmount}, Payment ID: ${razorpayPaymentId}, Order ID: ${razorpayOrderId})`,
        })
        .catch((crmErr) => {
          logger.warn('Non-blocking EFILINGG CRM sync notice for paid lead:', 'PaymentController', crmErr?.message || crmErr);
        });

      res.status(200).json({
        success: true,
        message: 'Payment verified and order confirmed successfully.',
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
        itemName: confirmedItemName,
        amount: confirmedAmount,
        leadId: targetLead?.id || leadToSync.id,
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

