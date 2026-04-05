import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { getIdempotencyKey } from '../utils/idempotency';

interface RecordModalProps {
  record?: any;
  onClose: () => void;
  onSuccess: () => void;
}

const RecordModal: React.FC<RecordModalProps> = ({ record, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (record) {
      setFormData({
        amount: record.amount.toString(),
        type: record.type,
        category: record.category,
        date: new Date(record.date).toISOString().split('T')[0],
        notes: record.notes || ''
      });
    }
  }, [record]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (record) {
        await axiosInstance.patch(`/records/${record.id}`, {
          ...formData,
          amount: parseFloat(formData.amount),
          updated_at: record.updated_at
        });
      } else {
        await axiosInstance.post('/records', 
          { ...formData, amount: parseFloat(formData.amount) },
          { headers: { 'Idempotency-Key': getIdempotencyKey() } }
        );
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save record. Check for concurrency conflicts.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card" style={{ width: '500px', position: 'relative' }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', color: '#64748b' }}
        >
          <X size={24} />
        </button>
        
        <h2 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>{record ? 'Edit Record' : 'New Financial Record'}</h2>

        {error && <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Amount ($)</label>
              <input 
                type="number" 
                step="0.01" 
                className="input" 
                value={formData.amount} 
                onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                required 
              />
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Type</label>
              <select 
                className="input" 
                value={formData.type} 
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Category</label>
            <input 
              type="text" 
              className="input" 
              value={formData.category} 
              onChange={(e) => setFormData({...formData, category: e.target.value})} 
              required 
              placeholder="e.g., Grocery, Rent, Salary"
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Date</label>
            <input 
              type="date" 
              className="input" 
              value={formData.date} 
              onChange={(e) => setFormData({...formData, date: e.target.value})} 
              required 
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Notes (Optional)</label>
            <textarea 
              className="input" 
              rows={3} 
              value={formData.notes} 
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              style={{ resize: 'none' }}
            ></textarea>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn" style={{ background: '#f1f5f9' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordModal;