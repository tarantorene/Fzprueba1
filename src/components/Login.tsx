import React, { useState } from 'react';
import { motion } from 'motion/react';
import { KeyRound, CreditCard, ShieldAlert, GraduationCap, ArrowRight } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
}

export default function Login({ users, onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor complete todos los campos.');
      return;
    }

    const foundUser = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.isActive
    );

    if (!foundUser) {
      setError('Usuario no encontrado o inactivo.');
      return;
    }

    // Verify Password (simplified for prototype)
    if (foundUser.passwordHash !== password) {
      setError('Contraseña incorrecta.');
      return;
    }

    onLoginSuccess(foundUser);
  };

  const handleQuickLogin = (role: 'admin' | 'user') => {
    const targetUser = users.find((u) => u.role === role);
    if (targetUser) {
      setEmail(targetUser.email);
      setPassword(targetUser.passwordHash);
      setError('');
    }
  };

  return (
    <div id="login-screen" className="min-h-screen flex flex-col items-center justify-center bg-[#F0F2F5] px-4 py-12 sm:px-6 lg:px-8 relative">
      {/* Canvas Institutional Header Bar */}
      <div className="w-full max-w-md mb-6 flex items-center justify-center gap-3">
        <div className="h-10 w-10 bg-[#0374B5] text-white rounded-[4px] flex items-center justify-center shadow-sm">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#2D3B45] tracking-tight">Fundametz</h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="max-w-md w-full bg-white p-8 border border-[#C7CDD1] rounded-[6px] shadow-sm relative z-10"
      >
        <div className="border-b border-[#E0E0E0] pb-4 mb-6 text-center">
          <h2 className="text-xl font-bold text-[#2D3B45]">
            Iniciar Sesión
          </h2>
          <p className="text-xs text-[#556575] mt-1">
            Ingrese sus credenciales de colaborador o administrador
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-red-50 text-[#EE0606] text-xs flex items-start gap-2.5 border border-red-200 rounded-[4px]"
            >
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-[#EE0606]" />
              <span className="font-medium">{error}</span>
            </motion.div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-xs font-semibold text-[#2D3B45] mb-1.5">
                Número de Cédula (Usuario)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#556575]">
                  <CreditCard className="h-4 w-4" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="text"
                  autoComplete="off"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-[#C7CDD1] text-[#2D3B45] bg-white placeholder-slate-400 focus:outline-none focus:border-[#0374B5] focus:ring-1 focus:ring-[#0374B5] text-sm rounded-[4px] transition-colors"
                  placeholder="ej. 1715493012 o admin"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-[#2D3B45]">
                  Contraseña
                </label>
                <span className="text-[11px] text-[#0374B5] hover:underline cursor-pointer">
                  ¿Olvidó su contraseña?
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#556575]">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-[#C7CDD1] text-[#2D3B45] bg-white placeholder-slate-400 focus:outline-none focus:border-[#0374B5] focus:ring-1 focus:ring-[#0374B5] text-sm rounded-[4px] transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              id="btn-submit-login"
              type="submit"
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-[#0374B5] hover:bg-[#025a8c] active:bg-[#024a73] transition-colors rounded-[4px] cursor-pointer"
            >
              Iniciar Sesión
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* Canvas Quick Demo Credentials */}
        <div className="mt-6 pt-5 border-t border-[#E0E0E0] text-center">
          <p className="text-xs text-[#556575] font-medium mb-3">
            Acceso Rápido de Prueba (Demo)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              id="quick-login-admin"
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="flex flex-col items-center p-2.5 border border-[#C7CDD1] bg-[#F5F7F8] hover:bg-white hover:border-[#0374B5] transition-colors rounded-[4px] cursor-pointer text-center"
            >
              <span className="text-[11px] font-bold text-[#0374B5] uppercase">Rol: Administrador</span>
              <span className="text-xs font-medium text-[#2D3B45]">Cédula: admin</span>
              <span className="text-[10px] text-[#556575]">Clave: 2026</span>
            </button>
            {users.some(u => u.role === 'user') ? (
              <button
                id="quick-login-user"
                type="button"
                onClick={() => handleQuickLogin('user')}
                className="flex flex-col items-center p-2.5 border border-[#C7CDD1] bg-[#F5F7F8] hover:bg-white hover:border-[#00AC18] transition-colors rounded-[4px] cursor-pointer text-center"
              >
                <span className="text-[11px] font-bold text-[#00AC18] uppercase">Rol: Colaborador</span>
                <span className="text-xs font-medium text-[#2D3B45] truncate max-w-full">
                  Cédula: {users.find(u => u.role === 'user')?.email}
                </span>
                <span className="text-[10px] text-[#556575]">
                  Clave: {users.find(u => u.role === 'user')?.passwordHash}
                </span>
              </button>
            ) : (
              <div className="flex flex-col items-center p-2.5 border border-dashed border-[#C7CDD1] bg-[#F5F7F8] text-center rounded-[4px]">
                <span className="text-xs text-[#556575]">Colaborador</span>
                <span className="text-[10px] text-[#556575] italic">Regístralo en Admin</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-[#556575] mt-4">
            Gestión Académica y Certificaciones Fundametz
          </p>
        </div>
      </motion.div>
    </div>
  );
}
