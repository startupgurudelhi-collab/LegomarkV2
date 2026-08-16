import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  FileCheck2,
  Clock,
  Lock,
  CheckCircle2,
  Star,
  User,
  Play,
  X,
  MessageSquareQuote,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { TestimonialItem } from '../../types/testimonial';
import { fetchPublicTestimonials } from '../../services/testimonial.service';

export const TestimonialsSection: React.FC = () => {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [activeVideoItem, setActiveVideoItem] = useState<TestimonialItem | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  useEffect(() => {
    fetchPublicTestimonials().then((items) => {
      if (items && items.length > 0) {
        setTestimonials(items);
      }
    });
  }, []);

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const el = scrollContainerRef.current;
    if (!el) return;

    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [testimonials]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.85 : clientWidth * 0.85;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeftState(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeftState - walk;
  };

  const commitments = [
    {
      icon: <Clock className="w-5 h-5 text-orange-600" />,
      title: 'Punctual Statutory Filings',
      desc: 'Proactive scheduling and timely submissions for ROC annual filings, GST returns, and tax acknowledgments to avoid statutory late fees.',
    },
    {
      icon: <Lock className="w-5 h-5 text-orange-600" />,
      title: 'Confidentiality & Data Security',
      desc: 'All director identity documents, DSC credentials, accounting data, and corporate secretarial files are handled with strict privacy protocols.',
    },
    {
      icon: <FileCheck2 className="w-5 h-5 text-orange-600" />,
      title: 'Clear Documentation & Drafting',
      desc: 'Precise legal drafting for MOA, AOA, Partnership Deeds, LLP Agreements, and trademark applications adhering to current government norms.',
    },
    {
      icon: <Shield className="w-5 h-5 text-orange-600" />,
      title: 'Direct Advisory Guidance',
      desc: 'Clear communication throughout each stage of company incorporation, tax registration, and annual compliance management.',
    },
  ];

  return (
    <section id="testimonials-section" className="py-16 bg-slate-50 border-b border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Dynamic Client Testimonials Horizontal Carousel */}
        {testimonials.length > 0 && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="text-left max-w-2xl space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
                  <MessageSquareQuote className="w-3.5 h-3.5 text-orange-600" />
                  Client Testimonials
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B132B] tracking-tight font-sans">
                  Trusted by Founders & Enterprise Leaders
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Read direct feedback from business owners and founders who rely on LEGOMARK INDIA for statutory structuring, tax compliance, and legal counsel.
                </p>
              </div>

              {/* Carousel Navigation Buttons */}
              <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => handleScroll('left')}
                  disabled={!canScrollLeft}
                  aria-label="Previous testimonials"
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                    canScrollLeft
                      ? 'bg-white hover:bg-orange-50 text-slate-800 hover:text-orange-600 border-slate-200 shadow-xs hover:border-orange-200'
                      : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-50'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScroll('right')}
                  disabled={!canScrollRight}
                  aria-label="Next testimonials"
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                    canScrollRight
                      ? 'bg-white hover:bg-orange-50 text-slate-800 hover:text-orange-600 border-slate-200 shadow-xs hover:border-orange-200'
                      : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-50'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Horizontal Scrollable Track */}
            <div
              ref={scrollContainerRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              className={`flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 pt-1 px-1 -mx-1 select-none scrollbar-thin scrollbar-thumb-slate-200 ${
                isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
              }`}
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {testimonials.map((item) => (
                <div
                  key={item.id}
                  id={`testimonial-card-${item.id}`}
                  className="w-[88%] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0 snap-start bg-white border border-slate-200 p-6 sm:p-7 rounded-2xl flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all shadow-xs space-y-5"
                >
                  <div className="space-y-3.5">
                    {/* Stars */}
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < (item.rating || 5)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Quote */}
                    <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed line-clamp-6">
                      "{item.quote}"
                    </p>

                    {/* Video Attachment Button */}
                    {item.videoUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveVideoItem(item);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-orange-600 text-orange-600" />
                        <span>Watch Video Review</span>
                      </button>
                    )}
                  </div>

                  {/* Author / Client Info */}
                  <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {item.avatarUrl ? (
                        <img
                          src={item.avatarUrl}
                          alt={item.clientName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      ) : (
                        <User className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#0B132B]">
                        {item.clientName}
                      </h4>
                      <p className="text-[11px] text-orange-600 font-medium">
                        {item.designation}
                        {item.company ? ` • ${item.company}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Playback Modal */}
        {activeVideoItem && activeVideoItem.videoUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {activeVideoItem.clientName} — Client Video Testimonial
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {activeVideoItem.designation} {activeVideoItem.company ? `• ${activeVideoItem.company}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => setActiveVideoItem(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="rounded-xl overflow-hidden bg-black border border-slate-800">
                <video
                  src={activeVideoItem.videoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full max-h-96 object-contain"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setActiveVideoItem(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section: Advisory Standards Commitments */}
        <div className="space-y-10 pt-4">
          <div className="text-center max-w-3xl mx-auto space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />
              Advisory Standards
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B132B] tracking-tight font-sans">
              Our Client Service Commitments
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Professional principles guiding every corporate setup, taxation filing, and secretarial engagement at LEGOMARK INDIA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {commitments.map((item, idx) => (
              <div
                key={idx}
                id={`commitment-card-${idx}`}
                className="bg-white border border-slate-200 p-6 sm:p-7 rounded-xl flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <h3 className="text-base font-bold text-[#0B132B]">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

