// Supabase Edge Function: send-push
// Sends push notifications to users via Web Push API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Web Push requires these for sending notifications
interface PushSubscription {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  type?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
}

// Convert base64 to Uint8Array for crypto operations
function base64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(b64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Convert Uint8Array to base64url
function uint8ArrayToBase64Url(uint8Array: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...uint8Array));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Generate ECDH key pair for encryption
async function generateECDHKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );
}

// Create HKDF key from shared secret
async function hkdfDerive(
  ikm: ArrayBuffer,
  salt: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw",
    ikm,
    { name: "HKDF" },
    false,
    ["deriveBits"]
  );
  return await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info },
    key,
    length * 8
  );
}

// Encrypt payload using Web Push encryption
async function encryptPayload(
  subscription: PushSubscription,
  payload: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  // Generate local ECDH key pair
  const localKeyPair = await generateECDHKeyPair();

  // Import subscriber's public key
  const subscriberPublicKeyBytes = base64ToUint8Array(subscription.p256dh_key);
  const subscriberPublicKey = await crypto.subtle.importKey(
    "raw",
    subscriberPublicKeyBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: subscriberPublicKey },
    localKeyPair.privateKey,
    256
  );

  // Export local public key
  const localPublicKeyBytes = new Uint8Array(
    await crypto.subtle.exportKey("raw", localKeyPair.publicKey)
  );

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Auth secret
  const authSecret = base64ToUint8Array(subscription.auth_key);

  // Create info for HKDF
  const keyInfoPrefix = new TextEncoder().encode("WebPush: info\0");
  const keyInfo = new Uint8Array(keyInfoPrefix.length + subscriberPublicKeyBytes.length + localPublicKeyBytes.length);
  keyInfo.set(keyInfoPrefix);
  keyInfo.set(subscriberPublicKeyBytes, keyInfoPrefix.length);
  keyInfo.set(localPublicKeyBytes, keyInfoPrefix.length + subscriberPublicKeyBytes.length);

  // Derive IKM
  const ikm = await hkdfDerive(sharedSecret, authSecret, keyInfo, 32);

  // Derive content encryption key and nonce
  const contentEncryptionKeyInfo = new TextEncoder().encode("Content-Encoding: aes128gcm\0");
  const nonceInfo = new TextEncoder().encode("Content-Encoding: nonce\0");

  const prk = await hkdfDerive(ikm, salt, new Uint8Array(0), 32);
  const cek = new Uint8Array(await hkdfDerive(prk, new Uint8Array(0), contentEncryptionKeyInfo, 16));
  const nonce = new Uint8Array(await hkdfDerive(prk, new Uint8Array(0), nonceInfo, 12));

  // Pad and encode payload
  const payloadBytes = new TextEncoder().encode(payload);
  const paddingLength = 0;
  const paddedPayload = new Uint8Array(2 + paddingLength + payloadBytes.length);
  paddedPayload[0] = paddingLength >> 8;
  paddedPayload[1] = paddingLength & 0xff;
  paddedPayload.set(payloadBytes, 2 + paddingLength);

  // Encrypt
  const encryptionKey = await crypto.subtle.importKey(
    "raw",
    cek,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce },
      encryptionKey,
      paddedPayload
    )
  );

  return { ciphertext, salt, serverPublicKey: localPublicKeyBytes };
}

// Create JWT for VAPID authentication
async function createVapidJwt(
  audience: string,
  subject: string,
  privateKeyBase64: string
): Promise<string> {
  const header = { alg: "ES256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: subject,
  };

  const encodedHeader = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Import private key
  const privateKeyBytes = base64ToUint8Array(privateKeyBase64);
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  // Sign
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      privateKey,
      new TextEncoder().encode(unsignedToken)
    )
  );

  return `${unsignedToken}.${uint8ArrayToBase64Url(signature)}`;
}

// Send push notification to a single subscription
async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payloadString = JSON.stringify(payload);
    const { ciphertext, salt, serverPublicKey } = await encryptPayload(subscription, payloadString);

    // Build aes128gcm body
    const recordSize = 4096;
    const body = new Uint8Array(
      21 + serverPublicKey.length + ciphertext.length
    );
    body.set(salt, 0);
    body[16] = (recordSize >> 24) & 0xff;
    body[17] = (recordSize >> 16) & 0xff;
    body[18] = (recordSize >> 8) & 0xff;
    body[19] = recordSize & 0xff;
    body[20] = serverPublicKey.length;
    body.set(serverPublicKey, 21);
    body.set(ciphertext, 21 + serverPublicKey.length);

    // Create VAPID JWT
    const endpoint = new URL(subscription.endpoint);
    const audience = `${endpoint.protocol}//${endpoint.host}`;
    const jwt = await createVapidJwt(audience, vapidSubject, vapidPrivateKey);

    // Send request
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        "TTL": "86400",
        "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}`,
      },
      body: body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:hello@twogetherforward.com";

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("VAPID keys not configured");
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { user_id, notification } = await req.json();

    if (!user_id || !notification) {
      throw new Error("Missing user_id or notification in request body");
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id)
      .eq("active", true);

    if (subError) {
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active subscriptions" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare push payload
    const pushPayload: PushPayload = {
      title: notification.title || "TwogetherForward",
      body: notification.body || "You have a new notification",
      icon: notification.icon || "/logo192.png",
      badge: notification.badge || "/logo192.png",
      tag: notification.tag || `notification-${Date.now()}`,
      type: notification.type,
      data: {
        notification_id: notification.id,
        roadmap_id: notification.roadmap_id,
        url: notification.url,
        ...notification.data,
      },
      requireInteraction: notification.requireInteraction || false,
    };

    // Send to all subscriptions
    const results = await Promise.all(
      subscriptions.map((sub) =>
        sendPushNotification(
          {
            endpoint: sub.endpoint,
            p256dh_key: sub.p256dh_key,
            auth_key: sub.auth_key,
          },
          pushPayload,
          vapidPublicKey,
          vapidPrivateKey,
          vapidSubject
        )
      )
    );

    // Check for failed subscriptions (might be expired)
    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      console.log(`${failed.length} push notifications failed:`, failed);

      // Deactivate failed subscriptions (they're likely expired)
      for (let i = 0; i < subscriptions.length; i++) {
        if (!results[i].success && results[i].error?.includes("410")) {
          await supabase
            .from("push_subscriptions")
            .update({ active: false })
            .eq("id", subscriptions[i].id);
        }
      }
    }

    const successful = results.filter((r) => r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successful,
        failed: failed.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send push error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
