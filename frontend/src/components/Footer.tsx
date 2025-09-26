import { Link } from "wouter";
import { Clock, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-blue-100 py-6 sm:py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile-First Layout */}
        <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-4 md:gap-8">
          {/* Company Info - Mobile First */}
          <div className="text-center md:text-left md:col-span-1">
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl md:text-xl font-bold text-blue-900">AltQ</span>
            </div>
            <p className="text-gray-600 mb-6 text-center md:text-left leading-relaxed px-4 md:px-0">
              Revolutionizing salon experiences with AltQ management and real-time updates.
            </p>
            
            {/* Social Links - Mobile Centered */}
            <div className="flex justify-center md:justify-start space-x-4 mb-8 md:mb-0">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300"
                data-testid="link-facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300"
                data-testid="link-twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300"
                data-testid="link-instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300"
                data-testid="link-linkedin"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links - Grid Layout for Mobile and Desktop */}
          <div className="md:col-span-3">
            <div className="grid grid-cols-3 gap-3 md:gap-8">
              
              {/* For Customers */}
              <div className="bg-blue-50 rounded-xl p-3 md:bg-transparent md:p-0">
                <h4 className="font-semibold text-blue-900 mb-3 text-center md:text-left text-sm md:text-base">
                   Customers
                </h4>
                <ul className="space-y-2 md:space-y-2">
                  <li className="text-center md:text-left">
                    <Link
                      href="/"
                      className="text-gray-700 hover:text-blue-600 transition-colors duration-200 text-xs md:text-base block"
                      data-testid="link-find-salons"
                    >
                      Find Salons
                    </Link>
                  </li>
                  <li className="text-center md:text-left">
                    <Link
                      href="/queue"
                      className="text-gray-700 hover:text-blue-600 transition-colors duration-200 text-xs md:text-base block"
                      data-testid="link-track-queue"
                    >
                      Track Queue
                    </Link>
                  </li>
                  <li className="text-center md:text-left">
                    <a
                      href="#"
                      className="text-gray-700 hover:text-blue-600 transition-colors duration-200 text-xs md:text-base block"
                      data-testid="link-loyalty"
                    >
                      Loyalty Program
                    </a>
                  </li>
                  <li className="text-center md:text-left">
                    <a
                      href="#"
                      className="text-gray-700 hover:text-blue-600 transition-colors duration-200 text-xs md:text-base block"
                      data-testid="link-reviews"
                    >
                      Reviews
                    </a>
                  </li>
                </ul>
              </div>

              {/* For Salons */}
              <div className="bg-blue-50 rounded-xl p-3 md:bg-transparent md:p-0">
                <h4 className="font-semibold text-blue-900 mb-3 text-center md:text-left text-sm md:text-base">
                  For Salons
                </h4>
                <ul className="space-y-2 md:space-y-2">
                  <li className="text-center md:text-left">
                    <Link
                      href="/auth"
                      className="text-gray-700 hover:text-blue-600 transition-colors duration-200 text-xs md:text-base block"
                      data-testid="link-join"
                    >
                      Join AltQ
                    </Link>
                  </li>
                  <li className="text-center md:text-left">
                    <Link
                      href="/dashboard"
                      className="text-gray-700 hover:text-blue-600 transition-colors duration-200 text-xs md:text-base block"
                      data-testid="link-dashboard-footer"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li className="text-center md:text-left">
                    <a
                      href="#"
                      className="text-gray-700 hover:text-blue-600 transition-colors duration-200 text-xs md:text-base block"
                      data-testid="link-analytics"
                    >
                      Analytics
                    </a>
                  </li>
                  <li className="text-center md:text-left">
                    <a
                      href="#"
                      className="text-gray-700 hover:text-blue-600 transition-colors duration-200 text-xs md:text-base block"
                      data-testid="link-pricing"
                    >
                      Pricing
                    </a>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div className="bg-blue-50 rounded-xl p-3 md:bg-transparent md:p-0">
                <h4 className="font-semibold text-blue-900 mb-3 text-center md:text-left text-sm md:text-base">
                  Support
                </h4>
                <ul className="space-y-2 md:space-y-2">
                  <li className="text-center md:text-left">
                    <Link
                      href="/help"
                      className="text-gray-700 hover:text-blue-600 transition-colors duration-200 text-xs md:text-base block"
                      data-testid="link-help"
                    >
                      Help Center
                    </Link>
                  </li>
                  <li className="text-center md:text-left">
                    <Link
                      href="/contact"
                      className="text-gray-700 hover:text-blue-600 transition-colors duration-200 text-xs md:text-base block"
                      data-testid="link-contact"
                    >
                      Contact Us
                    </Link>
                  </li>
                  <li className="text-center md:text-left">
                    <Link
                      href="/privacy"
                      className="text-gray-700 hover:text-blue-600 transition-colors duration-200 text-xs md:text-base block"
                      data-testid="link-privacy"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li className="text-center md:text-left">
                    <Link
                      href="/terms"
                      className="text-gray-700 hover:text-blue-600 transition-colors duration-200 text-xs md:text-base block"
                      data-testid="link-terms"
                    >
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-blue-100 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 AltQ. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}