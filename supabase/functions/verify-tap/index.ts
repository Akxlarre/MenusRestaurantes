import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// ============================================================================
// AION Loyalty System - Tap Verification Edge Function
// ============================================================================
// Validates NFC taps (or QR scans in dev mode) and awards loyalty points
// Supports two modes:
// - DEV: QR-based testing (skips CMAC validation)
// - PROD: NTAG 424 DNA with cryptographic validation

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const NFC_MASTER_KEY = Deno.env.get('NFC_MASTER_KEY') // Hex string for NTAG 424 DNA

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================================================
// Types
// ============================================================================

interface TapRequest {
    uid: string
    counter?: number
    cmac?: string
    mode?: 'dev' | 'prod'
}

interface Device {
    id: string
    uid_hex: string
    device_type: string
    last_counter: number
    status: string
    assigned_restaurant_id: string | null
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: CORS_HEADERS })
    }

    try {
        const url = new URL(req.url)
        const params: TapRequest = {
            uid: url.searchParams.get('uid') || '',
            counter: parseInt(url.searchParams.get('counter') || '0'),
            cmac: url.searchParams.get('cmac') || '',
            mode: (url.searchParams.get('mode') as 'dev' | 'prod') || 'prod',
        }

        console.log('[verify-tap] Request:', { uid: params.uid, counter: params.counter, mode: params.mode })

        // Validate required parameters
        if (!params.uid) {
            return errorResponse('Missing required parameter: uid', 400)
        }

        // Initialize Supabase client (service role for backend operations)
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Step 1: Fetch device from database
        const { data: device, error: deviceError } = await supabase
            .from('nfc_devices')
            .select('*')
            .eq('uid_hex', params.uid)
            .eq('status', 'active')
            .single<Device>()

        if (deviceError || !device) {
            console.error('[verify-tap] Device not found:', params.uid)
            return redirectToError('device_not_found')
        }

        // Step 2: Mode-specific validation
        if (params.mode === 'prod') {
            // Production mode: Validate CMAC signature
            if (!params.cmac || !params.counter) {
                return errorResponse('Production mode requires counter and cmac parameters', 400)
            }

            const isValid = await validateNTAG424CMAC(params.uid, params.counter, params.cmac)
            if (!isValid) {
                console.warn('[verify-tap] CMAC validation failed:', params.uid)
                await logSuspiciousActivity(supabase, device.id, 'invalid_cmac', params)
                return redirectToError('invalid_signature')
            }
        } else {
            // Dev mode: Skip cryptographic validation
            console.log('[verify-tap] Running in DEV mode - skipping CMAC validation')
        }

        // Step 3: Anti-replay check (counter must increase)
        if (params.counter && params.counter <= device.last_counter) {
            console.warn('[verify-tap] Replay attack detected:', {
                uid: params.uid,
                received: params.counter,
                expected: device.last_counter + 1,
            })
            await logSuspiciousActivity(supabase, device.id, 'replay_attack', params)
            return redirectToError('replay_attack')
        }

        // Step 4: Rate limiting (1 tap per device per 60 seconds)
        const { data: recentTaps } = await supabase
            .from('loyalty_transactions')
            .select('created_at')
            .eq('device_id', device.id)
            .gte('created_at', new Date(Date.now() - 60000).toISOString())
            .limit(1)

        if (recentTaps && recentTaps.length > 0) {
            console.warn('[verify-tap] Rate limit exceeded:', params.uid)
            return redirectToError('rate_limit')
        }

        // Step 5: Update device counter
        if (params.counter) {
            await supabase
                .from('nfc_devices')
                .update({ last_counter: params.counter })
                .eq('id', device.id)
        }

        // Step 6: Check user authentication
        const authHeader = req.headers.get('Authorization')
        let userId: string | null = null

        if (authHeader) {
            const token = authHeader.replace('Bearer ', '')
            const { data: { user } } = await supabase.auth.getUser(token)
            userId = user?.id || null
        }

        // Step 7: Award point
        if (userId) {
            // Authenticated user: Award immediately
            const { data: result, error: awardError } = await supabase
                .rpc('award_loyalty_stamp', {
                    p_user_id: userId,
                    p_device_id: device.id,
                    p_restaurant_id: device.assigned_restaurant_id || null,
                    p_metadata: {
                        tap_mode: params.mode,
                        counter: params.counter,
                        timestamp: new Date().toISOString(),
                    },
                })

            if (awardError) {
                console.error('[verify-tap] Failed to award stamp:', awardError)
                return redirectToError('award_failed')
            }

            console.log('[verify-tap] Stamp awarded:', result)

            // Redirect to success page
            return new Response(null, {
                status: 302,
                headers: {
                    ...CORS_HEADERS,
                    'Location': `/puntos?status=success&stamps=${result.current_stamps}`,
                },
            })
        } else {
            // Anonymous user: Create pending reward token
            const pendingToken = await createPendingRewardToken(supabase, device.id, params)

            // Redirect to auth with pending token
            return new Response(null, {
                status: 302,
                headers: {
                    ...CORS_HEADERS,
                    'Location': `/auth/login?pending=${pendingToken}&redirect=/puntos`,
                },
            })
        }
    } catch (error) {
        console.error('[verify-tap] Unexpected error:', error)
        return errorResponse('Internal server error', 500)
    }
})

// ============================================================================
// Helper Functions
// ============================================================================

function errorResponse(message: string, status: number) {
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
}

function redirectToError(reason: string) {
    return new Response(null, {
        status: 302,
        headers: {
            ...CORS_HEADERS,
            'Location': `/verify-tap?status=error&reason=${reason}`,
        },
    })
}

async function validateNTAG424CMAC(uid: string, counter: number, cmac: string): Promise<boolean> {
    // TODO: Implement NTAG 424 DNA CMAC validation
    // This requires:
    // 1. Reconstruct SUN message from UID + counter
    // 2. Decrypt CMAC using AES-128 with NFC_MASTER_KEY
    // 3. Compare calculated CMAC with received CMAC

    // For now, return true in dev mode
    if (!NFC_MASTER_KEY) {
        console.warn('[validateNTAG424CMAC] NFC_MASTER_KEY not set - validation skipped')
        return true
    }

    // Placeholder for production implementation
    console.log('[validateNTAG424CMAC] CMAC validation not yet implemented')
    return true
}

async function logSuspiciousActivity(
    supabase: any,
    deviceId: string,
    eventType: string,
    params: TapRequest
) {
    // Log to a separate security_events table (optional)
    console.warn('[SECURITY]', { deviceId, eventType, params })

    // Could insert into a dedicated table:
    // await supabase.from('security_events').insert({ device_id: deviceId, event_type: eventType, metadata: params })
}

async function createPendingRewardToken(
    supabase: any,
    deviceId: string,
    params: TapRequest
): Promise<string> {
    // Create a short-lived token for anonymous users
    // In production, store this in a separate table with expiration
    const token = crypto.randomUUID()

    // TODO: Store in pending_rewards table with 15-minute expiration
    // await supabase.from('pending_rewards').insert({
    //   token,
    //   device_id: deviceId,
    //   expires_at: new Date(Date.now() + 15 * 60 * 1000)
    // })

    return token
}
