import { Link } from "wouter";
import { Clock, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Footer() {
  const { user } = useAuth();

  if (user?.role === 'salon_owner') {
    return null;
  }

  return (
    <footer className="bg-white border-t border-blue-100 py-10 px-6 pb-24 md:pb-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Brand Section */}
        <div className="mb-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <span className="text-3xl font-bold text-blue-900">AltQ</span>
          </div>
        </div>

        {/* Links Grid - 2 Columns on Mobile, 4 on Desktop */}
        <div className="grid grid-cols-2 gap-8 mb-10 md:grid-cols-4">
          
          {/* Customers Column */}
          <div>
            <h4 className="font-semibold text-blue-900 mb-4 text-base">Customers</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors text-sm block">
                  Find Salons
                </Link>
              </li>
              <li>
                <Link href="/queue" className="text-gray-700 hover:text-blue-600 transition-colors text-sm block">
                  Track Queue
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors text-sm block">
                  Loyalty Program
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors text-sm block">
                  Reviews
                </a>
              </li>
            </ul>
          </div>

          {/* For Salons Column */}
          <div>
            <h4 className="font-semibold text-blue-900 mb-4 text-base">For Salons</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/auth" className="text-gray-700 hover:text-blue-600 transition-colors text-sm block">
                  Join AltQ
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors text-sm block">
                  Dashboard
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors text-sm block">
                  Analytics
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors text-sm block">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h4 className="font-semibold text-blue-900 mb-4 text-base">Support</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-gray-700 hover:text-blue-600 transition-colors text-sm block">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-700 hover:text-blue-600 transition-colors text-sm block">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-700 hover:text-blue-600 transition-colors text-sm block">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-700 hover:text-blue-600 transition-colors text-sm block">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Links Column */}
          <div>
            <h4 className="font-semibold text-blue-900 mb-4 text-base">Social Links</h4>
            <div className="flex flex-wrap gap-3">
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-6 border-t border-blue-100">
          <p className="text-gray-600 text-xs leading-relaxed">
            By continuing past this page, you agree to our{" "}
            <Link href="/terms" className="text-blue-600 hover:text-blue-800">
              Terms of Service
            </Link>
            ,{" "}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-800">
              Privacy Policy
            </Link>
            . All trademarks are properties of their respective owners.
          </p>
          <p className="text-gray-500 text-xs mt-3">
            2008-2025 © AltQ™ Ltd. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}