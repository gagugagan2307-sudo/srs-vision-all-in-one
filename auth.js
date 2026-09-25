// SRS Vision authentication bridge — no hard-coded credentials.
(function(){
 let client=null,session=null;
 const profile={id:'anonymous',email:'',full_name:'SRS Vision Team Member',role:'team',is_active:true};
 async function init(){try{const cfg=window.SUPABASE_CONFIG||{};if(!cfg.url||!cfg.publishableKey||!window.supabase)return false;client=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});window._3fsSupabaseClient=client;const e=await client.auth.getSession();if(e?.data?.session){session=e.data.session;window._3fsSupabaseSession=session;return true;}const r=await client.auth.signInAnonymously();if(r.error)throw r.error;session=r.data?.session||null;window._3fsSupabaseSession=session;return !!session;}catch(e){console.warn('SRS Vision anonymous auth failed',e);return false;}}
 const ready=init();
 window.threefsAuth={client:()=>client||window._3fsSupabaseClient||null,profile:()=>profile,role:()=> 'team',roleLabel:()=> 'Team Member',is:r=>r==='team'||r==='admin',can:()=>true,signIn:async()=>({data:{session},error:null}),signUp:async()=>({data:null,error:new Error('Sign up disabled')}),signOut:async()=>({error:null}),resetPassword:async()=>({error:new Error('Password reset disabled')}),ready:()=>ready};
 window._3fsAuthReady=ready;
})();
