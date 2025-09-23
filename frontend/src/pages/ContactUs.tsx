import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, HeadphonesIcon, Users, Sparkles, Star, Zap, Heart, CheckCircle, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ContactUs() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
        type: "general" as "general" | "support" | "business" | "feedback"
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        toast({
            title: "Message sent successfully!",
            description: "We'll get back to you within 24 hours.",
        });

        setFormData({
            name: "",
            email: "",
            subject: "",
            message: "",
            type: "general"
        });
        setIsSubmitting(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const contactMethods = [
        {
            icon: Mail,
            title: "Email Us",
            description: "Send us an email anytime",
            value: "hello@smartq.com",
            action: "mailto:hello@smartq.com",
            gradient: "from-blue-500 to-purple-600"
        },
        {
            icon: Phone,
            title: "Call Us",
            description: "Mon-Fri from 8am to 6pm",
            value: "+1 (555) 123-4567",
            action: "tel:+15551234567",
            gradient: "from-green-500 to-teal-600"
        },
        {
            icon: MessageCircle,
            title: "Live Chat",
            description: "Chat with our support team",
            value: "Available 24/7",
            action: "#",
            gradient: "from-pink-500 to-rose-600"
        },
        {
            icon: MapPin,
            title: "Visit Us",
            description: "Come say hello at our office",
            value: "123 Business St, City, State 12345",
            action: "https://maps.google.com",
            gradient: "from-orange-500 to-red-600"
        }
    ];

    const inquiryTypes = [
        { value: "general", label: "General Inquiry", icon: MessageCircle },
        { value: "support", label: "Technical Support", icon: HeadphonesIcon },
        { value: "business", label: "Business Partnership", icon: Users },
        { value: "feedback", label: "Feedback & Suggestions", icon: Send }
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
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Get in Touch
                                </Badge>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full animate-ping"></div>
                            </div>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent mb-8 tracking-tight">
                            Let's Talk!
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
                            Have questions about SmartQ? We're here to help! Our friendly team is ready to assist you
                            <span className="inline-block ml-2">
                                <Heart className="w-6 h-6 text-pink-500 animate-pulse" />
                            </span>
                        </p>

                        {/* Call to Action */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
                                <MessageCircle className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                                Start a Conversation
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <div className="flex items-center text-gray-500 text-sm">
                                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                Usually responds in minutes
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                        {[
                            { value: "24/7", label: "Support", icon: Clock, color: "purple" },
                            { value: "<1hr", label: "Response", icon: Zap, color: "indigo" },
                            { value: "10k+", label: "Happy Users", icon: Users, color: "blue" },
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
            </section>

            {/* Contact Methods */}
            <section className="py-20 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl mb-6 shadow-lg">
                            <MessageCircle className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent mb-6">
                            Choose Your Preferred Way
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            We're available across all channels to provide you with the best support experience.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {contactMethods.map((method, index) => (
                            <div key={index} className="group relative">
                                {/* Hover glow effect */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl blur opacity-0 group-hover:opacity-25 transition duration-500"></div>

                                <Card className="relative border-0 bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 overflow-hidden">
                                    {/* Card background pattern */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100/50 to-indigo-100/50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>

                                    <CardContent className="relative p-8 text-center">
                                        <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-r ${method.gradient} flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                                            <method.icon className="h-10 w-10 text-white group-hover:animate-pulse" />
                                        </div>

                                        <h3 className="font-bold text-xl text-gray-900 mb-3 group-hover:text-purple-700 transition-colors">
                                            {method.title}
                                        </h3>

                                        <p className="text-gray-600 mb-4 leading-relaxed">
                                            {method.description}
                                        </p>

                                        <a
                                            href={method.action}
                                            className="inline-flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-700 font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 group-hover:shadow-lg"
                                        >
                                            {method.value}
                                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </a>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Form */}
            <section className="py-20 relative">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-transparent to-indigo-600/5"></div>

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="grid lg:grid-cols-2 gap-12 items-start">
                        {/* Left side - Form intro */}
                        <div className="lg:sticky lg:top-8">
                            <div className="mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl mb-6 shadow-lg">
                                    <Send className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
                                    Send us a Message
                                </h2>
                                <p className="text-xl text-gray-600 leading-relaxed mb-8">
                                    Fill out the form and we'll get back to you within 24 hours. We love hearing from our users!
                                </p>
                            </div>

                            {/* Benefits */}
                            <div className="space-y-4">
                                {[
                                    { icon: CheckCircle, text: "Quick response within 1 hour" },
                                    { icon: Heart, text: "Friendly and helpful support team" },
                                    { icon: Zap, text: "Solutions tailored to your needs" }
                                ].map((benefit, index) => (
                                    <div key={index} className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                                            <benefit.icon className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-gray-700 font-medium">{benefit.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right side - Form */}
                        <div className="relative">
                            {/* Form glow effect */}
                            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-3xl blur-xl opacity-0 hover:opacity-100 transition-opacity duration-500"></div>

                            <Card className="relative border-0 shadow-2xl bg-white/95 backdrop-blur-sm overflow-hidden">
                                {/* Card decoration */}
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>

                                <CardHeader className="text-center pb-6 pt-8">
                                    <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                                        Get Started
                                    </CardTitle>
                                    <p className="text-gray-600">
                                        We're excited to help you with SmartQ!
                                    </p>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* Inquiry Type Selection */}
                                        <div>
                                            <label className="block text-lg font-semibold text-gray-800 mb-4">
                                                What can we help you with? ✨
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {inquiryTypes.map((type) => (
                                                    <button
                                                        key={type.value}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, type: type.value as any })}
                                                        className={`group relative p-4 rounded-2xl border-2 transition-all duration-300 text-sm font-medium transform hover:scale-105 ${formData.type === type.value
                                                                ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 shadow-lg'
                                                                : 'border-gray-200 hover:border-purple-300 text-gray-600 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <div className="flex items-center space-x-3">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${formData.type === type.value
                                                                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                                                                    : 'bg-gray-100 text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-600'
                                                                }`}>
                                                                <type.icon className="h-5 w-5" />
                                                            </div>
                                                            <span className="text-left font-medium">{type.label}</span>
                                                        </div>
                                                        {formData.type === type.value && (
                                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                                                                <CheckCircle className="w-3 h-3 text-white" />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Name and Email */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="group">
                                                <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-3">
                                                    Full Name *
                                                </label>
                                                <div className="relative">
                                                    <Input
                                                        id="name"
                                                        name="name"
                                                        type="text"
                                                        required
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        className="h-14 border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl bg-gray-50/50 focus:bg-white transition-all duration-300 pl-4 text-gray-800 font-medium"
                                                        placeholder="Enter your full name"
                                                    />
                                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-indigo-500/0 group-focus-within:from-purple-500/10 group-focus-within:to-indigo-500/10 transition-all duration-300 pointer-events-none"></div>
                                                </div>
                                            </div>
                                            <div className="group">
                                                <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-3">
                                                    Email Address *
                                                </label>
                                                <div className="relative">
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        required
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        className="h-14 border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl bg-gray-50/50 focus:bg-white transition-all duration-300 pl-4 text-gray-800 font-medium"
                                                        placeholder="Enter your email"
                                                    />
                                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-indigo-500/0 group-focus-within:from-purple-500/10 group-focus-within:to-indigo-500/10 transition-all duration-300 pointer-events-none"></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Subject */}
                                        <div className="group">
                                            <label htmlFor="subject" className="block text-sm font-semibold text-gray-800 mb-3">
                                                Subject *
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    id="subject"
                                                    name="subject"
                                                    type="text"
                                                    required
                                                    value={formData.subject}
                                                    onChange={handleInputChange}
                                                    className="h-14 border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl bg-gray-50/50 focus:bg-white transition-all duration-300 pl-4 text-gray-800 font-medium"
                                                    placeholder="What's this about?"
                                                />
                                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-indigo-500/0 group-focus-within:from-purple-500/10 group-focus-within:to-indigo-500/10 transition-all duration-300 pointer-events-none"></div>
                                            </div>
                                        </div>

                                        {/* Message */}
                                        <div className="group">
                                            <label htmlFor="message" className="block text-sm font-semibold text-gray-800 mb-3">
                                                Message *
                                            </label>
                                            <div className="relative">
                                                <Textarea
                                                    id="message"
                                                    name="message"
                                                    required
                                                    rows={6}
                                                    value={formData.message}
                                                    onChange={handleInputChange}
                                                    className="border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 resize-none rounded-xl bg-gray-50/50 focus:bg-white transition-all duration-300 p-4 text-gray-800 font-medium"
                                                    placeholder="Tell us more about your inquiry..."
                                                />
                                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-indigo-500/0 group-focus-within:from-purple-500/10 group-focus-within:to-indigo-500/10 transition-all duration-300 pointer-events-none"></div>
                                            </div>
                                        </div>

                                        {/* Submit Button */}
                                        <div className="text-center pt-4">
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="relative group bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white px-12 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                                            >
                                                {/* Button glow effect */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>

                                                <div className="relative flex items-center justify-center">
                                                    {isSubmitting ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                                            <span>Sending your message...</span>
                                                            <Sparkles className="h-5 w-5 ml-3 animate-pulse" />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send className="h-5 w-5 mr-3 group-hover:translate-x-1 transition-transform duration-300" />
                                                            <span>Send Message</span>
                                                            <ArrowRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                                                        </>
                                                    )}
                                                </div>
                                            </Button>

                                            <p className="text-sm text-gray-500 mt-4 flex items-center justify-center">
                                                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                                Your information is secure and will never be shared
                                            </p>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-gradient-to-r from-white/80 via-purple-50/30 to-indigo-50/30 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-purple-200/30 to-indigo-200/30 rounded-full blur-xl"></div>
                <div className="absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-br from-indigo-200/30 to-blue-200/30 rounded-full blur-xl"></div>

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl mb-6 shadow-lg">
                            <MessageCircle className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent mb-6">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Quick answers to common questions about SmartQ. Can't find what you're looking for?
                            <span className="text-purple-600 font-semibold"> Contact us!</span>
                        </p>
                    </div>

                    <div className="grid gap-8">
                        {[
                            {
                                question: "How does SmartQ work?",
                                answer: "SmartQ allows you to join salon queues remotely, track your position in real-time, and receive notifications when it's your turn. It's like having a virtual queue number!",
                                icon: Zap
                            },
                            {
                                question: "Is SmartQ free to use?",
                                answer: "Yes! SmartQ is completely free for customers. Salons pay a small subscription fee to use our queue management system, but you get all the benefits at no cost.",
                                icon: Heart
                            },
                            {
                                question: "How accurate are the wait time estimates?",
                                answer: "Our AI-powered system provides highly accurate estimates based on historical data, current queue length, and service types. We're typically accurate within 5-10 minutes!",
                                icon: Star
                            },
                            {
                                question: "Can I cancel my queue position?",
                                answer: "Absolutely! You can cancel your position anytime through the app. We recommend doing so if your plans change to help other customers get served faster.",
                                icon: CheckCircle
                            }
                        ].map((faq, index) => (
                            <div key={index} className="group">
                                <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden">
                                    {/* Card accent */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                                    <CardContent className="p-8">
                                        <div className="flex items-start space-x-4">
                                            <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                <faq.icon className="w-6 h-6 text-purple-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-xl text-gray-900 mb-3 group-hover:text-purple-700 transition-colors">
                                                    {faq.question}
                                                </h3>
                                                <p className="text-gray-600 leading-relaxed text-lg">
                                                    {faq.answer}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Business Hours */}
            <section className="py-20 relative">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        {/* Left side - Hours card */}
                        <div className="relative group">
                            {/* Glow effect */}
                            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>

                            <Card className="relative border-0 shadow-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white overflow-hidden">
                                {/* Background pattern */}
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>

                                <CardContent className="relative p-10 text-center">
                                    <div className="w-20 h-20 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                                        <Clock className="h-10 w-10 text-white animate-pulse" />
                                    </div>

                                    <h3 className="text-3xl font-bold mb-6">Support Hours</h3>

                                    <div className="space-y-4 text-white/90 text-lg">
                                        <div className="flex justify-between items-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                            <span className="font-semibold">Monday - Friday:</span>
                                            <span>8:00 AM - 6:00 PM PST</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                            <span className="font-semibold">Saturday:</span>
                                            <span>10:00 AM - 4:00 PM PST</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                            <span className="font-semibold">Sunday:</span>
                                            <span>Closed</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                                        <p className="text-sm text-white/80 leading-relaxed">
                                            For urgent issues outside business hours, please email us and we'll respond as soon as possible.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right side - Additional info */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                                    We're Here When You Need Us
                                </h3>
                                <p className="text-xl text-gray-600 leading-relaxed">
                                    Our dedicated support team is committed to providing you with the best possible experience with SmartQ.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { icon: Zap, title: "Lightning Fast", desc: "Average response time under 1 hour" },
                                    { icon: Heart, title: "Personal Touch", desc: "Real humans, not bots" },
                                    { icon: Star, title: "Expert Help", desc: "Knowledgeable about every feature" }
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center space-x-4 p-4 bg-white/80 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                                            <item.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{item.title}</h4>
                                            <p className="text-gray-600">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}