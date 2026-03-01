import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CustomerView from './components/CustomerView';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import ParticlesBackground from './components/ParticlesBackground';
import { Product } from './types';
import { collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from './firebase';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsArray = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        
        if (productsArray.length > 0) {
          setProducts(productsArray);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.warn('Could not fetch products from Firebase. Using fallback data.', error);
        // Fallback data for demonstration if fetch fails or no data
        setProducts([
          {
            id: 'PRD-1',
            name: 'Premium Attar Combo',
            price: 1500,
            discountedPrice: 850,
            imageUrl: 'https://picsum.photos/seed/attar/800/600?blur=2',
            description: '<p><strong>3 Premium Attars</strong> - Oudh, Rose, Musk.</p><ul><li>100% Alcohol-free</li><li>Long-lasting up to 48 hours</li></ul>'
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-gold-500"></div>
      </div>
    );
  }

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  };

  return (
    <Router>
      <ParticlesBackground />
      <div 
        className="min-h-screen font-body text-emerald-950 relative"
        style={{
          backgroundColor: '#FDFBF7', // Ivory background
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23022c22' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundAttachment: 'fixed'
        }}
      >
        <Routes>
          <Route path="/" element={<CustomerView products={products} isLoading={isLoading} />} />
          <Route path="/login" element={user ? <Navigate to="/admin" replace /> : <AdminLogin />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}
