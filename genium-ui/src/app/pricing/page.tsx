"use client";
import React from 'react';
import { PricingSection, PLANS } from '../../components/ui/pricing';

export default function PricingPage() {
  return (
    <PricingSection
      heading="Simple, Transparent Pricing"
      description="Choose the plan that's right for you."
      plans={PLANS}
    />
  );
}