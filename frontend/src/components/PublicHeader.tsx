import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

interface PublicHeaderProps {
    showNavigation?: boolean;
}

const PublicHeader = ({ showNavigation = false }: PublicHeaderProps) => {
    const navigate = useNavigate();

    return (
        <header className="fixed top-0 w-full bg-[#77838F]/30 backdrop-blur-sm border-b border-gray-200 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <div
                        className="flex items-center space-x-2 cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        <img
                            src="/assets/feedisight-logo.png"
                            alt="FeediSight Logo"
                            className="w-20 h-20 rounded-lg object-contain"
                        />
                        {/* <span className="text-2xl font-bold text-black">FeediSight</span> */}
                    </div>

                    <nav className="hidden md:flex items-center space-x-8">
                        {/* <a href="#features" className="text-black hover:text-[#0d569e] transition-colors font-medium">Features</a>
                        <a href="#benefits" className="text-black hover:text-[#0d569e] transition-colors font-medium">Benefits</a>
                        <a href="#testimonials" className="text-black hover:text-[#0d569e] transition-colors font-medium">Testimonials</a>
                        <a href="#pricing" className="text-black hover:text-[#0d569e] transition-colors font-medium">Pricing</a> */}
                    </nav>


                    {showNavigation && (
                        <nav className="hidden md:flex items-center space-x-8">
                            <a href="/#features" className="text-black hover:text-[#0d569e] transition-colors font-medium">Features</a>
                            <a href="/#benefits" className="text-black hover:text-[#0d569e] transition-colors font-medium">Benefits</a>
                            <a href="/#testimonials" className="text-black hover:text-[#0d569e] transition-colors font-medium">Testimonials</a>
                            <a href="/#pricing" className="text-black hover:text-[#0d569e] transition-colors font-medium">Pricing</a>
                        </nav>
                    )}

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate('/register')}
                            className="text-black hover:text-[#0d569e] font-medium transition-colors"
                        >
                            Sign In/Sign Up
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
    );
};

export default PublicHeader;
