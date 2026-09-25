// SRS Vision Live Database Sync V10 — fast UI, debounced writes, resilient realtime.
(function(){
  'use strict';
  const cfg=window.SUPABASE_CONFIG||{};
  let client=null, channel=null, connected=false, authReady=false;
  let writeTimer=null, retryTimer=null, heartbeatTimer=null;
  let pendingStore=null, pendingKeys=new Set(), writeInFlight=false, retryMs=1500;
  let refreshQueued=false;

  const configured=()=>!!(cfg.url&&cfg.publishableKey&&window.supabase);
  const clone=v=>{try{return structuredClone(v)}catch(_e){try{return JSON.parse(JSON.stringify(v))}catch(__e){return v}}};
  const describe=e=>e?.message||e?.msg||e?.error_description||e?.details||String(e||'Unknown error');
  const emit=(state,text,details='')=>{
    window.__srsLiveStatus={state,text,details};
    window.dispatchEvent(new CustomEvent('3fs:syncstatus',{detail:{state,text,details}}));
  };
  const queueRefresh=()=>{
    if(refreshQueued)return;
    refreshQueued=true;
    const run=()=>{
      refreshQueued=false;
      try{
        if(typeof window.loadStore==='function'){ const s=window.loadStore(); window.store=s; }
        if(typeof window.nav==='function')window.nav();
        if(typeof window.render==='function')window.render();
        if(typeof window.updatePermissionUI==='function')window.updatePermissionUI();
        if(typeof window.updateNotifications==='function')window.updateNotifications();
      }catch(e){console.warn('SRS Vision realtime UI refresh:',e);}
    };
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(run); else setTimeout(run,0);
  };

  async function ensureClient(){
    if(!configured()){
      emit('offline','Supabase configuration missing','Check supabase-config.js');
      return null;
    }
    // auth.js starts first; wait for its session/client so only one anonymous user is created per page.
    try{ if(window._3fsAuthReady) await window._3fsAuthReady; }catch(_e){}
    client=window._3fsSupabaseClient||client||window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    window._3fsSupabaseClient=client;
    return client;
  }

  async function ensureAuth(){
    if(!client)return false;
    try{
      const s=await client.auth.getSession();
      if(s?.data?.session){
        authReady=true;
        window._3fsSupabaseSession=s.data.session;
        try{await client.realtime.setAuth(s.data.session.access_token)}catch(_e){}
        return true;
      }
      const r=await client.auth.signInAnonymously();
      if(r.error)throw r.error;
      authReady=!!r.data?.session;
      window._3fsSupabaseSession=r.data?.session||null;
      if(authReady){try{await client.realtime.setAuth(r.data.session.access_token)}catch(_e){}}
      return authReady;
    }catch(e){
      authReady=false;
      emit('error','Anonymous Auth failed',describe(e));
      console.warn('SRS Vision anonymous auth failed:',e);
      return false;
    }
  }

  async function readRow(){
    const r=await client.from('threefs_state').select('id,data,updated_at,updated_by').eq('id',1).maybeSingle();
    if(r.error)throw r.error;
    return r.data||null;
  }

  function resetChannel(){
    if(channel&&client){try{client.removeChannel(channel)}catch(_e){}}
    channel=null; connected=false;
  }

  async function subscribe(){
    if(!client||!authReady)return false;
    resetChannel();
    channel=client.channel('srs-vision-live-state-v10');
    channel.on('postgres_changes',{event:'*',schema:'public',table:'threefs_state',filter:'id=eq.1'},payload=>{
      if(!payload.new?.data)return;
      const at=new Date(payload.new.updated_at||0).getTime();
      const localAt=Number(localStorage.getItem('3fsLastSyncedAt')||0);
      // Don't overwrite a local change that is waiting to be written.
      if(localStorage.getItem('3fsPendingWrite')==='1' && at<Number(localStorage.getItem('3fsLocalChangedAt')||0))return;
      if(at>=localAt){
        try{
          localStorage.setItem('3fsData',JSON.stringify(payload.new.data));
          localStorage.setItem('3fsLastSyncedAt',String(at));
          localStorage.removeItem('3fsPendingWrite');
          localStorage.removeItem('3fsLocalChangedAt');
          queueRefresh();
        }catch(e){console.warn('SRS Vision realtime apply failed:',e);}
      }
      emit('online','Live database connected · realtime ON');
    });
    await new Promise(resolve=>{
      let settled=false;
      const finish=()=>{if(!settled){settled=true;resolve()}};
      channel.subscribe((state,err)=>{
        if(state==='SUBSCRIBED'){
          connected=true; retryMs=1500; emit('online','Live database connected · realtime ON'); finish();
        }else if(state==='CHANNEL_ERROR'){
          connected=false; emit('error','Realtime channel error',describe(err)||'Check Realtime publication, table grants and RLS'); finish();
        }else if(state==='TIMED_OUT'){
          connected=false; emit('error','Realtime connection timed out','Check network access and Supabase Realtime'); finish();
        }else if(state==='CLOSED'){
          connected=false; emit('error','Realtime channel closed','The connection will retry automatically'); finish();
        }
      });
      setTimeout(finish,7000);
    });
    return connected;
  }

  async function init(){
    const c=await ensureClient();
    if(!c)return false;
    if(!await ensureAuth())return false;
    if(connected)return true;
    emit('connecting','Connecting to live database…');
    try{
      let row=null;
      try{row=await readRow();}
      catch(e){emit('error','Database table unavailable',describe(e)||'Run database.sql in Supabase SQL Editor');console.warn('SRS Vision readRow failed:',e);return false;}
      const local=(()=>{try{return JSON.parse(localStorage.getItem('3fsData')||'{}')}catch(_e){return {}}})();
      if(row?.data && Object.keys(row.data).length){
        const serverAt=new Date(row.updated_at||0).getTime();
        const localChanged=Number(localStorage.getItem('3fsLocalChangedAt')||0);
        if(localChanged>serverAt){
          pendingStore=local; Object.keys(local||{}).forEach(k=>pendingKeys.add(k));
          scheduleWrite(0);
        }else{
          localStorage.setItem('3fsData',JSON.stringify(row.data));
          localStorage.setItem('3fsLastSyncedAt',String(serverAt));
          localStorage.removeItem('3fsPendingWrite');
          queueRefresh();
        }
      }else if(Object.keys(local).length){
        pendingStore=local; Object.keys(local).forEach(k=>pendingKeys.add(k)); scheduleWrite(0);
      }
      await subscribe();
      return connected;
    }catch(e){emit('error','Live database connection failed',describe(e));console.warn('SRS Vision database init failed:',e);return false;}
  }

  async function writeNow(){
    if(writeInFlight)return;
    if(!pendingStore || !pendingKeys.size)return;
    if(!client||!authReady){await init(); if(!client||!authReady)return;}
    const source=clone(pendingStore); const keys=[...pendingKeys]; pendingKeys.clear(); writeInFlight=true;
    localStorage.setItem('3fsPendingWrite','1');
    emit('saving','Saving to live database…');
    try{
      const patch={}; keys.forEach(k=>patch[k]=clone(source[k]));
      let r=await client.rpc('threefs_merge_state',{p_patch:patch});
      let merged=r.data?.[0]||r.data||null;
      if(r.error){
        // Fallback for projects where the RPC has not been created yet.
        const existing=await readRow();
        const full=clone(existing?.data||{}); keys.forEach(k=>full[k]=clone(source[k]));
        r=await client.from('threefs_state').upsert({id:1,data:full,updated_at:new Date().toISOString(),updated_by:window._3fsSupabaseSession?.user?.id||null}).select('id,data,updated_at').single();
        if(r.error)throw r.error;
        merged=r.data;
      }
      if(merged?.data){
        localStorage.setItem('3fsData',JSON.stringify(merged.data));
        localStorage.setItem('3fsLastSyncedAt',String(new Date(merged.updated_at||Date.now()).getTime()));
      }
      localStorage.removeItem('3fsPendingWrite');
      localStorage.removeItem('3fsLocalChangedAt');
      retryMs=1500;
      emit('online','Saved globally · realtime ON');
    }catch(e){
      keys.forEach(k=>pendingKeys.add(k));
      localStorage.setItem('3fsPendingWrite','1');
      emit('error','Live save failed',describe(e)||'Your changes are stored locally and will retry');
      clearTimeout(retryTimer);
      retryTimer=setTimeout(()=>scheduleWrite(0),retryMs);
      retryMs=Math.min(retryMs*2,30000);
    }finally{
      writeInFlight=false;
      if(pendingKeys.size)scheduleWrite(250);
    }
  }

  function scheduleWrite(delay=300){
    clearTimeout(writeTimer);
    writeTimer=setTimeout(()=>{writeTimer=null;writeNow()},Math.max(0,delay));
  }

  // Returns immediately so buttons/forms never wait on a network round trip.
  window._3fsPushLive=function(obj,changedKeys){
    if(!obj)return Promise.resolve(false);
    pendingStore=obj;
    const keys=changedKeys?.length?changedKeys:Object.keys(obj);
    keys.forEach(k=>pendingKeys.add(k));
    localStorage.setItem('3fsPendingWrite','1');
    localStorage.setItem('3fsLocalChangedAt',String(Date.now()));
    scheduleWrite(250);
    return Promise.resolve(true);
  };

  window.init3FSLiveSync=init;
  window._3fsRefreshLive=async()=>{if(!client||!authReady)return init();if(!connected)await subscribe();return connected};
  window.srsLiveHealth=async function(){
    try{
      if(!(await init()))return {ok:false,status:window.__srsLiveStatus||{}};
      const row=await readRow();
      return {ok:true,status:window.__srsLiveStatus||{},updated_at:row?.updated_at||null};
    }catch(e){return {ok:false,status:{state:'error',text:'Database check failed',details:describe(e)}};}
  };

  window.addEventListener('3fs:datachanged',e=>{
    if(e.detail?.store)window._3fsPushLive(e.detail.store,e.detail.changedKeys||[]);
  });
  window.addEventListener('online',()=>{if(window._3fsRefreshLive)window._3fsRefreshLive()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&window._3fsRefreshLive)window._3fsRefreshLive()});

  heartbeatTimer=setInterval(async()=>{
    try{
      if(!client){await init();return;}
      const s=await client.auth.getSession();
      if(!s?.data?.session){authReady=false;connected=false;await init();return;}
      window._3fsSupabaseSession=s.data.session;
      try{await client.realtime.setAuth(s.data.session.access_token)}catch(_e){}
      if(!connected)await subscribe();
    }catch(e){console.warn('SRS Vision live heartbeat:',e)}
  },30000);

  // Start once after the document is ready, without blocking the UI.
  const boot=()=>setTimeout(()=>init(),0);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
