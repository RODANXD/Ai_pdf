"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/Authcontext';
import { Button } from '@/components/ui/button';
import Upload from './upload';

const Dashboardpage = () => {
  const {logout, isAuthenticated, loading} = useAuth();

  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated,loading, router]);
  if (loading) return null;
  return (
    <div className="p-4">
      
      <Button
        onClick={logout}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Logout
      </Button>

      <Upload />
    </div>
  );
};

export default Dashboardpage;
