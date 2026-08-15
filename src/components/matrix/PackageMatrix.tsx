import React, { useState, useEffect } from 'react';
import { Check, X, Layers } from 'lucide-react';
import { fetchPublicMatrix, PublicMatrixData } from '../../services/publicPackage.service';
import { PACKAGE_MATRIX as STATIC_PACKAGE_MATRIX, PACKAGES as STATIC_PACKAGES } from '../../data/websiteData';

interface PackageMatrixProps {
  onOpenConsultation: (packageName?: string) => void;
}

export const PackageMatrix: React.FC<PackageMatrixProps> = ({ onOpenConsultation }) => {
  // Initialize with fallback static structure to prevent layout flicker
  const [matrixData, setMatrixData] = useState<PublicMatrixData>(() => {
    const defaultCategories: string[] = [];
    const seen = new Set<string>();
    for (const r of STATIC_PACKAGE_MATRIX) {
      if (!seen.has(r.category)) {
        seen.add(r.category);
        defaultCategories.push(r.category);
      }
    }

    return {
      packages: STATIC_PACKAGES.map((p, idx) => ({
        id: p.id,
        name: p.name,
        tagline: p.tagline || null,
        priceAmount: p.price.replace(/[^\d.]/g, '') || '0',
        currency: 'INR',
        billingType: p.period?.includes('yr') || p.period?.includes('year') ? 'yearly' : 'one_time',
        priceDisplayOverride: p.price,
        popular: Boolean(p.popular),
        badge: p.badge || null,
        displayOrder: idx,
        formattedPrice: p.price,
        period: p.period,
        shortName: p.name.trim().split(' ')[0] || 'Plan',
        ctaLabel: p.ctaLabel || `Select ${p.name.trim().split(' ')[0]}`,
      })),
      rows: STATIC_PACKAGE_MATRIX.map((r, idx) => ({
        id: `static-row-${idx}`,
        category: r.category,
        featureName: r.featureName,
        tooltip: r.tooltip || null,
        displayOrder: idx,
        packageValues: {
          starter: r.starter,
          growth: r.growth,
          enterprise: r.enterprise,
        },
      })),
      categories: defaultCategories,
      isFallback: true,
    };
  });

  useEffect(() => {
    let isMounted = true;

    async function loadMatrix() {
      const data = await fetchPublicMatrix();
      if (isMounted && data.packages.length > 0) {
        setMatrixData(data);
      }
    }

    loadMatrix();

    return () => {
      isMounted = false;
    };
  }, []);

  const renderCellContent = (val: boolean | string | undefined) => {
    if (typeof val === 'boolean') {
      return val ? (
        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <X className="w-3 h-3 stroke-[2]" />
        </div>
      );
    }
    if (val === undefined || val === null || val === '') {
      return (
        <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <X className="w-3 h-3 stroke-[2]" />
        </div>
      );
    }
    return (
      <span className="text-xs font-semibold text-slate-800 text-center block">
        {val}
      </span>
    );
  };

  const { packages, rows, categories } = matrixData;
  const colSpanCount = 1 + packages.length;

  return (
    <section id="matrix-section" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
            <Layers className="w-3.5 h-3.5 text-orange-600" />
            Comparison Matrix
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B132B] tracking-tight font-sans">
            Package Deliverables Matrix
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Side-by-side breakdown of services across advisory, compliance, and corporate retainer tiers.
          </p>
        </div>

        {/* Comparison Table Container */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[680px]">
              {/* Table Header */}
              <thead>
                <tr className="bg-[#0B132B] text-white divide-x divide-slate-800">
                  <th className="p-4 sm:p-5 text-xs sm:text-sm font-bold text-white w-2/5 sm:w-1/3">
                    Deliverables & Inclusions
                  </th>
                  {packages.map((pkg) => (
                    <th
                      key={pkg.id}
                      className={`p-4 sm:p-5 text-center ${
                        pkg.popular ? 'bg-orange-600' : ''
                      }`}
                    >
                      <div className={`text-xs font-bold ${pkg.popular ? 'text-white' : ''}`}>
                        {pkg.shortName || pkg.name}
                      </div>
                      <div
                        className={`text-[11px] font-normal ${
                          pkg.popular ? 'text-orange-100' : 'text-slate-400'
                        }`}
                      >
                        {pkg.formattedPrice}
                        {pkg.period ? (pkg.period.startsWith('/') ? pkg.period : `/${pkg.period}`) : ''}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-200">
                {categories.map((category) => {
                  const rowsInCategory = rows.filter((r) => r.category === category);
                  return (
                    <React.Fragment key={category}>
                      {/* Category Header Row */}
                      <tr className="bg-slate-100/80">
                        <td
                          colSpan={colSpanCount}
                          className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#0B132B] border-t border-b border-slate-200"
                        >
                          {category}
                        </td>
                      </tr>

                      {/* Item Rows */}
                      {rowsInCategory.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-slate-50 transition-colors divide-x divide-slate-100"
                        >
                          <td className="px-5 py-3 text-xs font-medium text-slate-800">
                            {row.featureName}
                          </td>
                          {packages.map((pkg) => {
                            const val = row.packageValues[pkg.id];
                            return (
                              <td
                                key={pkg.id}
                                className={`px-4 py-3 text-center ${
                                  pkg.popular ? 'bg-orange-50/40' : ''
                                }`}
                              >
                                {renderCellContent(val)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>

              {/* Table Footer Actions */}
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200 divide-x divide-slate-200">
                  <td className="p-4 text-xs font-bold text-slate-700">
                    Ready to proceed with your business setup?
                  </td>
                  {packages.map((pkg) => (
                    <td
                      key={pkg.id}
                      className={`p-3 text-center ${pkg.popular ? 'bg-orange-50/60' : ''}`}
                    >
                      <button
                        onClick={() => onOpenConsultation(pkg.name)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer w-full shadow-xs ${
                          pkg.popular
                            ? 'text-white bg-orange-600 hover:bg-orange-700'
                            : 'text-[#0B132B] bg-white border border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {pkg.ctaLabel}
                      </button>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

