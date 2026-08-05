import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-card section-card" style={{ padding: '40px', margin: '24px 0', borderColor: 'var(--accent-rose)' }} role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <AlertCircle size={28} color="var(--accent-rose)" aria-hidden="true" />
            <h2 style={{ fontSize: '1.3rem', color: 'var(--accent-rose)', fontWeight: '800' }}>
              Something went wrong while rendering this section
            </h2>
          </div>

          <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.95rem' }}>
            {this.state.error?.message || 'An unexpected component error occurred.'}
          </p>

          <button 
            onClick={this.handleReset}
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <RotateCcw size={16} aria-hidden="true" /> Reload Component
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node
};
