// @ts-nocheck
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

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Gestion du CORS pour les appels directs depuis le front
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
        const { record } = await req.json()
        if (!record) throw new Error("No record provided")

        console.log('Notification record received:', record)

        const title = 'Mes Transports'
        const message = record.message || 'Nouvelle notification'
        const targetEmail = record.user_email
        const targetRole = record.target_role
        const targetUserId = record.target_user_id

        // 1. Construction de la requête de recherche d'abonnements
        let query = supabase.from('push_subscriptions').select('subscription, email')

        if (targetUserId) {
            query = query.eq('user_id', targetUserId)
        } else if (targetEmail) {
            query = query.eq('email', targetEmail)
        } else if (targetRole) {
            if (targetRole === 'ADMIN' || targetRole === 'SUPER_ADMIN') {
                query = query.in('role', ['ADMIN', 'SUPER_ADMIN'])
            } else {
                query = query.eq('role', targetRole)
            }
        } else {
            // Sécurité : ne rien envoyer si aucune cible n'est définie
            return new Response(JSON.stringify({ message: "No target specified" }), { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200 
            })
        }

        const { data: subscriptions, error: dbError } = await query
        if (dbError) throw dbError

        if (!subscriptions || subscriptions.length === 0) {
            return new Response(JSON.stringify({ message: "No subscriptions found" }), { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200 
            })
        }

        // 2. Préparation du payload
        const payload = JSON.stringify({
            title: title,
            body: message,
            url: 'https://mes-transports-prod.vercel.app/dashboard',
            icon: '/icon-192x192.png'
        })

        // 3. Envoi des notifications
        const results = await Promise.all(subscriptions.map(async (sub: any) => {
            try {
                // IMPORTANT: Parser la souscription si c'est une string
                const pushConfig = typeof sub.subscription === 'string' 
                    ? JSON.parse(sub.subscription) 
                    : sub.subscription
                
                await webpush.sendNotification(pushConfig, payload)
                return { email: sub.email, success: true }
            } catch (e: any) {
                console.error(`Push error for ${sub.email}:`, e.message)
                return null
            }
        }))

        return new Response(JSON.stringify({ sent: results.filter(r => r !== null).length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error: any) {
        console.error('Global Error:', error)
        return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
