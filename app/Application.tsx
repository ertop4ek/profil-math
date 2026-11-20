'use client';
import {useEffect,useMemo} from 'react';
import {template} from './template';
export function Application(){const html=useMemo(()=>({__html:template}),[]);useEffect(()=>{if(document.getElementById('profile-client-entry'))return;const script=document.createElement('script');script.id='profile-client-entry';script.type='module';script.src='/client/app.js';script.onerror=()=>{const e=document.getElementById('bootError');if(e)e.hidden=false;};document.body.appendChild(script);},[]);return <><div dangerouslySetInnerHTML={html}/><div hidden id="bootError" role="alert">Не удалось загрузить приложение. Обнови страницу.</div></>}
