"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Home,
  ShieldCheck,
  MessageSquare,
  AlertTriangle,
  Star,
  Menu,
  User,
  Settings,
  LogOut,
  Shield,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SupabaseConfigDialog } from '@/components/supabase-config-dialog';
import { useState } from 'react';
import { useSupabase } from '@/contexts/supabase-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isConfigOpen, setConfigOpen] = useState(false);
  const { disconnect, credentials } = useSupabase();

  const navItems = [
    { href: '/', label: 'Monitoring', icon: Home },
    { href: '/sendguard', label: 'SendGuard', icon: ShieldCheck },
    { href: '/manual-reply', label: 'Manual Reply', icon: MessageSquare },
    { href: '/escalation', label: 'Escalation', icon: AlertTriangle },
    { href: '/important', label: 'Important', icon: Star },
  ];

  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col gap-4 px-4 py-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
            <Shield size={24} />
            <span className="text-xl">Neswave</span>
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                pathname === item.href ? 'bg-muted text-primary' : 'text-muted-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium">
                <Link href="/" className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base">
                   <Shield className="h-5 w-5 transition-all group-hover:scale-110" />
                   <span className="sr-only">Neswave</span>
                </Link>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-4 px-2.5 ${
                      pathname === item.href ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="relative ml-auto flex-1 md:grow-0">
             {/* Can add a search bar here if needed in future */}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setConfigOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuration</span>
              </DropdownMenuItem>
              <Link href="/recovery">
                <DropdownMenuItem>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Data Recovery</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={disconnect} disabled={!credentials}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Disconnect</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-0">{children}</main>
      </div>
      <SupabaseConfigDialog open={isConfigOpen} onOpenChange={setConfigOpen} />
    </div>
  );
}
