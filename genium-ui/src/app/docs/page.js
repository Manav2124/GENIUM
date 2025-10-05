"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import DocsPageContent from '../../components/DocsPage';

export default function DocsPage() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <DocsPageContent onBack={handleBack} />
  );
}