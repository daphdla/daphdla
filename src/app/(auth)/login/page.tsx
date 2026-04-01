import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Connexion",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-pe p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gold-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gold-400 mb-4 shadow-lg">
            <span className="text-primary-950 font-black text-xl">PE</span>
          </div>
          <h1 className="text-2xl font-bold text-white">PE Platform</h1>
          <p className="text-white/50 text-sm mt-1">Private Equity Management</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Connexion</h2>
          <LoginForm />
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Accès restreint — Données confidentielles
        </p>
      </div>
    </main>
  );
}
