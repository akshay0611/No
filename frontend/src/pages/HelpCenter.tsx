import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    HelpCircle,
    Search,
    BookOpen,
    MessageCircle,
    Phone,
    Mail,
    Clock,
    Users,
    Smartphone,
    MapPin,
    Bell,
    Settings,
    Shield,
    CreditCard,
    ArrowRight,
    Sparkles,
    Heart,
    Star,
    CheckCircle,
    PlayCircle,
    FileText,
    Headphones,
    Zap,
    ChevronRight,
    ExternalLink
} from "lucide-react";
import { Link } from "wouter";

export default function HelpCenter() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");

    const helpCategories = [
        {
            id: "getting-started",
            title: "Getting Started",
            description: "Learn the basics of using SmartQ",
            icon: Smartphone,
            gradient: "from-blue-500 to-cyan-600",
            articleCount: 8
        },
        {
            id: "queue-management",
            title: "Queue Management",
            description: "How to join, track, and manage queues",
            icon: Clock,
            gradient: "from-green-500 to-emerald-600",
            articleCount: 12
        },
        {
            id: "account-settings",
            title: "Account & Settings",
            description: "Manage your profile and preferences",
            icon: Settings,
            gradient: "from-purple-500 to-indigo-600",
            articleCount: 6
        },
        {
            id: "troubleshooting",
            title: "Troubleshooting",
            description: "Fix common issues and problems",
            icon: HelpCircle,
            gradient: "from-orange-500 to-red-600",
            articleCount: 10
        },
        {
            id: "privacy-security",
            title: "Privacy & Security",
            description: "Keep your account safe and secure",
            icon: Shield,
            gradient: "from-pink-500 to-rose-600",
            articleCount: 5
        },
        {
            id: "billing",
            title: "Billing & Payments",
            description: "Payment methods and billing questions",
            icon: CreditCard,
            gradient: "from-indigo-500 to-purple-600",
            articleCount: 4
        }
    ];

    const popularArticles = [
        {
            title: "How to join a salon queue",
            description: "Step-by-step guide to joining your first queue",
            category: "Getting Started",
            readTime: "3 min read",
            views: "15.2k views",
            icon: Users
        },
        {
            title: "Understanding wait time estimates",
            description: "How we calculate and update queue wait times",
            category: "Queue Management",
            readTime: "2 min read",
            views: "12.8k views",
            icon: Clock
        },
        {
            title: "Setting up notifications",
            description: "Get alerts when it's almost your turn",
            category: "Account & Settings",
            readTime: "4 min read",
            views: "9.5k views",
            icon: Bell
        },
        {
            title: "Finding salons near you",
            description: "Discover and filter salons by location and services",
            category: "Getting Started",
            readTime: "3 min read",
            views: "8.7k views",
            icon: MapPin
        },
        {
            title: "App not working properly?",
            description: "Common fixes for app crashes and loading issues",
            category: "Troubleshooting",
            readTime: "5 min read",
            views: "7.3k views",
            icon: Smartphone
        },
        {
            title: "Managing your privacy settings",
            description: "Control what information you share",
            category: "Privacy & Security",
            readTime: "4 min read",
            views: "6.1k views",
            icon: Shield
        }
    ];

    const quickActions = [
        {
            title: "Contact Support",
            description: "Get help from our support team",
            icon: Headphones,
            action: "/contact",
            gradient: "from-blue-500 to-blue-600"
        },
        {
            title: "Report a Bug",
            description: "Found an issue? Let us know",
            icon: FileText,
            action: "/contact",
            gradient: "from-red-500 to-red-600"
        },
        {
            title: "Feature Request",
            description: "Suggest new features or improvements",
            icon: Sparkles,
            action: "/contact",
            gradient: "from-purple-500 to-purple-600"
        },
        {
            title: "Live Chat",
            description: "Chat with support (9 AM - 6 PM)",
            icon: MessageCircle,
            action: "#",
            gradient: "from-green-500 to-green-600"
        }
    ];

    const videoTutorials = [
        {
            title: "SmartQ Overview - Getting Started",
            duration: "3:45",
            thumbnail: "https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225",
            views: "25k views"
        },
        {
            title: "How to Join Your First Queue",
            duration: "2:30",
            thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225",
            views: "18k views"
        },
        {
            title: "Managing Notifications and Alerts",
            duration: "4:15",
            thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=225",
            views: "12k views"
        }
    ];

    const filteredArticles = popularArticles.filter(article => {
        const matchesSearch = searchQuery === "" ||
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = selectedCategory === "all" ||
            article.category.toLowerCase().replace(/\s+/g, '-').includes(selectedCategory);

        return matchesSearch && matchesCategory;
    });

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
                                    <HelpCircle className="w-4 h-4 mr-2" />
                                    Help Center
                                </Badge>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full animate-ping"></div>
                            </div>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent mb-8 tracking-tight">
                            How Can We Help?
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-12">
                            Find answers, get support, and learn how to make the most of SmartQ
                            <span className="inline-block ml-2">
                                <Heart className="w-6 h-6 text-pink-500 animate-pulse" />
                            </span>
                        </p>

                        {/* Search Bar */}
                        <div className="max-w-2xl mx-auto mb-8">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-25 transition duration-500"></div>
                                <div className="relative">
                                    <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
                                    <Input
                                        type="text"
                                        placeholder="Search for help articles, guides, or tutorials..."
                                        className="pl-16 pr-6 py-6 text-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl font-medium"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                            {[
                                { value: "500+", label: "Help Articles", icon: BookOpen, color: "purple" },
                                { value: "24/7", label: "Support", icon: Headphones, color: "indigo" },
                                { value: "<1hr", label: "Response Time", icon: Zap, color: "blue" },
                                { value: "99%", label: "Satisfaction", icon: Star, color: "purple" }
                            ].map((stat, index) => (
                                <div key={index} className="group">
                                    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
                                        <CardContent className="p-6 text-center">
                                            <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-r ${stat.color === 'purple' ? 'from-purple-500 to-purple-600' :
                                                stat.color === 'indigo' ? 'from-indigo-500 to-indigo-600' :
                                                    'from-blue-500 to-blue-600'
                                                } flex items-center justify-center group-hover:rotate-12 transition-transform duration-300`}>
                                                <stat.icon className="h-6 w-6 text-white" />
                                            </div>
                                            <div className={`text-3xl font-bold ${stat.color === 'purple' ? 'text-purple-600' :
                                                stat.color === 'indigo' ? 'text-indigo-600' :
                                                    'text-blue-600'
                                                } mb-1`}>
                                                {stat.value}
                                            </div>
                                            <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Actions */}
            <section className="py-20 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl mb-6 shadow-lg">
                            <Zap className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent mb-6">
                            Quick Actions
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            Need immediate help? Try these quick options to get support fast.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {quickActions.map((action, index) => (
                            <Link key={index} href={action.action}>
                                <div className="group relative cursor-pointer">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl blur opacity-0 group-hover:opacity-25 transition duration-500"></div>

                                    <Card className="relative border-0 bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 overflow-hidden h-full">
                                        <CardContent className="relative p-8 text-center">
                                            <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-r ${action.gradient} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                                                <action.icon className="h-10 w-10 text-white group-hover:animate-pulse" />
                                            </div>

                                            <h3 className="font-bold text-xl text-gray-900 mb-3 group-hover:text-purple-700 transition-colors">
                                                {action.title}
                                            </h3>

                                            <p className="text-gray-600 leading-relaxed mb-4">
                                                {action.description}
                                            </p>

                                            <div className="flex items-center justify-center text-purple-600 font-semibold group-hover:text-purple-700">
                                                <span>Get Help</span>
                                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Help Categories */}
            <section className="py-20 bg-gradient-to-r from-white/80 via-purple-50/30 to-indigo-50/30 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl mb-6 shadow-lg">
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent mb-6">
                            Browse by Category
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            Find help articles organized by topic to quickly get the answers you need.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {helpCategories.map((category, index) => (
                            <div key={index} className="group cursor-pointer" onClick={() => setSelectedCategory(category.id)}>
                                <Card className={`border-0 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden ${selectedCategory === category.id ? 'ring-2 ring-purple-500 shadow-purple-500/25' : ''
                                    }`}>
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>

                                    <CardContent className="p-8">
                                        <div className="flex items-start space-x-4">
                                            <div className={`w-16 h-16 bg-gradient-to-r ${category.gradient} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                                <category.icon className="w-8 h-8 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-bold text-xl text-gray-900 group-hover:text-purple-700 transition-colors">
                                                        {category.title}
                                                    </h3>
                                                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                                                </div>
                                                <p className="text-gray-600 leading-relaxed mb-3">
                                                    {category.description}
                                                </p>
                                                <div className="flex items-center text-sm text-purple-600 font-medium">
                                                    <FileText className="w-4 h-4 mr-1" />
                                                    {category.articleCount} articles
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Popular Articles */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl mb-6 shadow-lg">
                            <Star className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent mb-6">
                            Popular Articles
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            The most helpful articles based on user feedback and views.
                        </p>
                    </div>

                    <div className="grid gap-6">
                        {filteredArticles.map((article, index) => (
                            <Card key={index} className="border-0 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
                                <CardContent className="p-8">
                                    <div className="flex items-start space-x-6">
                                        <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                            <article.icon className="w-8 h-8 text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">
                                                        {article.title}
                                                    </h3>
                                                    <p className="text-gray-600 leading-relaxed mb-3">
                                                        {article.description}
                                                    </p>
                                                </div>
                                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
                                            </div>
                                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                                                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                                    {article.category}
                                                </Badge>
                                                <span className="flex items-center">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    {article.readTime}
                                                </span>
                                                <span className="flex items-center">
                                                    <Users className="w-4 h-4 mr-1" />
                                                    {article.views}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Video Tutorials */}
            <section className="py-20 bg-gradient-to-r from-white/80 via-purple-50/30 to-indigo-50/30 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl mb-6 shadow-lg">
                            <PlayCircle className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent mb-6">
                            Video Tutorials
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            Learn SmartQ with our step-by-step video guides.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {videoTutorials.map((video, index) => (
                            <Card key={index} className="border-0 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden cursor-pointer group">
                                <div className="relative">
                                    <img
                                        src={video.thumbnail}
                                        alt={video.title}
                                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                            <PlayCircle className="w-8 h-8 text-purple-600" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-sm font-medium">
                                        {video.duration}
                                    </div>
                                </div>

                                <CardContent className="p-6">
                                    <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">
                                        {video.title}
                                    </h3>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Users className="w-4 h-4 mr-1" />
                                        {video.views}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Support Section */}
            <section className="py-20 relative">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="relative group">
                        <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>

                        <Card className="relative border-0 shadow-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>

                            <CardContent className="relative p-12 text-center">
                                <div className="w-20 h-20 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                                    <Headphones className="h-10 w-10 text-white animate-pulse" />
                                </div>

                                <h3 className="text-3xl font-bold mb-4">Still Need Help?</h3>
                                <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                                    Can't find what you're looking for? Our friendly support team is here to help you
                                    get the most out of SmartQ. We're just a message away!
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link href="/contact">
                                        <Button className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group">
                                            <MessageCircle className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                                            Contact Support
                                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>

                                    <Button className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 px-8 py-3 rounded-2xl font-semibold border border-white/30 transition-all duration-300 transform hover:scale-105">
                                        <Phone className="w-5 h-5 mr-2" />
                                        Call Us: (555) 123-4567
                                    </Button>
                                </div>

                                <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                                    <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                        <div className="text-2xl font-bold">24/7</div>
                                        <div className="text-sm text-white/80">Available</div>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                        <div className="text-2xl font-bold">&lt;1hr</div>
                                        <div className="text-sm text-white/80">Response</div>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                        <div className="text-2xl font-bold">99%</div>
                                        <div className="text-sm text-white/80">Satisfaction</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    );
}