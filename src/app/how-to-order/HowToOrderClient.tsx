'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Ruler, CreditCard, Truck, ChevronDown, HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { getFAQSchema } from '@/lib/schema';

export default function HowToOrderClient() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How do I pick the right size for Abayas & Kaftans?',
      answer: 'Our abayas follow standard sleeve length sizing based on height (e.g. Size 54 fits heights 5\'3" to 5\'5"). You can click the "Size Guide" button on any product detail page for exact bust and shoulder measurements.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept Cash on Delivery (COD), bKash / Nagad Mobile Banking, and major Credit/Debit Cards.'
    },
    {
      question: 'How long does Express delivery take?',
      answer: 'Standard Express shipping within Dhaka takes 24-48 hours. Nationwide delivery across Bangladesh takes 2-3 business days.'
    },
    {
      question: 'Can I track my parcel once shipped?',
      answer: 'Yes! Every order receives a unique Reference Tracking Code. Enter your Order ID on our Track Shipment page for real-time logistics progress.'
    }
  ];

  const faqSchema = getFAQSchema(faqs);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10 pb-28 lg:pb-12 text-stone-900 font-sans">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="text-center max-w-xl mx-auto space-y-3">
        <span className="px-3.5 py-1 bg-[#FDF2F3] text-[#A80C14] text-xs font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5" /> Customer Service Guide
        </span>
        <h1 className="font-sans text-3xl sm:text-4xl font-extrabold text-stone-900">
          How to Place Your Order
        </h1>
        <p className="text-xs sm:text-sm text-stone-500">
          Simple 4-step shopping guide for handcrafted haute couture modest fashion creations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { step: '01', title: 'Browse Collection', desc: 'Explore handcrafted abayas, luxury hijabs, and designer kaftans.', icon: ShoppingBag },
          { step: '02', title: 'Select Color & Size', desc: 'Use our precise size chart to choose your custom fit.', icon: Ruler },
          { step: '03', title: 'Express Checkout', desc: 'Enter shipping address and select COD or Mobile Banking.', icon: CreditCard },
          { step: '04', title: 'Doorstep Delivery', desc: 'Receive quality-checked items directly at your doorstep.', icon: Truck }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.step} className="p-5 bg-white rounded-3xl border border-[#F8D2D5] shadow-xs space-y-3 text-center">
              <span className="font-mono font-bold text-[#A80C14] text-xs uppercase tracking-wider block">Step {item.step}</span>
              <div className="w-10 h-10 rounded-2xl bg-[#FDF2F3] text-[#A80C14] flex items-center justify-center mx-auto">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-stone-900">{item.title}</h3>
              <p className="text-xs text-stone-500">{item.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        <h2 className="font-bold text-xl text-stone-900 text-center">Frequently Asked Questions</h2>
        <div className="space-y-3 max-w-2xl mx-auto">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-[#F8D2D5] overflow-hidden shadow-xs">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full p-4 text-left font-bold text-xs sm:text-sm text-stone-900 flex items-center justify-between cursor-pointer"
              >
                <span>{faq.question}</span>
                <ChevronDown className={`w-4 h-4 text-[#A80C14] transition-transform ${openFaqIndex === idx ? 'rotate-180' : ''}`} />
              </button>
              {openFaqIndex === idx && (
                <div className="p-4 pt-0 text-xs text-stone-600 border-t border-[#F8D2D5] bg-[#FDF2F3]/20">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
