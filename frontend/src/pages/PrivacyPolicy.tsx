import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Eye, Users, Database, FileText, CheckCircle, Mail, Phone, Calendar, ArrowRight, Sparkles, Heart, Star } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPolicy() {
    const lastUpdated = "January 15, 2025";

    const privacyPrinciples = [
        {
            icon: Shield,
            title: "Data Protection",
            description: "Your personal information is encrypted and securely stored",
            gradient: "from-blue-500 to-cyan-600"
        },
        {
            icon: Lock,
            title: "Secure Access",
            description: "Only authorized personnel can access your data",
            gradient: "from-green-500 to-emerald-600"
        },
        {
            icon: Eye,
            title: "Transparency",
            description: "We're clear about what data we collect and why",
            gradient: "from-purple-500 to-indigo-600"
        },
        {
            icon: Users,
            title: "Your Control",
            description: "You have full control over your personal information",
            gradient: "from-pink-500 to-rose-600"
        }
    ];

    const dataTypes = [
        {
            category: "Account Information",
            items: ["Name and contact details", "Email address", "Phone number", "Profile picture"],
            icon: Users,
            color: "purple"
        },
        {
            category: "Usage Data",
            items: ["Queue positions", "Salon visits", "Service preferences", "App interactions"],
            icon: Database,
            color: "indigo"
        },
        {
            category: "Location Data",
            items: ["Current location (when permitted)", "Salon locations visited", "Distance calculations"],
            icon: Calendar,
            color: "blue"
        }
    ];

    const sections = [
        {
            id: "information-collection",
            title: "Information We Collect",
            content: `We collect information you provide directly to us, such as when you create an account, join a queue, or contact us for support. This includes your name, email address, phone number, and any other information you choose to provide.

We also automatically collect certain information about your device and how you use SmartQ, including your IP address, browser type, operating system, and usage patterns within the app.`
        },
        {
            id: "how-we-use",
            title: "How We Use Your Information",
            content: `We use the information we collect to:
      
• Provide and maintain our queue management services
• Send you notifications about your queue status
• Improve and personalize your experience
• Communicate with you about updates and support
• Analyze usage patterns to enhance our services
• Ensure the security and integrity of our platform

We never sell your personal information to third parties.`
        },
        {
            id: "information-sharing",
            title: "Information Sharing",
            content: `We may share your information in the following circumstances:

• With salons when you join their queue (limited to necessary information only)
• With service providers who help us operate SmartQ
• When required by law or to protect our rights
• In connection with a business transaction (with your consent)

We require all third parties to respect the security of your personal data and treat it in accordance with the law.`
        },
        {
            id: "data-security",
            title: "Data Security",
            content: `We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

This includes encryption of data in transit and at rest, regular security assessments, and strict access controls. However, no method of transmission over the internet is 100% secure.`
        },
        {
            id: "your-rights",
            title: "Your Rights",
            content: `You have the right to:

• Access your personal information
• Correct inaccurate or incomplete data
• Delete your account and associated data
• Restrict or object to certain processing
• Data portability (receive a copy of your data)
• Withdraw consent at any time

To exercise these rights, please contact us using the information provided below.`
        },
        {
            id: "cookies",
            title: "Cookies and Tracking",
            content: `We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content. You can control cookie settings through your browser preferences.

We also use analytics tools to understand how users interact with SmartQ, which helps us improve our services.`
        },
        {
            id: "children",
            title: "Children's Privacy",
            content: `SmartQ is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.`
        },
        {
            id: "changes",
            title: "Changes to This Policy",
            content: `We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date.

We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.`
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
                                    <Shield className="w-4 h-4 mr-2" />
                                    Privacy Policy
                                </Badge>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full animate-ping"></div>
                            </div>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent mb-8 tracking-tight">
                            Your Privacy Matters
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
                            We're committed to protecting your personal information and being transparent about our data practices
                            <span className="inline-block ml-2">
                                <Heart className="w-6 h-6 text-pink-500 animate-pulse" />
                            </span>
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                            <div className="flex items-center text-gray-600 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg">
                                <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                                <span className="font-medium">Last updated: {lastUpdated}</span>
                            </div>
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

            {/* Privacy Principles */}
            <section className="py-20 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl mb-6 shadow-lg">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent mb-6">
                            Our Privacy Principles
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            These core principles guide how we handle your personal information.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {privacyPrinciples.map((principle, index) => (
                            <div key={index} className="group relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl blur opacity-0 group-hover:opacity-25 transition duration-500"></div>

                                <Card className="relative border-0 bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 overflow-hidden h-full">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100/50 to-indigo-100/50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>

                                    <CardContent className="relative p-8 text-center">
                                        <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-r ${principle.gradient} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                                            <principle.icon className="h-10 w-10 text-white group-hover:animate-pulse" />
                                        </div>

                                        <h3 className="font-bold text-xl text-gray-900 mb-3 group-hover:text-purple-700 transition-colors">
                                            {principle.title}
                                        </h3>

                                        <p className="text-gray-600 leading-relaxed">
                                            {principle.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Data We Collect */}
            <section className="py-20 bg-gradient-to-r from-white/80 via-purple-50/30 to-indigo-50/30 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl mb-6 shadow-lg">
                            <Database className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent mb-6">
                            Data We Collect
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            Here's what information we collect and why we need it.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {dataTypes.map((dataType, index) => (
                            <Card key={index} className="border-0 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>

                                <CardHeader className="pb-4">
                                    <div className={`w-12 h-12 bg-gradient-to-r ${dataType.color === 'purple' ? 'from-purple-500 to-purple-600' :
                                        dataType.color === 'indigo' ? 'from-indigo-500 to-indigo-600' :
                                            'from-blue-500 to-blue-600'
                                        } rounded-xl flex items-center justify-center mb-4`}>
                                        <dataType.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <CardTitle className="text-xl font-bold text-gray-900">
                                        {dataType.category}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent>
                                    <ul className="space-y-2">
                                        {dataType.items.map((item, itemIndex) => (
                                            <li key={itemIndex} className="flex items-center text-gray-600">
                                                <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
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

            {/* Contact Section */}
            <section className="py-20 relative">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="relative group">
                        <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>

                        <Card className="relative border-0 shadow-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>

                            <CardContent className="relative p-12 text-center">
                                <div className="w-20 h-20 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                                    <Mail className="h-10 w-10 text-white animate-pulse" />
                                </div>

                                <h3 className="text-3xl font-bold mb-4">Questions About Your Privacy?</h3>
                                <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                                    If you have any questions about this Privacy Policy or how we handle your data,
                                    we're here to help. Contact our privacy team anytime.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link href="/contact">
                                        <Button className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group">
                                            <Mail className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                                            Contact Privacy Team
                                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>

                                    <a href="mailto:privacy@smartq.com">
                                        <Button className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 px-8 py-3 rounded-2xl font-semibold border border-white/30 transition-all duration-300 transform hover:scale-105">
                                            <Mail className="w-5 h-5 mr-2" />
                                            privacy@smartq.com
                                        </Button>
                                    </a>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    );
}