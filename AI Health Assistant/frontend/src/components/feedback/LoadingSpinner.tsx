interface LoadingSpinnerProps {
  size?: number
  className?: string
}

const LoadingSpinner = ({ size = 24, className = '' }: LoadingSpinnerProps) => (
  <div className={`flex items-center justify-center ${className}`} role="status">
    <span
      className="spinner block animate-spin rounded-full text-primary [animation-duration:0.8s]"
      style={{
        width: size,
        height: size,
        background: 'conic-gradient(from 90deg, transparent 0deg, currentColor 300deg, transparent 360deg)',
        WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${Math.max(2, Math.round(size / 8))}px), #000 0)`,
        mask: `radial-gradient(farthest-side, transparent calc(100% - ${Math.max(2, Math.round(size / 8))}px), #000 0)`,
      }}
    />
    <span className="sr-only">Loading</span>
  </div>
)

export default LoadingSpinner
