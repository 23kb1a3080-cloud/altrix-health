import React from 'react'
import { useTranslation } from 'react-i18next'
import { Activity, ShieldCheck, FileDown, Printer, Languages } from 'lucide-react'

interface NavbarProps {
  currentTab: string
  setCurrentTab: (tab: string) => void
  onExportFHIR: () => void
  onPrintSummary: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onExportFHIR,
  onPrintSummary,
}) => {
  const { t, i18n } = useTranslation()

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value)
  }

  const navItems = [
    { id: 'about', label: t('nav.about') },
    { id: 'dashboard', label: t('nav.dashboard') },
    { id: 'timeline', label: t('nav.timeline') },
    { id: 'upload', label: t('nav.upload') },
    { id: 'chat', label: t('nav.chat') },
    { id: 'abha', label: t('nav.abha') },
  ]

  return (
    <header className="sticky top-0 z-40 bg-cream-light/90 backdrop-blur-md border-b border-latte-dark shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('about')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-chocolate-dark via-chocolate to-caramel flex items-center justify-center text-cream-light shadow-sm shadow-chocolate/20">
              <Activity className="w-6 h-6 text-cream" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-chocolate-deep tracking-tight">{t('app_name')}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-latte text-chocolate-dark border border-latte-dark">
                  <ShieldCheck className="w-3 h-3 mr-1 text-caramel" />
                  ABDM R4
                </span>
              </div>
              <p className="text-xs text-chocolate hidden sm:block">{t('tagline')}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1 lg:space-x-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === item.id
                    ? 'bg-latte text-chocolate-deep border border-caramel/50 shadow-xs font-semibold'
                    : 'text-chocolate-dark hover:text-caramel-dark hover:bg-latte/60'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Actions & Language Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Export & Print */}
            <button
              onClick={onExportFHIR}
              title="Download Patient FHIR R4 Bundle"
              className="p-2 text-chocolate-dark hover:text-caramel-dark hover:bg-latte rounded-lg border border-latte-dark text-xs hidden lg:flex items-center transition-colors"
            >
              <FileDown className="w-4 h-4 mr-1 text-caramel" />
              FHIR Bundle
            </button>

            <button
              onClick={onPrintSummary}
              title="Print Clinical Summary"
              className="p-2 text-chocolate-dark hover:text-caramel-dark hover:bg-latte rounded-lg border border-latte-dark text-xs hidden lg:flex items-center transition-colors"
            >
              <Printer className="w-4 h-4 mr-1 text-chocolate" />
              Print
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-latte rounded-lg px-2 py-1 border border-latte-dark">
              <Languages className="w-4 h-4 text-caramel mr-1.5" />
              <select
                aria-label="Select Language"
                value={i18n.language}
                onChange={handleLanguageChange}
                className="bg-transparent text-xs font-semibold text-chocolate-deep focus:outline-hidden cursor-pointer"
              >
                <option value="en">English (EN)</option>
                <option value="hi">हिन्दी (HI)</option>
                <option value="te">తెలుగు (TE)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="md:hidden flex overflow-x-auto py-2 border-t border-latte-dark space-x-2 scrollbar-none">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`px-3 py-1.5 whitespace-nowrap rounded-lg text-xs font-medium transition-colors ${
                currentTab === item.id
                  ? 'bg-caramel text-white font-semibold'
                  : 'bg-latte text-chocolate-dark'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
