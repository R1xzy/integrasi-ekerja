'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from "next/link";
import { Star, MapPin, Clock, Shield, Award, MessageCircle, Calendar, ChevronRight, Phone, Mail, CheckCircle, Users, Trophy } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import ReviewItem from "@/components/reviews/ReviewItem";
import { authenticatedFetch, getAuthData } from '@/lib/auth-client';

interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  isShow: boolean;
  customer: {
    id: number;
    fullName: string;
    profilePictureUrl?: string;
  };
}

interface Provider {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  profilePictureUrl?: string;
  providerBio: string;
  verificationStatus: string;
  isActive: boolean;
  createdAt: string;
  // Add other provider fields as needed
}

export default function ProviderDetailPageWithReviews() {
  const params = useParams();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchProviderData();
  }, [params.id]);

  const fetchProviderData = async () => {
    try {
      setLoading(true);
      
      // Get current user first
      const user = getAuthData();
      setCurrentUser(user);
      
      // Fetch provider details
      const providerResponse = await fetch(`/api/providers/${params.id}`);
      const providerData = await providerResponse.json();
      
      if (providerData.success) {
        setProvider(providerData.data);
      }

      // Fetch reviews for this provider
      const reviewsResponse = await fetch(`/api/providers/${params.id}/reviews`);
      const reviewsData = await reviewsResponse.json();
      
      if (reviewsData.success) {
        // Apply client-side filtering for consistency (REQ-F-7.3)
        // Filter is also applied in ReviewItem component but this ensures data consistency
        const visibleReviews = reviewsData.data.filter((review: Review) => {
          // Show review if:
          // 1. is_show is not false (true or undefined), OR
          // 2. Current user is admin, OR  
          // 3. Current user is the review owner
          return review.isShow !== false || 
                 user?.role === 'admin' || 
                 user?.id === review.customer.id.toString();
        });
        setReviews(visibleReviews);
      }
      
    } catch (error) {
      console.error('Error fetching provider data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewUpdate = () => {
    fetchProviderData(); // Refresh data when review is updated/reported
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Provider tidak ditemukan</h1>
            <Link href="/providers" className="text-blue-600 hover:text-blue-800">
              Kembali ke daftar provider
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-8">
            {/* Provider Avatar */}
            <div className="flex-shrink-0 mb-4 lg:mb-0">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                {provider.profilePictureUrl ? (
                  <img
                    src={provider.profilePictureUrl}
                    alt={provider.fullName}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  provider.fullName.charAt(0).toUpperCase()
                )}
              </div>
            </div>

            {/* Provider Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{provider.fullName}</h1>
                {provider.verificationStatus === 'VERIFIED' && (
                  <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span className="text-xs font-medium">Terverifikasi</span>
                  </div>
                )}
              </div>

              <p className="text-gray-600 mb-4 max-w-2xl">{provider.providerBio}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>Bergabung {new Date(provider.createdAt).getFullYear()}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  <span>{provider.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  <span>{provider.phoneNumber}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2 mt-4 lg:mt-0">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Pesan Sekarang
              </button>
              <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Reviews Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  Ulasan Pelanggan ({reviews.length})
                </h2>
                
                {/* Review Summary */}
                {reviews.length > 0 && (
                  <div className="text-right">
                    <div className="flex items-center">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
                          return (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= avgRating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          );
                        })}
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Dari {reviews.length} ulasan
                    </p>
                  </div>
                )}
              </div>

              {/* Reviews List using ReviewItem component */}
              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <ReviewItem
                      key={review.id}
                      review={{
                        id: review.id,
                        rating: review.rating,
                        comment: review.comment,
                        date: review.createdAt,
                        customer: {
                          id: review.customer.id,
                          name: review.customer.fullName,
                          avatar: review.customer.profilePictureUrl
                        },
                        isShow: review.isShow
                      }}
                      currentUserId={currentUser?.id ? parseInt(currentUser.id) : undefined}
                      userRole={currentUser?.role}
                      providerName={provider.fullName}
                      onReviewUpdate={handleReviewUpdate}
                      showReportButton={true}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Belum ada ulasan untuk provider ini</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-6 mb-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistik</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`text-sm font-medium ${
                    provider.isActive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {provider.isActive ? 'Aktif' : 'Tidak Aktif'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Ulasan</span>
                  <span className="text-sm font-medium text-gray-900">
                    {reviews.length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Rating Rata-rata</span>
                  <span className="text-sm font-medium text-gray-900">
                    {reviews.length > 0 
                      ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
                      : 'Belum ada'
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Bergabung</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(provider.createdAt).getFullYear()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}