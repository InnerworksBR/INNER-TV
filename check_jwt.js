
const crypto = require('crypto');

const secret = 'a1d619a5587e543d0f450c39e74545e5';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const [header, payload, signature] = token.split('.');

const data = `${header}.${payload}`;
const hmac = crypto.createHmac('sha256', secret);
const calculatedSignature = hmac.update(data).digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

if (calculatedSignature === signature) {
    console.log("MATCH: The secret correctly signs this token.");
} else {
    console.log("MISMATCH: The secret does NOT match this token.");
    console.log("Calculated:", calculatedSignature);
    console.log("Original:  ", signature);
}

// Check with default Supabase secret
const defaultSecret = 'super-secret-jwt-token-with-at-least-32-characters-long';
const hmacDefault = crypto.createHmac('sha256', defaultSecret);
const calculatedDefault = hmacDefault.update(data).digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

if (calculatedDefault === signature) {
    console.log("MATCH with default Supabase secret!");
}
