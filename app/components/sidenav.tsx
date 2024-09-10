'use client'

import { useState } from 'react'
import { Button } from "~/components/ui/button"
import { ScrollArea } from "~/components/ui/scroll-area"
import { cn } from "~/lib/utils"
import { Home, PersonStanding, LandPlot, Menu, X } from 'lucide-react'
import { Link, useMatch } from '@remix-run/react'
import tgcIcon from "~/src/assets/images/tgcIcon.png";
import { navigation } from '~/src/components/header/Header'
interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}



interface SidenavProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidenav({ isOpen, onToggle }: SidenavProps) {



  return (
    <>


      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-background shadow-lg transform transition-transform duration-200 ease-in-out md:translate-x-0 ",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4">
            <div >
              <Link to="/" className="text-white flex-col items-center justify-center">
                <div className="flex items-center justify-center">
                  <div className="bg-white rounded-xl mr-2 " style={{ maxWidth: "60px" }}>
                    <img src={tgcIcon} style={{ width: "60px", height: "60px" }} />
                  </div>
                </div>
                <span className="text-sm">The Great Commission</span>
              </Link>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden absolute right-0 top-0 text-tgc-primary hover:text-tgc-secondary"
              onClick={onToggle}
            >
              <X className="h-6 w-6" />
              <span className="sr-only">Close Menu</span>
            </Button>
          </div>
          <ScrollArea className="flex-grow">
            <nav className="px-2 py-4">
              {navigation.map((item: NavItem) => {
                const match = useMatch(item.href);
                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    style={{ borderRadius: "0.5rem" }}
                    onClick={onToggle}
                    className={cn(
                      "flex items-center px-4 py-2 mt-2 text-sm transition-colors duration-200 ",
                      match
                        ? "text-tgc-dark bg-white"
                        : "text-tgc-accent hover:text-tgc-dark hover:bg-tgc-primary"
                    )}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
        </div>
      </div>
    </>
  )
}