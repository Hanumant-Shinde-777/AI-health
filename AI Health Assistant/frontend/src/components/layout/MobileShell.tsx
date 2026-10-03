import type { PropsWithChildren } from 'react'

const MobileShell = ({ children }: PropsWithChildren) => (
  <div className="relative mx-auto min-h-screen w-full max-w-[430px] overflow-x-hidden bg-background sm:border-x sm:border-border/60 sm:shadow-shell">
    {children}
  </div>
)

export default MobileShell
