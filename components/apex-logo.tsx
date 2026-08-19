export function ApexLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2 3 21h4.2l4.8-10.6L16.8 21H21L12 2Z"
        fill="currentColor"
      />
      <path d="M12 12.5 9.4 18h5.2L12 12.5Z" fill="var(--accent)" />
    </svg>
  )
}
