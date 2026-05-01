import React from 'react';
import { MainAppBar } from './MainAppBar';

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MainAppBar />
      {children}
    </>
  );
}
