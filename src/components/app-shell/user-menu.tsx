import { LogOutIcon, ShieldIcon, UserIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/server/actions/auth";
import { requireUser } from "@/server/session";

export async function UserMenu() {
  const user = await requireUser();

  return (
    <div className="flex items-center gap-3">
      {user.isAnonymous && (
        <Badge variant="secondary" className="hidden sm:inline-flex">
          Demo account
        </Badge>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" aria-label="Account menu">
            <UserIcon aria-hidden />
            <span className="max-w-32 truncate max-sm:hidden">{user.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col">
            <span className="truncate">{user.name}</span>
            {!user.isAnonymous && (
              <span className="truncate text-xs font-normal text-muted-foreground">
                {user.email}
              </span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {user.role === "admin" && (
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <ShieldIcon aria-hidden />
                Admin
              </Link>
            </DropdownMenuItem>
          )}
          <form action={signOut}>
            <DropdownMenuItem asChild>
              <button type="submit" className="w-full">
                <LogOutIcon aria-hidden />
                Sign out
              </button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
