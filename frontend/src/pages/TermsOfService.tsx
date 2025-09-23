import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Scale, Users, Shield, AlertTriangle, CheckCircle, Mail, Calendar, ArrowRight, Sparkles, Heart, Star, Gavel, BookOpen, UserCheck } from "lucide-react";
import { Link } from "wouter";

export default function TermsOfService() {
  const lastUpdated = "January 15, 2025";
  const effectiveDate = "January 15, 2025";

  const keyTerms = [
    {
      icon: UserCheck,
      title: "Account Responsibility",
      description: "You're responsible for maintaining account security and accuracy",
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      icon: Shield,
      title: "Acceptable Use",
      description: "Use SmartQ respectfully and in accordance with our guidelines",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      icon: Scale,
      title: "Fair Usage",
      description: "Our services are provided fairly to all users",
      gradient: "from-purple-500 to-indigo-600"
    },
    {
      icon: BookOpen,
      title: "Transparency",
      description: "Clear terms with no hidden clauses or surprises",
      gradient: "from-pink-500 to-rose-600"
    }
  ];

  const serviceRules = [
    {
      category: "Account Usage",
      items: ["One account per person", "Accurate information required", "Secure password management", "No sharing of credentials"],
      icon: Users,
      color: "purple"
    },
    {
      category: "Queue Etiquette",
      items: ["Join queues you intend to honor", "Cancel if plans change", "Arrive on time for appointments", "Respect salon policies"],
      icon: CheckCircle,
      color: "indigo"
    },
    {
      category: "Prohibited Activities",
      items: ["No spam or abuse", "No false information", "No system manipulation", "No commercial misuse"],
      icon: AlertTriangle,
      color: "red"
    }
  ];

  const sections = [
    {
      id: "acceptance",
      title: "Acceptance of Terms",
      content: `By accessing and using SmartQ, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.

These Terms of Service ("Terms") govern your use of SmartQ's queue management platform and services. By creating an account or using our services, you agree to these Terms.`
    },
    {
      id: "description",
      title: "Service Description",
      content: `SmartQ provides a digital queue management system that allows users to:

• Join salon queues remotely
• Track queue positions in real-time
• Receive notifications about queue status
• Discover and connect with local salons
• Manage appointments and preferences

We reserve the right to modify, suspend, or discontinue any part of our service at any time with reasonable notice.`
    },
    {
      id: "user-accounts",
      title: "User Accounts",
      content: `To use SmartQ, you must create an account and provide accurate, complete information. You are responsible for:

• Maintaining the confidentiality of your account credentials
• All activities that occur under your account
• Notifying us immediately of any unauthorized use
• Ensuring your contact information is current and accurate

You must be at least 13 years old to create an account. If you're under 18, you need parental consent.`
    },
    {
      id: "acceptable-use",
      title: "Acceptable Use Policy",
      content: `You agree to use SmartQ only for lawful purposes and in accordance with these Terms. You may not:

• Use the service for any illegal or unauthorized purpose
• Violate any laws in your jurisdiction
• Transmit any harmful, threatening, or offensive content
• Attempt to gain unauthorized access to our systems
• Interfere with or disrupt the service or servers
• Use automated systems to access the service without permission
• Impersonate others or provide false information

Violation of these terms may result in account suspension or termination.`
    },
    {
      id: "queue-policies",
      title: "Queue Management Policies",
      content: `When using our queue management features:

• Join queues only when you intend to visit the salon
• Provide accurate arrival time estimates
• Cancel your position if your plans change
• Respect salon-specific policies and requirements
• Arrive within the designated time window

Salons reserve the right to remove users from queues for policy violations or no-shows. Repeated violations may result in service restrictions.`
    },
    {
      id: "intellectual-property",
      title: "Intellectual Property",
      content: `SmartQ and its original content, features, and functionality are owned by SmartQ and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.

You may not:
• Copy, modify, or distribute our content without permission
• Use our trademarks or branding without authorization
• Reverse engineer or attempt to extract source code
• Create derivative works based on our service

User-generated content remains your property, but you grant us a license to use it in connection with our services.`
    },
    {
      id: "privacy",
      title: "Privacy and Data Protection",
      content: `Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information when you use SmartQ.

By using our service, you consent to the collection and use of information in accordance with our Privacy Policy. We implement appropriate security measures to protect your personal data.

You have rights regarding your personal information, including access, correction, and deletion rights as described in our Privacy Policy.`
    },
    {
      id: "disclaimers",
      title: "Disclaimers and Limitations",
      content: `SmartQ is provided "as is" without warranties of any kind. We do not guarantee:

• Uninterrupted or error-free service
• Accuracy of queue time estimates
• Availability of specific salons or services
• Compatibility with all devices or browsers

We are not responsible for:
• Actions or policies of individual salons
• Service interruptions beyond our control
• Loss of data due to technical issues
• Third-party content or services

Our liability is limited to the maximum extent permitted by law.`
    },
    {
      id: "termination",
      title: "Account Termination",
      content: `You may terminate your account at any time by contacting us or using the account deletion feature in the app.

We may terminate or suspend your account immediately, without prior notice, for:
• Violation of these Terms
• Fraudulent or illegal activity
• Abuse of our services or other users
• Extended periods of inactivity

Upon termination, your right to use the service ceases immediately. We may retain certain information as required by law or for legitimate business purposes.`
    },
    {
      id: "changes",
      title: "Changes to Terms",
      content: `We reserve the right to modify these Terms at any time. We will notify users of material changes by:

• Posting updated Terms on our website
• Sending email notifications to registered users
• Displaying in-app notifications

Continued use of SmartQ after changes constitutes acceptance of the new Terms. If you disagree with changes, you should discontinue use of the service.`
    },
    {
      id: "governing-law",
      title: "Governing Law and Disputes",
      content: `These Terms are governed by and construed in accordance with the laws of [Jurisdiction], without regard to conflict of law principles.

Any disputes arising from these Terms or your use of SmartQ will be resolved through:
1. Good faith negotiation
2. Mediation if negotiation fails
3. Binding arbitration as a last resort

You agree to resolve disputes individually and waive any right to class action proceedings.`
    },
    {
      id: "contact",
      title: "Contact Information",
      content: `If you have questions about these Terms of Service, please contact us:

• Email: legal@smartq.com
• Contact Form: Available on our website
• Mail: SmartQ Legal Department, [Address]

We aim to respond to all inquiries within 48 hours during business days.`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-blue-600/10"></div>
          {/* Floating Elements */}
          <div className="absolute top-20 left-10 w-4 h-4 bg-purple-400 rounded-full animate-bounce delay-300"></div>
          <div className="absolute top-40 right-20 w-3 h-3 bg-indigo-400 rounded-full animate-bounce delay-700"></div>
          <div className="absolute bottom-40 left-20 w-5 h-5 bg-blue-400 rounded-full animate-bounce delay-1000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-12 animate-fade-in">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <Badge className="mb-4 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 hover:from-purple-200 hover:to-indigo-200 border-0 px-6 py-2 text-sm font-semibold shadow-lg">
                  <Gavel className="w-4 h-4 mr-2" />
                  Terms of Service
                </Badge>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full animate-ping"></div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent mb-8 tracking-tight">
              Terms of Service
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
              Clear, fair terms that protect both you and SmartQ while ensuring the best experience for everyone
              <span className="inline-block ml-2">
                <Heart className="w-6 h-6 text-pink-500 animate-pulse" />
              </span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <div className="flex items-center text-gray-600 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg">
                <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                <span className="font-medium">Effective: {effectiveDate}</span>
              </div>
              <div className="flex items-center text-gray-600 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg">
                <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                <span className="font-medium">Last updated: {lastUpdated}</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/contact">
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
                  <Mail className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                  Questions? Contact Us
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Terms Overview */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl mb-6 shadow-lg">
              <Scale className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent mb-6">
              Key Terms Overview
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              The essential points you need to know about using SmartQ.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {keyTerms.map((term, index) => (
              <div key={index} className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl blur opacity-0 group-hover:opacity-25 transition duration-500"></div>
                
                <Card className="relative border-0 bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 overflow-hidden h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100/50 to-indigo-100/50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
                  
                  <CardContent className="relative p-8 text-center">
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-r ${term.gradient} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                      <term.icon className="h-10 w-10 text-white group-hover:animate-pulse" />
                    </div>
                    
                    <h3 className="font-bold text-xl text-gray-900 mb-3 group-hover:text-purple-700 transition-colors">
                      {term.title}
                    </h3>
                    
                    <p className="text-gray-600 leading-relaxed">
                      {term.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Rules */}
      <section className="py-20 bg-gradient-to-r from-white/80 via-purple-50/30 to-indigo-50/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl mb-6 shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent mb-6">
              Service Guidelines
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Important rules and guidelines for using SmartQ responsibly.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {serviceRules.map((rule, index) => (
              <Card key={index} className="border-0 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
                  rule.color === 'purple' ? 'from-purple-500 to-purple-600' :
                  rule.color === 'indigo' ? 'from-indigo-500 to-indigo-600' :
                  rule.color === 'red' ? 'from-red-500 to-red-600' :
                  'from-blue-500 to-blue-600'
                }`}></div>
                
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${
                    rule.color === 'purple' ? 'from-purple-500 to-purple-600' :
                    rule.color === 'indigo' ? 'from-indigo-500 to-indigo-600' :
                    rule.color === 'red' ? 'from-red-500 to-red-600' :
                    'from-blue-500 to-blue-600'
                  } rounded-xl flex items-center justify-center mb-4`}>
                    <rule.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {rule.category}
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-2">
                    {rule.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center text-gray-600">
                        <CheckCircle className={`w-4 h-4 mr-2 flex-shrink-0 ${
                          rule.color === 'red' ? 'text-red-500' : 'text-green-500'
                        }`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Sections */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {sections.map((section, index) => (
              <Card key={index} className="border-0 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    {section.title}
                  </h3>
                  <div className="prose prose-lg max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {section.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Legal Contact Section */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            
            <Card className="relative border-0 shadow-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
              
              <CardContent className="relative p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                  <Gavel className="h-10 w-10 text-white animate-pulse" />
                </div>
                
                <h3 className="text-3xl font-bold mb-4">Questions About These Terms?</h3>
                <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                  If you have any questions about these Terms of Service or need legal clarification, 
                  our team is here to help. We believe in transparency and clear communication.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/contact">
                    <Button className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group">
                      <Mail className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                      Contact Legal Team
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  
                  <a href="mailto:legal@smartq.com">
                    <Button className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 px-8 py-3 rounded-2xl font-semibold border border-white/30 transition-all duration-300 transform hover:scale-105">
                      <Mail className="w-5 h-5 mr-2" />
                      legal@smartq.com
                    </Button>
                  </a>
                </div>
                
                <div className="mt-8 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                  <p className="text-sm text-white/80">
                    By using SmartQ, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}