// Nonsecret lifecycle/recovery scope for the single local owner. Never a Bearer.
export const localOwnerSession='local-owner:v1';
export const accessHeaders=(session:string):Record<string,string>=>session===localOwnerSession?{}:{Authorization:`Bearer ${session}`};
