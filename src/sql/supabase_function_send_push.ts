import { serve } from "https://deno.land/std@0.131.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as webpush from "https://esm.sh/web-push@3.4.5"

const VAPID_PUBLIC_KEY = "BHPj4IaJOPBJYRxKF9aUcC5IGG2EUvA30yP5tump8qR5i2kHtmEzFe4BNI17baHWUlh6JniSPjxibHKe5_juhiU"
const VAPID_PRIVATE_KEY = "JPGWKHr_HDPPXi19d-JlgmStRxkPV0HfJbv0Zt7XB38"

webpush.setVapidDetails(
    'mailto:votre-email@exemple.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
)

serve(async (req) => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
        const { record } = await req.json()
        console.log('Notification record received:', record)

        const title = 'Mes Transports'
        const message = record.message
        const targetEmail = record.user_email
        const targetRole = record.target_role

        // 1. Chercher les abonnements correspondants
        let query = supabase.from('push_subscriptions').select('subscription')

        if (targetEmail) {
            query = query.eq('email', targetEmail)
        } else if (targetRole) {
            if (targetRole === 'ADMIN') {
                query = query.in('role_assigned', ['ADMIN', 'SUPER_ADMIN']) // On peut rajouter un champ role_assigned dans push_subscriptions
            } else {
                // Note: On va chercher par email si on n'a pas mis le rôle dans push_subscriptions
                // Pour l'instant on va chercher tous ceux qui matchent le rôle via une jointure ou filtrer simplement
                // Simplification: Chercher tous les abonnements et filtrer (ou améliorer le schéma plus tard)
                query = query.select('subscription, email')
            }
        }

        const { data: subscriptions } = await query

        if (!subscriptions || subscriptions.length === 0) {
            return new Response("No subscriptions found", { status: 200 })
        }

        // 2. Envoyer les notifications
        const payload = JSON.stringify({
            title: title,
            body: message,
            url: '/dashboard'
        })

        const results = await Promise.all(subscriptions.map(sub =>
            webpush.sendNotification(sub.subscription, payload).catch(e => {
                console.error('Push error for', sub.email, e)
                return null
            })
        ))

        return new Response(JSON.stringify({ sent: results.length }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
