'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { X, Send, GripVertical } from 'lucide-react';

interface WhatsAppWidgetProps {
  whatsappNumber?: string;
  contactPhone?: string;
}

export function WhatsAppWidget({ whatsappNumber, contactPhone }: WhatsAppWidgetProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [hasOpened, setHasOpened] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Dragging State
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });
  const hasMovedRef = useRef(false);

  // Clean WhatsApp number from Site Identity or contactPhone
  const rawTarget = whatsappNumber || contactPhone || '01799775487';
  let cleanNumber = rawTarget.replace(/[^0-9]/g, '');
  if (cleanNumber.length === 11 && cleanNumber.startsWith('01')) {
    cleanNumber = '880' + cleanNumber.substring(1);
  } else if (cleanNumber.length === 10 && cleanNumber.startsWith('1')) {
    cleanNumber = '880' + cleanNumber;
  }
  if (!cleanNumber) cleanNumber = '8801799775487';

  // Toggle Widget open state
  const handleToggle = () => {
    if (!isOpen) {
      setIsOpen(true);
      setUnreadCount(0);
      if (!hasOpened) {
        setHasOpened(true);
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
        }, 1200);
      }
    } else {
      setIsOpen(false);
    }
  };

  // Drag Event Handlers
  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const deltaX = clientX - dragStartRef.current.startX;
    const deltaY = clientY - dragStartRef.current.startY;

    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      hasMovedRef.current = true;
    }

    setPosition({
      x: dragStartRef.current.initialX + deltaX,
      y: dragStartRef.current.initialY + deltaY,
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleDragMove(e.clientX, e.clientY);
      }
    };
    const onMouseUp = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) {
        handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging]);

  // Do not render on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  // Format current time e.g. "02:50 PM"
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = message.trim() || 'Hello, I have a question about Falak Closet products.';
    const encodedText = encodeURIComponent(textToSend);
    const waUrl = `https://wa.me/${cleanNumber}?text=${encodedText}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setMessage('');
  };

  return (
    <div
      className="hidden lg:block fixed z-[998] transition-transform duration-75"
      style={{
        bottom: '80px',
        right: '24px',
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      {/* WhatsApp Chat Popup Box */}
      {isOpen && (
        <div
          className="absolute bottom-16 right-0 w-[calc(100vw-2rem)] max-w-[340px] sm:max-w-[360px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200/80 animate-in fade-in slide-in-from-bottom-5 duration-200 font-sans z-[999]"
          style={{ boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.25)' }}
        >
          {/* Header (also acts as drag handle) */}
          <div
            onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
            onTouchStart={(e) => e.touches[0] && handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
            className="bg-[#075E54] text-white p-4 flex items-center justify-between relative overflow-hidden select-none cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-3 relative z-10">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center p-2 border border-white/20">
                  <svg className="w-full h-full fill-white" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#075E54] rounded-full" />
              </div>
              <div>
                <h4 className="font-bold text-sm tracking-wide leading-none flex items-center gap-1">
                  <span>WhatsApp Chat</span>
                  <GripVertical className="w-3.5 h-3.5 opacity-60 ml-0.5" />
                </h4>
                <span className="text-[11px] text-emerald-100 font-medium tracking-wide">Online • Drag to move</span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white/80 hover:text-white"
              aria-label="Close WhatsApp chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Body */}
          <div
            className="p-4 min-h-[160px] max-h-[220px] overflow-y-auto space-y-3"
            style={{
              backgroundColor: '#ECE5DD',
              backgroundImage:
                'radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)',
              backgroundSize: '12px 12px',
            }}
          >
            {isTyping ? (
              <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-xs shadow-xs inline-flex items-center gap-1.5 text-stone-500 text-xs font-medium border border-stone-100">
                <span className="text-stone-400">Falak Closet typing</span>
                <span className="inline-flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                </span>
              </div>
            ) : (
              <div className="bg-white p-3.5 rounded-2xl rounded-tl-xs shadow-xs space-y-1.5 max-w-[88%] border border-stone-200/60 animate-in fade-in duration-200">
                <p className="text-xs text-stone-800 leading-relaxed font-medium">
                  Hello sir or mam! How can we help you?
                </p>
                <div className="text-[10px] text-stone-400 text-right font-sans">
                  {getCurrentTime()}
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input & Send Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-stone-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message"
              className="flex-1 bg-stone-100 hover:bg-stone-100/80 focus:bg-white text-stone-800 text-xs px-3.5 py-2.5 rounded-full border border-transparent focus:border-stone-300 outline-none transition-all placeholder:text-stone-400"
            />
            <button
              type="submit"
              className="w-9 h-9 rounded-full bg-[#128C7E] hover:bg-[#075E54] active:scale-90 text-white flex items-center justify-center transition-all shadow-xs shrink-0 cursor-pointer"
              aria-label="Send message to WhatsApp"
            >
              <Send className="w-4 h-4 translate-x-0.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        type="button"
        onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
        onTouchStart={(e) => e.touches[0] && handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
        onClick={() => {
          if (!hasMovedRef.current) {
            handleToggle();
          }
        }}
        className={`w-13 h-13 rounded-full bg-[#25D366] hover:bg-[#20ba5a] active:scale-95 text-white flex items-center justify-center shadow-xl transition-all duration-150 select-none ${
          isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab hover:scale-105'
        } ${isOpen ? 'scale-90 opacity-90' : ''}`}
        aria-label="Open WhatsApp chat"
      >
        {/* Unread Badge */}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-bounce">
            1
          </span>
        )}

        <svg className="w-7 h-7 fill-white drop-shadow-xs pointer-events-none" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      </button>
    </div>
  );
}
