"use client";

import Image from "next/image";
import { UserRound, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
} from "@/components/ui/dropdown-menu";
import { sair } from "@/lib/auth-actions";

interface HeaderUserMenuProps {
  fotoUrl: string | null;
  email: string;
}

export function HeaderUserMenu({ fotoUrl, email }: HeaderUserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Menu de ${email}`}
        className="h-9 w-9 rounded-full overflow-hidden bg-muted flex items-center justify-center border border-transparent hover:border-border transition-colors"
      >
        {fotoUrl ? (
          <Image src={fotoUrl} alt="" width={36} height={36} className="h-full w-full object-cover" />
        ) : (
          <UserRound className="h-5 w-5 text-muted-foreground" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLinkItem href="/perfil">Perfil</DropdownMenuLinkItem>
        <DropdownMenuItem onClick={() => sair()}>
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
