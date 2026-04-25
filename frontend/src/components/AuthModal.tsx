import { useEffect, useState } from 'react';
import { requestLoginOtp, verifyLoginOtp } from '../api';
import type { AuthRole, AuthSession } from '../types';

export default function AuthModal({
  isOpen,
  initialRole,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  initialRole: AuthRole | null;
  onClose: () => void;
  onSuccess: (session: AuthSession) => void;
}) {
  const [role, setRole] = useState<AuthRole | null>(initialRole);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [requestNote, setRequestNote] = useState<string | null>(null);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setRole(initialRole);
    setPhoneNumber('');
    setRequestId(null);
    setOtpCode('');
    setRequestNote(null);
    setDemoOtp(null);
    setSending(false);
    setVerifying(false);
    setError(null);
  }, [initialRole, isOpen]);

  if (!isOpen) {
    return null;
  }

  const otpStep = requestId !== null;

  return (
    <div className="modal-backdrop auth-backdrop">
      <div className="modal card auth-modal">
        <div className="modal-header">
          <div>
            <span className="eyebrow">Role login</span>
            <h3>{otpStep ? 'Enter the OTP' : 'Login to BolBazaar'}</h3>
          </div>
          <button className="ghost-button" onClick={onClose}>Close</button>
        </div>

        {!otpStep && (
          <div className="role-grid">
            <button
              className={`role-card ${role === 'buyer' ? 'role-card-active' : ''}`}
              onClick={() => setRole('buyer')}
            >
              <strong>Buyer</strong>
              <span>Marketplace view with live listings, filters, and order booking.</span>
            </button>
            <button
              className={`role-card ${role === 'seller' ? 'role-card-active' : ''}`}
              onClick={() => setRole('seller')}
            >
              <strong>Seller</strong>
              <span>Seller cockpit with khata, pending orders, listings, and WhatsApp-linked stats.</span>
            </button>
          </div>
        )}

        <div className="auth-form-grid">
          {!otpStep && (
            <div>
              <label className="label">Phone number</label>
              <input
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="Enter the number you use for BolBazaar"
              />
            </div>
          )}

          {otpStep && (
            <div>
              <label className="label">OTP</label>
              <input
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
                placeholder="Enter the 6-digit code"
              />
            </div>
          )}
        </div>

        {requestNote && <div className="notice-banner">{requestNote}</div>}
        {demoOtp && (
          <div className="otp-preview">
            <span className="label">Demo OTP</span>
            <strong>{demoOtp}</strong>
          </div>
        )}
        {error && <div className="error-banner">{error}</div>}

        <div className="action-row">
          {otpStep && (
            <button
              className="ghost-button"
              onClick={() => {
                setRequestId(null);
                setOtpCode('');
                setRequestNote(null);
                setDemoOtp(null);
                setError(null);
              }}
            >
              Change number
            </button>
          )}
          {!otpStep ? (
            <button
              className="primary-button"
              disabled={sending || !role || phoneNumber.trim().length < 10}
              onClick={async () => {
                if (!role) {
                  setError('Choose buyer or seller first.');
                  return;
                }
                setSending(true);
                setError(null);
                try {
                  const response = await requestLoginOtp({
                    role,
                    phone_number: phoneNumber,
                  });
                  setRequestId(response.request_id);
                  setRequestNote(response.note || null);
                  setDemoOtp(response.demo_otp || null);
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to send OTP');
                } finally {
                  setSending(false);
                }
              }}
            >
              {sending ? 'Sending...' : 'Send OTP'}
            </button>
          ) : (
            <button
              className="primary-button"
              disabled={verifying || otpCode.trim().length < 4 || !requestId}
              onClick={async () => {
                if (!requestId) {
                  return;
                }
                setVerifying(true);
                setError(null);
                try {
                  const response = await verifyLoginOtp({
                    request_id: requestId,
                    otp_code: otpCode,
                  });
                  onSuccess(response.session);
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to verify OTP');
                } finally {
                  setVerifying(false);
                }
              }}
            >
              {verifying ? 'Verifying...' : 'Verify and continue'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
