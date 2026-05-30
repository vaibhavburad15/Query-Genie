// src/components/auth/SignupForm.tsx
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff, Loader2, Mail, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/services/apiClient';

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

const SignupForm = ({ onSwitchToLogin }: SignupFormProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const { signup, isLoading } = useAuth();
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (!/^[A-Za-z]+$/.test(formData.firstName)) {
      newErrors.firstName = 'Must contain only letters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (!/^[A-Za-z]+$/.test(formData.lastName)) {
      newErrors.lastName = 'Must contain only letters';
    }

    if (!formData.gender) newErrors.gender = 'Please select a gender';

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Must be a valid email address';
    }

    // BUG-007 FIX: Strong password validation (matches backend)
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 12) {
      newErrors.password = 'Password must be at least 12 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    } else if (!/[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\|/~`]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (otpSent && !formData.otp) {
      newErrors.otp = 'OTP is required';
    } else if (otpSent && !/^\d{6}$/.test(formData.otp)) {
      newErrors.otp = 'OTP must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSendOtp = async () => {
    if (errors.email || !formData.email.trim()) {
      setErrors((prev) => ({ ...prev, email: 'Must be a valid email address' }));
      return;
    }
    setIsSendingOtp(true);
    try {
      const res = await apiFetch('/api/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        toast({ title: 'OTP Sent!', description: 'Please check your email for the verification code.' });
      } else {
        toast({ variant: 'destructive', title: 'Failed to Send OTP', description: data.detail || 'An unexpected error occurred.' });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to Send OTP', description: error?.message || 'An unexpected error occurred.' });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const success = await signup({
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        email: formData.email,
        password: formData.password,
        otp: formData.otp,
        username: formData.email.split('@')[0],
      });
      if (success) {
        toast({ title: 'Account created!', description: 'Welcome! You have been automatically signed in.' });
      } else {
        toast({ variant: 'destructive', title: 'Signup failed', description: 'Please try again.' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred. Please try again.' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-label">First Name</Label>
            <Input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="Enter first name"
              className={`focus-brand ${errors.firstName ? 'border-destructive' : ''}`}
              disabled={isLoading}
            />
            {errors.firstName && <p className="text-sm text-destructive animate-in">{errors.firstName}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-label">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Enter last name"
              className={`focus-brand ${errors.lastName ? 'border-destructive' : ''}`}
              disabled={isLoading}
            />
            {errors.lastName && <p className="text-sm text-destructive animate-in">{errors.lastName}</p>}
          </div>
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label htmlFor="gender" className="text-label">Gender</Label>
          <Select value={formData.gender} onValueChange={(v) => handleInputChange('gender', v)} disabled={isLoading}>
            <SelectTrigger className={`focus-brand ${errors.gender ? 'border-destructive' : ''}`}>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Non-binary">Non-binary</SelectItem>
              <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && <p className="text-sm text-destructive animate-in">{errors.gender}</p>}
        </div>

        {/* Email + OTP trigger */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-label">Email</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email"
              className={`focus-brand pr-20 ${errors.email ? 'border-destructive' : ''}`}
              disabled={isLoading || otpSent}
            />
            {!otpSent && (
              <button
                type="button"
                onClick={handleSendOtp}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                disabled={isSendingOtp || isLoading || !!errors.email}
              >
                {isSendingOtp ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Sending...</span></>
                ) : (
                  <><Mail size={16} /><span className="text-sm">Get OTP</span></>
                )}
              </button>
            )}
          </div>
          {errors.email && <p className="text-sm text-destructive animate-in">{errors.email}</p>}
        </div>

        {/* OTP */}
        {otpSent && (
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-label">Verification Code (OTP)</Label>
            <Input
              id="otp"
              type="text"
              value={formData.otp}
              onChange={(e) => handleInputChange('otp', e.target.value)}
              placeholder="Enter 6-digit OTP"
              className={`focus-brand ${errors.otp ? 'border-destructive' : ''}`}
              disabled={isLoading}
            />
            {errors.otp && <p className="text-sm text-destructive animate-in">{errors.otp}</p>}
          </div>
        )}

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-label">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Enter password"
              className={`focus-brand pr-12 ${errors.password ? 'border-destructive' : ''}`}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-sm text-destructive animate-in">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-label">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="Confirm password"
              className={`focus-brand pr-12 ${errors.confirmPassword ? 'border-destructive' : ''}`}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={isLoading}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-sm text-destructive animate-in">{errors.confirmPassword}</p>}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full gradient-brand hover:shadow-brand transition-all duration-200"
        disabled={isLoading || !otpSent}
      >
        {isLoading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating Account...</>
        ) : (
          <><UserPlus className="w-4 h-4 mr-2" />Create Account</>
        )}
      </Button>

      <div className="text-center">
        <p className="text-caption">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-brand-600 hover:text-brand-700 font-medium transition-colors"
            disabled={isLoading}
          >
            Sign In
          </button>
        </p>
      </div>
    </form>
  );
};

export default SignupForm;