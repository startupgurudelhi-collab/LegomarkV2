import { Request, Response } from 'express';
import { leadRepository } from '../repositories/lead.repository';
import { crmService } from '../services/crm.service';
import { logger } from '../utils/logger';

/**
 * Public Consultation Controller
 * Handles inbound consultation requests from the website forms and modals
 */
export class LeadController {
  /**
   * Submit public consultation enquiry
   * POST /api/leads or POST /api/consultations
   */
  async submitConsultation(req: Request, res: Response): Promise<void> {
    try {
      const {
        fullName,
        phone,
        email,
        city,
        state,
        selectedService,
        serviceInterested,
        serviceId,
        packageDetails,
        packageFee,
        submissionChannel,
        notes,
        message,
        source,
      } = req.body;

      if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Full name is required',
        });
        return;
      }

      if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Phone number is required',
        });
        return;
      }

      const targetService = (serviceInterested || selectedService || 'General Consultation').trim();

      const createdLead = await leadRepository.createLead({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email && typeof email === 'string' ? email.trim() : undefined,
        city: city && typeof city === 'string' ? city.trim() : undefined,
        serviceInterested: targetService,
        serviceId: serviceId && typeof serviceId === 'string' ? serviceId.trim() : undefined,
        message: (message || notes || '').trim() || undefined,
        source: (source && typeof source === 'string' ? source.trim() : undefined) || 'Website Consultation Modal',
      });

      logger.info(`New consultation enquiry received from ${createdLead.fullName} for ${createdLead.serviceInterested}`, 'PublicLead');

      // Forward lead to EFILINGG CRM server-side in a non-blocking flow
      // This ensures LEGOMARK remains the primary lead record and stays saved even if CRM is unavailable
      crmService
        .sendLeadToCrm(createdLead, {
          selectedService: typeof selectedService === 'string' ? selectedService : undefined,
          packageDetails: typeof packageDetails === 'string' ? packageDetails : undefined,
          packageFee: packageFee !== undefined ? packageFee : undefined,
          city: typeof city === 'string' ? city : undefined,
          state: typeof state === 'string' ? state : undefined,
          submissionChannel: typeof submissionChannel === 'string' ? submissionChannel : undefined,
          notes: typeof notes === 'string' ? notes : undefined,
          message: typeof message === 'string' ? message : undefined,
        })
        .catch((crmErr) => {
          logger.warn('Non-blocking EFILINGG CRM sync notice:', 'PublicLead', crmErr?.message || crmErr);
        });

      res.status(201).json({
        success: true,
        message: 'Consultation request submitted successfully. Our corporate advisory team will contact you shortly.',
        lead: {
          id: createdLead.id,
          fullName: createdLead.fullName,
          phone: createdLead.phone,
          serviceInterested: createdLead.serviceInterested,
          createdAt: createdLead.createdAt,
        },
      });
    } catch (err: any) {
      logger.error('Error handling public consultation submission', 'PublicLead', err);
      res.status(500).json({
        success: false,
        error: 'Failed to process consultation request. Please contact us directly via phone or email.',
      });
    }
  }
}

export const leadController = new LeadController();
