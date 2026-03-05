
const crypto = require('crypto');

const secret = 'a1d619a5587e543d0f450c39e74545e5';

function sign(payload) {
    const header = { alg: "HS256", typ: "JWT" };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto.createHmac('sha256', secret).update(data).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    return `${data}.${signature}`;
}

const now = Math.floor(Date.now() / 1000);
const exp = now + (60 * 60 * 24 * 365 * 10); // 10 years

const anonPayload = {
    role: "anon",
    iss: "supabase",
    iat: now,
    exp: exp
};

const servicePayload = {
    role: "service_role",
    iss: "supabase",
    iat: now,
    exp: exp
};

console.log("NEW_ANON_KEY=" + sign(anonPayload));
console.log("NEW_SERVICE_ROLE_KEY=" + sign(servicePayload));
