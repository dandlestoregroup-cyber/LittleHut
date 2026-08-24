import { NextResponse } from 'next/server'
import {
  operatorAuthConfigured,
  operatorSessionFromRequest,
  type OperatorSession,
} from './session'

/**
 * Guards every operator endpoint. Returns either an authenticated session or
 * a response to send back. Fails closed: an unconfigured deployment is
 * treated as "no operator access", never as "open access".
 */
export function requireOperator(
  request: Request,
): { session: OperatorSession } | { response: NextResponse } {
  if (!operatorAuthConfigured()) {
    return {
      response: NextResponse.json(
        {
          error:
            'Operator access is not configured on this deployment. Set OPS_ACCESS_KEY.',
          code: 'ops_not_configured',
        },
        { status: 503 },
      ),
    }
  }

  const session = operatorSessionFromRequest(request)
  if (!session) {
    return {
      response: NextResponse.json(
        { error: 'Operator sign-in required.', code: 'ops_unauthorized' },
        { status: 401 },
      ),
    }
  }

  return { session }
}
