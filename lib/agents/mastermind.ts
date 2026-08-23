import { nextBestAction as momentsNextBestAction } from './momentsAgent'
import type { AgentContext, JourneyState, NextBestAction } from './types'

/**
 * Mastermind Agent — the top-level router. It preserves *why* an action was
 * chosen (every NextBestAction carries a `reason`), and it is the single
 * place that can disable the entire agent layer without touching the
 * underlying domain services in `lib/stayza`, satisfying the failure-mode
 * requirement: Little Hut must keep booking, availability and activation
 * working with the AI layer switched off.
 */
export function agentsEnabled(): boolean {
  const flag = process.env.AGENTS_ENABLED
  if (flag === undefined) return true
  return flag !== '0' && flag.toLowerCase() !== 'false'
}

export async function route(
  context: AgentContext,
  state: JourneyState,
): Promise<NextBestAction> {
  if (!agentsEnabled()) {
    return {
      action: 'wait',
      reason:
        'The agent layer is currently disabled; core booking, availability and activation workflows continue to operate normally.',
      owner: 'system',
      priority: 'low',
      requiresHumanApproval: false,
    }
  }
  return momentsNextBestAction(context, state)
}
