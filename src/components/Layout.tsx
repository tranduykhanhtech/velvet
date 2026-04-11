import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function Layout() {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-text-main selection:bg-brand/20 selection:text-brand">
      <Navbar />
      <main className="flex-grow flex flex-col relative w-full pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-grow w-full flex flex-col"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#1a1a1a',
            fontFamily: '"Inter", sans-serif',
            fontSize: '13px',
            fontWeight: '500',
            borderRadius: '12px',
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)',
            border: '1px solid #f3f4f6',
            padding: '12px 20px',
          },
          success: {
            iconTheme: {
              primary: '#A89278',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}
