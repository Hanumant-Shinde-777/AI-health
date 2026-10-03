import type { ReactNode } from 'react'
import { Bot, UserRound } from 'lucide-react'
import { classNames } from '@/utils'

interface ChatBubbleProps {
  from: 'ai' | 'user'
  children: ReactNode
  className?: string
}

/** Chat-style message row: AI on the left with an avatar, patient on the right. */
const ChatBubble = ({ from, children, className }: ChatBubbleProps) => {
  const isAi = from === 'ai'
  return (
    <div className={classNames('flex items-end gap-2', isAi ? '' : 'flex-row-reverse', className)}>
      <div
        aria-hidden
        className={classNames(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isAi ? 'bg-gradient-primary text-white shadow-primary-glow' : 'bg-surface text-muted ring-1 ring-border',
        )}
      >
        {isAi ? <Bot size={16} /> : <UserRound size={16} />}
      </div>
      <div
        className={classNames(
          'max-w-[82%] px-4 py-2.5 text-[15px] leading-relaxed',
          isAi
            ? 'rounded-2xl rounded-bl-md border border-border/70 bg-card text-foreground shadow-card'
            : 'rounded-2xl rounded-br-md bg-gradient-primary text-white shadow-[0_4px_14px_rgb(var(--c-primary)/0.3)]',
        )}
      >
        {children}
      </div>
    </div>
  )
}

export default ChatBubble
