import { getDatabase, pingDatabase } from '../config/database';
import { websiteSettings, WebsiteSettings, NewWebsiteSettings, systemMetadata } from '../../db/schema/index';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { COMPANY_PROFILE } from '../../src/data/websiteData';

export interface UpdateSettingsInput {
  companyName?: string;
  positioning?: string;
  tagline?: string;
  businessDescription?: string;
  phone?: string;
  mobile?: string;
  landline?: string;
  email?: string;
  whatsapp?: string;
  primaryWebsite?: string;
  secondaryWebsite?: string;
  officeHours?: string;
  registeredOfficeAddress?: string;
  logoUrl?: string | null;
  fontFamily?: string;
}

export type SettingsWithFont = WebsiteSettings & {
  fontFamily?: string;
};

const DEFAULT_FONT = 'Plus Jakarta Sans';

const DEFAULT_SETTINGS: WebsiteSettings = {
  id: 'global',
  companyName: COMPANY_PROFILE.name || 'LEGOMARK INDIA',
  positioning: COMPANY_PROFILE.positioning || 'LEGAL, TAXATION & CORPORATE ADVISORY',
  tagline: COMPANY_PROFILE.tagline || 'Legal, Taxation & Corporate Advisory Services',
  businessDescription: 'Simplifying company registration, taxation, trademark protection, and business compliance through transparent professional services.',
  phone: COMPANY_PROFILE.contact.mobile || '+91 75308 47878',
  mobile: COMPANY_PROFILE.contact.mobile || '+91 75308 47878',
  landline: COMPANY_PROFILE.contact.landline || '011-45768289',
  email: COMPANY_PROFILE.contact.email || 'info@legomarkindia.com',
  whatsapp: COMPANY_PROFILE.contact.mobile || '+91 75308 47878',
  primaryWebsite: COMPANY_PROFILE.contact.primaryWebsite || 'www.legomarkindia.com',
  secondaryWebsite: COMPANY_PROFILE.contact.websites[1] || 'www.legomark.com',
  officeHours: COMPANY_PROFILE.contact.officeHours || 'Monday to Sunday: 11:00 AM – 8:00 PM',
  registeredOfficeAddress: COMPANY_PROFILE.address.fullAddress || 'D-561, Pocket 11, DDA Janta Flats, Jasola, New Delhi – 110025',
  logoUrl: null,
  updatedAt: new Date(),
  updatedBy: 'System Default',
};

class SettingsRepository {
  private fallbackStore: WebsiteSettings = { ...DEFAULT_SETTINGS };
  private fallbackFont: string = DEFAULT_FONT;

