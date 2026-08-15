export interface TestimonialItem {
  id: string;
  clientName: string;
  company?: string;
  designation?: string;
  quote: string;
  rating: number;
  avatarUrl?: string | null;
  videoUrl?: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string | null;
}

export interface CreateTestimonialInput {
  clientName: string;
  company?: string;
  designation?: string;
  quote: string;
  rating?: number;
  avatarUrl?: string | null;
  videoUrl?: string | null;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateTestimonialInput {
  clientName?: string;
  company?: string;
  designation?: string;
  quote?: string;
  rating?: number;
  avatarUrl?: string | null;
  videoUrl?: string | null;
  isActive?: boolean;
  displayOrder?: number;
}

export interface TestimonialStats {
  total: number;
  published: number;
  draft: number;
  withVideo: number;
}

export interface TestimonialsResponse {
  testimonials: TestimonialItem[];
  total: number;
  stats: TestimonialStats;
}
