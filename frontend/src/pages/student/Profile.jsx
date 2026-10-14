import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { studentAPI, uploadAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Camera, Mail, Phone, MapPin, Award, UserCheck, Bus, Building, Shield } from 'lucide-react';

export default function StudentProfile() {
  const { user, profile, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(profile);
  const fileInputRef = useRef(null);

  const activeStudent = currentProfile || profile;
  const regNo = activeStudent?.regNo || activeStudent?.registrationNumber || '—';

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    setUploading(true);
    try {
      const uploadRes = await uploadAPI.uploadFile(file);
      const photoUrl = uploadRes.data?.data?.url;
      if (photoUrl) {
        const updateRes = await studentAPI.updateProfile({ photoUrl });
        setCurrentProfile(updateRes.data?.data);
        if (updateUser) {
          updateUser({ profile: updateRes.data?.data });
        }
        toast.success('Profile photo updated successfully!');
      } else {
        toast.error('Upload succeeded but no photo URL was returned.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Your personal, academic, and institutional identity</p>
      </div>

      {/* Hero Profile Card */}
      <div className="card" style={{ marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '80px',
          background: 'linear-gradient(135deg, var(--brand) 0%, #4338ca 100%)', opacity: 0.9
        }} />
        
        <div style={{ position: 'relative', paddingTop: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '96px', height: '96px', borderRadius: '50%',
                  background: 'var(--surface-raised)', border: '4px solid var(--surface-raised)',
                  boxShadow: 'var(--shadow-md)', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', fontWeight: 800, color: 'var(--brand)'
                }}>
                  {activeStudent?.photoUrl ? (
                    <img
                      src={activeStudent.photoUrl}
                      alt={activeStudent.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    activeStudent?.name?.charAt(0).toUpperCase() || '?'
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Change profile photo"
                  style={{
                    position: 'absolute', bottom: 2, right: 2,
                    background: 'var(--brand)', color: '#fff',
                    borderRadius: '50%', width: '30px', height: '30px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #fff', cursor: 'pointer', boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <Camera size={14} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoUpload}
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                    {activeStudent?.name || 'Student'}
                  </h2>
                  <span className="badge badge-info" style={{ fontSize: '0.85rem', padding: '4px 10px', fontWeight: 700, letterSpacing: '0.5px' }}>
                    {regNo}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0 0', color: 'var(--ink-muted)', fontSize: 'var(--text-sm)' }}>
                  {activeStudent?.department || 'Department'} • Year {activeStudent?.year || '1'} • Sec {activeStudent?.section || 'A'}
                </p>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginTop: '2px' }}>
                  {activeStudent?.college || 'CampusHub Engineering College'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignSelf: 'center' }}>
              <span className="badge badge-success" style={{ textTransform: 'capitalize' }}>
                <Shield size={12} style={{ marginRight: '4px' }} />
                Active Student
              </span>
              <span className={`badge ${activeStudent?.hostelStatus === 'hosteller' ? 'badge-warning' : 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>
                {activeStudent?.hostelStatus === 'hosteller' ? 'Hosteller' : 'Day Scholar'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Profile Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        
        {/* Academic Profile */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
            <Award size={18} style={{ color: 'var(--brand)' }} />
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>Academic Details</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Register Number</div>
              <div style={{ fontWeight: 700, color: 'var(--brand)', fontFamily: 'monospace' }}>{regNo}</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Department</div>
              <div style={{ fontWeight: 600 }}>{activeStudent?.department || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Year & Semester</div>
              <div style={{ fontWeight: 600 }}>Year {activeStudent?.year || '—'} / Sem {activeStudent?.semester || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Section / Batch</div>
              <div style={{ fontWeight: 600 }}>Sec {activeStudent?.section || '—'} • {activeStudent?.batch || '2023-2027'}</div>
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
            <UserCheck size={18} style={{ color: 'var(--brand)' }} />
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>Personal Information</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Date of Birth</div>
              <div style={{ fontWeight: 600 }}>
                {activeStudent?.dateOfBirth ? new Date(activeStudent.dateOfBirth).toLocaleDateString('en-IN') : '15 Aug 2003'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Gender</div>
              <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{activeStudent?.gender || 'Male'}</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Blood Group</div>
              <div style={{ fontWeight: 600 }}>{activeStudent?.bloodGroup || 'O+'}</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Institution</div>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)' }}>{activeStudent?.college || 'CampusHub College'}</div>
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
            <Phone size={18} style={{ color: 'var(--brand)' }} />
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>Contact Information</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Email Address</div>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{user?.email || 'student@campushub.edu'}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Student Phone</div>
                <div style={{ fontWeight: 600 }}>{activeStudent?.phone || '+91 98765 43210'}</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Parent Phone</div>
                <div style={{ fontWeight: 600 }}>{activeStudent?.parentPhone || '+91 98765 00000'}</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Permanent Address</div>
              <div style={{ fontWeight: 500, fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
                {activeStudent?.address || '12/4 Campus Road, Coimbatore, Tamil Nadu - 641001'}
              </div>
            </div>
          </div>
        </div>

        {/* Accommodation / Transport */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
            {activeStudent?.hostelStatus === 'hosteller' ? (
              <Building size={18} style={{ color: 'var(--brand)' }} />
            ) : (
              <Bus size={18} style={{ color: 'var(--brand)' }} />
            )}
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>
              {activeStudent?.hostelStatus === 'hosteller' ? 'Hostel Accommodation' : 'Bus Transport Details'}
            </h3>
          </div>
          {activeStudent?.hostelStatus === 'hosteller' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Hostel Block</div>
                <div style={{ fontWeight: 600 }}>Boys Hostel Block B</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Room Number</div>
                <div style={{ fontWeight: 600 }}>Room #304 (Floor 3)</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Mess Allotment</div>
                <div style={{ fontWeight: 600 }}>South Dining Hall</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Warden Incharge</div>
                <div style={{ fontWeight: 600 }}>Dr. V. Ramanathan</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Assigned Bus</div>
                <div style={{ fontWeight: 700, color: 'var(--brand)' }}>{activeStudent?.busNumber || 'BUS-07'}</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Bus Route</div>
                <div style={{ fontWeight: 600 }}>{activeStudent?.busRoute || 'Salem Junction Express'}</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Pickup Stop</div>
                <div style={{ fontWeight: 600 }}>{activeStudent?.pickupPoint || 'Salem Junction Main Gate'}</div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Morning Pickup</div>
                <div style={{ fontWeight: 600 }}>07:45 AM</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mentor Information */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Shield size={18} style={{ color: 'var(--brand)' }} />
          <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>Faculty Mentor</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>
              {activeStudent?.mentorId?.name || 'Dr. K. Senthil Kumar'}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
              {activeStudent?.mentorId?.designation || 'Associate Professor'} • {activeStudent?.mentorId?.department || activeStudent?.department || 'Computer Science'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mail size={13} /> {activeStudent?.mentorId?.email || 'mentor.cs@campushub.edu'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Phone size={13} /> {activeStudent?.mentorId?.phone || '+91 94441 23456'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