  /**
   * Fetch current global website settings (including configured font family)
   */
  async getSettings(): Promise<SettingsWithFont> {
    const dbStatus = await pingDatabase();
    let currentSettings = this.fallbackStore;
    let currentFont = this.fallbackFont;

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const rows = await db
          .select()
          .from(websiteSettings)
          .where(eq(websiteSettings.id, 'global'))
          .limit(1);

        if (rows && rows.length > 0) {
          currentSettings = rows[0];
        }

        // Fetch configured font family from systemMetadata
        const fontRows = await db
          .select()
          .from(systemMetadata)
          .where(eq(systemMetadata.key, 'site_font_family'))
          .limit(1);

        if (fontRows && fontRows.length > 0 && fontRows[0].value) {
          currentFont = fontRows[0].value;
          this.fallbackFont = currentFont;
        }
      } catch (err) {
        logger.error('Error fetching website settings from DB', 'SettingsRepo', err);
      }
    }

    return {
      ...currentSettings,
      fontFamily: currentFont,
    };
  }

  /**
   * Update or upsert website settings (including font family)
   */
  async updateSettings(input: UpdateSettingsInput, authorUser = 'Admin'): Promise<SettingsWithFont> {
    const existing = await this.getSettings();
    const dbStatus = await pingDatabase();
    const now = new Date();

    const patch: Partial<WebsiteSettings> = {
      updatedAt: now,
      updatedBy: authorUser,
    };

    if (input.companyName !== undefined) patch.companyName = input.companyName.trim();
    if (input.positioning !== undefined) patch.positioning = input.positioning.trim();
    if (input.tagline !== undefined) patch.tagline = input.tagline.trim();
    if (input.businessDescription !== undefined) patch.businessDescription = input.businessDescription.trim();
    if (input.phone !== undefined) patch.phone = input.phone.trim();
    if (input.mobile !== undefined) patch.mobile = input.mobile.trim();
    if (input.landline !== undefined) patch.landline = input.landline.trim();
    if (input.email !== undefined) patch.email = input.email.trim();
    if (input.whatsapp !== undefined) patch.whatsapp = input.whatsapp.trim();
    if (input.primaryWebsite !== undefined) patch.primaryWebsite = input.primaryWebsite.trim();
    if (input.secondaryWebsite !== undefined) patch.secondaryWebsite = input.secondaryWebsite.trim();
    if (input.officeHours !== undefined) patch.officeHours = input.officeHours.trim();
    if (input.registeredOfficeAddress !== undefined) patch.registeredOfficeAddress = input.registeredOfficeAddress.trim();
    
    // Only touch logoUrl if explicitly provided in input.
    // If undefined/omitted, preserve the existing database value.
    if (input.logoUrl !== undefined) {
      patch.logoUrl = input.logoUrl ? input.logoUrl.trim() : null;
    }

    let savedFont = existing.fontFamily || DEFAULT_FONT;
    if (input.fontFamily !== undefined && input.fontFamily.trim()) {
      savedFont = input.fontFamily.trim();
      this.fallbackFont = savedFont;
    }

    if (dbStatus.connected) {
      try {
        const db = getDatabase();
        const merged: NewWebsiteSettings = {
          id: 'global',
          companyName: patch.companyName !== undefined ? patch.companyName : existing.companyName,
          positioning: patch.positioning !== undefined ? patch.positioning : existing.positioning,
          tagline: patch.tagline !== undefined ? patch.tagline : existing.tagline,
          businessDescription: patch.businessDescription !== undefined ? patch.businessDescription : existing.businessDescription,
          phone: patch.phone !== undefined ? patch.phone : existing.phone,
          mobile: patch.mobile !== undefined ? patch.mobile : existing.mobile,
          landline: patch.landline !== undefined ? patch.landline : existing.landline,
          email: patch.email !== undefined ? patch.email : existing.email,
          whatsapp: patch.whatsapp !== undefined ? patch.whatsapp : existing.whatsapp,
          primaryWebsite: patch.primaryWebsite !== undefined ? patch.primaryWebsite : existing.primaryWebsite,
          secondaryWebsite: patch.secondaryWebsite !== undefined ? patch.secondaryWebsite : existing.secondaryWebsite,
          officeHours: patch.officeHours !== undefined ? patch.officeHours : existing.officeHours,
          registeredOfficeAddress: patch.registeredOfficeAddress !== undefined ? patch.registeredOfficeAddress : existing.registeredOfficeAddress,
          logoUrl: patch.logoUrl !== undefined ? patch.logoUrl : existing.logoUrl,
          updatedAt: now,
          updatedBy: authorUser,
        };

        const updated = await db
          .insert(websiteSettings)
          .values(merged)
          .onConflictDoUpdate({
            target: websiteSettings.id,
            set: patch,
          })
          .returning();

        // Upsert font family in systemMetadata table
        if (input.fontFamily !== undefined && input.fontFamily.trim()) {
          try {
            await db
              .insert(systemMetadata)
              .values({
                key: 'site_font_family',
                value: savedFont,
                updatedAt: now,
                createdAt: now,
              })
              .onConflictDoUpdate({
                target: systemMetadata.key,
                set: {
                  value: savedFont,
                  updatedAt: now,
                },
              });
          } catch (fontErr) {
            logger.warn('Could not persist font to systemMetadata, keeping fallback in memory', 'SettingsRepo', fontErr);
          }
        }

        if (updated && updated.length > 0) {
          this.fallbackStore = updated[0];
          return {
            ...updated[0],
            fontFamily: savedFont,
          };
        }
      } catch (err) {
        logger.error('Error saving website settings in DB', 'SettingsRepo', err);
      }
    }

    this.fallbackStore = {
      ...existing,
      ...patch,
    };
    return {
      ...this.fallbackStore,
      fontFamily: savedFont,
    };
  }
}

export const settingsRepository = new SettingsRepository();
