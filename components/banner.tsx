import Link from "next/link";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MenuIcon } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

function Banner() {
  return (
    <div className="w-full mx-auto bg-orange-600 text-black">
      <div className="flex items-center justify-between px-8 py-4">
        <header>
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
            <Link href={"/"}>Parkify</Link>
          </h1>
        </header>
        <div>
          <div>
            <div className="sm:hidden flex space-x-2 items-baseline">
              <DropdownMenu>
                <DropdownMenuTrigger><MenuIcon/></DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Signout</DropdownMenuLabel>
                  <DropdownMenuItem><Link href={'/mybookings'}>My Bookings</Link></DropdownMenuItem>
                  <DropdownMenuItem><Link href={'/dashboard'}>Admin</Link></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              Signout
              Signin
            </div>


            <div className="hidden sm:flex gap-x-4 items-center">
            <Link href={'/mybookings'}>My Bookings</Link>
            <Link href={'/dashboard'}>Admin</Link>
          <SignedOut>
            <SignInButton/>
          </SignedOut>
          <SignedIn>
            <UserButton/>
          </SignedIn>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-orange-600 w-full h-20"></div>
    </div>
  );
}

export default Banner;
