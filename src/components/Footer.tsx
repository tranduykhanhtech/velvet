export function Footer() {
  return (
    <footer className="w-full py-8 border-t border-gray-50 bg-white">
      <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0 text-[10px] md:text-[12px] tracking-[0.2em] uppercase text-gray-400 font-bold">
        <span className="text-center md:text-left">&copy; 2026 Velvet. Elevating your craft.</span>
        <div className="flex gap-8 md:gap-6">
          <span className="hover:text-brand transition-colors cursor-pointer">Terms</span>
          <span className="hover:text-brand transition-colors cursor-pointer">Privacy</span>
        </div>
      </div>
    </footer>
  );
}
