/* SRS Vision Supabase client: anonymous sign-in + shared JSON state + Postgres Changes. */
(function(){
  'use strict';
  const cfg=window.SRS_SUPABASE_CONFIG||{};
  let client=null,session=null,channel=null,started=false,writeTimer=null,writeQueue=Promise.resolve(),lastServerAt=0;
  const state={connected:false,realtime:false,lastError:'',lastUpdatedAt:null,pending:false};
  const clone=v=>{try{return structuredClone(v)}catch{return JSON.parse(JSON.stringify(v))}};
  const emit=()=>window.dispatchEvent(new CustomEvent('srs:dbstatus',{detail:clone(state)}));
  const setStatus=(patch)=>{Object.assign(state,patch);emit()};
  const hasConfig=()=>!!(cfg.url&&cfg.publishableKey&&window.supabase);

  async function ensureClient(){
    if(client)return client;
    if(!hasConfig()) throw new Error('Supabase configuration is missing.');
    client=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    window.srsSupabaseClient=client;
    return client;
  }
  async function ensureSession(){
    const c=await ensureClient();
    const existing=await c.auth.getSession();
    if(existing?.data?.session){session=existing.data.session;return session;}
    const r=await c.auth.signInAnonymously();
    if(r.error)throw r.error;
    session=r.data.session||null;
    if(!session)throw new Error('Anonymous session was not created. Enable Anonymous Sign-Ins in Supabase.');
    return session;
  }
  async function readServer(){
    const c=await ensureClient();
    const r=await c.from('srs_vision_state').select('id,data,updated_at').eq('id',1).maybeSingle();
    if(r.error)throw r.error;
    return r.data||null;
  }
  function replaceLocal(next){
    if(window.SRS_APP?.replaceState){window.SRS_APP.replaceState(clone(next),false);}else{localStorage.setItem('srsVisionState',JSON.stringify(next));window.dispatchEvent(new Event('srs:statechanged'));}
  }
  function currentLocal(){
    try{return clone(window.SRS_APP?.getState?.()||JSON.parse(localStorage.getItem('srsVisionState')||'{}'));}catch{return {};}
  }
  async function subscribe(){
    const c=await ensureClient();
    if(channel){try{await c.removeChannel(channel)}catch{}}
    if(session?.access_token){try{await c.realtime.setAuth(session.access_token)}catch{}}
    channel=c.channel('srs-vision-state').on('postgres_changes',{event:'*',schema:'public',table:'srs_vision_state',filter:'id=eq.1'},payload=>{
      const incoming=payload?.new?.data;
      const at=new Date(payload?.new?.updated_at||0).getTime();
      if(!incoming||at<lastServerAt)return;
      lastServerAt=at; replaceLocal(incoming);
      setStatus({realtime:true,lastUpdatedAt:payload.new.updated_at,lastError:''});
    }).subscribe((status,err)=>{
      if(status==='SUBSCRIBED')setStatus({realtime:true,lastError:''});
      else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status))setStatus({realtime:false,lastError:err?.message||status});
    });
  }
  async function connect(){
    if(started && state.connected)return true;
    started=true;
    try{
      setStatus({lastError:'',connected:false,realtime:false});
      await ensureSession();
      const row=await readServer();
      const local=currentLocal();
      if(row?.data && Object.keys(row.data||{}).length){
        lastServerAt=new Date(row.updated_at||0).getTime();replaceLocal(row.data);setStatus({lastUpdatedAt:row.updated_at});
      }else if(Object.keys(local||{}).length){
        await saveAll(local);
      }
      setStatus({connected:true,lastError:''});
      await subscribe();
      return true;
    }catch(e){
      setStatus({connected:false,realtime:false,lastError:e?.message||String(e)});
      return false;
    }
  }
  async function savePatch(patch){
    const data=clone(patch||{});
    if(!Object.keys(data).length)return false;
    writeQueue=writeQueue.then(async()=>{
      try{
        state.pending=true;emit();
        if(!session)await ensureSession();
        const c=await ensureClient();
        const payload={p_patch:data};
        let r=await c.rpc('srs_vision_merge_state',payload);
        if(r.error){
          // Compatibility fallback for projects where the merge function has not been run yet.
          const existing=await readServer();
          const merged={...(existing?.data||{}),...data};
          r=await c.from('srs_vision_state').upsert({id:1,data:merged,updated_at:new Date().toISOString(),updated_by:session?.user?.id||null}).select('id,data,updated_at').single();
        }
        if(r.error)throw r.error;
        const row=r.data?.[0]||r.data;
        if(row?.data){lastServerAt=new Date(row.updated_at||Date.now()).getTime();localStorage.setItem('srsVisionLastServerAt',String(lastServerAt));}
        setStatus({connected:true,pending:false,lastUpdatedAt:row?.updated_at||state.lastUpdatedAt,lastError:''});
        return true;
      }catch(e){
        setStatus({pending:true,lastError:e?.message||String(e)});
        return false;
      }finally{state.pending=false;emit();}
    });
    return writeQueue;
  }
  async function saveAll(data){return savePatch(data)}
  function queueSave(data){clearTimeout(writeTimer);writeTimer=setTimeout(()=>savePatch(data),180);}
  async function health(){
    try{
      const ok=await connect();
      const row=await readServer();
      return {ok,updated_at:row?.updated_at||null,status:clone(state),row:row?{id:row.id}:null};
    }catch(e){setStatus({connected:false,lastError:e?.message||String(e)});return {ok:false,updated_at:null,status:clone(state)};}
  }
  async function refresh(){
    try{await ensureSession();const row=await readServer();if(row?.data){lastServerAt=new Date(row.updated_at||0).getTime();replaceLocal(row.data);setStatus({connected:true,lastUpdatedAt:row.updated_at,lastError:''});}await subscribe();return true;}catch(e){setStatus({lastError:e?.message||String(e)});return false;}
  }
  window.srsDB={connect,savePatch,saveAll,queueSave,health,refresh,getStatus:()=>clone(state)};
  window.addEventListener('srs:state-local-change',e=>{if(e.detail?.patch)queueSave(e.detail.patch)});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh().catch(()=>{})});
})();
