import mongoose, { Schema, Document } from 'mongoose';

export interface IHeroSlide extends Document {
  tag: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  image: string;
  order?: number;
  isActive?: boolean;
}
//  id: 1,
//     tag: 'FRESH OFFERS',
//     title: 'Style picks for every plan',
//     subtitle: 'Discover clothing deals, curated collections, and easy checkout in one place.',
//     ctaText: 'View Offers',
//     ctaLink: '/live-promotions',
//     image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1600&q=85'

export const HeroSlideSchema = new Schema<IHeroSlide>(
  {
    tag: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    ctaText: { type: String, required: true },
    ctaLink: { type: String, required: true },
    image: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const HeroSlideModel = mongoose.models.HeroSlide || mongoose.model<IHeroSlide>('HeroSlide', HeroSlideSchema);
