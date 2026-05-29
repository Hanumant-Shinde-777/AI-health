import { PrismaClient } from '@prisma/client'
import { assertDatabaseConfigured } from '../utils/prismaErrors.js'

assertDatabaseConfigured()

/** Reuse one client across node --watch reloads to avoid pool exhaustion (P2024). */
const globalForPrisma = globalThis

const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma
}

if (!globalForPrisma.__prismaDisconnectRegistered) {
  globalForPrisma.__prismaDisconnectRegistered = true
  const disconnect = async () => {
    await prisma.$disconnect()
  }
  process.on('SIGINT', () => {
    void disconnect().finally(() => process.exit(0))
  })
  process.on('SIGTERM', () => {
    void disconnect().finally(() => process.exit(0))
  })
  process.on('beforeExit', () => {
    void disconnect()
  })
}

export default prisma
