'use client';

import React from 'react';
import { Sparkles, ShieldCheck, Truck, RotateCcw, Award, HeartHandshake } from 'lucide-react';

export function ValuePropsSection() {
  const features = [
    {
      icon: Award,
      title: 'Premium Nida & Silk Fabrics',
      description: 'Crafted with imported Korean Nida, pure Dubai silk, and breathable airy cotton fabrics.'
    },
    {
      icon: ShieldCheck,
      title: '100% Authentic Modest Cut',
      description: 'Generous flared silhouettes, full-length hemlines, and modest wrist coverage for effortless modesty.'
    },
    {
      icon: Truck,
      title: 'Fast Doorstep BD Delivery',
      description: 'Swift 2-3 day express courier delivery across all 64 districts in Bangladesh.'
    },
    {
      icon: RotateCcw,
      title: '30-Day Easy Exchange',
      description: 'Hassle-free size replacement and item exchange guarantee within 30 days.'
    }
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8 sm:my-14">
      <div className="bg-[#FFFBF0] border border-[#F2C76E]/60 rounded-3xl p-6 sm:p-10 space-y-8 shadow-xs">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F2C76E]/20 border border-[#F2C76E]/60 rounded-full text-xs text-[#9B050B] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Falak Closet Standard</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#0C163A]">
            Why Modest Fashion Lovers Choose Us
          </h2>
          <p className="text-xs sm:text-sm text-stone-600">
            We blend timeless elegance with modern modest tailoring, ensuring premium comfort and elegance in every stitch.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-[#F2C76E]/40 space-y-3 shadow-xs hover:border-[#9B050B]/30 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-[#9B050B]/10 text-[#9B050B] flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-sm text-[#0C163A]">
                  {item.title}
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
