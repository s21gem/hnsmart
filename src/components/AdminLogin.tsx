import React, { useState } from 'react';
import { motion } from 'motion/react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('ভুল ইমেইল বা পাসওয়ার্ড');
      } else {
        setError('লগইন করতে সমস্যা হচ্ছে। আবার চেষ্টা করুন।');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gold-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-emerald-900 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 md:p-10 rounded-3xl shadow-2xl max-w-md w-full border-t-8 border-t-gold-500 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="bg-emerald-950/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-gold-500/30">
            <Lock className="text-emerald-950" size={32} />
          </div>
          <h1 className="text-3xl font-heading font-bold text-emerald-950">অ্যাডমিন প্যানেল</h1>
          <p className="text-slate-500 mt-2">অ্যাক্সেস করতে লগইন করুন</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 text-sm"
          >
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-emerald-950 mb-2">ইমেইল অ্যাড্রেস</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-5 py-4 bg-white/50 border border-gold-500/30 rounded-xl focus:ring-2 focus:ring-gold-500 outline-none transition-all placeholder:text-slate-400"
                placeholder="admin@hnsmart.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-950 mb-2">পাসওয়ার্ড</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-5 py-4 bg-white/50 border border-gold-500/30 rounded-xl focus:ring-2 focus:ring-gold-500 outline-none transition-all placeholder:text-slate-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-emerald-950 text-gold-500 font-heading font-bold py-4 rounded-xl hover:bg-emerald-900 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shimmer-btn"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gold-500"></div>
                অপেক্ষা করুন...
              </>
            ) : (
              'লগইন করুন'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
