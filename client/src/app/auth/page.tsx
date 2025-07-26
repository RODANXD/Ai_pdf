
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const transition = {
    x: { type: "spring", stiffness: 300, damping: 30 },
    opacity: { duration: 0.2 }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-4xl h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden flex relative">
        {/* Sliding Panel */}
        <motion.div
          className="absolute w-1/2 h-full flex items-center justify-center text-white z-10"
          animate={{
            x: isLogin ? '0%' : '100%',
            background: isLogin 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
            <div className="absolute top-20 -left-10 w-32 h-32 bg-white/10 rounded-full"></div>
            <div className="absolute bottom-20 right-20 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-white/10 rounded-full"></div>
          </div>
          
          <div className="text-center z-10 px-8">
            <motion.div
              key={isLogin ? 'login-panel' : 'register-panel'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-4xl font-bold mb-4">
                {isLogin ? 'Hello, Friend!' : 'Welcome Back!'}
              </h1>
              <p className="text-lg mb-8 leading-relaxed">
                {isLogin 
                  ? 'Register with your personal details to use all of site features'
                  : 'To keep connected with us please login with your personal info'
                }
              </p>
              <button
                onClick={toggleForm}
                className="border-2 border-white text-white px-8 py-3 rounded-full font-medium hover:bg-white hover:text-gray-800 transition-all duration-300 whitespace-nowrap"
              >
                {isLogin ? 'SIGN UP' : 'SIGN IN'}
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Left Form Panel */}
        <div className="w-1/2 relative flex items-center justify-center">
          <div className="w-full max-w-sm px-8">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="login-left"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  // transition={transition}
                  custom={-1}
                  className="absolute inset-0 flex items-center justify-center px-8"
                >
                  <div className="w-full max-w-sm">
                    
                    <RegisterForm onToggle={toggleForm} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="w-1/2 relative flex items-center justify-center">
          <div className="w-full max-w-sm px-8">
            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.div
                  key="login-right"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  // transition={transition}
                  custom={1}
                  className="absolute inset-0 flex items-center justify-center px-8"
                >
                  <div className="w-full max-w-sm">
                    <LoginForm onToggle={toggleForm} />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="register-right"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  // transition={transition}
                  custom={1}
                  className="absolute inset-0 flex items-center justify-center px-8"
                >
                  <div className="w-full max-w-sm">
                    <RegisterForm onToggle={toggleForm} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
