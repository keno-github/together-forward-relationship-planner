import React, { useState, useEffect } from 'react';
import { X, Link2, Mail, Copy, Check, Send, Users, AlertCircle } from 'lucide-react';
import { createDreamShareInvite, getDreamShareInfo, revokeDreamShare, sendPartnerInviteEmail } from '../../services/supabaseService';
import { useAuth } from '../../context/AuthContext';

/**
 * ShareDreamModal - Modal for sharing a dream with a partner
 * Supports both email invites and shareable link/code
 */
const ShareDreamModal = ({ isOpen, onClose, roadmap }) => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('link'); // 'link' or 'email'
  const [shareCode, setShareCode] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingShares, setExistingShares] = useState([]);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (isOpen && roadmap?.id) {
      loadExistingShares();
    }
  }, [isOpen, roadmap?.id]);

  const loadExistingShares = async () => {
    const { data } = await getDreamShareInfo(roadmap.id);
    if (data) {
      setExistingShares(data);
      // If there's an active share link, use that code
      const activeShare = data.find(s => s.status === 'pending' && s.share_code);
      if (activeShare) {
        setShareCode(activeShare.share_code);
        setShareLink(`${window.location.origin}/invite/${activeShare.share_code}`);
      }
    }
  };

  const generateShareLink = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: shareError } = await createDreamShareInvite(roadmap.id);

      if (shareError) throw shareError;

      setShareCode(data.share_code);
      setShareLink(`${window.location.origin}/invite/${data.share_code}`);
      setSuccess('Share link generated!');

      // Refresh existing shares
      loadExistingShares();
    } catch (err) {
      setError(err.message || 'Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const sendEmailInvite = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const personalMessage = message || `I'd like to share "${roadmap.title}" with you!`;

      const { data, error: shareError } = await createDreamShareInvite(
        roadmap.id,
        email,
        personalMessage
      );

      if (shareError) throw shareError;

      // Now actually send the email!
      setSendingEmail(true);
      const inviterName = profile?.full_name || profile?.display_name || user?.email?.split('@')[0] || 'Your partner';

      const { error: emailError } = await sendPartnerInviteEmail(email, {
        inviterName,
        dreamTitle: roadmap.title,
        message: personalMessage,
        shareCode: data.share_code
      });

      setSendingEmail(false);

      if (emailError) {
        // Invite was created, but email failed - show partial success
        console.error('Email send failed:', emailError);
        setSuccess(`Invite created! Email couldn't be sent, but you can share this code: ${data.share_code}`);
      } else {
        setSuccess(`Invitation sent to ${email}!`);
      }

      setEmail('');
      setMessage('');

      // Refresh existing shares
      loadExistingShares();
    } catch (err) {
      setError(err.message || 'Failed to send invite');
    } finally {
      setLoading(false);
      setSendingEmail(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleRevoke = async (shareId) => {
    const { error } = await revokeDreamShare(shareId);
    if (!error) {
      loadExistingShares();
      // If we revoked the current share code, clear it
      const revokedShare = existingShares.find(s => s.id === shareId);
      if (revokedShare?.share_code === shareCode) {
        setShareCode('');
        setShareLink('');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-800">Share Dream</h2>
              <p className="text-sm text-stone-500">{roadmap?.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="flex gap-2 p-1 bg-stone-100 rounded-xl">
            <button
              onClick={() => setActiveTab('link')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'link'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Link2 className="w-4 h-4" />
              Share Link
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'email'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email Invite
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-sm">
              <Check className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {activeTab === 'link' ? (
            <div className="space-y-4">
              <p className="text-sm text-stone-600">
                Generate a shareable link that your partner can use to join this dream.
              </p>

              {shareLink ? (
                <div className="space-y-3">
                  {/* Share Link */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-stone-50 border border-stone-200 rounded-xl font-mono text-sm text-stone-700 truncate">
                      {shareLink}
                    </div>
                    <button
                      onClick={() => copyToClipboard(shareLink)}
                      className={`p-3 rounded-xl transition-all ${
                        copied
                          ? 'bg-green-500 text-white'
                          : 'bg-stone-900 text-white hover:bg-stone-800'
                      }`}
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Share Code (for manual entry) */}
                  <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div>
                      <p className="text-xs text-amber-700 font-medium uppercase tracking-wide">Share Code</p>
                      <p className="text-2xl font-bold text-amber-900 tracking-widest mt-1">{shareCode}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(shareCode)}
                      className="p-2 hover:bg-amber-100 rounded-lg transition-colors text-amber-700"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-xs text-stone-500 text-center">
                    This link expires in 7 days. Your partner needs an account to join.
                  </p>
                </div>
              ) : (
                <button
                  onClick={generateShareLink}
                  disabled={loading}
                  className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Link2 className="w-5 h-5" />
                      Generate Share Link
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-stone-600">
                Send an invite directly to your partner's email address.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Partner's Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@email.com"
                    className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Personal Message (optional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add a personal note..."
                    rows={3}
                    className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  />
                </div>

                <button
                  onClick={sendEmailInvite}
                  disabled={loading || !email}
                  className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {sendingEmail ? 'Sending email...' : 'Creating invite...'}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Invite
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Existing Shares */}
          {existingShares.length > 0 && (
            <div className="mt-6 pt-6 border-t border-stone-200">
              <h3 className="text-sm font-medium text-stone-700 mb-3">Pending Invites</h3>
              <div className="space-y-2">
                {existingShares.filter(s => s.status === 'pending').map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 bg-stone-50 rounded-xl"
                  >
                    <div>
                      <p className="text-sm text-stone-700">
                        {share.invited_email || `Code: ${share.share_code}`}
                      </p>
                      <p className="text-xs text-stone-500">
                        Expires {new Date(share.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevoke(share.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareDreamModal;
