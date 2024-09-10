'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sidenav } from './sidenav'
import Header from '~/src/components/header/Header'

// Assume these components are already created and imported


export function TGCLayout({ children }: { children: React.ReactNode }) {
  const [sidenavOpen, setSidenavOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden w-full">
      {/* Sidenav - hidden on mobile, toggleable */}
      <div
        className={`${sidenavOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed inset-y-0 left-0 z-50 w-64 transform overflow-y-auto bg-gray-800 transition duration-200 ease-in-out lg:static lg:translate-x-0`}
      >
        <Sidenav isOpen={sidenavOpen} onToggle={() => setSidenavOpen(!sidenavOpen)} />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm lg:overflow-y-visible">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative flex justify-between lg:gap-8 xl:grid xl:grid-cols-12">
              <div className="flex md:absolute md:inset-y-0 md:left-0 lg:static xl:col-span-2">
                <div className="flex flex-shrink-0 items-center">
                  {/* Mobile menu button */}
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md p-2 text-tgc-dark hover:bg-tgc-primary hover:text-tgc-dark focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 lg:hidden"
                    onClick={() => setSidenavOpen(!sidenavOpen)}
                  >
                    <span className="sr-only">Open sidebar</span>
                    <Menu className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="min-w-0 flex-1 md:px-8 lg:px-0 xl:col-span-10">
                <Header />
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">{children}</main>
      </div>
    </div>
  )
}