import {
  serviceRepository,
  PublicCategoryItem,
  PublicServiceSummary,
  PublicServiceDetail,
} from '../repositories/service.repository';
import { logger } from '../utils/logger';

export class ServiceService {
  /**
   * Fetch all active service categories ordered by display_order
   */
  async getAllPublicCategories(): Promise<PublicCategoryItem[]> {
    logger.info('Fetching public service categories...', 'ServiceService');
    return await serviceRepository.getAllPublicCategories();
  }

  /**
   * Fetch all active services ordered by display_order
   */
  async getAllPublicServices(): Promise<PublicServiceSummary[]> {
    logger.info('Fetching all public services...', 'ServiceService');
    return await serviceRepository.getAllPublicServices();
  }

  /**
   * Fetch active services belonging to a category
   */
  async getPublicServicesByCategory(
    categoryId: string
  ): Promise<{ category: PublicCategoryItem; services: PublicServiceSummary[] } | null> {
    logger.info(`Fetching public services for category: ${categoryId}`, 'ServiceService');
    return await serviceRepository.getPublicServicesByCategory(categoryId);
  }

  /**
   * Fetch complete single service landing-page payload by canonical slug
   */
  async getPublicServiceBySlug(slug: string): Promise<PublicServiceDetail | null> {
    logger.info(`Fetching complete public service details for slug: ${slug}`, 'ServiceService');
    return await serviceRepository.getPublicServiceBySlug(slug);
  }
}

export const serviceService = new ServiceService();
