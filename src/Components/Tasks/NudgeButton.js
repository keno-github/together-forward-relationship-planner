import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Send, Smile, Heart, AlertCircle } from 'lucide-react';
import { sendNudge } from '../../services/supabaseService';

/**
 * NudgeButton - Send friendly reminders to partner about tasks
 */
const NudgeButton = ({ task, recipientId, recipientName, onNudgeSent }) => {
  const [showModal, setShowModal] = useState(false);
  const [nudgeType, setNudgeType] = useState('gentle');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const nudgeTypes = [
    {
      id: 'gentle',
      label: 'Gentle',
      icon: Smile,
      color: '#7d8c75',
      description: 'A soft reminder',
      defaultMessage: "Hey, just checking in on this when you get a chance!"
    },
    {
      id: 'friendly',
      label: 'Friendly',
      icon: Heart,
      color: '#c49a6c',
      description: 'A warm nudge',
      defaultMessage: "Would love to make progress on this together!"
    },
    {
      id: 'urgent',
      label: 'Urgent',
      icon: AlertCircle,
      color: '#c76b6b',
      description: 'Time-sensitive',
      defaultMessage: "This is coming up soon - can we tackle it today?"
    }
  ];

  const handleSend = async () => {
    if (!recipientId) return;

    setSending(true);
    try {
      const selectedType = nudgeTypes.find(t => t.id === nudgeType);
      const finalMessage = message.trim() || selectedType?.defaultMessage || '';

      const { error } = await sendNudge(task.id, recipientId, finalMessage, nudgeType);

      if (!error) {
        setSent(true);
        onNudgeSent?.();
        setTimeout(() => {
          setShowModal(false);
          setSent(false);
          setMessage('');
          setNudgeType('gentle');
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to send nudge:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="p-1.5 rounded-lg hover:bg-amber-50 transition-colors group"
        title={`Nudge ${recipientName}`}
      >
        <Bell className="w-4 h-4 text-stone-400 group-hover:text-amber-600 transition-colors" />
      </button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
              style={{ background: '#faf8f5' }}
            >
              {/* Header */}
              <div className="px-6 py-4 flex items-center justify-between" style={{ background: '#fff', borderBottom: '1px solid #e8e4de' }}>
                <div>
                  <h3 className="font-semibold text-lg" style={{ color: '#2d2926' }}>
                    Nudge {recipientName}
                  </h3>
                  <p className="text-sm" style={{ color: '#6b635b' }}>
                    About: {task.title}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <X className="w-5 h-5" style={{ color: '#6b635b' }} />
                </button>
              </div>

              {sent ? (
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ background: 'rgba(125, 140, 117, 0.15)' }}
                  >
                    <Bell className="w-8 h-8" style={{ color: '#7d8c75' }} />
                  </motion.div>
                  <p className="font-medium" style={{ color: '#2d2926' }}>
                    Nudge sent to {recipientName}!
                  </p>
                </div>
              ) : (
                <div className="p-6 space-y-5">
                  {/* Nudge Type Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: '#2d2926' }}>
                      Nudge Style
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {nudgeTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = nudgeType === type.id;
                        return (
                          <button
                            key={type.id}
                            onClick={() => setNudgeType(type.id)}
                            className={`p-3 rounded-xl text-center transition-all ${isSelected ? 'ring-2' : ''}`}
                            style={{
                              background: isSelected ? `${type.color}15` : '#fff',
                              border: `1px solid ${isSelected ? type.color : '#e8e4de'}`,
                              ringColor: type.color
                            }}
                          >
                            <Icon
                              className="w-5 h-5 mx-auto mb-1"
                              style={{ color: isSelected ? type.color : '#6b635b' }}
                            />
                            <span
                              className="text-sm font-medium block"
                              style={{ color: isSelected ? type.color : '#2d2926' }}
                            >
                              {type.label}
                            </span>
                            <span className="text-xs" style={{ color: '#6b635b' }}>
                              {type.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Message */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#2d2926' }}>
                      Add a message (optional)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={nudgeTypes.find(t => t.id === nudgeType)?.defaultMessage}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none focus:ring-2"
                      style={{ border: '1px solid #e8e4de', focusRing: '#c49a6c' }}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSend}
                      disabled={sending}
                      className="flex-1 py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      style={{ background: '#2d2926' }}
                    >
                      {sending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Nudge
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-5 py-3 rounded-xl font-medium transition-colors"
                      style={{ background: '#f5f2ed', color: '#6b635b' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NudgeButton;
