'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Leo Finance</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/circles" className="text-gray-600 hover:text-primary-600">
              Circles
            </Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-primary-600">
              Dashboard
            </Link>
            <Link href="/profile" className="text-gray-600 hover:text-primary-600">
              Profile
            </Link>
            <ConnectButton />
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Bitcoin-Backed <br />
          <span className="text-primary-600">Lending Circles</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Join decentralized lending circles powered by Mezo's MUSD stablecoin.
          Build trust, access capital, and grow your financial future.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/circles/create" className="btn btn-primary text-lg px-8 py-3">
            Create Circle
          </Link>
          <Link href="/circles" className="btn btn-secondary text-lg px-8 py-3">
            Browse Circles
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Deposit BTC Collateral</h3>
            <p className="text-gray-600">
              Deposit Bitcoin as collateral to mint MUSD at 1% borrowing rate
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Join Lending Circle</h3>
            <p className="text-gray-600">
              Create or join circles matched to your trust tier and financial goals
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Build Trust & Earn</h3>
            <p className="text-gray-600">
              Make on-time payments, complete circles, and watch your trust score grow
            </p>
          </div>
        </div>
      </section>

      {/* Trust Tiers */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Trust Tiers</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="card">
              <div className="badge badge-newcomer mb-4">Newcomer</div>
              <div className="text-2xl font-bold mb-2">0-249</div>
              <div className="text-gray-600 mb-4">Trust Score</div>
              <div className="text-sm text-gray-500">
                Access circles up to $200/month
              </div>
            </div>

            <div className="card">
              <div className="badge badge-silver mb-4">Silver</div>
              <div className="text-2xl font-bold mb-2">250-499</div>
              <div className="text-gray-600 mb-4">Trust Score</div>
              <div className="text-sm text-gray-500">
                Access circles up to $500/month
              </div>
            </div>

            <div className="card">
              <div className="badge badge-gold mb-4">Gold</div>
              <div className="text-2xl font-bold mb-2">500-749</div>
              <div className="text-gray-600 mb-4">Trust Score</div>
              <div className="text-sm text-gray-500">
                Access circles up to $2,000/month
              </div>
            </div>

            <div className="card">
              <div className="badge badge-platinum mb-4">Platinum</div>
              <div className="text-2xl font-bold mb-2">750-1000</div>
              <div className="text-gray-600 mb-4">Trust Score</div>
              <div className="text-sm text-gray-500">
                Unlimited access + governance
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-primary-600 mb-2">1%</div>
            <div className="text-gray-600">Borrowing Rate</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary-600 mb-2">10-20%</div>
            <div className="text-gray-600">Insurance Coverage</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary-600 mb-2">5%</div>
            <div className="text-gray-600">Yield APY</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary-600 mb-2">0-1000</div>
            <div className="text-gray-600">Trust Score Range</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Connect your wallet and join the future of decentralized finance
          </p>
          <ConnectButton />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold mb-4">Leo Finance</div>
              <p className="text-gray-400">
                Bitcoin-backed lending circles on Mezo
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/circles">Circles</Link></li>
                <li><Link href="/dashboard">Dashboard</Link></li>
                <li><Link href="/profile">Profile</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#">Documentation</a></li>
                <li><a href="#">Whitepaper</a></li>
                <li><a href="#">GitHub</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Community</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#">Discord</a></li>
                <li><a href="#">Twitter</a></li>
                <li><a href="#">Telegram</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Leo Finance. Built for Mezo Hackathon.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
