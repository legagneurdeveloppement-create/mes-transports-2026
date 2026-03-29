import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import * as webpush from "https://esm.sh/web-push@3.6.7?target=deno"

const VAPID_PUBLIC_KEY = "BHPj4IaJOPBJYRxKF9aUcC5IGG2EUvA30yP5tump8qR5i2kHtmEzFe4BNI17baHWUlh6JniSPjxibHKe5_juhiU"
const VAPID_PRIVATE_KEY = "JPGWKHr_HDPPXi19d-JlgmStRxkPV0HfJbv0Zt7XB38"

webpush.setVapidDetails(
    'mailto:legagneur.developpement@gmail.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
)

serve(async (req) => {
    // Gérer les requêtes OPTIONS pour CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
        const { record } = await req.json()
        console.log('--- Notification Process Started ---')
        console.log('Record:', JSON.stringify(record))

        const title = 'Mes Transports'
        const message = record.message
        const targetEmail = record.user_email
        const targetRole = record.target_role

        // 1. Chercher les abonnements correspondants
        let query = supabase.from('push_subscriptions').select('subscription, email')

        if (targetEmail) {
            console.log('Targeting email:', targetEmail)
            query = query.eq('email', targetEmail)
        } else if (targetRole) {
            console.log('Targeting role:', targetRole)
            if (targetRole === 'ADMIN' || targetRole === 'SUPER_ADMIN') {
                query = query.in('role', ['ADMIN', 'SUPER_ADMIN'])
            } else {
                query = query.eq('role', targetRole)
            }
        }

        const { data: subscriptions, error: dbError } = await query

        if (dbError) throw dbError

        if (!subscriptions || subscriptions.length === 0) {
            console.log('No subscriptions found for this target.')
            return new Response(JSON.stringify({ message: "No subscriptions found" }), {
                headers: { 'Content-Type': 'application/json' },
                status: 200
            })
        }

        console.log(`Found ${subscriptions.length} subscriptions. Sending...`)

        // 2. Préparer le contenu
        const payload = JSON.stringify({
            title: title,
            body: message,
            url: 'https://mes-transports-prod.vercel.app/dashboard'
        })

        // 3. Envoyer les notifications en parallèle
        const results = await Promise.all(subscriptions.map(async (sub) => {
            try {
                // S'assurer que la souscription est au bon format
                const pushConfig = typeof sub.subscription === 'string'
                    ? JSON.parse(sub.subscription)
                    : sub.subscription

                await webpush.sendNotification(pushConfig, payload)
                return { email: sub.email, success: true }
            } catch (e) {
                console.error(`Push failed for ${sub.email}:`, e.message)
                return { email: sub.email, success: false, error: e.message }
            }
        }))

        console.log('Results:', JSON.stringify(results))

        return new Response(JSON.stringify({ sent: results.length, details: results }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            status: 200,
        })
    } catch (error) {
        console.error('Global Error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            status: 500,
        })
    }
})
