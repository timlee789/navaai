'use client'
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showContentUpload, setShowContentUpload] = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [contentDescription, setContentDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0
  });
  
  // Gallery management state
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'payments', 'gallery', or 'banner'
  const [galleryItems, setGalleryItems] = useState([]);
  const [showGalleryUpload, setShowGalleryUpload] = useState(false);
  const [galleryUploadFile, setGalleryUploadFile] = useState(null);
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryDescription, setGalleryDescription] = useState('');
  const [galleryLoading, setGalleryLoading] = useState(false);

  // Banner management state
  const [bannerData, setBannerData] = useState(null);
  const [showBannerUpload, setShowBannerUpload] = useState(false);
  const [bannerUploadFile, setBannerUploadFile] = useState(null);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerDescription, setBannerDescription] = useState('');
  const [bannerLoading, setBannerLoading] = useState(false);

  // Payment management state
  const [payments, setPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    pendingPayments: 0,
    completedPayments: 0,
    failedPayments: 0
  });
  const [paymentFilter, setPaymentFilter] = useState('ALL'); // ALL, PENDING, COMPLETED, FAILED
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Customer details with payments state
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null);
  const [loadingCustomerDetails, setLoadingCustomerDetails] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, loading: authLoading } = useAuth();

  useEffect(() => {
    // Wait if authentication state is loading
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.role !== 'ADMIN') {
      alert('Administrator privileges required.');
      router.push('/');
      return;
    }
    
    loadOrders();
    if (activeTab === 'payments') {
      loadPayments();
    } else if (activeTab === 'gallery') {
      loadGalleryItems();
    } else if (activeTab === 'banner') {
      loadBannerData();
    }
  }, [user, authLoading, router, activeTab]);

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      
      if (response.ok) {
        setOrders(data.orders);
        calculateStats(data.orders);
      } else {
        console.error('Failed to load orders:', data.error);
      }
    } catch (error) {
      console.error('Order loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersList) => {
    const stats = {
      totalOrders: ordersList.length,
      pendingOrders: ordersList.filter(order => order.status === 'PENDING').length,
      inProgressOrders: ordersList.filter(order => order.status === 'IN_PROGRESS').length,
      completedOrders: ordersList.filter(order => order.status === 'COMPLETED').length
    };
    setStats(stats);
  };

  const loadPayments = async () => {
    try {
      console.log('🏦 Loading payments...');
      const response = await fetch('/api/admin/payments');
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Payments loaded:', data.payments.length);
        setPayments(data.payments);
        setPaymentStats(data.stats);
      } else {
        console.error('Failed to load payments:', data.error);
      }
    } catch (error) {
      console.error('Payment loading error:', error);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateStatus',
          status: status
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        loadOrders(); // Refresh order list
        alert('Status has been updated.');
      } else {
        alert('Status update failed: ' + data.error);
      }
    } catch (error) {
      console.error('Status update error:', error);
      alert('A network error occurred.');
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadFiles(prev => [...prev, ...files]);
  };

  const removeUploadFile = (index) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadAdminContent = async (orderId) => {
    if (uploadFiles.length === 0) {
      alert('Please select files to upload.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('description', contentDescription);
      
      uploadFiles.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        loadOrders(); // Refresh order list
        setShowContentUpload(null);
        setUploadFiles([]);
        setContentDescription('');
        alert('Content has been uploaded successfully!');
      } else {
        alert('Content upload failed: ' + data.error);
      }
    } catch (error) {
      console.error('Content upload error:', error);
      alert('A network error occurred.');
    } finally {
      setUploading(false);
    }
  };

  const openContentUpload = (order) => {
    setShowContentUpload(order);
    setContentDescription('');
    setUploadFiles([]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'PENDING': return 'bg-gray-100 text-gray-800';
      case 'REVISION': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'COMPLETED': return 'Completed';
      case 'IN_PROGRESS': return 'In Progress';
      case 'REVIEW': return 'Under Review';
      case 'PENDING': return 'Pending';
      case 'REVISION': return 'Revision Required';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const dateStr = dateString.split('T')[0];
    const [year, month, day] = dateStr.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString('en-US');
  };

  // Payment utility functions
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status) => {
    switch (status) {
      case 'COMPLETED': return 'Completed';
      case 'PENDING': return 'Pending';
      case 'FAILED': return 'Failed';
      default: return status;
    }
  };

  const getServiceTypeText = (type) => {
    switch (type) {
      case 'PLAN': return 'Service Plan';
      case 'OTHER_SERVICE': return 'Other Service';
      default: return type;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const filteredPayments = payments.filter(payment => {
    if (paymentFilter === 'ALL') return true;
    return payment.status === paymentFilter;
  });

  // Load customer details with payment history
  const loadCustomerDetails = async (customer) => {
    setLoadingCustomerDetails(true);
    try {
      console.log('👤 Loading customer details for:', customer.email);
      const response = await fetch(`/api/admin/user-payments/${customer.id}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Customer details loaded:', data.user);
        setSelectedCustomerDetails(data.user);
      } else {
        console.error('Failed to load customer details:', data.error);
        alert('Failed to load customer details: ' + data.error);
      }
    } catch (error) {
      console.error('Customer details loading error:', error);
      alert('An error occurred while loading customer details.');
    } finally {
      setLoadingCustomerDetails(false);
    }
  };

  // Gallery management functions
  const loadGalleryItems = async () => {
    try {
      const response = await fetch('/api/gallery');
      const data = await response.json();
      
      if (response.ok) {
        setGalleryItems(data.items);
      } else {
        console.error('Failed to load gallery items:', data.error);
      }
    } catch (error) {
      console.error('Gallery loading error:', error);
    }
  };

  const handleGalleryFileUpload = (e) => {
    const file = e.target.files[0];
    setGalleryUploadFile(file);
  };

  const uploadGalleryItem = async () => {
    if (!galleryUploadFile || !galleryTitle.trim()) {
      alert('Please provide a title and select a file.');
      return;
    }

    setGalleryLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', galleryTitle);
      formData.append('description', galleryDescription);
      formData.append('file', galleryUploadFile);

      const response = await fetch('/api/gallery', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Gallery item uploaded successfully!');
        setShowGalleryUpload(false);
        setGalleryTitle('');
        setGalleryDescription('');
        setGalleryUploadFile(null);
        loadGalleryItems();
      } else {
        alert('Upload failed: ' + data.error);
      }
    } catch (error) {
      console.error('Gallery upload error:', error);
      alert('A network error occurred.');
    } finally {
      setGalleryLoading(false);
    }
  };

  const deleteGalleryItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const response = await fetch(`/api/gallery/${itemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Gallery item deleted successfully!');
        loadGalleryItems();
      } else {
        alert('Delete failed: ' + data.error);
      }
    } catch (error) {
      console.error('Gallery delete error:', error);
      alert('A network error occurred.');
    }
  };

  const reorderGalleryItems = async (newOrder) => {
    try {
      const response = await fetch('/api/gallery', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: newOrder }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setGalleryItems(newOrder);
      } else {
        alert('Reorder failed: ' + data.error);
      }
    } catch (error) {
      console.error('Gallery reorder error:', error);
      alert('A network error occurred.');
    }
  };

  const moveGalleryItem = (fromIndex, toIndex) => {
    const newItems = [...galleryItems];
    const [removed] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, removed);
    reorderGalleryItems(newItems);
  };

  // Banner management functions
  const loadBannerData = async () => {
    try {
      const response = await fetch('/api/banner');
      const data = await response.json();
      
      if (response.ok) {
        setBannerData(data.banner); // null if no banner exists - this is normal
      } else {
        console.error('Failed to load banner:', data.error);
      }
    } catch (error) {
      console.error('Banner loading error:', error);
    }
  };

  const handleBannerFileUpload = (e) => {
    const file = e.target.files[0];
    setBannerUploadFile(file);
  };

  const uploadBanner = async () => {
    if (!bannerUploadFile) {
      alert('Please select a file to upload.');
      return;
    }

    setBannerLoading(true);
    
    const formData = new FormData();
    formData.append('file', bannerUploadFile);
    formData.append('title', bannerTitle);
    formData.append('description', bannerDescription);

    try {
      const response = await fetch('/api/banner', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        alert('Banner uploaded successfully!');
        setShowBannerUpload(false);
        setBannerUploadFile(null);
        setBannerTitle('');
        setBannerDescription('');
        loadBannerData();
      } else {
        alert('Upload failed: ' + data.error);
      }
    } catch (error) {
      console.error('Banner upload error:', error);
      alert('A network error occurred.');
    } finally {
      setBannerLoading(false);
    }
  };

  const deleteBanner = async (bannerId) => {
    if (!confirm('Are you sure you want to delete this banner?')) {
      return;
    }

    try {
      const response = await fetch(`/api/banner?id=${bannerId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Banner deleted successfully!');
        loadBannerData();
      } else {
        alert('Delete failed: ' + data.error);
      }
    } catch (error) {
      console.error('Banner delete error:', error);
      alert('A network error occurred.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4d03f' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: '#f4d03f' }}>
      <nav className="shadow-lg" style={{ background: '#f4d03f' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a href="/" style={{ textDecoration: 'none' }}>
                <h1 className="text-2xl font-bold text-purple-600" style={{ fontFamily: 'Myriad Pro, Arial, sans-serif', cursor: 'pointer' }}>AiStudio7.com - Admin</h1>
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <a 
                href="/" 
                className="hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium"
                style={{
                  fontWeight: pathname === '/' ? 'bold' : 'normal',
                  color: pathname === '/' ? '#7c3aed' : '#374151'
                }}
              >
                Home
              </a>
              <a 
                href="/admin" 
                className="hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium"
                style={{
                  fontWeight: pathname === '/admin' ? 'bold' : 'normal',
                  color: pathname === '/admin' ? '#7c3aed' : '#374151'
                }}
              >
                Admin
              </a>
              <button 
                onClick={logout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Order Management
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'payments'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Payment Management
              </button>
              <button
                onClick={() => setActiveTab('gallery')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'gallery'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Gallery Management
              </button>
              <button
                onClick={() => setActiveTab('banner')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'banner'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Banner Management
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'orders' && (
          <>
            {/* Statistics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <span className="text-2xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">🔄</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-semibold text-blue-900">{stats.inProgressOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-green-900">{stats.completedOrders}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Order List</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <button
                            onClick={() => loadCustomerDetails(order.client)}
                            className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                            disabled={loadingCustomerDetails}
                          >
                            {order.client?.name}
                          </button>
                          <div className="text-gray-500">{order.client?.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-US')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.dueDate) || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          View Details
                        </button>
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'IN_PROGRESS')}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Start
                          </button>
                        )}
                        {order.status === 'IN_PROGRESS' && (
                          <>
                            <button
                              onClick={() => openContentUpload(order)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Upload Content
                            </button>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'REVIEW')}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              Request Review
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Order Details: {selectedOrder.orderId}</h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700">Customer Information</h4>
                      <p className="text-gray-600">{selectedOrder.client?.name}</p>
                      <p className="text-gray-500 text-sm">{selectedOrder.client?.email}</p>
                      {selectedOrder.client?.company && (
                        <p className="text-gray-500 text-sm">{selectedOrder.client?.company}</p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Order Information</h4>
                      <p className="text-gray-600">Title: {selectedOrder.title}</p>
                      <p className="text-gray-600">Created: {new Date(selectedOrder.createdAt).toLocaleDateString('en-US')}</p>
                      <p className="text-gray-600">Due Date: {formatDate(selectedOrder.dueDate) || 'TBD'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700">Order Description</h4>
                    <p className="text-gray-600">{selectedOrder.description}</p>
                  </div>

                  {/* Uploaded Files */}
                  {selectedOrder.files && selectedOrder.files.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-700 mb-3">Customer Uploaded Files</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {selectedOrder.files.map((file, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                              {file.mimetype?.startsWith('image/') ? (
                                <img
                                  src={file.path}
                                  alt={file.originalName}
                                  className="w-full h-full object-cover"
                                />
                              ) : file.mimetype?.startsWith('video/') ? (
                                <video
                                  src={file.path}
                                  className="w-full h-full object-cover"
                                  muted
                                  preload="metadata"
                                >
                                  <source src={file.path} type={file.mimetype} />
                                </video>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-3xl">📄</span>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1 truncate" title={file.originalName}>
                              {file.originalName}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Separator */}
                  {selectedOrder.adminContent && (
                    <div className="border-t-2 border-purple-200 pt-6">
                      <div className="flex items-center mb-4">
                        <div className="flex-grow h-px bg-purple-200"></div>
                        <span className="px-4 text-sm font-medium text-purple-600 bg-purple-50 rounded-full">
                          🎨 Admin Created Content
                        </span>
                        <div className="flex-grow h-px bg-purple-200"></div>
                      </div>
                    </div>
                  )}

                  {/* Admin Created Content */}
                  {selectedOrder.adminContent && (
                    <div>
                      <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                        <div className="flex justify-between items-start mb-3">
                          <p className="text-gray-600 flex-1">{selectedOrder.adminContent.description}</p>
                          <span className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                            {new Date(selectedOrder.adminContent.createdAt).toLocaleDateString('en-US')} {' '}
                            {new Date(selectedOrder.adminContent.createdAt).toLocaleTimeString('en-US')}
                          </span>
                        </div>
                        
                        {/* Admin uploaded files */}
                        {selectedOrder.adminContent.files && selectedOrder.adminContent.files.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {selectedOrder.adminContent.files.map((file, index) => (
                              <div key={index} className="relative group">
                                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                  {file.mimetype?.startsWith('image/') ? (
                                    <img
                                      src={file.path}
                                      alt={file.originalName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : file.mimetype?.startsWith('video/') ? (
                                    <video
                                      src={file.path}
                                      className="w-full h-full object-cover"
                                      controls
                                      preload="metadata"
                                    >
                                      <source src={file.path} type={file.mimetype} />
                                    </video>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <div className="text-center">
                                        <span className="text-3xl">🎨</span>
                                        <p className="text-xs mt-1 text-gray-500">Final Work</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Filename */}
                                <p className="text-xs text-gray-600 mt-1 truncate" title={file.originalName}>
                                  {file.originalName}
                                </p>
                                {/* File upload time */}
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {new Date(selectedOrder.adminContent.createdAt).toLocaleDateString('en-US')} {' '}
                                  {new Date(selectedOrder.adminContent.createdAt).toLocaleTimeString('en-US', { 
                                    hour12: true, 
                                    hour: 'numeric', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-200 h-40 rounded flex items-center justify-center">
                            <span className="text-gray-500">Content Preview</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Customer Feedback */}
                  {selectedOrder.feedbacks && selectedOrder.feedbacks.length > 0 && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h4 className="font-medium text-gray-700 mb-3">Customer Feedback</h4>
                      <div className="space-y-3">
                        {selectedOrder.feedbacks.map((feedback, index) => (
                          <div key={index} className="bg-white p-3 rounded border">
                            <div className="flex justify-between items-start mb-2">
                              <span className={`px-2 py-1 text-xs rounded font-medium ${
                                feedback.type === 'APPROVAL' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                              }`}>
                                {feedback.type === 'APPROVAL' ? '✅ Approved' : '📝 Revision Request'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(feedback.createdAt).toLocaleDateString('en-US')} {new Date(feedback.createdAt).toLocaleTimeString('en-US')}
                              </span>
                            </div>
                            {feedback.message && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700">Feedback:</p>
                                <p className="text-gray-600 mt-1 p-2 bg-gray-50 rounded text-sm">{feedback.message}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status Change Buttons */}
                  <div className="flex space-x-2 pt-4 border-t">
                    {selectedOrder.status === 'PENDING' && (
                      <button
                        onClick={() => {
                          updateOrderStatus(selectedOrder.id, 'IN_PROGRESS');
                          setSelectedOrder(null);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Start Work
                      </button>
                    )}
                    {selectedOrder.status === 'IN_PROGRESS' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedOrder(null);
                            openContentUpload(selectedOrder);
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Upload Content
                        </button>
                        <button
                          onClick={() => {
                            updateOrderStatus(selectedOrder.id, 'REVIEW');
                            setSelectedOrder(null);
                          }}
                          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                        >
                          Request Review
                        </button>
                      </>
                    )}
                    {(selectedOrder.status === 'REVIEW' || selectedOrder.status === 'REVISION') && (
                      <button
                        onClick={() => {
                          setSelectedOrder(null);
                          openContentUpload(selectedOrder);
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        {selectedOrder.status === 'REVISION' ? 'Upload Revised Content' : 'Re-upload Content'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Details Modal with Payment History */}
        {selectedCustomerDetails && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-5/6 lg:w-4/5 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-medium text-gray-900">Customer Details & Payment History</h3>
                  <button
                    onClick={() => setSelectedCustomerDetails(null)}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ✕
                  </button>
                </div>

                {/* Customer Information Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Basic Info */}
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h4 className="font-medium text-black text-lg mb-4">👤 Customer Information</h4>
                    <div className="space-y-3 text-sm text-black">
                      <div><span className="font-medium text-black">Name:</span> {selectedCustomerDetails.name}</div>
                      <div><span className="font-medium text-black">Email:</span> {selectedCustomerDetails.email}</div>
                      {selectedCustomerDetails.company && (
                        <div><span className="font-medium text-black">Company:</span> {selectedCustomerDetails.company}</div>
                      )}
                      <div><span className="font-medium text-black">Phone:</span> {selectedCustomerDetails.phone || 'Not provided'}</div>
                      <div><span className="font-medium text-black">Role:</span> 
                        <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {selectedCustomerDetails.role}
                        </span>
                      </div>
                      <div><span className="font-medium text-black">Member Since:</span> {new Date(selectedCustomerDetails.createdAt).toLocaleDateString('en-US')}</div>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h4 className="font-medium text-black text-lg mb-4">💰 Payment Summary</h4>
                    <div className="space-y-3 text-sm text-black">
                      <div><span className="font-medium text-black">Total Payments:</span> {selectedCustomerDetails.payments?.length || 0}</div>
                      <div>
                        <span className="font-medium text-black">Total Spent:</span> 
                        {formatCurrency(selectedCustomerDetails.payments?.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0) || 0)}
                      </div>
                      <div>
                        <span className="font-medium text-black">Completed Payments:</span> 
                        {selectedCustomerDetails.payments?.filter(p => p.status === 'COMPLETED').length || 0}
                      </div>
                      <div>
                        <span className="font-medium text-black">Pending Payments:</span> 
                        {selectedCustomerDetails.payments?.filter(p => p.status === 'PENDING').length || 0}
                      </div>
                      <div>
                        <span className="font-medium text-black">Failed Payments:</span> 
                        {selectedCustomerDetails.payments?.filter(p => p.status === 'FAILED').length || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment History */}
                <div className="bg-white">
                  <h4 className="font-medium text-black text-lg mb-4">📋 Payment History</h4>
                  
                  {selectedCustomerDetails.payments && selectedCustomerDetails.payments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 border border-gray-300 rounded-lg">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Service</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Details</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedCustomerDetails.payments.map((payment) => (
                            <tr key={payment.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-black">
                                <div>{new Date(payment.createdAt).toLocaleDateString('en-US')}</div>
                                <div className="text-xs text-gray-600">{new Date(payment.createdAt).toLocaleTimeString('en-US')}</div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-black">
                                <div className="font-medium">{payment.serviceName}</div>
                                {payment.serviceDetails && (
                                  <div className="text-xs text-gray-600">
                                    {(() => {
                                      try {
                                        const details = JSON.parse(payment.serviceDetails);
                                        return details.description || '';
                                      } catch (e) {
                                        return '';
                                      }
                                    })()}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-black">
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {getServiceTypeText(payment.serviceType)}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-black">
                                {formatCurrency(payment.amount)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(payment.status)}`}>
                                  {getPaymentStatusText(payment.status)}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-black">
                                <button
                                  onClick={() => setSelectedPayment(payment)}
                                  className="text-purple-600 hover:text-purple-900 text-xs"
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                      No payment history found for this customer.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Upload Modal */}
        {showContentUpload && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {showContentUpload.status === 'REVISION' ? 'Upload Revised Content' : 'Upload Content'}: {showContentUpload.orderId}
                  </h3>
                  <button
                    onClick={() => setShowContentUpload(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">Order Information</h4>
                    <p className="text-gray-600">Customer: {showContentUpload.client?.name}</p>
                    <p className="text-gray-600">Title: {showContentUpload.title}</p>
                    <p className="text-gray-600">Description: {showContentUpload.description}</p>
                    <p className="text-gray-600">Current Status: 
                      <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(showContentUpload.status)}`}>
                        {getStatusText(showContentUpload.status)}
                      </span>
                    </p>
                  </div>

                  {/* Customer Feedback Display (for revision requests) */}
                  {showContentUpload.status === 'REVISION' && showContentUpload.feedbacks && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h4 className="font-medium text-red-700 mb-3">🔄 Customer Revision Requests</h4>
                      <div className="space-y-2">
                        {showContentUpload.feedbacks
                          .filter(feedback => feedback.type === 'REVISION')
                          .slice(-1) // Show only the latest revision request
                          .map((feedback, index) => (
                            <div key={index} className="bg-white p-3 rounded border border-orange-300">
                              <div className="flex justify-between items-start mb-2">
                                <span className="px-2 py-1 text-xs rounded font-medium bg-orange-100 text-orange-800">
                                  📝 Latest Revision Request
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(feedback.createdAt).toLocaleDateString('en-US')} {new Date(feedback.createdAt).toLocaleTimeString('en-US')}
                                </span>
                              </div>
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700">Revision Request Details:</p>
                                <p className="text-gray-800 mt-1 p-2 bg-orange-50 rounded text-sm font-medium border-l-4 border-orange-400">
                                  {feedback.message}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {showContentUpload.status === 'REVISION' ? 'Revised Content Description' : 'Final Content Description'}
                    </label>
                    <textarea
                      value={contentDescription}
                      onChange={(e) => setContentDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-black"
                      rows="3"
                      placeholder={showContentUpload.status === 'REVISION' ? 
                        'Enter description of content with revisions applied...' : 
                        'Enter description of content to deliver to customer...'}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      File Upload (Images/Videos)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="admin-content-upload"
                      />
                      <label
                        htmlFor="admin-content-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <span className="text-3xl mb-2">🎨</span>
                        <span className="text-lg text-gray-600">
                          {showContentUpload.status === 'REVISION' ? 'Upload revised content' : 'Upload final content'}
                        </span>
                        <span className="text-sm text-gray-500 mt-2">Supports image and video files</span>
                      </label>
                    </div>

                    {/* Uploaded File Preview */}
                    {uploadFiles.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-700 mb-3">Files to Upload</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {uploadFiles.map((file, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                {file.type.startsWith('image/') ? (
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : file.type.startsWith('video/') ? (
                                  <video
                                    src={URL.createObjectURL(file)}
                                    className="w-full h-full object-cover"
                                    muted
                                    preload="metadata"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-3xl">📄</span>
                                  </div>
                                )}
                                
                                {/* Delete button */}
                                <button
                                  type="button"
                                  onClick={() => removeUploadFile(index)}
                                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ×
                                </button>
                              </div>
                              
                              <p className="text-xs text-gray-600 mt-1 truncate" title={file.name}>
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => setShowContentUpload(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => uploadAdminContent(showContentUpload.id)}
                      disabled={uploading || uploadFiles.length === 0}
                      className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                    >
                      {uploading ? 'Uploading...' : 
                        (showContentUpload.status === 'REVISION' ? 'Send Revised Content' : 'Send Content')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
          </>
        )}

        {activeTab === 'payments' && (
          <>
            {/* Payment Statistics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <span className="text-2xl">💳</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Payments</p>
                    <p className="text-2xl font-semibold text-gray-900">{paymentStats.totalPayments}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-semibold text-green-900">{formatCurrency(paymentStats.totalAmount)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-semibold text-yellow-900">{paymentStats.pendingPayments}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-semibold text-green-900">{paymentStats.completedPayments}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <span className="text-2xl">❌</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Failed</p>
                    <p className="text-2xl font-semibold text-red-900">{paymentStats.failedPayments}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Filters */}
            <div className="bg-white shadow-xl rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Payment List</h3>
                  <div className="flex space-x-2">
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm text-black"
                    >
                      <option value="ALL">All Payments</option>
                      <option value="PENDING">Pending</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                          No payments found.
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {payment.id.slice(-8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <button
                                onClick={() => setSelectedPayment(payment)}
                                className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                              >
                                {payment.user?.name}
                              </button>
                              <div className="text-gray-500">{payment.user?.email}</div>
                              {payment.user?.company && (
                                <div className="text-gray-400 text-xs">{payment.user?.company}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{payment.serviceName}</div>
                              {payment.serviceDetails && (
                                <div className="text-gray-500 text-xs">
                                  {JSON.parse(payment.serviceDetails).description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {getServiceTypeText(payment.serviceType)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(payment.status)}`}>
                              {getPaymentStatusText(payment.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>
                              <div>{new Date(payment.createdAt).toLocaleDateString('en-US')}</div>
                              <div className="text-xs">{new Date(payment.createdAt).toLocaleTimeString('en-US')}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => setSelectedPayment(payment)}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Details Modal */}
            {selectedPayment && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Payment Details</h3>
                      <button
                        onClick={() => setSelectedPayment(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Payment Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-black mb-3">Payment Information</h4>
                          <div className="space-y-2 text-sm text-black">
                            <div><span className="font-medium text-black">Payment ID:</span> {selectedPayment.id}</div>
                            <div><span className="font-medium text-black">Amount:</span> {formatCurrency(selectedPayment.amount)}</div>
                            <div><span className="font-medium text-black">Currency:</span> {selectedPayment.currency.toUpperCase()}</div>
                            <div>
                              <span className="font-medium text-black">Status:</span> 
                              <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(selectedPayment.status)}`}>
                                {getPaymentStatusText(selectedPayment.status)}
                              </span>
                            </div>
                            <div><span className="font-medium text-black">Created:</span> {new Date(selectedPayment.createdAt).toLocaleString('en-US')}</div>
                            {selectedPayment.paidAt && (
                              <div><span className="font-medium text-black">Paid At:</span> {new Date(selectedPayment.paidAt).toLocaleString('en-US')}</div>
                            )}
                          </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium text-black mb-3">Customer Information</h4>
                          <div className="space-y-2 text-sm text-black">
                            <div><span className="font-medium text-black">Name:</span> {selectedPayment.user?.name}</div>
                            <div><span className="font-medium text-black">Email:</span> {selectedPayment.user?.email}</div>
                            {selectedPayment.user?.company && (
                              <div><span className="font-medium text-black">Company:</span> {selectedPayment.user?.company}</div>
                            )}
                            {selectedPayment.user?.phone && (
                              <div><span className="font-medium text-black">Phone:</span> {selectedPayment.user?.phone}</div>
                            )}
                            <div><span className="font-medium text-black">Member Since:</span> {new Date(selectedPayment.user?.createdAt).toLocaleDateString('en-US')}</div>
                          </div>
                        </div>
                      </div>

                      {/* Service Information */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-medium text-black mb-3">Service Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-black">
                          <div>
                            <div className="mb-2">
                              <span className="font-medium text-black">Service Name:</span> {selectedPayment.serviceName}
                            </div>
                            <div className="mb-2">
                              <span className="font-medium text-black">Service Type:</span>
                              <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {getServiceTypeText(selectedPayment.serviceType)}
                              </span>
                            </div>
                          </div>
                          <div>
                            {selectedPayment.stripeSessionId && (
                              <div className="mb-2">
                                <span className="font-medium text-black">Session ID:</span> 
                                <span className="ml-2 text-xs font-mono bg-gray-200 px-2 py-1 rounded text-black">
                                  {selectedPayment.stripeSessionId}
                                </span>
                              </div>
                            )}
                            {selectedPayment.stripePaymentId && (
                              <div className="mb-2">
                                <span className="font-medium text-black">Payment ID:</span>
                                <span className="ml-2 text-xs font-mono bg-gray-200 px-2 py-1 rounded text-black">
                                  {selectedPayment.stripePaymentId}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Service Details */}
                        {selectedPayment.serviceDetails && (
                          <div className="mt-4 p-3 bg-white rounded border">
                            <h5 className="font-medium text-black mb-2">Service Details</h5>
                            <div className="text-sm text-black">
                              {(() => {
                                try {
                                  const details = JSON.parse(selectedPayment.serviceDetails);
                                  return (
                                    <div>
                                      {details.description && (
                                        <div className="mb-2"><span className="font-medium text-black">Description:</span> {details.description}</div>
                                      )}
                                      {details.features && (
                                        <div>
                                          <span className="font-medium text-black">Features:</span>
                                          <ul className="list-disc list-inside ml-4 mt-1 text-black">
                                            {details.features.map((feature, index) => (
                                              <li key={index}>{feature}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {details.unit && (
                                        <div className="mt-2"><span className="font-medium text-black">Unit:</span> {details.unit}</div>
                                      )}
                                    </div>
                                  );
                                } catch (e) {
                                  return <div className="text-black">{selectedPayment.serviceDetails}</div>;
                                }
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'gallery' && (
          <>
            {/* Gallery Management Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Gallery Management</h2>
              <button
                onClick={() => setShowGalleryUpload(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
              >
                Add New Item
              </button>
            </div>

            {/* Gallery Grid */}
            <div className="bg-white shadow-xl rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Gallery Items ({galleryItems.length})</h3>
              </div>

              {galleryItems.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No gallery items found. Add some items to get started.
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {galleryItems.map((item, index) => (
                      <div key={item.id} className="relative group border border-gray-200 rounded-lg overflow-hidden">
                        {/* Thumbnail */}
                        <div className="aspect-video bg-gray-100">
                          {item.mimetype?.startsWith('image/') ? (
                            <img
                              src={item.path}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : item.mimetype?.startsWith('video/') ? (
                            <video
                              src={item.path}
                              className="w-full h-full object-cover"
                              muted
                              preload="metadata"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-4xl">📄</span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                          {item.description && (
                            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          )}
                          <div className="text-xs text-gray-500">
                            <p>Order: {item.order}</p>
                            <p>Size: {(item.size / 1024 / 1024).toFixed(2)} MB</p>
                            <p>Type: {item.mimetype}</p>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex space-x-1">
                            {index > 0 && (
                              <button
                                onClick={() => moveGalleryItem(index, index - 1)}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded p-1"
                                title="Move Up"
                              >
                                ↑
                              </button>
                            )}
                            {index < galleryItems.length - 1 && (
                              <button
                                onClick={() => moveGalleryItem(index, index + 1)}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded p-1"
                                title="Move Down"
                              >
                                ↓
                              </button>
                            )}
                            <button
                              onClick={() => deleteGalleryItem(item.id)}
                              className="bg-red-600 hover:bg-red-700 text-white rounded p-1"
                              title="Delete"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Gallery Upload Modal */}
            {showGalleryUpload && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Add Gallery Item</h3>
                      <button
                        onClick={() => setShowGalleryUpload(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={galleryTitle}
                          onChange={(e) => setGalleryTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-black"
                          placeholder="Enter item title"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={galleryDescription}
                          onChange={(e) => setGalleryDescription(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-black"
                          rows="3"
                          placeholder="Enter item description (optional)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          File *
                        </label>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleGalleryFileUpload}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                          required
                        />
                      </div>

                      {galleryUploadFile && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-700 mb-2">Preview</h4>
                          <div className="aspect-video bg-gray-100 rounded border">
                            {galleryUploadFile.type.startsWith('image/') ? (
                              <img
                                src={URL.createObjectURL(galleryUploadFile)}
                                alt="Preview"
                                className="w-full h-full object-cover rounded"
                              />
                            ) : galleryUploadFile.type.startsWith('video/') ? (
                              <video
                                src={URL.createObjectURL(galleryUploadFile)}
                                className="w-full h-full object-cover rounded"
                                muted
                                preload="metadata"
                              />
                            ) : null}
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            {galleryUploadFile.name} ({(galleryUploadFile.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                          onClick={() => setShowGalleryUpload(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={uploadGalleryItem}
                          disabled={galleryLoading || !galleryUploadFile || !galleryTitle.trim()}
                          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                        >
                          {galleryLoading ? 'Uploading...' : 'Add Item'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'banner' && (
          <>
            {/* Banner Management Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Banner Management</h2>
              <button
                onClick={() => setShowBannerUpload(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
              >
                Upload New Banner
              </button>
            </div>

            {/* Current Banner Display */}
            <div className="bg-white shadow-xl rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Current Main Banner</h3>
              </div>

              {!bannerData ? (
                <div className="p-8 text-center text-gray-500">
                  No banner uploaded yet. Upload a banner to display on the home page.
                </div>
              ) : (
                <div className="p-6">
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Banner Preview */}
                    <div className="aspect-[8/3] bg-gray-100">
                      <img
                        src={bannerData.path}
                        alt={bannerData.title || 'Main Banner'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Banner Info */}
                    <div className="p-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Banner Details</h4>
                          {bannerData.title && (
                            <p className="text-sm text-gray-700 mb-1">
                              <span className="font-medium">Title:</span> {bannerData.title}
                            </p>
                          )}
                          {bannerData.description && (
                            <p className="text-sm text-gray-700 mb-1">
                              <span className="font-medium">Description:</span> {bannerData.description}
                            </p>
                          )}
                          <p className="text-sm text-gray-700 mb-1">
                            <span className="font-medium">File:</span> {bannerData.originalName}
                          </p>
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Size:</span> {(bannerData.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <div className="flex justify-end items-start">
                          <button
                            onClick={() => deleteBanner(bannerData.id)}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                          >
                            Delete Banner
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Banner Upload Modal */}
            {showBannerUpload && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Upload Main Banner</h3>
                      <button
                        onClick={() => setShowBannerUpload(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title (Optional)
                        </label>
                        <input
                          type="text"
                          value={bannerTitle}
                          onChange={(e) => setBannerTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-black"
                          placeholder="Enter banner title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description (Optional)
                        </label>
                        <textarea
                          value={bannerDescription}
                          onChange={(e) => setBannerDescription(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-black"
                          rows="3"
                          placeholder="Enter banner description"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Banner Image *
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerFileUpload}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Recommended size: 1200x450px (for best results)
                        </p>
                      </div>

                      {bannerUploadFile && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-700 mb-2">Preview</h4>
                          <div className="aspect-[8/3] bg-gray-100 rounded border">
                            <img
                              src={URL.createObjectURL(bannerUploadFile)}
                              alt="Banner Preview"
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            {bannerUploadFile.name} ({(bannerUploadFile.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                          onClick={() => setShowBannerUpload(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={uploadBanner}
                          disabled={bannerLoading || !bannerUploadFile}
                          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                        >
                          {bannerLoading ? 'Uploading...' : 'Upload Banner'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}