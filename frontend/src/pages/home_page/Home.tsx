import { useNavigate } from 'react-router-dom';
import { Sparkles, Calendar, TrendingUp, Zap, CheckCircle, Clock } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: <Sparkles className="w-6 h-6" />,
            title: "AI-Powered Niche Content",
            description: "Generate engaging LinkedIn posts with our advanced AI that understands your voice and style."
        },
        {
            icon: <Calendar className="w-6 h-6" />,
            title: "Smart Scheduling",
            description: "Schedule posts at optimal times for maximum engagement and reach."
        },
        {
            icon: <TrendingUp className="w-6 h-6" />,
            title: "Analytics Dashboard",
            description: "Track performance metrics and insights to improve your content strategy."
        },
        {
            icon: <Zap className="w-6 h-6" />,
            title: "Quick Generation",
            description: "Create weeks of content in minutes with our intelligent post generator."
        },
        {
            icon: <Zap className="w-6 h-6" />,
            title: "Compare and Analyze your Post with 1000+ Viral Post",
            description: "Compare and Analysis weeks of content in minutes with our intelligent post generator."
        },
        {
            icon: <Zap className="w-6 h-6" />,
            title: "Quick Generation",
            description: "Create weeks of content in minutes with our intelligent post generator."
        }
    ];

    const benefits = [
        "Save 10+ hours per week on content creation",
        "Increase engagement by up to 300%",
        "Maintain consistent posting schedule",
        "Build your personal brand effortlessly",
        "Access to 1000+ Viral Post for comparison and analysis",
        "AI learns your unique writing style"
    ];

    const testimonials = [
        {
            name: "Sarah Johnson",
            role: "Marketing Director",
            content: "This tool transformed my LinkedIn presence. I'm now posting daily with minimal effort!",
            avatar: "SJ"
        },
        {
            name: "Michael Chen",
            role: "Entrepreneur",
            content: "The AI understands my voice perfectly. My engagement has tripled in just 2 months.",
            avatar: "MC"
        },
        {
            name: "Emily Rodriguez",
            role: "Content Strategist",
            content: "Best investment for my personal brand. The scheduling feature is a game-changer!",
            avatar: "ER"
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Header/Navigation */}
            <header className="fixed top-0 w-full bg-[#77838F]/30 backdrop-blur-sm border-b border-gray-200 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-2">
                            <img
                                src="/assets/feedisight-logo.png"
                                alt="FeediSight Logo"
                                className="w-20 h-20 rounded-lg object-contain"
                            />
                            {/* <span className="text-2xl font-bold text-black">FeediSight</span> */}
                        </div>

                        <nav className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-black hover:text-[#0d569e] transition-colors font-medium">Features</a>
                            <a href="#benefits" className="text-black hover:text-[#0d569e] transition-colors font-medium">Benefits</a>
                            <a href="#testimonials" className="text-black hover:text-[#0d569e] transition-colors font-medium">Testimonials</a>
                            {/* <a href="#pricing" className="text-black hover:text-[#0d569e] transition-colors font-medium">Pricing</a> */}
                        </nav>

                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="text-black hover:text-[#0d569e] font-medium transition-colors"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-[#ff6700] hover:bg-[#e55d00] text-white px-6 py-2.5 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                Get Started Free
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center space-x-2 bg-[#0d569e]/10 text-[#0d569e] px-4 py-2 rounded-full mb-6">
                            <Zap className="w-4 h-4" />
                            <span className="text-sm font-semibold">AI-Powered LinkedIn Content Generator and Analyzer</span>
                        </div>

                        <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-black mb-6 leading-tight">
                            Create <span className="text-[#0d569e]">Engaging</span> LinkedIn Posts in{' '}
                            <span className="text-[#ff6700]">Minutes</span>
                        </h2>

                        <p className="text-xl md:text-2xl text-gray-700 mb-10 leading-relaxed">
                            Generate post ideas, schedule content, and build your personal brand with our AI-powered platform.
                            Save hours every week while growing your LinkedIn presence.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full sm:w-auto bg-[#ff6700] hover:bg-[#e55d00] text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl"
                            >
                                Start Free Trial
                            </button>
                            <button className="w-full sm:w-auto border-2 border-[#0d569e] text-[#0d569e] hover:bg-[#0d569e] hover:text-white px-8 py-4 rounded-lg font-bold text-lg transition-all">
                                Watch Demo
                            </button>
                        </div>

                        <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span>No credit card required</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span>14-day free trial</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span>Cancel anytime</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-100">
                            <div className="text-4xl font-bold text-[#0d569e] mb-2">10,000+</div>
                            <div className="text-gray-600 font-medium">Active Users</div>
                        </div>
                        <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-100">
                            <div className="text-4xl font-bold text-[#ff6700] mb-2">1M+</div>
                            <div className="text-gray-600 font-medium">Posts Generated</div>
                        </div>
                        <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-100">
                            <div className="text-4xl font-bold text-[#0d569e] mb-2">300%</div>
                            <div className="text-gray-600 font-medium">Avg. Engagement Boost</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
                            Powerful Features for <span className="text-[#0d569e]">Content Creators</span>
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Everything you need to dominate LinkedIn and build your personal brand
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="p-6 bg-white rounded-xl border-2 border-gray-100 hover:border-[#0d569e] hover:shadow-xl transition-all group"
                            >
                                <div className="w-12 h-12 bg-gradient-to-br from-[#0d569e] to-[#0a4278] rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-black mb-2">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
                                Why Choose <span className="text-[#ff6700]">FeediSight</span>?
                            </h2>
                            <p className="text-xl text-gray-600 mb-8">
                                Join thousands of professionals who have transformed their LinkedIn presence with our AI-powered platform.
                            </p>

                            <div className="space-y-4">
                                {benefits.map((benefit, index) => (
                                    <div key={index} className="flex items-start space-x-3">
                                        <CheckCircle className="w-6 h-6 text-[#0d569e] flex-shrink-0 mt-1" />
                                        <span className="text-lg text-black">{benefit}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => navigate('/login')}
                                className="mt-8 bg-[#ff6700] hover:bg-[#e55d00] text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
                            >
                                Start Creating Now
                            </button>
                        </div>

                        {/* <div className="relative">
                            <div className="bg-gradient-to-br from-[#0d569e] to-[#0a4278] rounded-2xl p-8 shadow-2xl">
                                <div className="bg-white rounded-lg p-6 mb-4">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                        <div>
                                            <div className="h-3 bg-gray-200 rounded w-32 mb-2"></div>
                                            <div className="h-2 bg-gray-100 rounded w-24"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-3 bg-gray-100 rounded"></div>
                                        <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                                        <div className="h-3 bg-gray-100 rounded w-4/6"></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center space-x-2 text-white">
                                    <Clock className="w-5 h-5" />
                                    <span className="font-semibold">Generated in 30 seconds</span>
                                </div>
                            </div>
                        </div> */}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
                            Loved by <span className="text-[#0d569e]">Professionals</span>
                        </h2>
                        <p className="text-xl text-gray-600">See what our users have to say</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className="bg-white p-8 rounded-xl border-2 border-gray-100 hover:border-[#ff6700] hover:shadow-xl transition-all"
                            >
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#0d569e] to-[#0a4278] rounded-full flex items-center justify-center text-white font-bold">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <div className="font-bold text-black">{testimonial.name}</div>
                                        <div className="text-sm text-gray-600">{testimonial.role}</div>
                                    </div>
                                </div>
                                <p className="text-gray-700 italic">"{testimonial.content}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#0d569e] to-[#0a4278]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Ready to Transform Your LinkedIn Presence?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Join thousands of professionals creating engaging content effortlessly
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-[#ff6700] hover:bg-[#e55d00] text-white px-10 py-5 rounded-lg font-bold text-xl transition-all transform hover:scale-105 shadow-2xl"
                    >
                        Start Your Free Trial Today
                    </button>
                    <p className="text-blue-100 mt-4">No credit card required • 14-day free trial</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <img
                                    src="/assets/feedisight-logo.png"
                                    alt="FeediSight Logo"
                                    className="w-8 h-8 rounded-lg object-contain"
                                />
                                <span className="text-xl font-bold">FeediSight</span>
                            </div>
                            <p className="text-gray-400">
                                AI-powered LinkedIn content generation platform
                            </p>
                        </div>

                        <div>
                            <h3 className="font-bold mb-4">Product</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#features" className="hover:text-[#ff6700] transition-colors">Features</a></li>
                                <li><a href="#pricing" className="hover:text-[#ff6700] transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-[#ff6700] transition-colors">Templates</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold mb-4">Company</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-[#ff6700] transition-colors">About</a></li>
                                <li><a href="#" className="hover:text-[#ff6700] transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-[#ff6700] transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold mb-4">Legal</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-[#ff6700] transition-colors">Privacy</a></li>
                                <li><a href="#" className="hover:text-[#ff6700] transition-colors">Terms</a></li>
                                <li><a href="#" className="hover:text-[#ff6700] transition-colors">Security</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
                        <p>&copy; 2024 FeedInsight. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;