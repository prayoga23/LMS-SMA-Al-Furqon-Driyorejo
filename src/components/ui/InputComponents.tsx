'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LucideIcon, X, Search, Check, ChevronDown, User } from 'lucide-react';

/* ─── TEXT INPUT ─── */
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  icon?: LucideIcon;
  helperText?: string;
  error?: string;
  onClear?: () => void;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  required,
  icon: Icon,
  helperText,
  error,
  onClear,
  className = '',
  value,
  disabled,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
          {label}
          {required && <span className="text-rose-500 ml-0.5 font-bold">*</span>}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          value={value}
          disabled={disabled}
          className={`w-full h-11 text-sm text-slate-900 placeholder-slate-400 font-medium bg-white border border-slate-200 rounded-xl transition-all duration-150 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-50 disabled:bg-slate-50 ${
            Icon ? 'pl-10' : 'pl-3.5'
          } ${onClear && value ? 'pr-9' : 'pr-3.5'} ${
            error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : ''
          } ${className}`}
          {...props}
        />
        {onClear && value && !disabled && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>
      )}
      {!error && helperText && (
        <p className="mt-1.5 text-xs text-slate-400">{helperText}</p>
      )}
    </div>
  );
};

/* ─── SELECT ─── */
interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  required?: boolean;
  icon?: LucideIcon;
  helperText?: string;
  error?: string;
  children: React.ReactNode;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  required,
  icon: Icon,
  helperText,
  error,
  children,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
          {label}
          {required && <span className="text-rose-500 ml-0.5 font-bold">*</span>}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <select
          disabled={disabled}
          className={`w-full h-11 text-sm text-slate-900 font-medium bg-white border border-slate-200 rounded-xl transition-all duration-150 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-50 disabled:bg-slate-50 appearance-none cursor-pointer ${
            Icon ? 'pl-10' : 'pl-3.5'
          } pr-9 ${
            error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : ''
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="mt-1 text-[11px] text-rose-600 font-medium">{error}</p>
      )}
      {!error && helperText && (
        <p className="mt-1 text-[11px] text-slate-400">{helperText}</p>
      )}
    </div>
  );
};

/* ─── TEXTAREA ─── */
interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  required?: boolean;
  icon?: LucideIcon;
  helperText?: string;
  error?: string;
  maxLength?: number;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  required,
  icon: Icon,
  helperText,
  error,
  maxLength,
  className = '',
  value,
  ...props
}) => {
  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            {label}
            {required && <span className="text-rose-500 ml-0.5 font-bold">*</span>}
          </label>
          {maxLength && (
            <span className={`text-[10px] font-mono tabular-nums ${currentLength > maxLength ? 'text-rose-500' : 'text-slate-400'}`}>
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-emerald-600 transition-colors pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <textarea
          value={value}
          maxLength={maxLength}
          className={`w-full text-sm text-slate-900 placeholder-slate-400 font-medium bg-white border border-slate-200 rounded-xl py-2.5 transition-all duration-150 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 custom-scrollbar resize-none ${
            Icon ? 'pl-10' : 'pl-3.5'
          } pr-3.5 ${
            error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : ''
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>
      )}
      {!error && helperText && (
        <p className="mt-1.5 text-xs text-slate-400">{helperText}</p>
      )}
    </div>
  );
};

/* ─── SEARCHABLE STUDENT COMBOBOX ─── */
export interface StudentOption {
  id: number;
  nis: string;
  name: string;
  class?: string;
}

interface FormStudentComboboxProps {
  label?: string;
  required?: boolean;
  students: StudentOption[];
  value: string | number;
  onChange: (studentId: string) => void;
  error?: string;
  placeholder?: string;
}

export const FormStudentCombobox: React.FC<FormStudentComboboxProps> = ({
  label = 'Pilih Siswa',
  required,
  students,
  value,
  onChange,
  error,
  placeholder = 'Cari nama atau NIS siswa...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedStudent = students.find((s) => String(s.id) === String(value));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.class && s.class.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelect = (studentId: number) => {
    onChange(String(studentId));
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wide">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Main Field Button / Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className={`w-full h-11 text-sm text-left bg-white border border-slate-200 rounded-xl pl-10 pr-9 flex items-center justify-between transition-all duration-150 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 ${
            error ? 'border-rose-400 focus:ring-rose-500/10' : ''
          }`}
        >
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

          {selectedStudent ? (
            <span className="font-semibold text-slate-900 truncate">
              {selectedStudent.name}{' '}
              <span className="font-normal text-slate-500">
                — {selectedStudent.class || 'Siswa'} (NIS: {selectedStudent.nis})
              </span>
            </span>
          ) : (
            <span className="text-slate-400 font-medium">{placeholder}</span>
          )}

          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown Menu Overlay */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
          {/* Inner Search Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik Nama, Kelas, atau NIS..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-slate-900 placeholder-slate-400 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Student List */}
          <div className="max-h-56 overflow-y-auto custom-scrollbar p-1 divide-y divide-slate-50">
            {filteredStudents.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 font-medium">
                Tidak ada siswa yang cocok dengan "{searchQuery}"
              </div>
            ) : (
              filteredStudents.map((s) => {
                const isSelected = String(s.id) === String(value);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelect(s.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-950 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-xs font-bold text-slate-900 truncate">{s.name}</span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {s.class || 'Siswa'} • NIS: <span className="font-mono text-emerald-700">{s.nis}</span>
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-[11px] text-rose-600 font-medium">{error}</p>}
    </div>
  );
};
