import React, { useState, useEffect } from 'react';
import { Package, ShoppingCart, LogOut, Plus, RefreshCw, Download, TrendingUp, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Product, Order } from '../types';
import jsPDF from 'jspdf';
import { formatToBengaliPrice, formatToBengaliNumber } from '../utils';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import RichTextEditor from './RichTextEditor';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('orders');
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    discountedPrice: '',
    description: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsArray = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const ordersArray = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      setProducts(productsArray);
      setOrders(ordersArray);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data from Firebase.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    } else {
      setImageFile(null);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      alert('Please select an image file first.');
      return;
    }
    
    try {
      setIsAddingProduct(true);
      setUploadStatus('Uploading Image...');
      
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'hns_mart_preset';
      
      if (!cloudName) {
        throw new Error('Cloudinary Cloud Name is not configured in environment variables.');
      }

      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('upload_preset', uploadPreset);

      const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!cloudinaryRes.ok) {
        throw new Error('Failed to upload image to Cloudinary');
      }

      const cloudinaryData = await cloudinaryRes.json();
      const imageUrl = cloudinaryData.secure_url;

      setUploadStatus('Saving Product...');

      await addDoc(collection(db, 'products'), {
        name: newProduct.name,
        price: Number(newProduct.price),
        discountedPrice: Number(newProduct.discountedPrice),
        imageUrl: imageUrl,
        description: newProduct.description
      });
      
      setNewProduct({ name: '', price: '', discountedPrice: '', description: '' });
      setImageFile(null);
      const fileInput = document.getElementById('productImageInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      alert('Product added successfully!');
      fetchData();
    } catch (error: any) {
      console.error('Error adding product:', error);
      alert(`Failed to add product: ${error.message || 'Unknown error'}`);
    } finally {
      setIsAddingProduct(false);
      setUploadStatus(null);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    setProductToDelete(productId);
  };

  const confirmDeleteProduct = async (productId: string) => {
    setProductToDelete(null);
    try {
      // Optimistic update
      setProducts(prev => prev.filter(p => p.id !== productId));

      await deleteDoc(doc(db, 'products', productId));
      
      fetchData(); // Refresh to ensure sync
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
      fetchData(); // Revert on error
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus
      });
    } catch (error) {
      console.error('Error updating status:', error);
      // Revert on error
      fetchData();
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrderToDelete(orderId);
  };

  const confirmDeleteOrder = async (orderId: string) => {
    setOrderToDelete(null);
    try {
      // Optimistic update
      setOrders(prev => prev.filter(o => o.id !== orderId));
      
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order. Please try again.');
      fetchData(); // Revert on error
    }
  };

  const generateInvoicePDF = (order: Order) => {
    const doc = new jsPDF();
    
    // Branding
    doc.setFontSize(24);
    doc.setTextColor(2, 44, 34); // Emerald 950
    doc.text('HNS Mart', 14, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(212, 175, 55); // Gold 500
    doc.text('Premium Attar & Fragrances', 14, 32);
    
    // Invoice details
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('INVOICE', 150, 25);
    
    doc.setFontSize(10);
    doc.text(`Order ID: ${order.id}`, 150, 32);
    doc.text(`Date: ${order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'N/A'}`, 150, 38);
    doc.text(`Status: ${order.status || 'Pending'}`, 150, 44);
    
    // Customer details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 14, 55);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(order.customerName, 14, 62);
    doc.text(`Phone: ${order.mobileNumber}`, 14, 68);
    
    // Handle multi-line address
    const splitAddress = doc.splitTextToSize(order.address, 80);
    doc.text(splitAddress, 14, 74);
    
    // Items Table Header
    const startY = 100;
    doc.setFillColor(253, 251, 247); // Ivory
    doc.rect(14, startY - 6, 182, 10, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.text('Item Description', 16, startY);
    doc.text('Qty', 130, startY);
    doc.text('Price', 150, startY);
    doc.text('Total', 175, startY);
    
    // Items
    doc.setFont('helvetica', 'normal');
    let currentY = startY + 10;
    
    try {
      const items = JSON.parse(order.items);
      items.forEach((item: any) => {
        const itemName = doc.splitTextToSize(item.name, 100);
        doc.text(itemName, 16, currentY);
        doc.text(String(item.quantity || 1), 130, currentY);
        doc.text(`BDT ${item.discountedPrice}`, 150, currentY);
        doc.text(`BDT ${(item.discountedPrice * (item.quantity || 1))}`, 175, currentY);
        currentY += (itemName.length * 6) + 4;
      });
    } catch {
      // Fallback for old single-item format
      doc.text('Premium Attar Combo', 16, currentY);
      doc.text('1', 130, currentY);
      doc.text(`BDT ${order.totalAmount}`, 150, currentY);
      doc.text(`BDT ${order.totalAmount}`, 175, currentY);
      currentY += 10;
    }
    
    // Total
    doc.setDrawColor(212, 175, 55); // Gold 500
    doc.line(14, currentY, 196, currentY);
    
    currentY += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount:', 130, currentY);
    doc.setTextColor(2, 44, 34); // Emerald 950
    doc.text(`BDT ${order.totalAmount}`, 175, currentY);
    
    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for shopping with HNS Mart! Ramadan Kareem.', 105, 280, { align: 'center' });
    
    doc.save(`Invoice_${order.id}.pdf`);
  };

  // Analytics Calculations
  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter(o => o.status === 'Shipped' || o.status === 'Completed')
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);
  
  const pendingCount = orders.filter(o => !o.status || o.status === 'Pending').length;
  const processingCount = orders.filter(o => o.status === 'Processing').length;
  const shippedCount = orders.filter(o => o.status === 'Shipped').length;
  const canceledCount = orders.filter(o => o.status === 'Canceled').length;

  return (
    <div className="min-h-screen pb-12">
      <header className="bg-emerald-950 text-ivory py-4 shadow-xl border-b border-gold-500/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-heading font-bold text-gold-500">HNS Mart Admin</h1>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-ivory/80 hover:text-gold-500 transition-colors font-bengali-sans font-medium"
          >
            <LogOut size={18} />
            লগআউট
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Analytics Dashboard */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-heading font-bold text-emerald-950 mb-6">Dashboard Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
              <div className="bg-emerald-950/10 p-4 rounded-full text-emerald-950 border border-emerald-950/20">
                <TrendingUp size={28} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
                <p className="text-3xl font-serif font-bold text-emerald-950">{formatToBengaliPrice(totalRevenue)}</p>
                <p className="text-xs text-slate-400 mt-1">From shipped orders</p>
              </div>
            </div>
            
            <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
              <div className="bg-gold-500/20 p-4 rounded-full text-gold-600 border border-gold-500/30">
                <ShoppingCart size={28} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Orders</p>
                <p className="text-3xl font-serif font-bold text-emerald-950">{formatToBengaliNumber(totalOrders)}</p>
                <p className="text-xs text-slate-400 mt-1">All time</p>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
              <div className="bg-amber-100 p-4 rounded-full text-amber-600 border border-amber-200">
                <Clock size={28} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Pending & Processing</p>
                <p className="text-3xl font-serif font-bold text-emerald-950">{pendingCount + processingCount}</p>
                <p className="text-xs text-slate-400 mt-1">Needs attention</p>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
              <div className="bg-red-100 p-4 rounded-full text-red-600 border border-red-200">
                <XCircle size={28} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Canceled</p>
                <p className="text-3xl font-serif font-bold text-emerald-950">{canceledCount}</p>
                <p className="text-xs text-slate-400 mt-1">Lost orders</p>
              </div>
            </div>
          </div>

          {/* Visual Status Bar */}
          {totalOrders > 0 && (
            <div className="mt-6 glass-card p-6 rounded-2xl">
              <p className="text-sm font-medium text-emerald-950 mb-3">Order Status Distribution</p>
              <div className="w-full h-4 flex rounded-full overflow-hidden shadow-inner">
                <div style={{ width: `${(shippedCount / totalOrders) * 100}%` }} className="bg-emerald-600" title={`Shipped: ${shippedCount}`}></div>
                <div style={{ width: `${(processingCount / totalOrders) * 100}%` }} className="bg-gold-500" title={`Processing: ${processingCount}`}></div>
                <div style={{ width: `${(pendingCount / totalOrders) * 100}%` }} className="bg-slate-300" title={`Pending: ${pendingCount}`}></div>
                <div style={{ width: `${(canceledCount / totalOrders) * 100}%` }} className="bg-red-500" title={`Canceled: ${canceledCount}`}></div>
              </div>
              <div className="flex flex-wrap gap-6 mt-4 text-sm text-slate-600 font-medium">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-600"></div> Shipped ({shippedCount})</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gold-500"></div> Processing ({processingCount})</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-300"></div> Pending ({pendingCount})</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Canceled ({canceledCount})</div>
              </div>
            </div>
          )}
        </motion.div>

        <div className="flex flex-wrap gap-4 mb-8 border-b border-gold-500/20 pb-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-heading font-bold transition-colors ${
              activeTab === 'orders' ? 'bg-emerald-950 text-gold-500 shadow-lg' : 'text-emerald-950 hover:bg-emerald-950/5'
            }`}
          >
            <ShoppingCart size={20} />
            Manage Orders
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-heading font-bold transition-colors ${
              activeTab === 'products' ? 'bg-emerald-950 text-gold-500 shadow-lg' : 'text-emerald-950 hover:bg-emerald-950/5'
            }`}
          >
            <Package size={20} />
            Manage Products
          </button>
          
          <button 
            onClick={fetchData}
            disabled={isLoading}
            className="ml-auto flex items-center gap-2 px-6 py-3 text-emerald-950 hover:bg-emerald-950/5 rounded-xl font-heading font-bold transition-colors border border-emerald-950/10"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {activeTab === 'orders' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-2xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-950/5 text-emerald-950 text-sm border-b border-gold-500/20">
                    <th className="p-5 font-heading font-bold">Order ID</th>
                    <th className="p-5 font-heading font-bold">Date</th>
                    <th className="p-5 font-heading font-bold">Customer</th>
                    <th className="p-5 font-heading font-bold">Items</th>
                    <th className="p-5 font-heading font-bold">Total</th>
                    <th className="p-5 font-heading font-bold">Status</th>
                    <th className="p-5 font-heading font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold-500/10">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-500 font-heading text-lg">No orders found</td>
                    </tr>
                  ) : (
                    orders.map((order, index) => (
                      <tr key={order.id || `order-${index}`} className="hover:bg-emerald-950/5 transition-colors">
                        <td className="p-5 text-sm font-medium text-emerald-950">{order.id}</td>
                        <td className="p-5 text-sm text-slate-500">
                          {order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-5 text-sm">
                          <div className="font-bold text-emerald-950">{order.customerName}</div>
                          <div className="text-slate-500 font-serif">{order.mobileNumber}</div>
                          <div className="text-xs text-slate-400 mt-1 max-w-[200px] truncate" title={order.address}>{order.address}</div>
                        </td>
                        <td className="p-5 text-sm text-slate-600 max-w-[250px]">
                          {(() => {
                            try {
                              const items = JSON.parse(order.items);
                              return items.map((i: any) => `${i.name} (x${i.quantity || 1})`).join(', ');
                            } catch {
                              return "Single Item";
                            }
                          })()}
                        </td>
                        <td className="p-5 text-lg font-serif font-bold text-emerald-950">{formatToBengaliPrice(order.totalAmount)}</td>
                        <td className="p-5">
                          <select 
                            value={order.status || 'Pending'}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`text-sm rounded-full px-4 py-1.5 font-bold border outline-none shadow-sm ${
                              order.status === 'Shipped' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                              order.status === 'Processing' ? 'bg-gold-50 text-gold-700 border-gold-200' :
                              order.status === 'Canceled' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Canceled">Canceled</option>
                          </select>
                        </td>
                        <td className="p-5 flex items-center gap-2">
                          <button 
                            onClick={() => generateInvoicePDF(order)}
                            className="flex items-center gap-2 text-sm text-emerald-950 hover:text-gold-600 font-bold transition-colors bg-white hover:bg-gold-50 px-4 py-2 rounded-xl border border-gold-500/30 shadow-sm"
                          >
                            <Download size={16} />
                            Invoice
                          </button>
                          {order.status === 'Canceled' && (
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="flex items-center justify-center text-sm text-red-600 hover:text-red-700 font-bold transition-colors bg-red-50 hover:bg-red-100 p-2.5 rounded-xl border border-red-200 shadow-sm"
                              title="Delete Order"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'products' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-1">
              <div className="glass-card rounded-2xl p-6 border-t-4 border-t-gold-500">
                <h2 className="text-xl font-heading font-bold text-emerald-950 mb-6 flex items-center gap-2">
                  <Plus size={24} className="text-gold-500" />
                  Add New Product
                </h2>
                <form onSubmit={handleAddProduct} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-emerald-950 mb-1">Product Name</label>
                    <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-4 py-3 bg-white/50 border border-gold-500/30 rounded-xl focus:ring-2 focus:ring-gold-500 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-emerald-950 mb-1">Regular Price</label>
                      <input required type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full px-4 py-3 bg-white/50 border border-gold-500/30 rounded-xl focus:ring-2 focus:ring-gold-500 outline-none font-serif" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-emerald-950 mb-1">Sale Price</label>
                      <input required type="number" value={newProduct.discountedPrice} onChange={e => setNewProduct({...newProduct, discountedPrice: e.target.value})} className="w-full px-4 py-3 bg-white/50 border border-gold-500/30 rounded-xl focus:ring-2 focus:ring-gold-500 outline-none font-serif" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-emerald-950 mb-1">Product Image</label>
                    <input 
                      id="productImageInput"
                      type="file" 
                      accept="image/*" 
                      required
                      onChange={handleImageChange} 
                      className="w-full px-4 py-3 bg-white/50 border border-gold-500/30 rounded-xl focus:ring-2 focus:ring-gold-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-emerald-950 file:text-gold-500 hover:file:bg-emerald-900 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-emerald-950 mb-1">Description</label>
                    <RichTextEditor 
                      content={newProduct.description} 
                      onChange={(content) => setNewProduct({...newProduct, description: content})} 
                    />
                  </div>
                  <button type="submit" disabled={isAddingProduct} className="w-full bg-emerald-950 text-gold-500 font-heading font-bold py-4 rounded-xl hover:bg-emerald-900 transition-colors disabled:bg-slate-400 shadow-lg flex items-center justify-center gap-2">
                    {isAddingProduct ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        {uploadStatus || 'Adding Product...'}
                      </>
                    ) : 'Save Product'}
                  </button>
                </form>
              </div>
            </div>
            
            <div className="lg:col-span-2">
              <div className="glass-card rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-emerald-950/5 text-emerald-950 text-sm border-b border-gold-500/20">
                      <th className="p-5 font-heading font-bold">Product</th>
                      <th className="p-5 font-heading font-bold">Price</th>
                      <th className="p-5 font-heading font-bold">Sale Price</th>
                      <th className="p-5 font-heading font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold-500/10">
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-slate-500 font-heading text-lg">No products found</td>
                      </tr>
                    ) : (
                      products.map((product, index) => (
                        <tr key={product.id || `product-${index}`} className="hover:bg-emerald-950/5 transition-colors">
                          <td className="p-5">
                            <div className="flex items-center gap-4">
                              <img src={product.imageUrl || "https://picsum.photos/seed/product/50/50"} alt={product.name} className="w-14 h-14 rounded-xl object-cover border border-gold-500/20 shadow-sm" referrerPolicy="no-referrer" />
                              <div>
                                <div className="font-bold text-emerald-950">{product.name}</div>
                                <div className="text-xs text-slate-500 font-serif">ID: {product.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-5 text-lg text-slate-400 line-through font-serif">{formatToBengaliPrice(product.price)}</td>
                          <td className="p-5 text-xl font-bold text-emerald-950 font-serif">{formatToBengaliPrice(product.discountedPrice)}</td>
                          <td className="p-5">
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-bold transition-colors bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl border border-red-200 shadow-sm"
                            >
                              <Trash2 size={16} />
                              ডিলিট
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Product Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-emerald-950 mb-4">Confirm Deletion</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to delete this product? (আপনি কি নিশ্চিত যে আপনি এই প্রোডাক্টটি ডিলিট করতে চান?)</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => confirmDeleteProduct(productToDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-emerald-950 mb-4">Confirm Deletion</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to permanently delete this canceled order?</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => confirmDeleteOrder(orderToDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
