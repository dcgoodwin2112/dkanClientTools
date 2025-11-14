/**
 * Fixture Version Tracker
 *
 * Tracks fixture recording metadata and provides version information.
 * Helps detect when fixtures become outdated and need regeneration.
 */

import { fixtureLoader } from './FixtureLoader'

export interface FixtureVersion {
  timestamp: string
  ageDays: number
  totalMethods: number
  recorded: number
  skipped: number
  errors: number
  baseUrl: string
  duration: number
  isOutdated: boolean
}

/**
 * Get current fixture version information
 */
export function getFixtureVersion(): FixtureVersion {
  const version = fixtureLoader.getVersion()
  const ageDays = fixtureLoader.getAgeInDays()
  const isOutdated = fixtureLoader.isOutdated(30)

  return {
    timestamp: version.timestamp,
    ageDays: Math.round(ageDays * 10) / 10, // Round to 1 decimal
    totalMethods: version.totalMethods,
    recorded: version.recorded,
    skipped: version.skipped,
    errors: version.errors,
    baseUrl: version.baseUrl,
    duration: version.duration,
    isOutdated,
  }
}

/**
 * Format fixture age as human-readable string
 */
export function getFixtureAgeString(): string {
  const ageDays = fixtureLoader.getAgeInDays()

  if (ageDays < 1) {
    const hours = Math.round(ageDays * 24)
    return `${hours} hour${hours !== 1 ? 's' : ''} old`
  }

  if (ageDays < 7) {
    const days = Math.round(ageDays)
    return `${days} day${days !== 1 ? 's' : ''} old`
  }

  if (ageDays < 30) {
    const weeks = Math.round(ageDays / 7)
    return `${weeks} week${weeks !== 1 ? 's' : ''} old`
  }

  const months = Math.round(ageDays / 30)
  return `${months} month${months !== 1 ? 's' : ''} old`
}

/**
 * Get warning message if fixtures are outdated
 */
export function getOutdatedWarning(): string | null {
  const ageDays = fixtureLoader.getAgeInDays()

  if (ageDays > 90) {
    return `⚠️  Fixtures are ${Math.round(ageDays)} days old. Consider regenerating with 'npm run record:fixtures'`
  }

  if (ageDays > 30) {
    return `⚠️  Fixtures are ${Math.round(ageDays)} days old. May need regeneration soon.`
  }

  return null
}

/**
 * Print fixture version information to console
 */
export function printFixtureVersion(): void {
  const version = getFixtureVersion()
  const ageString = getFixtureAgeString()

  console.log('\n📦 Fixture Version Information:')
  console.log(`   Recorded: ${new Date(version.timestamp).toLocaleString()}`)
  console.log(`   Age: ${ageString}`)
  console.log(`   Source: ${version.baseUrl}`)
  console.log(`   Coverage: ${version.recorded}/${version.totalMethods} methods`)
  console.log(`   Skipped: ${version.skipped}`)
  console.log(`   Errors: ${version.errors}`)
  console.log(`   Duration: ${(version.duration / 1000).toFixed(1)}s`)

  const warning = getOutdatedWarning()
  if (warning) {
    console.log(`\n${warning}`)
  }
}
