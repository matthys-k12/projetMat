/**
 * Mise en page des écrans connectés : sidebar fixe 248 px à partir de 1024 px,
 * tiroir (Sheet, 300 px) en dessous, en-tête collant, contenu paddé 32 px (16 px mobile).
 * Tier : présentation.
 */
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { NavigationLaterale } from './NavigationLaterale';
import { EnTeteApp } from './EnTeteApp';

export function MiseEnPageApp() {
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r bg-card lg:block">
        <NavigationLaterale />
      </aside>

      <Sheet open={menuOuvert} onOpenChange={setMenuOuvert}>
        <SheetContent side="left" className="w-[300px] p-0 sm:max-w-[300px]">
          <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
          <SheetDescription className="sr-only">Liens vers les pages de l&apos;application</SheetDescription>
          <NavigationLaterale mobile surNavigation={() => setMenuOuvert(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-col">
        <EnTeteApp surOuvrirMenu={() => setMenuOuvert(true)} />
        <main className="mx-auto flex w-full max-w-[1256px] flex-col gap-6 p-4 pb-28 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
